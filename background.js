// Background script for Vivideo
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vivideo extension installed');
});

// Handle action button click (when icon is clicked)
chrome.action.onClicked.addListener((tab) => {
    // Use a callback and check runtime.lastError to avoid unchecked runtime errors
    chrome.tabs.sendMessage(tab.id, { action: 'toggle-vivideo' }, () => {
      if (chrome.runtime.lastError) {
        // The tab may not have the content script; suppress noisy console error
        console.debug('Vivideo Background: sendMessage failed (possibly no receiver)');
      }
    });
});

// When user switches tabs, notify content script to ensure Vivideo is initialized/applied
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.sendMessage(activeInfo.tabId, { action: 'ensure-vivideo' }, (res) => {
    // ignore errors (tab may not have content script)
  });
});

// When a tab finishes loading, ensure Vivideo applies if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { action: 'ensure-vivideo' }, (res) => {
      // ignore errors
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  console.log('Vivideo Background: Command received:', command);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      console.log('Vivideo Background: Sending command to tab:', tabs[0].id, command);
        chrome.tabs.sendMessage(tabs[0].id, { action: command }, () => {
          if (chrome.runtime.lastError) {
            console.debug('Vivideo Background: command send failed (no receiver)');
          }
        });
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get-storage') {
    chrome.storage.sync.get(request.keys, (result) => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'set-storage') {
    chrome.storage.sync.set(request.data, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
