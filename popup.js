// Popup script for Vivideo
document.addEventListener('DOMContentLoaded', function() {
  const openPanelBtn = document.getElementById('open-panel-btn');
  const statusDiv = document.getElementById('status');
  const videoCountDiv = document.getElementById('video-count');
  const enhancementStatusDiv = document.getElementById('enhancement-status');

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    
    // Check if we can access the tab
    if (currentTab.url.startsWith('chrome://') || 
        currentTab.url.startsWith('chrome-extension://') ||
        currentTab.url.startsWith('moz-extension://') ||
        currentTab.url.startsWith('edge://')) {
      videoCountDiv.textContent = 'Nie można uzyskać dostępu do tej strony';
      enhancementStatusDiv.textContent = 'Enhancement: Niedostępny';
      statusDiv.className = 'status status-inactive';
      openPanelBtn.disabled = true;
      openPanelBtn.textContent = '❌ Panel niedostępny';
      return;
    }
    
    // Inject content script and check for videos
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: checkVideos
    }, (results) => {
      if (results && results[0]) {
        const videoCount = results[0].result;
        videoCountDiv.textContent = `${videoCount} ${videoCount === 1 ? 'film znaleziony' : 'filmów znalezionych'}`;
        
        if (videoCount > 0) {
          statusDiv.className = 'status status-active';
          enhancementStatusDiv.textContent = 'Enhancement: Aktywny';
        } else {
          statusDiv.className = 'status status-inactive';
          enhancementStatusDiv.textContent = 'Enhancement: Brak filmów';
        }
      }
    });
  });

  // Open panel button click
  openPanelBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-vivideo' });
      window.close();
    });
  });

  // Load current settings and display status
  chrome.storage.sync.get('vivideoSettings', function(result) {
    if (result.vivideoSettings) {
      const settings = result.vivideoSettings;
      const hasChanges = settings.brightness !== 0 || 
                        settings.contrast !== 0 || 
                        settings.saturation !== 0 || 
                        settings.gamma !== 1 || 
                        settings.colorTemp !== 0;
      
      if (hasChanges) {
        enhancementStatusDiv.textContent = 'Enhancement: Zmodyfikowany';
      }
    }
  });
});

// Function to inject for checking videos
function checkVideos() {
  const videos = document.querySelectorAll('video');
  let videoCount = videos.length;
  
  // Also check shadow DOM
  const elementsWithShadow = document.querySelectorAll('*');
  elementsWithShadow.forEach(element => {
    if (element.shadowRoot) {
      videoCount += element.shadowRoot.querySelectorAll('video').length;
    }
  });
  
  return videoCount;
}
