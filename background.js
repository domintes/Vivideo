// Background script for Vivideo
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vivideo extension installed');
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-vivideo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-vivideo' });
    });
  }
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
