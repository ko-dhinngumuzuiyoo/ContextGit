import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gitService } from "../services/git-service";
import { getContext, saveContext } from "../services/context-service";
import type { ContextData } from "../types/context";
import type { RepoInfo } from "../types/repo";
import ContextEditor from "../components/context/ContextEditor";
import BranchSelector from "../components/git/BranchSelector";
import CommitDialog from "../components/git/CommitDialog";

export default function RepoEditorView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [context, setContext] = useState<ContextData | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const [r, c] = await Promise.all([
      gitService.getRepoInfo(id),
      getContext(id),
    ]);
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
    if (!context || !id) return;
    setSaving(true);
    try {
      await saveContext(id, context);
      setDirty(false);
      setStatus("Saved");
      setTimeout(() => setStatus(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async (message: string) => {
    if (!id) return;
    if (dirty && context) {
      await saveContext(id, context);
    }
    await gitService.commit(id, message);
    setDirty(false);
    setStatus("Committed!");
    setTimeout(() => setStatus(""), 2000);
    await load();
  };

  const handleCheckout = async (branch: string) => {
    if (!id) return;
    await gitService.checkout(id, branch);
    await load();
  };

  const handleCreateBranch = async (name: string) => {
    if (!id) return;
    await gitService.createBranch(id, name);
    await gitService.checkout(id, name);
    await load();
  };

  if (!repo || !context) {
    return <p className="py-8 text-center text-sm text-gray-400">Loading...</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-base font-bold">{repo.name}</h1>
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => navigate(`/repo/${id}/history`)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-gray-400"
          >
            History
          </button>
          <button
            onClick={() => navigate(`/repo/${id}/export`)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-gray-400"
          >
            Export
          </button>
        </div>
      </div>

      {/* Branch + actions */}
      <div className="mb-3 space-y-2">
        <BranchSelector
          branches={repo.branches}
          current={repo.current_branch}
          onCheckout={handleCheckout}
          onCreate={handleCreateBranch}
        />
        <div className="flex items-center gap-2">
          {status && (
            <span className="text-xs text-green-600">{status}</span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-400 disabled:opacity-50"
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
