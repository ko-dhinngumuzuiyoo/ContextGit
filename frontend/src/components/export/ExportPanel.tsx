"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const TARGETS = [
  { key: "chatgpt", label: "ChatGPT", color: "bg-green-600" },
  { key: "claude", label: "Claude", color: "bg-orange-600" },
  { key: "gemini", label: "Gemini", color: "bg-blue-600" },
];

export default function ExportPanel({
  repoId,
  branch,
}: {
  repoId: string;
  branch: string;
}) {
  const [selected, setSelected] = useState("chatgpt");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = async (target: string) => {
    setSelected(target);
    setLoading(true);
    setCopied(false);
    try {
      const result = await api.exportContext(repoId, target, branch);
      setContent(result.content);
    } catch {
      setContent("Export failed. Check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Target selector */}
      <div className="flex gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleExport(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              selected === t.key ? t.color : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      {loading ? (
        <p className="py-8 text-center text-gray-400">Generating...</p>
      ) : content ? (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 rounded-lg bg-white px-3 py-1 text-xs font-medium shadow hover:bg-gray-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre className="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      ) : (
        <p className="py-8 text-center text-gray-400">
          Select a target to generate Export Pack
        </p>
      )}
    </div>
  );
}
