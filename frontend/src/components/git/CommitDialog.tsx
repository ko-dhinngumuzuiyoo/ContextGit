"use client";

import { useState } from "react";

export default function CommitDialog({
  onCommit,
  disabled,
}: {
  onCommit: (message: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleCommit = () => {
    if (!message.trim()) return;
    onCommit(message.trim());
    setMessage("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Commit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCommit()}
        placeholder="Commit message..."
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        autoFocus
      />
      <button
        onClick={handleCommit}
        disabled={!message.trim()}
        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Save
      </button>
      <button
        onClick={() => setOpen(false)}
        className="rounded-lg px-2 py-2 text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}
