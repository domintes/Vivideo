// Background script for Vivideo
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vivideo extension installed');
});

// Handle action button click (when icon is clicked)
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle-vivideo' });
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  console.log('Vivideo Background: Command received:', command);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      console.log('Vivideo Background: Sending command to tab:', tabs[0].id, command);
      chrome.tabs.sendMessage(tabs[0].id, { action: command });
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
