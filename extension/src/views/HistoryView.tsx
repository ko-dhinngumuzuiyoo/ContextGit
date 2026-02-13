import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { gitService } from "../services/git-service";
import type { RepoInfo, CommitInfo } from "../types/repo";
import CommitHistory from "../components/git/CommitHistory";
import DiffViewer from "../components/git/DiffViewer";

export default function HistoryView() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [diffText, setDiffText] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const [r, c] = await Promise.all([
      gitService.getRepoInfo(id),
      gitService.getLog(id),
    ]);
    setRepo(r);
    setCommits(c);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = async (hash: string) => {
    if (!id) return;
    setSelectedHash(hash);
    try {
      const d = await gitService.getDiff(id, `${hash}~1`, hash);
      setDiffText(d);
    } catch {
      setDiffText("");
    }
  };

  if (!repo) {
    return <p className="py-8 text-center text-sm text-gray-400">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-base font-bold">Commit History</h1>
        <p className="text-xs text-gray-500">
          Branch: {repo.current_branch} &middot; {commits.length} commit
          {commits.length !== 1 && "s"}
        </p>
      </div>

      {/* Stacked layout for sidepanel width */}
      <div className="space-y-4">
        <div>
          <h2 className="mb-1 text-xs font-semibold text-gray-600">
            Commits
          </h2>
          <CommitHistory commits={commits} onSelect={handleSelect} />
        </div>
        <div>
          <h2 className="mb-1 text-xs font-semibold text-gray-600">
            {selectedHash
              ? `Diff for ${selectedHash}`
              : "Select a commit to view diff"}
          </h2>
          {selectedHash ? (
            <DiffViewer diffText={diffText} />
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">
              Click a commit to see changes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
