export function injectClaude(content: string): boolean {
  // Claude uses a ProseMirror contenteditable editor
  const editor = document.querySelector(
    '[contenteditable="true"]',
  ) as HTMLElement | null;
  if (!editor) return false;

  editor.focus();

  // execCommand works well with ProseMirror
  if (document.execCommand("insertText", false, content)) {
    return true;
  }

  // Fallback
  editor.textContent = content;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
