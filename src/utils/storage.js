// Storage Utilities
// Handles Chrome storage operations and data persistence

class StorageUtils {
  static sendMessage(action, data) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action, ...data }, (response) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.warn('StorageUtils.sendMessage runtime.lastError:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } catch (e) {
        console.warn('StorageUtils.sendMessage failed to send message', e);
        resolve(null);
      }
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
    // Serialize writes. Several controls can save nearly simultaneously and
    // chrome.storage.sync may otherwise finish an older write last.
    if (!this.writeQueue) this.writeQueue = Promise.resolve();

    const write = this.writeQueue.then(async () => {
      try {
        return (await this.sendMessage('set-storage', { data }))?.success === true;
      } catch (error) {
        console.error('Storage set error:', error);
        return false;
      }
    });

    this.writeQueue = write.catch(() => false);
    return write;
  }

  static getStateKeys() {
    return [
      'vivideoSettings',
      'vivideoProfiles',
      'vivideoTheme',
      'vivideoAppState',
      'vivideoThemeColors',
      'vivideoStateMeta',
      'vivideoFullState'
    ];
  }

  static mergeStoragePayload(existing = {}, updates = {}) {
    const merged = { ...existing };

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        merged[key] = value;
      } else if (value && typeof value === 'object') {
        merged[key] = { ...(existing[key] || {}), ...value };
      } else {
        merged[key] = value;
      }
    });

    return merged;
  }

  static async saveStateSnapshot(snapshot = {}) {
    const existing = await this.getStorage(this.getStateKeys());
    const timestamp = Date.now();
    const currentMeta = existing.vivideoStateMeta || {};
    const incomingMeta = snapshot.vivideoStateMeta || {};
    const savedAt = Number(currentMeta.updatedAt || 0);
    const nextAt = Number(incomingMeta.updatedAt || timestamp);

    if (savedAt > nextAt) {
      console.warn('StorageUtils: skipped stale state write', {
        savedAt,
        nextAt,
        key: incomingMeta.source || 'unknown'
      });
      return false;
    }

    const merged = this.mergeStoragePayload(existing, {
      vivideoSettings: snapshot.vivideoSettings ?? existing.vivideoSettings,
      vivideoProfiles: snapshot.vivideoProfiles ?? existing.vivideoProfiles,
      vivideoTheme: snapshot.vivideoTheme ?? existing.vivideoTheme,
      vivideoAppState: snapshot.vivideoAppState ?? existing.vivideoAppState,
      vivideoThemeColors: snapshot.vivideoThemeColors ?? existing.vivideoThemeColors,
      vivideoFullState: snapshot.vivideoFullState ?? existing.vivideoFullState,
      vivideoStateMeta: {
        ...(existing.vivideoStateMeta || {}),
        ...(snapshot.vivideoStateMeta || {}),
        updatedAt: nextAt,
        savedAt: nextAt
      }
    });

    return await this.setStorage(merged);
  }

  static async loadSettings() {
    const response = await this.getStorage(this.getStateKeys());
    if (response && response.vivideoFullState) {
      return response;
    }
    return response;
  }

  static async saveSettings(settings) {
    const current = await this.getStorage(this.getStateKeys());
    return await this.saveStateSnapshot({
      ...current,
      vivideoSettings: settings,
      vivideoStateMeta: { ...(current.vivideoStateMeta || {}), updatedAt: Date.now() }
    });
  }

  static async saveProfiles(profiles) {
    const current = await this.getStorage(this.getStateKeys());
    return await this.saveStateSnapshot({
      ...current,
      vivideoProfiles: profiles,
      vivideoStateMeta: { ...(current.vivideoStateMeta || {}), updatedAt: Date.now() }
    });
  }

  static async saveTheme(theme) {
    const current = await this.getStorage(this.getStateKeys());
    return await this.saveStateSnapshot({
      ...current,
      vivideoTheme: theme,
      vivideoStateMeta: { ...(current.vivideoStateMeta || {}), updatedAt: Date.now() }
    });
  }

  static async saveThemeColors(themeColors) {
    const current = await this.getStorage(this.getStateKeys());
    return await this.saveStateSnapshot({
      ...current,
      vivideoThemeColors: themeColors,
      vivideoStateMeta: { ...(current.vivideoStateMeta || {}), updatedAt: Date.now() }
    });
  }

  static async saveAppState(appState) {
    const current = await this.getStorage(this.getStateKeys());
    return await this.saveStateSnapshot({
      ...current,
      vivideoAppState: appState,
      vivideoStateMeta: { ...(current.vivideoStateMeta || {}), updatedAt: Date.now() }
    });
  }
}

// Export for use in other files
window.StorageUtils = StorageUtils;
