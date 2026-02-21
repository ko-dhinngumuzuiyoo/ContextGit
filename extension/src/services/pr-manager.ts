import { db } from "../storage/db";
import type { PullRequest, PRStatus, Platform } from "../types/workflow";
import { generateId } from "../utils/id";
import { gitService } from "./git-service";
import { issueManager } from "./issue-manager";
import { tabManager } from "./tab-manager";

class PRManager {
  async createPR(issueId: string): Promise<PullRequest> {
    const issue = await db.issues.get(issueId);
    if (!issue) throw new Error(`Issue ${issueId} not found`);
    if (!issue.branchName) throw new Error(`Issue ${issueId} has no branch`);

    const pr: PullRequest = {
      id: generateId(),
      repoId: issue.repoId,
      issueId,
      sourceBranch: issue.branchName,
      targetBranch: "main",
      title: issue.title,
      status: "open",
      reviewerPlatform: issue.reviewerPlatform,
      createdAt: new Date().toISOString(),
    };
    await db.pullRequests.add(pr);

    // Update issue status
    await issueManager.updateStatus(issueId, "review");

    return pr;
  }

  async getPR(prId: string): Promise<PullRequest | undefined> {
    return db.pullRequests.get(prId);
  }

  async listPRs(
    repoId: string,
    status?: PRStatus,
  ): Promise<PullRequest[]> {
    const prs = await db.pullRequests
      .where("repoId")
      .equals(repoId)
      .toArray();
    if (status) return prs.filter((p) => p.status === status);
    return prs;
  }

  async getDiff(prId: string): Promise<string> {
    const pr = await db.pullRequests.get(prId);
    if (!pr) throw new Error(`PR ${prId} not found`);
    return gitService.getBranchDiff(pr.repoId, pr.targetBranch, pr.sourceBranch);
  }

  /**
   * Send PR diff to a reviewer AI for review
   */
  async requestReview(
    prId: string,
    reviewerPlatform: Platform,
  ): Promise<boolean> {
    const pr = await db.pullRequests.get(prId);
    if (!pr) throw new Error(`PR ${prId} not found`);

    const diff = await this.getDiff(prId);
    const issue = await db.issues.get(pr.issueId);

    const reviewPrompt = [
      `Please review the following work output.`,
      ``,
      `## Task: ${pr.title}`,
      issue ? `## Original Request: ${issue.description}` : "",
      ``,
      `## Output:`,
      "```",
      diff,
      "```",
      ``,
      `Please evaluate:`,
      `1. Does the output address the original request?`,
      `2. Is the information accurate?`,
      `3. What improvements would you suggest?`,
      ``,
      `Respond with APPROVE or REJECT followed by your reasoning.`,
    ]
      .filter(Boolean)
      .join("\n");

    // Send to reviewer tab
    const tab = tabManager.getByPlatform(reviewerPlatform);
    if (!tab) return false;

    try {
      await chrome.tabs.sendMessage(tab.tabId, {
        type: "BG_INJECT_PROMPT",
        prompt: reviewPrompt,
        autoSend: false,
      });
      await db.pullRequests.update(prId, {
        status: "reviewing" as PRStatus,
        reviewerPlatform,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Record review result
   */
  async submitReview(
    prId: string,
    action: "approve" | "reject",
    comment?: string,
  ): Promise<void> {
    const status: PRStatus = action === "approve" ? "approved" : "rejected";
    await db.pullRequests.update(prId, {
      status,
      reviewComment: comment,
    });
  }

  /**
   * Merge PR: merge source branch into target (main), close issue
   */
  async mergePR(prId: string): Promise<void> {
    const pr = await db.pullRequests.get(prId);
    if (!pr) throw new Error(`PR ${prId} not found`);

    await gitService.merge(pr.repoId, pr.sourceBranch, pr.targetBranch);

    await db.pullRequests.update(prId, {
      status: "merged" as PRStatus,
      mergedAt: new Date().toISOString(),
    });

    await issueManager.updateStatus(pr.issueId, "closed");
  }
}

export const prManager = new PRManager();
