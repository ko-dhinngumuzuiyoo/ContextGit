const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API error");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Types ---

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface Decision {
  title: string;
  detail: string;
  date?: string;
}

export interface ContextData {
  purpose: string;
  assumptions: string[];
  glossary: GlossaryItem[];
  decisions: Decision[];
}

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

// --- Repos ---

export const api = {
  listRepos: () => request<RepoInfo[]>("/api/repos"),

  createRepo: (name: string) =>
    request<RepoInfo>("/api/repos", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getRepo: (id: string) => request<RepoInfo>(`/api/repos/${id}`),

  deleteRepo: (id: string) =>
    request<void>(`/api/repos/${id}`, { method: "DELETE" }),

  // --- Context ---

  getContext: (repoId: string) =>
    request<ContextData>(`/api/repos/${repoId}/context`),

  updateContext: (repoId: string, data: ContextData) =>
    request<ContextData>(`/api/repos/${repoId}/context`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // --- Branches ---

  listBranches: (repoId: string) =>
    request<string[]>(`/api/repos/${repoId}/branches`),

  createBranch: (repoId: string, name: string) =>
    request<string[]>(`/api/repos/${repoId}/branches`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  checkout: (repoId: string, branch: string) =>
    request<{ current_branch: string }>(`/api/repos/${repoId}/checkout`, {
      method: "POST",
      body: JSON.stringify({ branch }),
    }),

  // --- Commits ---

  createCommit: (repoId: string, message: string) =>
    request<CommitInfo>(`/api/repos/${repoId}/commits`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  listCommits: (repoId: string) =>
    request<CommitInfo[]>(`/api/repos/${repoId}/commits`),

  getDiff: (repoId: string, ref1?: string, ref2?: string) => {
    const params = new URLSearchParams();
    if (ref1) params.set("ref1", ref1);
    if (ref2) params.set("ref2", ref2);
    const qs = params.toString();
    return request<DiffResult>(`/api/repos/${repoId}/diff${qs ? `?${qs}` : ""}`);
  },

  // --- Export ---

  exportContext: (repoId: string, target: string, branch?: string) =>
    request<ExportResult>(`/api/repos/${repoId}/export`, {
      method: "POST",
      body: JSON.stringify({ target, branch: branch || "main" }),
    }),

  listExportTargets: () => request<string[]>("/export/targets"),
};
