import type {
  Platform,
  AIResponse,
  IssueStatus,
  PRStatus,
  Issue,
  SendMode,
} from "./workflow";

// --- Existing messages ---
export type LegacyMessage =
  | { type: "INJECT_CONTEXT"; content: string }
  | { type: "OPEN_SIDEPANEL" }
  | { type: "INJECTION_RESULT"; success: boolean; error?: string };

// --- Content Script -> Background ---
export type CSMessage =
  | { type: "CS_READY"; platform: Platform }
  | {
      type: "CS_RESPONSE_COMPLETE";
      platform: Platform;
      response: AIResponse;
    };

// --- Background -> Content Script ---
export type BGToCSMessage =
  | { type: "BG_INJECT_PROMPT"; prompt: string; autoSend: boolean }
  | { type: "BG_READ_RESPONSE" }
  | { type: "BG_GET_STATUS" };

// --- Background -> Sidepanel ---
export type BGToSPMessage =
  | { type: "BG_ISSUE_UPDATE"; issueId: string; status: IssueStatus }
  | { type: "BG_PR_UPDATE"; prId: string; status: PRStatus };

// --- External (Commander AI) -> Background (via MCP bridge) ---
export type APIMessage =
  | {
      type: "API_CREATE_ISSUE";
      issue: Omit<Issue, "id" | "createdAt" | "status">;
    }
  | { type: "API_START_ISSUE"; issueId: string }
  | { type: "API_CREATE_PR"; issueId: string }
  | {
      type: "API_REVIEW_PR";
      prId: string;
      action: "approve" | "reject";
      comment?: string;
    }
  | { type: "API_MERGE_PR"; prId: string }
  | { type: "API_GET_STATE" }
  | {
      type: "API_START_WORKFLOW";
      issues: Omit<Issue, "id" | "createdAt" | "status">[];
      sendMode: SendMode;
    };

// --- Union of all messages ---
export type Message =
  | LegacyMessage
  | CSMessage
  | BGToCSMessage
  | BGToSPMessage
  | APIMessage;
