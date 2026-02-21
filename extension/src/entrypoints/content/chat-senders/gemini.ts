const SEND_SELECTORS = [
  '.send-button',
  'button[aria-label="Send"]',
  'button[aria-label="Send message"]',
  'button[data-testid="send-button"]',
];

export function sendGemini(): boolean {
  for (const sel of SEND_SELECTORS) {
    const btn = document.querySelector(sel) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  }
  return false;
}
