import Dexie, { type Table } from "dexie";
import type { Issue, PullRequest } from "../types/workflow";

export interface RepoMeta {
  id: string;
  name: string;
  created: string;
}

class ContextGitDB extends Dexie {
  repos!: Table<RepoMeta, string>;
  issues!: Table<Issue, string>;
  pullRequests!: Table<PullRequest, string>;

  constructor() {
    super("contextgit-meta");
    this.version(1).stores({
      repos: "id, name, created",
    });
    this.version(2).stores({
      repos: "id, name, created",
      issues: "id, repoId, status, assignedPlatform, createdAt",
      pullRequests: "id, repoId, issueId, status, createdAt",
    });
  }
}

export const db = new ContextGitDB();
