export interface RepoInfo {
  id: string;
  name: string;
  current_branch: string;
  branches: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface DiffResult {
  diff_text: string;
  from_ref: string;
  to_ref: string;
}

export interface ExportResult {
  target: string;
  content: string;
}
