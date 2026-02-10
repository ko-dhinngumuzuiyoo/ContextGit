"use client";

import { CommitInfo } from "@/lib/api";

export default function CommitHistory({
  commits,
  onSelect,
}: {
  commits: CommitInfo[];
  onSelect?: (hash: string) => void;
}) {
  if (commits.length === 0) {
    return <p className="py-8 text-center text-gray-400">No commits yet</p>;
  }

  return (
    <div className="space-y-1">
      {commits.map((c, i) => (
        <div
          key={c.hash + i}
          onClick={() => onSelect?.(c.hash)}
          className={`flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 ${
            onSelect ? "cursor-pointer hover:border-blue-300" : ""
          }`}
        >
          <code className="mt-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
            {c.hash}
          </code>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.message}</p>
            <p className="text-xs text-gray-400">
              {c.author} &middot; {new Date(c.date).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
