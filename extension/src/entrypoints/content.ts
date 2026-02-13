import { injectChatGPT } from "./content/chat-injectors/chatgpt";
import { injectClaude } from "./content/chat-injectors/claude";
import { injectGemini } from "./content/chat-injectors/gemini";

type Platform = "chatgpt" | "claude" | "gemini";

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

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "INJECT_CONTEXT") {
        const inject = injectors[platform];
        const success = inject(message.content);

        if (!success) {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(message.content).then(
            () =>
              sendResponse({
                success: true,
                fallback: "clipboard",
              }),
            () => sendResponse({ success: false, error: "Injection failed" }),
          );
          return true; // async response
        }

        sendResponse({ success: true });
      }
      return true;
    });
  },
});
