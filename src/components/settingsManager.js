// Settings Import/Export Manager
// Handles importing and exporting settings and profiles with full restoration

class SettingsManager {
  constructor(controller) {
    this.controller = controller;
  }

  // Export all settings and profiles to JSON
  async exportSettings() {
    try {
      const allData = await StorageUtils.loadSettings();

      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: allData.vivideoSettings || this.controller.defaultSettings,
        profiles: allData.vivideoProfiles || [],
        theme: allData.vivideoTheme || window.VivideoConfig.defaultTheme,
        themeColors: allData.vivideoThemeColors || this.controller.themeColors,
        appState: allData.vivideoAppState || {}
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const fileName = `vivideo-settings-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;

      // Use Chrome downloads API if available, otherwise fallback to anchor download
      if (typeof chrome !== 'undefined' && chrome.downloads) {
        const url = URL.createObjectURL(dataBlob);
        chrome.downloads.download(
          {
            url: url,
            filename: fileName,
            saveAs: true
          },
          (_downloadId) => {
            URL.revokeObjectURL(url);
            console.log('Settings exported successfully');
          }
        );
      } else {
        // Fallback for content script context
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return { success: true, message: 'Ustawienia zostały wyeksportowane pomyślnie!' };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, message: 'Błąd podczas eksportu: ' + error.message };
    }
  }

  // Import settings from JSON file
  async importSettings(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Nie wybrano pliku'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);

          // Validate import data structure
          if (!this.validateImportData(importData)) {
            reject(new Error('Nieprawidłowy format pliku ustawień'));
            return;
          }

          // Store current settings as backup before import
          const currentData = await StorageUtils.loadSettings();
          const backupData = {
            settings: currentData.vivideoSettings || this.controller.defaultSettings,
            profiles: currentData.vivideoProfiles || [],
            theme: currentData.vivideoTheme || window.VivideoConfig.defaultTheme,
            themeColors: currentData.vivideoThemeColors || this.controller.themeColors,
            appState: currentData.vivideoAppState || {}
          };

          // Store backup in sessionStorage for potential rollback
          sessionStorage.setItem('vivideoBackup', JSON.stringify(backupData));

          // Import new settings
          await this.applyImportedSettings(importData);

          resolve({
            success: true,
            message: 'Ustawienia zostały zaimportowane pomyślnie!',
            profilesCount: importData.profiles ? importData.profiles.length : 0
          });
        } catch (error) {
          console.error('Import error:', error);
          reject(new Error('Błąd podczas importu: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Błąd podczas odczytu pliku'));
      };

      reader.readAsText(file);
    });
  }

  // Validate imported data structure
  validateImportData(data) {
    if (!data || typeof data !== 'object') return false;

    // Check for required structure
    if (!data.settings && !data.profiles) return false;

    // Validate settings if present
    if (data.settings) {
      const requiredKeys = ['brightness', 'contrast', 'saturation', 'gamma', 'colorTemp'];
      const hasRequiredKeys = requiredKeys.some((key) => Object.hasOwn(data.settings, key));
      if (!hasRequiredKeys) return false;
    }

    // Validate profiles if present
    if (data.profiles && Array.isArray(data.profiles)) {
      for (let profile of data.profiles) {
        if (!profile.name || !profile.settings) return false;
      }
    }

    return true;
  }

  // Apply imported settings to the controller and storage
  async applyImportedSettings(importData) {
    try {
      // Update controller settings
      if (importData.settings) {
        this.controller.settings = {
          ...this.controller.defaultSettings,
          ...importData.settings
        };
        await StorageUtils.saveSettings(this.controller.settings);
      }

      // Update profiles
      if (importData.profiles) {
        this.controller.profiles = [...importData.profiles];
        await StorageUtils.saveProfiles(this.controller.profiles);
      }

      // Update theme
      if (importData.theme) {
        this.controller.currentTheme = importData.theme;
        await StorageUtils.saveTheme(this.controller.currentTheme);
      }

      // Update theme colors
      if (importData.themeColors) {
        this.controller.themeColors = {
          ...this.controller.themeColors,
          ...importData.themeColors
        };
        await StorageUtils.saveThemeColors(this.controller.themeColors);
      }

      // Update app state
      if (importData.appState) {
        await StorageUtils.saveAppState(importData.appState);
      }

      // Refresh UI if controller is available and visible
      if (this.controller && this.controller.container) {
        this.controller.updateUI();
        this.controller.applyFilters();
        this.controller.updateProfilesList();
        if (this.controller.themeManager) {
          this.controller.themeManager.updateThemesList(
            this.controller.container,
            this.controller.currentTheme
          );
        }
      }

      console.log('Settings imported and applied successfully');
    } catch (error) {
      console.error('Error applying imported settings:', error);
      throw error;
    }
  }

  // Create import/export HTML interface
  createImportExportHTML() {
    return /*html*/ `
      <div class="vivideo-settings-management" style="display: none;" id="settings-management">
        <div class="vivideo-settings-section">
          <h3>⚙️ Zarządzanie ustawieniami</h3>
          
          <div class="settings-actions">
            <button class="vivideo-control-btn export-btn" id="export-settings-btn" title="Eksportuj wszystkie ustawienia i profile">
              📤 Eksportuj ustawienia
            </button>
            
            <div class="import-section">
              <input type="file" id="import-settings-file" accept=".json" style="display: none;">
              <button class="vivideo-control-btn import-btn" id="import-settings-btn" title="Importuj ustawienia z pliku">
                📥 Importuj ustawienia
              </button>
            </div>
          </div>
          
          <div class="settings-info">
            <p>📝 Eksport obejmuje:</p>
            <ul>
              <li>✅ Wszystkie ustawienia filtrów</li>
              <li>✅ Zapisane profile użytkownika</li>
              <li>✅ Ustawienia motywu</li>
              <li>✅ Kolory motywów</li>
            </ul>
          </div>
          
          <div id="settings-message" class="settings-message" style="display: none;"></div>
        </div>
      </div>
    `;
  }

  // Bind events for import/export functionality
  bindEvents(container) {
    const exportBtn = container.querySelector('#export-settings-btn');
    const importBtn = container.querySelector('#import-settings-btn');
    const fileInput = container.querySelector('#import-settings-file');
    const messageDiv = container.querySelector('#settings-message');

    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        this.showMessage(messageDiv, 'Eksportowanie ustawień...', 'info');
        const result = await this.exportSettings();
        this.showMessage(messageDiv, result.message, result.success ? 'success' : 'error');
      });
    }

    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          this.showMessage(messageDiv, 'Importowanie ustawień...', 'info');
          try {
            const result = await this.importSettings(file);
            this.showMessage(
              messageDiv,
              `${result.message} Zaimportowano ${result.profilesCount} profili.`,
              'success'
            );
            // Clear file input
            fileInput.value = '';
          } catch (error) {
            this.showMessage(messageDiv, error.message, 'error');
            fileInput.value = '';
          }
        }
      });
    }
  }

  // Show message to user
  showMessage(messageDiv, text, type) {
    if (!messageDiv) return;

    messageDiv.textContent = text;
    messageDiv.className = `settings-message ${type}`;
    messageDiv.style.display = 'block';

    // Auto-hide success/error messages after 5 seconds
    if (type !== 'info') {
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }

  // Restore from backup (if needed)
  async restoreFromBackup() {
    try {
      const backupData = sessionStorage.getItem('vivideoBackup');
      if (!backupData) {
        return { success: false, message: 'Brak kopii zapasowej do przywrócenia' };
      }

      const backup = JSON.parse(backupData);
      await this.applyImportedSettings(backup);

      // Clear backup after successful restore
      sessionStorage.removeItem('vivideoBackup');

      return { success: true, message: 'Przywrócono poprzednie ustawienia' };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, message: 'Błąd podczas przywracania: ' + error.message };
    }
  }
}

// Export for use in other files
window.SettingsManager = SettingsManager;
