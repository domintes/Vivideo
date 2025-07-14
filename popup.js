// Popup script for Vivideo
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggle-btn');
  const resetBtn = document.getElementById('reset-btn');
  const statusDiv = document.getElementById('status');
  const videoCountDiv = document.getElementById('video-count');
  const enhancementStatusDiv = document.getElementById('enhancement-status');

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    
    // Check if we can access the tab
    if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
      videoCountDiv.textContent = 'Cannot access this page';
      enhancementStatusDiv.textContent = 'Enhancement: Unavailable';
      statusDiv.className = 'status status-inactive';
      toggleBtn.disabled = true;
      resetBtn.disabled = true;
      return;
    }
    
    // Inject content script and check for videos
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: checkVideos
    }, (results) => {
      if (results && results[0]) {
        const videoCount = results[0].result;
        videoCountDiv.textContent = `${videoCount} video${videoCount !== 1 ? 's' : ''} found`;
        
        if (videoCount > 0) {
          statusDiv.className = 'status status-active';
          enhancementStatusDiv.textContent = 'Enhancement: Active';
        } else {
          statusDiv.className = 'status status-inactive';
          enhancementStatusDiv.textContent = 'Enhancement: No videos';
        }
      }
    });
  });

  // Toggle button click
  toggleBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-vivideo' });
      window.close();
    });
  });

  // Reset button click
  resetBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'reset-vivideo' });
      
      // Also reset stored settings
      chrome.storage.sync.remove('vivideoSettings', function() {
        enhancementStatusDiv.textContent = 'Enhancement: Reset';
        setTimeout(() => {
          enhancementStatusDiv.textContent = 'Enhancement: Active';
        }, 1000);
      });
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
        enhancementStatusDiv.textContent = 'Enhancement: Modified';
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
