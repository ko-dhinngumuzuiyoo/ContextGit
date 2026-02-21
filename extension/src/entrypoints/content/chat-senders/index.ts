import type { Platform } from "../../../types/workflow";
import { sendChatGPT } from "./chatgpt";
import { sendClaude } from "./claude";
import { sendGemini } from "./gemini";

const senders: Record<Platform, () => boolean> = {
  chatgpt: sendChatGPT,
  claude: sendClaude,
  gemini: sendGemini,
};

export function triggerSend(platform: Platform): boolean {
  return senders[platform]();
}
