import { useState } from "react";
import { getContext } from "../../services/context-service";
import {
  exportContext,
  type ExportTarget,
} from "../../services/export-service";

const TARGETS = [
  { key: "chatgpt" as ExportTarget, label: "ChatGPT", color: "bg-green-600" },
  { key: "claude" as ExportTarget, label: "Claude", color: "bg-orange-600" },
  { key: "gemini" as ExportTarget, label: "Gemini", color: "bg-blue-600" },
];

export default function ExportPanel({ repoId }: { repoId: string }) {
  const [selected, setSelected] = useState<ExportTarget>("chatgpt");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [injected, setInjected] = useState(false);

  const handleExport = async (target: ExportTarget) => {
    setSelected(target);
    setLoading(true);
    setCopied(false);
    setInjected(false);
    try {
      const ctx = await getContext(repoId);
      const result = exportContext(ctx, target);
      setContent(result);
    } catch {
      setContent("Export failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInject = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;
      await chrome.tabs.sendMessage(tab.id, {
        type: "INJECT_CONTEXT",
        content,
      });
      setInjected(true);
      setTimeout(() => setInjected(false), 2000);
    } catch {
      // Fallback to clipboard
      await handleCopy();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleExport(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white transition ${
              selected === t.key ? t.color : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Generating...
        </p>
      ) : content ? (
        <div className="relative">
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              onClick={handleInject}
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow hover:bg-blue-700"
            >
              {injected ? "Injected!" : "Inject"}
            </button>
            <button
              onClick={handleCopy}
              className="rounded-lg bg-white px-2 py-1 text-xs font-medium shadow hover:bg-gray-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 pt-10 text-xs">
            {content}
          </pre>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">
          Select a target to generate Export Pack
        </p>
      )}
    </div>
  );
}
