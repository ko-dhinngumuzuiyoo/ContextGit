import { db } from "../storage/db";
import type { Issue, IssueStatus, AIResponse, Platform } from "../types/workflow";
import { generateId } from "../utils/id";
import { gitService } from "./git-service";
import { tabManager } from "./tab-manager";

class IssueManager {
  async createIssue(
    repoId: string,
    title: string,
    description: string,
    assignedPlatform?: Platform,
    reviewerPlatform?: Platform,
    dependsOn: string[] = [],
    labels: string[] = [],
  ): Promise<Issue> {
    const issue: Issue = {
      id: generateId(),
      repoId,
      title,
      description,
      assignedPlatform,
      reviewerPlatform,
      status: "open",
      dependsOn,
      labels,
      createdAt: new Date().toISOString(),
    };
    await db.issues.add(issue);
    return issue;
  }

  async getIssue(issueId: string): Promise<Issue | undefined> {
    return db.issues.get(issueId);
  }

  async listIssues(
    repoId: string,
    status?: IssueStatus,
  ): Promise<Issue[]> {
    let query = db.issues.where("repoId").equals(repoId);
    const issues = await query.toArray();
    if (status) return issues.filter((i) => i.status === status);
    return issues;
  }

  async updateStatus(issueId: string, status: IssueStatus): Promise<void> {
    const update: Partial<Issue> = { status };
    if (status === "closed") update.closedAt = new Date().toISOString();
    await db.issues.update(issueId, update);
  }

  /**
   * Start working on an issue:
   * 1. Create a branch
   * 2. Checkout the branch
   * 3. Send prompt to the assigned AI
   */
  async startIssue(
    issueId: string,
    autoSend = false,
  ): Promise<{ branchName: string; sent: boolean }> {
    const issue = await db.issues.get(issueId);
    if (!issue) throw new Error(`Issue ${issueId} not found`);
    if (!issue.assignedPlatform) {
      throw new Error(`Issue ${issueId} has no assigned platform`);
    }

    // Create and checkout branch
    const branchName = `issue/${issue.id}-${issue.assignedPlatform}`;
    await gitService.createBranch(issue.repoId, branchName);
    await gitService.checkout(issue.repoId, branchName);

    // Update issue
    await db.issues.update(issueId, {
      status: "in_progress" as IssueStatus,
      branchName,
    });

    // Send prompt to AI tab
    let sent = false;
    const tab = tabManager.getByPlatform(issue.assignedPlatform);
    if (tab) {
      try {
        await chrome.tabs.sendMessage(tab.tabId, {
          type: "BG_INJECT_PROMPT",
          prompt: issue.description,
          autoSend,
        });
        tabManager.updateStatus(tab.tabId, "busy");
        sent = true;
      } catch {
        // Tab may have been closed
        sent = false;
      }
    }

    return { branchName, sent };
  }

  /**
   * Commit an AI response to the issue's branch
   */
  async commitResponse(
    issueId: string,
    response: AIResponse,
  ): Promise<void> {
    const issue = await db.issues.get(issueId);
    if (!issue) throw new Error(`Issue ${issueId} not found`);

    // Ensure we're on the right branch
    if (issue.branchName) {
      await gitService.checkout(issue.repoId, issue.branchName);
    }

    // Write response to file
    const dir = `outputs/${response.platform}`;
    await gitService.ensureDir(issue.repoId, dir);
    await gitService.writeFile(
      issue.repoId,
      `${dir}/${issue.id}.md`,
      response.content,
    );

    // Commit
    await gitService.commitAll(
      issue.repoId,
      `[${response.platform}] ${issue.title}`,
    );
  }

  /**
   * Check if all dependencies for an issue are resolved (closed)
   */
  async areDependenciesResolved(issueId: string): Promise<boolean> {
    const issue = await db.issues.get(issueId);
    if (!issue) return false;
    if (issue.dependsOn.length === 0) return true;

    for (const depId of issue.dependsOn) {
      const dep = await db.issues.get(depId);
      if (!dep || dep.status !== "closed") return false;
    }
    return true;
  }
}

export const issueManager = new IssueManager();
