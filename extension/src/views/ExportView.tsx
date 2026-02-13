import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { gitService } from "../services/git-service";
import type { RepoInfo } from "../types/repo";
import ExportPanel from "../components/export/ExportPanel";

export default function ExportView() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<RepoInfo | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setRepo(await gitService.getRepoInfo(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!repo) {
    return <p className="py-8 text-center text-sm text-gray-400">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-base font-bold">Export Pack</h1>
        <p className="text-xs text-gray-500">
          Generate context for pasting into LLM web apps
        </p>
      </div>

      <ExportPanel repoId={id!} />
    </div>
  );
}
