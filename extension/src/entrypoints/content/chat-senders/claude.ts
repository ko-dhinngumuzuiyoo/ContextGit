const SEND_SELECTORS = [
  'button[aria-label="Send message"]',
  'button[aria-label="Send Message"]',
  'button[data-testid="send-button"]',
];

export function sendClaude(): boolean {
  for (const sel of SEND_SELECTORS) {
    const btn = document.querySelector(sel) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  }
  return false;
}
