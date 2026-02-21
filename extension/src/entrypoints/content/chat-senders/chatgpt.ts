const SEND_SELECTORS = [
  '[data-testid="send-button"]',
  'button[aria-label="Send prompt"]',
  'button[aria-label="Send"]',
];

export function sendChatGPT(): boolean {
  for (const sel of SEND_SELECTORS) {
    const btn = document.querySelector(sel) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  }
  return false;
}
