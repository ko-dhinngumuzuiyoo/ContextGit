export default defineBackground(() => {
  // Open sidepanel when extension icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "OPEN_SIDEPANEL" && sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      sendResponse({ success: true });
    }
    return true;
  });
});
