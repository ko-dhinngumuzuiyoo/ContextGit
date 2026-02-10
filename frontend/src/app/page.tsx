"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, RepoInfo } from "@/lib/api";

export default function Home() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setRepos(await api.listRepos());
    } catch {
      setError("Failed to load repos. Is the backend running?");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.createRepo(newName.trim());
      setNewName("");
      await load();
    } catch {
      setError("Failed to create repo");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Context Repos</h1>
      </div>

      {/* Create new repo */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New repo name..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Repo list */}
      {repos.length === 0 && !error ? (
        <p className="text-center text-gray-400 py-12">
          No repos yet. Create one above.
        </p>
      ) : (
        <div className="grid gap-3">
          {repos.map((repo) => (
            <Link
              key={repo.id}
              href={`/repo/${repo.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div>
                <h2 className="font-semibold">{repo.name}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {repo.current_branch} &middot; {repo.branches.length} branch{repo.branches.length !== 1 && "es"}
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">{repo.id}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
