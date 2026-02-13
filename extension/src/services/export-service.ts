import type { ContextData } from "../types/context";

export type ExportTarget = "chatgpt" | "claude" | "gemini";

// Faithful port of backend/templates/chatgpt.md.j2
function exportChatGPT(ctx: ContextData): string {
  let out = `# Context Pack (for ChatGPT)\n\n## Purpose\n${ctx.purpose}\n\n## Assumptions\n`;
  for (const item of ctx.assumptions) {
    out += `- ${item}\n`;
  }
  out += `\n## Glossary\n`;
  for (const item of ctx.glossary) {
    out += `- **${item.term}**: ${item.definition}\n`;
  }
  out += `\n## Decisions\n`;
  for (const item of ctx.decisions) {
    out += `### ${item.title}\n${item.detail}\n`;
    if (item.date) out += `(${item.date})`;
    out += "\n\n";
  }
  out += `---\n*Exported from ContextGit*\n`;
  return out;
}

// Faithful port of backend/templates/claude.md.j2
function exportClaude(ctx: ContextData): string {
  let out = `<context>\n<purpose>\n${ctx.purpose}\n</purpose>\n\n<assumptions>\n`;
  for (const item of ctx.assumptions) {
    out += `- ${item}\n`;
  }
  out += `</assumptions>\n\n<glossary>\n`;
  for (const item of ctx.glossary) {
    out += `- ${item.term}: ${item.definition}\n`;
  }
  out += `</glossary>\n\n<decisions>\n`;
  for (const item of ctx.decisions) {
    out += `- ${item.title}: ${item.detail}`;
    if (item.date) out += ` (${item.date})`;
    out += "\n\n";
  }
  out += `</decisions>\n</context>\n`;
  return out;
}

// Faithful port of backend/templates/gemini.md.j2
function exportGemini(ctx: ContextData): string {
  let out = `# Shared Context\n\n**Purpose:** ${ctx.purpose}\n\n**Assumptions:**\n`;
  ctx.assumptions.forEach((item, i) => {
    out += `${i + 1}. ${item}\n`;
  });
  out += `\n**Glossary:**\n`;
  for (const item of ctx.glossary) {
    out += `- ${item.term} = ${item.definition}\n`;
  }
  out += `\n**Key Decisions:**\n`;
  ctx.decisions.forEach((item, i) => {
    out += `${i + 1}. [${item.title}] ${item.detail}`;
    if (item.date) out += ` (${item.date})`;
    out += "\n\n";
  });
  out += `---\n_Exported from ContextGit_\n`;
  return out;
}

const exporters: Record<ExportTarget, (ctx: ContextData) => string> = {
  chatgpt: exportChatGPT,
  claude: exportClaude,
  gemini: exportGemini,
};

export function exportContext(
  context: ContextData,
  target: ExportTarget,
): string {
  const fn = exporters[target];
  if (!fn) throw new Error(`Unknown export target: ${target}`);
  return fn(context);
}

export function listTargets(): ExportTarget[] {
  return ["chatgpt", "claude", "gemini"];
}
