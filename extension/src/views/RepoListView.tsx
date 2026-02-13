import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gitService } from "../services/git-service";
import type { RepoInfo } from "../types/repo";

export default function RepoListView() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      setRepos(await gitService.listRepos());
    } catch {
      setError("Failed to load repos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await gitService.createRepo(newName.trim());
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
      <div className="mb-4">
        <h1 className="text-lg font-bold">Context Repos</h1>
      </div>

      <div className="mb-4 flex gap-2">
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
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "..." : "Create"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {repos.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No repos yet. Create one above.
        </p>
      ) : (
        <div className="grid gap-2">
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => navigate(`/repo/${repo.id}`)}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm"
            >
              <div>
                <h2 className="text-sm font-semibold">{repo.name}</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {repo.current_branch} &middot; {repo.branches.length} branch
                  {repo.branches.length !== 1 && "es"}
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {repo.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
