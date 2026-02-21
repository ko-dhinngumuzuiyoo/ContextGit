import type { ChatReader, ReaderCallbacks } from "./types";

const SELECTORS = {
  response: "model-response",
  responseText: ".model-response-text",
  fallbackResponse: ".response-content",
  // Gemini signals streaming via a loading indicator
  streaming: ".loading-indicator, .response-streaming",
};

const DEBOUNCE_MS = 300;

export class GeminiReader implements ChatReader {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSeenContent: string | null = null;
  private wasStreaming = false;
  private stableCount = 0;
  private lastContent: string | null = null;

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
    // Gemini doesn't always have a clear streaming indicator,
    // so we also check if content is still changing
    if (document.querySelector(SELECTORS.streaming)) return true;

    const content = this.readLatestResponse();
    if (content && content === this.lastContent) {
      this.stableCount++;
    } else {
      this.stableCount = 0;
      this.lastContent = content;
    }
    // Consider stable after 3 consecutive unchanged checks (~900ms)
    return this.stableCount < 3 && this.lastContent !== this.lastSeenContent;
  }

  private getLatestResponseEl(): Element | null {
    // Try model-response elements first
    const models = document.querySelectorAll(SELECTORS.response);
    if (models.length > 0) return models[models.length - 1];
    // Fallback to .model-response-text
    const texts = document.querySelectorAll(SELECTORS.responseText);
    if (texts.length > 0) return texts[texts.length - 1];
    const fallback = document.querySelectorAll(SELECTORS.fallbackResponse);
    return fallback.length > 0 ? fallback[fallback.length - 1] : null;
  }

  private check(callbacks: ReaderCallbacks): void {
    const streaming = this.isResponseStreaming();
    const el = this.getLatestResponseEl();
    if (!el) return;

    const elId = `gemini-response`;

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
