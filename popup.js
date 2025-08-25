// Popup script for Vivideo
document.addEventListener('DOMContentLoaded', function() {
  const openPanelBtn = document.getElementById('open-panel-btn');
  const statusDiv = document.getElementById('status');
  const videoCountDiv = document.getElementById('video-count');
  const enhancementStatusDiv = document.getElementById('enhancement-status');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  const messageDiv = document.getElementById('message');

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

  // Export settings
  exportBtn.addEventListener('click', async function() {
    showMessage('Eksportowanie ustawień...', 'info');
    
    try {
      const allData = await getAllSettings();
      const exportData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        settings: allData.vivideoSettings || {},
        profiles: allData.vivideoProfiles || [],
        theme: allData.vivideoTheme || 'cybernetic',
        themeColors: allData.vivideoThemeColors || {},
        appState: allData.vivideoAppState || {}
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const fileName = `vivideo-settings-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
      
      // Download file
      const url = URL.createObjectURL(dataBlob);
      chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs: true
      }, (downloadId) => {
        URL.revokeObjectURL(url);
        showMessage('Ustawienia zostały wyeksportowane pomyślnie!', 'success');
      });

    } catch (error) {
      console.error('Export error:', error);
      showMessage('Błąd podczas eksportu: ' + error.message, 'error');
    }
  });

  // Import settings
  importBtn.addEventListener('click', function() {
    importFile.click();
  });

  importFile.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    showMessage('Importowanie ustawień...', 'info');

    try {
      const fileText = await readFile(file);
      const importData = JSON.parse(fileText);
      
      // Validate data
      if (!validateImportData(importData)) {
        throw new Error('Nieprawidłowy format pliku ustawień');
      }

      // Import settings
      await importSettings(importData);
      
      const profilesCount = importData.profiles ? importData.profiles.length : 0;
      showMessage(`Ustawienia zostały zaimportowane pomyślnie! Zaimportowano ${profilesCount} profili.`, 'success');
      
      // Clear file input
      importFile.value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      showMessage('Błąd podczas importu: ' + error.message, 'error');
      importFile.value = '';
    }
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

  // Helper functions
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type !== 'info') {
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }

  function getAllSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'vivideoSettings', 
        'vivideoProfiles', 
        'vivideoTheme', 
        'vivideoThemeColors', 
        'vivideoAppState'
      ], resolve);
    });
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Błąd podczas odczytu pliku'));
      reader.readAsText(file);
    });
  }

  function validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.settings && !data.profiles) return false;
    
    if (data.settings) {
      const requiredKeys = ['brightness', 'contrast', 'saturation', 'gamma', 'colorTemp'];
      const hasRequiredKeys = requiredKeys.some(key => data.settings.hasOwnProperty(key));
      if (!hasRequiredKeys) return false;
    }

    if (data.profiles && Array.isArray(data.profiles)) {
      for (let profile of data.profiles) {
        if (!profile.name || !profile.settings) return false;
      }
    }

    return true;
  }

  async function importSettings(importData) {
    const savePromises = [];

    if (importData.settings) {
      savePromises.push(
        new Promise(resolve => {
          chrome.storage.sync.set({ vivideoSettings: importData.settings }, resolve);
        })
      );
    }

    if (importData.profiles) {
      savePromises.push(
        new Promise(resolve => {
          chrome.storage.sync.set({ vivideoProfiles: importData.profiles }, resolve);
        })
      );
    }

    if (importData.theme) {
      savePromises.push(
        new Promise(resolve => {
          chrome.storage.sync.set({ vivideoTheme: importData.theme }, resolve);
        })
      );
    }

    if (importData.themeColors) {
      savePromises.push(
        new Promise(resolve => {
          chrome.storage.sync.set({ vivideoThemeColors: importData.themeColors }, resolve);
        })
      );
    }

    if (importData.appState) {
      savePromises.push(
        new Promise(resolve => {
          chrome.storage.sync.set({ vivideoAppState: importData.appState }, resolve);
        })
      );
    }

    await Promise.all(savePromises);
  }
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
