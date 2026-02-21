import type { ChatReader, ReaderCallbacks } from "./types";

const SELECTORS = {
  response: '[data-message-author-role="assistant"]',
  streaming: ".result-streaming",
  fallbackResponse: ".markdown.prose",
};

const DEBOUNCE_MS = 300;

export class ChatGPTReader implements ChatReader {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSeenId: string | null = null;
  private currentStreamingEl: Element | null = null;

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
    const els = document.querySelectorAll(SELECTORS.response);
    if (els.length === 0) return null;
    const last = els[els.length - 1];
    return last.textContent?.trim() || null;
  }

  isResponseStreaming(): boolean {
    return document.querySelector(SELECTORS.streaming) !== null;
  }

  private check(callbacks: ReaderCallbacks): void {
    const els = document.querySelectorAll(SELECTORS.response);
    if (els.length === 0) return;
    const last = els[els.length - 1];
    const elId =
      last.getAttribute("data-message-id") || `chatgpt-${els.length}`;

    if (this.isResponseStreaming()) {
      if (this.currentStreamingEl !== last) {
        this.currentStreamingEl = last;
        callbacks.onResponseStart(elId);
      }
      return;
    }

    // Streaming just ended
    if (this.currentStreamingEl === last || elId !== this.lastSeenId) {
      this.currentStreamingEl = null;
      this.lastSeenId = elId;
      const content = last.textContent?.trim() || "";
      if (content) {
        callbacks.onResponseComplete(elId, content);
      }
    }
  }
}
