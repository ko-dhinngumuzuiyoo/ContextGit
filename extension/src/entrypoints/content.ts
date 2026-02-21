import type { Platform } from "../types/workflow";
import type { AIResponse } from "../types/workflow";
import { injectChatGPT } from "./content/chat-injectors/chatgpt";
import { injectClaude } from "./content/chat-injectors/claude";
import { injectGemini } from "./content/chat-injectors/gemini";
import { ChatGPTReader } from "./content/chat-readers/chatgpt";
import { ClaudeReader } from "./content/chat-readers/claude";
import { GeminiReader } from "./content/chat-readers/gemini";
import type { ChatReader } from "./content/chat-readers/types";
import { triggerSend } from "./content/chat-senders/index";

function detectPlatform(): Platform | null {
  const host = window.location.hostname;
  if (host.includes("chat.openai.com") || host.includes("chatgpt.com"))
    return "chatgpt";
  if (host.includes("claude.ai")) return "claude";
  if (host.includes("gemini.google.com")) return "gemini";
  return null;
}

const injectors: Record<Platform, (content: string) => boolean> = {
  chatgpt: injectChatGPT,
  claude: injectClaude,
  gemini: injectGemini,
};

function createReader(platform: Platform): ChatReader {
  switch (platform) {
    case "chatgpt":
      return new ChatGPTReader();
    case "claude":
      return new ClaudeReader();
    case "gemini":
      return new GeminiReader();
  }
}

function createInjectButton() {
  const host = document.createElement("div");
  host.id = "contextgit-inject-host";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    .cg-btn {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 10000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-size: 14px;
      font-weight: bold;
      font-family: system-ui, sans-serif;
      transition: transform 0.2s;
    }
    .cg-btn:hover {
      transform: scale(1.1);
    }
  `;
  shadow.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "cg-btn";
  btn.title = "Open ContextGit";
  btn.textContent = "CG";
  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL" });
  });
  shadow.appendChild(btn);
  document.body.appendChild(host);
}

// Map MCP bridge actions to Chrome runtime messages
function mapMCPAction(
  action: string,
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  switch (action) {
    case "createIssue":
      return { type: "API_CREATE_ISSUE", issue: payload };
    case "startIssue":
      return { type: "API_START_ISSUE", issueId: payload.issueId };
    case "listIssues":
      return { type: "API_GET_STATE" };
    case "createPR":
      return { type: "API_CREATE_PR", issueId: payload.issueId };
    case "reviewPR":
      return {
        type: "API_REVIEW_PR",
        prId: payload.prId,
        action: payload.action,
        comment: payload.comment,
      };
    case "mergePR":
      return { type: "API_MERGE_PR", prId: payload.prId };
    case "listPRs":
      return { type: "API_GET_STATE" };
    case "getState":
      return { type: "API_GET_STATE" };
    case "startWorkflow":
      return {
        type: "API_START_WORKFLOW",
        issues: payload.issues,
        sendMode: payload.sendMode,
      };
    case "injectPrompt":
      return {
        type: "BG_INJECT_PROMPT",
        prompt: payload.prompt,
        autoSend: payload.autoSend ?? false,
      };
    case "readResponse":
      return { type: "BG_READ_RESPONSE" };
    default:
      return null;
  }
}

let responseIdCounter = 0;

export default defineContentScript({
  matches: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
  ],
  main() {
    const platform = detectPlatform();
    if (!platform) return;

    createInjectButton();

    // --- Reader: monitor AI responses ---
    const reader = createReader(platform);
    reader.start({
      onResponseStart(elementId) {
        // Optionally notify background that streaming started
        console.debug("[ContextGit] Response streaming started:", elementId);
      },
      onResponseComplete(elementId, content) {
        const response: AIResponse = {
          id: `${platform}-${++responseIdCounter}`,
          platform,
          content,
          timestamp: new Date().toISOString(),
          isStreaming: false,
        };
        chrome.runtime.sendMessage({
          type: "CS_RESPONSE_COMPLETE",
          platform,
          response,
        });
      },
    });

    // --- Notify background that this tab is ready ---
    chrome.runtime.sendMessage({ type: "CS_READY", platform });

    // --- MCP Bridge: window.postMessage → chrome.runtime.sendMessage ---
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data?.source !== "contextgit-mcp") return;

      const { action, payload, requestId } = event.data;
      const apiMessage = mapMCPAction(action, payload);
      if (!apiMessage) {
        window.postMessage(
          {
            source: "contextgit-mcp-response",
            requestId,
            error: `Unknown action: ${action}`,
          },
          "*",
        );
        return;
      }

      chrome.runtime.sendMessage(apiMessage, (response) => {
        window.postMessage(
          {
            source: "contextgit-mcp-response",
            requestId,
            response,
          },
          "*",
        );
      });
    });

    // --- Message handler ---
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        // Legacy: inject context for export
        case "INJECT_CONTEXT": {
          const inject = injectors[platform];
          const success = inject(message.content);
          if (!success) {
            navigator.clipboard.writeText(message.content).then(
              () => sendResponse({ success: true, fallback: "clipboard" }),
              () => sendResponse({ success: false, error: "Injection failed" }),
            );
            return true; // async
          }
          sendResponse({ success: true });
          break;
        }

        // New: inject prompt + optionally auto-send
        case "BG_INJECT_PROMPT": {
          const inject = injectors[platform];
          const success = inject(message.prompt);
          if (success && message.autoSend) {
            // Small delay to ensure the text is registered by the UI
            setTimeout(() => {
              const sent = triggerSend(platform);
              sendResponse({ success: true, sent });
            }, 200);
            return true; // async
          }
          sendResponse({ success, sent: false });
          break;
        }

        // New: read latest AI response
        case "BG_READ_RESPONSE": {
          const text = reader.readLatestResponse();
          const streaming = reader.isResponseStreaming();
          sendResponse({ content: text, isStreaming: streaming });
          break;
        }

        // New: get tab status
        case "BG_GET_STATUS": {
          sendResponse({
            platform,
            streaming: reader.isResponseStreaming(),
            ready: true,
          });
          break;
        }
      }
      return true;
    });
  },
});
