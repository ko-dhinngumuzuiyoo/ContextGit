export type Platform = "chatgpt" | "claude" | "gemini";
export type SendMode = "public" | "power";

// --- AI Response ---
export interface AIResponse {
  id: string;
  platform: Platform;
  content: string;
  timestamp: string;
  isStreaming: boolean;
}

// --- Issue (Task Assignment) ---
export type IssueStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "review"
  | "closed";

export interface Issue {
  id: string;
  repoId: string;
  title: string;
  description: string;
  assignedPlatform?: Platform;
  reviewerPlatform?: Platform;
  status: IssueStatus;
  branchName?: string;
  dependsOn: string[];
  labels: string[];
  createdAt: string;
  closedAt?: string;
}

// --- Pull Request ---
export type PRStatus =
  | "open"
  | "reviewing"
  | "approved"
  | "rejected"
  | "merged";

export interface PullRequest {
  id: string;
  repoId: string;
  issueId: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  status: PRStatus;
  reviewerPlatform?: Platform;
  reviewComment?: string;
  createdAt: string;
  mergedAt?: string;
}

// --- Tab Connection ---
export interface TabConnection {
  tabId: number;
  platform: Platform;
  url: string;
  status: "connected" | "disconnected" | "busy";
  lastSeen: string;
}

// --- Workspace ---
export interface Workspace {
  id: string;
  name: string;
  repoId: string;
  sendMode: SendMode;
  createdAt: string;
}
