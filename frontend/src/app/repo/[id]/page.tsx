"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ContextData, RepoInfo } from "@/lib/api";
import ContextEditor from "@/components/context/ContextEditor";
import BranchSelector from "@/components/git/BranchSelector";
import CommitDialog from "@/components/git/CommitDialog";

export default function RepoPage() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [context, setContext] = useState<ContextData | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([api.getRepo(id), api.getContext(id)]);
    setRepo(r);
    setContext(c);
    setDirty(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleContextChange = (data: ContextData) => {
    setContext(data);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!context) return;
    setSaving(true);
    try {
      await api.updateContext(id, context);
      setDirty(false);
      setStatus("Saved");
      setTimeout(() => setStatus(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async (message: string) => {
    if (dirty && context) {
      await api.updateContext(id, context);
    }
    await api.createCommit(id, message);
    setDirty(false);
    setStatus("Committed!");
    setTimeout(() => setStatus(""), 2000);
    await load();
  };

  const handleCheckout = async (branch: string) => {
    await api.checkout(id, branch);
    await load();
  };

  const handleCreateBranch = async (name: string) => {
    await api.createBranch(id, name);
    await api.checkout(id, name);
    await load();
  };

  if (!repo || !context) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">
            &larr; Repos
          </Link>
          <h1 className="text-xl font-bold">{repo.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/repo/${id}/history`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400"
          >
            History
          </Link>
          <Link
            href={`/repo/${id}/export`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400"
          >
            Export
          </Link>
        </div>
      </div>

      {/* Branch + actions */}
      <div className="mb-4 flex items-center justify-between">
        <BranchSelector
          branches={repo.branches}
          current={repo.current_branch}
          onCheckout={handleCheckout}
          onCreate={handleCreateBranch}
        />
        <div className="flex items-center gap-2">
          {status && (
            <span className="text-sm text-green-600">{status}</span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <CommitDialog onCommit={handleCommit} />
        </div>
      </div>

      {/* Context editor */}
      <ContextEditor data={context} onChange={handleContextChange} />
    </div>
  );
}
