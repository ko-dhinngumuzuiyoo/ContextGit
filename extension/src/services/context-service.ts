import { parse, stringify } from "yaml";
import { gitService } from "./git-service";
import type { ContextData } from "../types/context";

const CONTEXT_FILE = "context.yaml";

const DEFAULT_CONTEXT: ContextData = {
  purpose: "",
  assumptions: [],
  glossary: [],
  decisions: [],
};

export async function getContext(repoId: string): Promise<ContextData> {
  const raw = await gitService.readFile(repoId, CONTEXT_FILE);
  if (raw === null) return { ...DEFAULT_CONTEXT };
  const data = parse(raw) || {};
  return { ...DEFAULT_CONTEXT, ...data } as ContextData;
}

export async function saveContext(
  repoId: string,
  context: ContextData,
): Promise<void> {
  const content = stringify(context, { sortMapEntries: false });
  await gitService.writeFile(repoId, CONTEXT_FILE, content);
}

export async function initContext(repoId: string): Promise<ContextData> {
  const existing = await gitService.readFile(repoId, CONTEXT_FILE);
  if (existing !== null) return getContext(repoId);
  await saveContext(repoId, DEFAULT_CONTEXT);
  return { ...DEFAULT_CONTEXT };
}
