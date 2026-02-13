export function injectChatGPT(content: string): boolean {
  // ChatGPT uses a contenteditable div with id #prompt-textarea
  const textarea = document.querySelector(
    "#prompt-textarea",
  ) as HTMLElement | null;
  if (!textarea) return false;

  textarea.focus();

  // Use execCommand for best compatibility with React/contenteditable
  if (document.execCommand("insertText", false, content)) {
    return true;
  }

  // Fallback: set textContent directly
  textarea.textContent = content;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
