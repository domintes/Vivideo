// Storage Utilities
// Handles Chrome storage operations and data persistence

class StorageUtils {
  static sendMessage(action, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  static async getStorage(keys) {
    try {
      return await this.sendMessage('get-storage', { keys });
    } catch (error) {
      console.error('Storage get error:', error);
      return {};
    }
  }

  static async setStorage(data) {
    try {
      return await this.sendMessage('set-storage', { data });
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  static async loadSettings() {
    const response = await this.getStorage([
      'vivideoSettings',
      'vivideoProfiles',
      'vivideoTheme',
      'vivideoAppState',
      'vivideoThemeColors'
    ]);
    return response;
  }

  static async saveSettings(settings) {
    return await this.setStorage({ vivideoSettings: settings });
  }

  static async saveProfiles(profiles) {
    return await this.setStorage({ vivideoProfiles: profiles });
  }

  static async saveTheme(theme) {
    return await this.setStorage({ vivideoTheme: theme });
  }

  static async saveThemeColors(themeColors) {
    return await this.setStorage({ vivideoThemeColors: themeColors });
  }

  static async saveAppState(appState) {
    return await this.setStorage({ vivideoAppState: appState });
  }
}

// Export for use in other files
window.StorageUtils = StorageUtils;
