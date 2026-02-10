"use client";

export default function DiffViewer({ diffText }: { diffText: string }) {
  if (!diffText) {
    return <p className="py-8 text-center text-gray-400">No changes</p>;
  }

  const lines = diffText.split("\n");

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50">
      <pre className="p-4 text-xs leading-5 font-mono">
        {lines.map((line, i) => {
          let color = "text-gray-700";
          let bg = "";
          if (line.startsWith("+") && !line.startsWith("+++")) {
            color = "text-green-700";
            bg = "bg-green-50";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            color = "text-red-700";
            bg = "bg-red-50";
          } else if (line.startsWith("@@")) {
            color = "text-blue-600";
            bg = "bg-blue-50";
          } else if (line.startsWith("diff") || line.startsWith("index")) {
            color = "text-gray-400";
          }
          return (
            <div key={i} className={`${color} ${bg} px-2 -mx-2`}>
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
