export interface ReaderCallbacks {
  onResponseStart: (elementId: string) => void;
  onResponseComplete: (elementId: string, content: string) => void;
}

export interface ChatReader {
  start(callbacks: ReaderCallbacks): void;
  stop(): void;
  readLatestResponse(): string | null;
  isResponseStreaming(): boolean;
}
