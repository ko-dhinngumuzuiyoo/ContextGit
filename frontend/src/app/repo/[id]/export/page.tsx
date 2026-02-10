"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, RepoInfo } from "@/lib/api";
import ExportPanel from "@/components/export/ExportPanel";

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const [repo, setRepo] = useState<RepoInfo | null>(null);

  const load = useCallback(async () => {
    setRepo(await api.getRepo(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!repo) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href={`/repo/${id}`} className="text-sm text-gray-500 hover:text-blue-600">
          &larr; {repo.name}
        </Link>
        <h1 className="text-xl font-bold">Export Pack</h1>
        <p className="text-sm text-gray-500">
          Generate context for pasting into LLM web apps
        </p>
      </div>

      <ExportPanel repoId={id} branch={repo.current_branch} />
    </div>
  );
}
