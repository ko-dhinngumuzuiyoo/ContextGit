"use client";

import { GlossaryItem, Decision } from "@/lib/api";

// --- Purpose editor (single textarea) ---
export function PurposeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="What is the purpose of this context?"
      rows={4}
      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
    />
  );
}

// --- Assumptions editor (list of strings) ---
export function AssumptionsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const update = (i: number, text: string) => {
    const next = [...value];
    next[i] = text;
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const add = () => {
    onChange([...value, ""]);
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Assumption ${i + 1}`}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-lg px-2 text-gray-400 hover:text-red-500"
          >
            x
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add assumption
      </button>
    </div>
  );
}

// --- Glossary editor (term + definition pairs) ---
export function GlossaryEditor({
  value,
  onChange,
}: {
  value: GlossaryItem[];
  onChange: (v: GlossaryItem[]) => void;
}) {
  const update = (i: number, field: keyof GlossaryItem, text: string) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: text };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const add = () => {
    onChange([...value, { term: "", definition: "" }]);
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item.term}
            onChange={(e) => update(i, "term", e.target.value)}
            placeholder="Term"
            className="w-1/3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            value={item.definition}
            onChange={(e) => update(i, "definition", e.target.value)}
            placeholder="Definition"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-lg px-2 text-gray-400 hover:text-red-500"
          >
            x
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add term
      </button>
    </div>
  );
}

// --- Decisions editor ---
export function DecisionsEditor({
  value,
  onChange,
}: {
  value: Decision[];
  onChange: (v: Decision[]) => void;
}) {
  const update = (i: number, field: keyof Decision, text: string) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: text };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const add = () => {
    const today = new Date().toISOString().split("T")[0];
    onChange([...value, { title: "", detail: "", date: today }]);
  };

  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={item.title}
              onChange={(e) => update(i, "title", e.target.value)}
              placeholder="Decision title"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="date"
              value={item.date || ""}
              onChange={(e) => update(i, "date", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => remove(i)}
              className="rounded-lg px-2 text-gray-400 hover:text-red-500"
            >
              x
            </button>
          </div>
          <textarea
            value={item.detail}
            onChange={(e) => update(i, "detail", e.target.value)}
            placeholder="Details..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Add decision
      </button>
    </div>
  );
}
