import { useState } from "react";

export default function BranchSelector({
  branches,
  current,
  onCheckout,
  onCreate,
}: {
  branches: string[];
  current: string;
  onCheckout: (branch: string) => void;
  onCreate: (name: string) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
    setShowNew(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={current}
        onChange={(e) => onCheckout(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      >
        {branches.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {showNew ? (
        <div className="flex gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="branch name"
            className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="rounded-lg bg-green-600 px-2 py-1.5 text-xs text-white hover:bg-green-700"
          >
            OK
          </button>
          <button
            onClick={() => setShowNew(false)}
            className="px-1 text-gray-400 hover:text-gray-600"
          >
            x
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg border border-dashed border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          + Branch
        </button>
      )}
    </div>
  );
}
