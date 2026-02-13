export function injectGemini(content: string): boolean {
  // Gemini uses a rich text editor with contenteditable
  const editor = document.querySelector(
    ".ql-editor, [contenteditable='true']",
  ) as HTMLElement | null;
  if (!editor) return false;

  editor.focus();

  if (document.execCommand("insertText", false, content)) {
    return true;
  }

  // Fallback
  editor.textContent = content;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
