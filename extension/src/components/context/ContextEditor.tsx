import { useState } from "react";
import type { ContextData } from "../../types/context";
import {
  PurposeEditor,
  AssumptionsEditor,
  GlossaryEditor,
  DecisionsEditor,
} from "./SectionEditor";

const TABS = [
  { key: "purpose", label: "Purpose" },
  { key: "assumptions", label: "Assumptions" },
  { key: "glossary", label: "Glossary" },
  { key: "decisions", label: "Decisions" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ContextEditor({
  data,
  onChange,
}: {
  data: ContextData;
  onChange: (data: ContextData) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("purpose");

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-medium transition ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {activeTab === "purpose" && (
          <PurposeEditor
            value={data.purpose}
            onChange={(v) => onChange({ ...data, purpose: v })}
          />
        )}
        {activeTab === "assumptions" && (
          <AssumptionsEditor
            value={data.assumptions}
            onChange={(v) => onChange({ ...data, assumptions: v })}
          />
        )}
        {activeTab === "glossary" && (
          <GlossaryEditor
            value={data.glossary}
            onChange={(v) => onChange({ ...data, glossary: v })}
          />
        )}
        {activeTab === "decisions" && (
          <DecisionsEditor
            value={data.decisions}
            onChange={(v) => onChange({ ...data, decisions: v })}
          />
        )}
      </div>
    </div>
  );
}
