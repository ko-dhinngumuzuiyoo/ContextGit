import type {
  Issue,
  Platform,
  AIResponse,
  SendMode,
  IssueStatus,
} from "../types/workflow";
import { issueManager } from "./issue-manager";
import { prManager } from "./pr-manager";
import { tabManager } from "./tab-manager";

export type WorkflowStatus = "idle" | "running" | "completed" | "error";

interface WorkflowState {
  status: WorkflowStatus;
  repoId: string;
  sendMode: SendMode;
  issueIds: string[];
  completedIds: Set<string>;
  error?: string;
}

class WorkflowEngine {
  private state: WorkflowState | null = null;

  getState(): WorkflowState | null {
    return this.state;
  }

  /**
   * Start a workflow: create issues and begin executing them
   * following dependency order (DAG).
   */
  async start(
    repoId: string,
    issueDefs: Omit<Issue, "id" | "createdAt" | "status">[],
    sendMode: SendMode,
  ): Promise<string[]> {
    const issueIds: string[] = [];

    // Create all issues first
    for (const def of issueDefs) {
      const issue = await issueManager.createIssue(
        repoId,
        def.title,
        def.description,
        def.assignedPlatform,
        def.reviewerPlatform,
        def.dependsOn,
        def.labels,
      );
      issueIds.push(issue.id);
    }

    this.state = {
      status: "running",
      repoId,
      sendMode,
      issueIds,
      completedIds: new Set(),
    };

    // Start issues with no dependencies
    await this.startReadyIssues();

    return issueIds;
  }

  /**
   * Handle AI response: commit, create PR, and advance workflow
   */
  async handleResponse(
    tabId: number,
    response: AIResponse,
  ): Promise<void> {
    if (!this.state || this.state.status !== "running") return;

    // Find the in-progress issue for this platform
    const platform = tabManager.getPlatformForTab(tabId);
    if (!platform) return;

    const issue = await this.findActiveIssueForPlatform(platform);
    if (!issue) return;

    // Commit the response
    await issueManager.commitResponse(issue.id, response);
    tabManager.updateStatus(tabId, "connected");

    // Create PR
    const pr = await prManager.createPR(issue.id);

    // Auto-review if reviewer is set
    if (issue.reviewerPlatform) {
      await prManager.requestReview(pr.id, issue.reviewerPlatform);
    } else {
      // Auto-approve and merge if no reviewer
      await prManager.submitReview(pr.id, "approve", "Auto-approved (no reviewer)");
      await prManager.mergePR(pr.id);
      this.state.completedIds.add(issue.id);

      // Check if workflow is complete
      if (this.state.completedIds.size === this.state.issueIds.length) {
        this.state.status = "completed";
      } else {
        // Start next ready issues
        await this.startReadyIssues();
      }
    }
  }

  /**
   * Handle review completion: merge if approved, advance workflow
   */
  async handleReviewComplete(
    prId: string,
    action: "approve" | "reject",
    comment?: string,
  ): Promise<void> {
    if (!this.state) return;

    await prManager.submitReview(prId, action, comment);

    if (action === "approve") {
      const pr = await prManager.getPR(prId);
      if (!pr) return;

      await prManager.mergePR(prId);
      this.state.completedIds.add(pr.issueId);

      if (this.state.completedIds.size === this.state.issueIds.length) {
        this.state.status = "completed";
      } else {
        await this.startReadyIssues();
      }
    }
  }

  /**
   * Start all issues whose dependencies are resolved
   */
  private async startReadyIssues(): Promise<void> {
    if (!this.state) return;

    for (const issueId of this.state.issueIds) {
      if (this.state.completedIds.has(issueId)) continue;

      const issue = await issueManager.getIssue(issueId);
      if (!issue || issue.status !== "open") continue;

      const ready = await issueManager.areDependenciesResolved(issueId);
      if (!ready) continue;

      const autoSend = this.state.sendMode === "power";
      try {
        await issueManager.startIssue(issueId, autoSend);
      } catch (err) {
        console.error(`[ContextGit] Failed to start issue ${issueId}:`, err);
      }
    }
  }

  private async findActiveIssueForPlatform(
    platform: Platform,
  ): Promise<Issue | undefined> {
    if (!this.state) return undefined;
    const issues = await issueManager.listIssues(this.state.repoId, "in_progress");
    return issues.find((i) => i.assignedPlatform === platform);
  }
}

export const workflowEngine = new WorkflowEngine();
