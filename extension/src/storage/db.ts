import Dexie, { type Table } from "dexie";

export interface RepoMeta {
  id: string;
  name: string;
  created: string;
}

class ContextGitDB extends Dexie {
  repos!: Table<RepoMeta, string>;

  constructor() {
    super("contextgit-meta");
    this.version(1).stores({
      repos: "id, name, created",
    });
  }
}

export const db = new ContextGitDB();
