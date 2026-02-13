export type Message =
  | { type: "INJECT_CONTEXT"; content: string }
  | { type: "OPEN_SIDEPANEL" }
  | { type: "INJECTION_RESULT"; success: boolean; error?: string };
