"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, CommitInfo, RepoInfo } from "@/lib/api";
import CommitHistory from "@/components/git/CommitHistory";
import DiffViewer from "@/components/git/DiffViewer";

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [diffText, setDiffText] = useState("");

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([api.getRepo(id), api.listCommits(id)]);
    setRepo(r);
    setCommits(c);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = async (hash: string) => {
    setSelectedHash(hash);
    try {
      const d = await api.getDiff(id, `${hash}~1`, hash);
      setDiffText(d.diff_text);
    } catch {
      setDiffText("");
    }
  };

  if (!repo) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href={`/repo/${id}`} className="text-sm text-gray-500 hover:text-blue-600">
          &larr; {repo.name}
        </Link>
        <h1 className="text-xl font-bold">Commit History</h1>
        <p className="text-sm text-gray-500">
          Branch: {repo.current_branch} &middot; {commits.length} commit{commits.length !== 1 && "s"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-600">Commits</h2>
          <CommitHistory commits={commits} onSelect={handleSelect} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-600">
            {selectedHash ? `Diff for ${selectedHash}` : "Select a commit to view diff"}
          </h2>
          {selectedHash ? (
            <DiffViewer diffText={diffText} />
          ) : (
            <p className="py-8 text-center text-gray-400">
              Click a commit to see changes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
