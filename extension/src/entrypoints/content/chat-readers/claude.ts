import type { ChatReader, ReaderCallbacks } from "./types";

const SELECTORS = {
  streaming: "[data-is-streaming='true']",
  response: ".font-claude-message",
  fallbackResponse: '[data-testid="chat-message-content"]',
};

const DEBOUNCE_MS = 300;

export class ClaudeReader implements ChatReader {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSeenContent: string | null = null;
  private wasStreaming = false;

  start(callbacks: ReaderCallbacks): void {
    this.observer = new MutationObserver(() => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.check(callbacks), DEBOUNCE_MS);
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  readLatestResponse(): string | null {
    const el = this.getLatestResponseEl();
    return el?.textContent?.trim() || null;
  }

  isResponseStreaming(): boolean {
    return document.querySelector(SELECTORS.streaming) !== null;
  }

  private getLatestResponseEl(): Element | null {
    const els = document.querySelectorAll(SELECTORS.response);
    if (els.length > 0) return els[els.length - 1];
    const fallback = document.querySelectorAll(SELECTORS.fallbackResponse);
    return fallback.length > 0 ? fallback[fallback.length - 1] : null;
  }

  private check(callbacks: ReaderCallbacks): void {
    const streaming = this.isResponseStreaming();
    const el = this.getLatestResponseEl();
    if (!el) return;

    const elId = el.getAttribute("data-testid") || `claude-response`;

    if (streaming && !this.wasStreaming) {
      this.wasStreaming = true;
      callbacks.onResponseStart(elId);
      return;
    }

    if (!streaming && this.wasStreaming) {
      this.wasStreaming = false;
      const content = el.textContent?.trim() || "";
      if (content && content !== this.lastSeenContent) {
        this.lastSeenContent = content;
        callbacks.onResponseComplete(elId, content);
      }
    }
  }
}
