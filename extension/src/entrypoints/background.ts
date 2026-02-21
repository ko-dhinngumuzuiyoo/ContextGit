import { tabManager } from "../services/tab-manager";
import { issueManager } from "../services/issue-manager";
import { prManager } from "../services/pr-manager";
import { workflowEngine } from "../services/workflow-engine";
import type { Message } from "../types/messages";

export default defineBackground(() => {
  // Open sidepanel when extension icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Clean up tab connections when tabs are closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    tabManager.unregister(tabId);
  });

  // Handle all messages
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      const tabId = sender.tab?.id;

      switch (message.type) {
        // --- Legacy ---
        case "OPEN_SIDEPANEL": {
          if (tabId) chrome.sidePanel.open({ tabId });
          sendResponse({ success: true });
          break;
        }

        // --- Content Script → Background ---
        case "CS_READY": {
          if (tabId) {
            tabManager.register(
              tabId,
              message.platform,
              sender.tab?.url || "",
            );
          }
          sendResponse({ success: true });
          break;
        }

        case "CS_RESPONSE_COMPLETE": {
          if (tabId) {
            tabManager.updateStatus(tabId, "connected");
            // Forward to workflow engine
            workflowEngine
              .handleResponse(tabId, message.response)
              .catch((err) =>
                console.error("[ContextGit] handleResponse error:", err),
              );
          }
          sendResponse({ success: true });
          break;
        }

        // --- API: Issue operations ---
        case "API_CREATE_ISSUE": {
          const def = message.issue;
          issueManager
            .createIssue(
              def.repoId,
              def.title,
              def.description,
              def.assignedPlatform,
              def.reviewerPlatform,
              def.dependsOn,
              def.labels,
            )
            .then((issue) => sendResponse({ success: true, issue }))
            .catch((err) =>
              sendResponse({ success: false, error: String(err) }),
            );
          return true; // async
        }

        case "API_START_ISSUE": {
          issueManager
            .startIssue(message.issueId)
            .then((result) => sendResponse({ success: true, ...result }))
            .catch((err) =>
              sendResponse({ success: false, error: String(err) }),
            );
          return true;
        }

        case "API_CREATE_PR": {
          prManager
            .createPR(message.issueId)
            .then((pr) => sendResponse({ success: true, pr }))
            .catch((err) =>
              sendResponse({ success: false, error: String(err) }),
            );
          return true;
        }

        case "API_REVIEW_PR": {
          workflowEngine
            .handleReviewComplete(message.prId, message.action, message.comment)
            .then(() => sendResponse({ success: true }))
            .catch((err) =>
              sendResponse({ success: false, error: String(err) }),
            );
          return true;
        }

        case "API_MERGE_PR": {
          prManager
            .mergePR(message.prId)
            .then(() => sendResponse({ success: true }))
            .catch((err) =>
              sendResponse({ success: false, error: String(err) }),
            );
          return true;
        }

        case "API_GET_STATE": {
          const wfState = workflowEngine.getState();
          const tabs = tabManager.listConnected();
          sendResponse({
            success: true,
            workflow: wfState
              ? {
                  ...wfState,
                  completedIds: Array.from(wfState.completedIds),
                }
              : null,
            connectedTabs: tabs,
          });
          break;
        }

        case "API_START_WORKFLOW": {
          workflowEngine
            .start(
              message.issues[0]?.repoId || "",
              message.issues,
              message.sendMode,
            )
            .then((issueIds) =>
              sendResponse({ success: true, issueIds }),
            )
            .catch((err) =>
              sendResponse({ success: false, error: String(err) }),
            );
          return true;
        }
      }
      return true;
    },
  );
});
