// Vivideo Content Script - Refactored with React-like Components
// This is the main controller that uses the new component architecture

// Prevent multiple instances
if (window !== window.top) {
  console.log('Vivideo: Skipping initialization in iframe/frame');
} else {
  // Clean up any existing instance
  if (window.vivideoController) {
    window.vivideoController.destroy();
    window.vivideoController = null;
  }

  class VivideoController {
    constructor() {
      // Prevent multiple instances
      if (window.vivideoController) {
        console.warn('Vivideo: Instance already exists, destroying previous one');
        window.vivideoController.destroy();
      }

      // Initialize state
      this.isInitialized = false;
      this.mainPanel = null;
      this.filterEngine = null;
      this.storageManager = null;

      // Settings and data
      this.settings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        colorTemp: 0,
        sharpness: 0,
        speed: 1.0,
        speedStep: 0.25,
        autoActivate: true,
        workOnImages: false,
        extendedLimits: false,
        compareMode: false
      };

      this.profiles = [];
      this.activeProfile = 'DEFAULT';
      this.currentTheme = 'cybernetic';
      this.panelPosition = { x: 20, y: 20 };

      // Set global reference
      window.vivideoController = this;

      this.init();
    }

    async init() {
      if (this.isInitialized) {
        console.warn('Vivideo: Already initialized');
        return;
      }

      console.log('Vivideo: Starting initialization with React-like components...');

      try {
        // Load settings first
        await this.loadSettings();

        // Initialize storage manager
        this.initializeStorageManager();

        // Initialize filter engine (reuse existing one)
        this.initializeFilterEngine();

        // Create main panel component
        this.createMainPanel();

        // Set up message listener for popup communication
        this.setupMessageListener();

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Auto-activate if enabled
        if (this.settings.autoActivate) {
          this.autoDetectAndActivate();
        }

        this.isInitialized = true;
        console.log('Vivideo: Initialization completed successfully');
      } catch (error) {
        console.error('Vivideo: Initialization failed:', error);
      }
    }

    async loadSettings() {
      try {
        const data = await this.getStorageData([
          'vivideoSettings',
          'vivideoProfiles',
          'vivideoTheme',
          'vivideoAppState'
        ]);

        // Load settings
        if (data.vivideoSettings) {
          this.settings = { ...this.settings, ...data.vivideoSettings };
        }

        // Load profiles
        if (data.vivideoProfiles && Array.isArray(data.vivideoProfiles)) {
          this.profiles = data.vivideoProfiles;
        } else {
          this.profiles = this.createDefaultProfiles();
        }

        // Load theme
        if (data.vivideoTheme) {
          this.currentTheme = data.vivideoTheme;
        }

        // Load app state (panel position, active profile, etc.)
        if (data.vivideoAppState) {
          this.activeProfile = data.vivideoAppState.activeProfile || 'DEFAULT';
          this.panelPosition = data.vivideoAppState.panelPosition || { x: 20, y: 20 };
        }

        console.log('Vivideo: Settings loaded successfully');
      } catch (error) {
        console.error('Vivideo: Failed to load settings:', error);
        // Use default settings on error
        this.profiles = this.createDefaultProfiles();
      }
    }

    createDefaultProfiles() {
      return [
        {
          name: 'DEFAULT',
          description: 'Neutral settings (no changes)',
          settings: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            gamma: 1,
            colorTemp: 0,
            sharpness: 0,
            speed: 1.0,
            autoActivate: true
          }
        }
      ];
    }

    getStorageData(keys) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(keys, resolve);
        } else {
          // Fallback to localStorage
          const data = {};
          keys.forEach((key) => {
            const stored = localStorage.getItem(key);
            if (stored) {
              try {
                data[key] = JSON.parse(stored);
              } catch (e) {
                console.warn('Failed to parse stored data for', key);
              }
            }
          });
          resolve(data);
        }
      });
    }

    initializeStorageManager() {
      // Create a simple storage manager for saving/loading data
      this.storageManager = {
        save: async (key, data) => {
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ [key]: data });
            } else {
              localStorage.setItem(key, JSON.stringify(data));
            }
          } catch (error) {
            console.error('Storage save failed:', error);
          }
        },

        load: async (key) => {
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              const result = await chrome.storage.local.get([key]);
              return result[key];
            } else {
              const stored = localStorage.getItem(key);
              return stored ? JSON.parse(stored) : null;
            }
          } catch (error) {
            console.error('Storage load failed:', error);
            return null;
          }
        }
      };
    }

    initializeFilterEngine() {
      // Reuse the existing VideoFilterEngine if it exists
      if (window.VideoFilterEngine) {
        this.filterEngine = new VideoFilterEngine(this);
      } else {
        console.warn('VideoFilterEngine not found, video filters may not work');
      }
    }

    createMainPanel() {
      // Create the main panel using React
      const panelContainer = document.createElement('div');
      panelContainer.id = 'vivideo-react-root';
      document.body.appendChild(panelContainer);

      // Import React components
      import('./components/reactlike/VivideoMainPanel.js').then(({ default: VivideoMainPanel }) => {
        const root = ReactDOM.createRoot(panelContainer);
        root.render(
          React.createElement(VivideoMainPanel, {
            isVisible: false,
            collapsed: false,
            theme: this.currentTheme,
            position: this.panelPosition,
            settings: this.settings,
            profiles: this.profiles,
            activeProfile: this.activeProfile,

            // Event handlers
            onMount: (panelApi) => {
              console.log('Vivideo: Main panel mounted');
              this.panelApi = panelApi;
            },

            onClose: () => {
              this.hidePanel();
            },

            onSettingsChange: (newSettings) => {
              this.updateSettings(newSettings);
            },

            onPositionChange: (position) => {
              this.panelPosition = position;
              this.saveAppState();
            },

            onProfileSelect: (profileName) => {
              this.loadProfile(profileName);
            },

            onThemeSelect: (themeName) => {
              this.changeTheme(themeName);
            }
          })
        );
      });
    }

    injectPanelIntoDOM(panel) {
      // Ensure the panel element has proper styling and z-index
      const panelElement = panel.element;
      if (panelElement) {
        panelElement.style.position = 'fixed';
        panelElement.style.zIndex = '999999';
        panelElement.style.pointerEvents = 'auto';
      }
    }

    setupMessageListener() {
      // Listen for messages from popup and background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Vivideo: Received message:', message);

        switch (message.action) {
          case 'toggle-vivideo':
            this.togglePanel();
            break;
          case 'default-profile':
            this.loadProfile('DEFAULT');
            break;
          case 'next-theme':
            this.nextTheme();
            break;
          case 'previous-theme':
            this.previousTheme();
            break;

          case 'get-video-count': {
            const videoCount = this.getVideoCount();
            sendResponse({ videoCount });
            break;
          }

          case 'get-status':
            sendResponse({
              isVisible: this.mainPanel ? this.mainPanel.state.isVisible : false,
              videoCount: this.getVideoCount(),
              activeProfile: this.activeProfile
            });
            break;

          default:
            console.log('Vivideo: Unknown message action:', message.action);
        }

        return true; // Keep message channel open for async response
      });
    }

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (event) => {
        if (!event.altKey) return;

        switch (event.code) {
          case 'Backslash':
            event.preventDefault();
            this.togglePanel();
            break;

          case 'KeyM':
            event.preventDefault();
            this.loadProfile('DEFAULT');
            break;

          case 'BracketLeft':
            event.preventDefault();
            this.previousTheme();
            break;

          case 'BracketRight':
            event.preventDefault();
            this.nextTheme();
            break;
        }
      });
    }

    // Panel control methods
    showPanel() {
      if (this.panelApi) {
        this.panelApi.show();
      }
    }

    hidePanel() {
      if (this.panelApi) {
        this.panelApi.hide();
      }
    }

    togglePanel() {
      if (this.panelApi) {
        this.panelApi.toggle();
      }
    }

    // Settings management
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };

      // Apply filters to videos
      if (this.filterEngine) {
        this.filterEngine.applyFiltersToAllVideos(this.settings);
      }

      // Save settings
      this.saveSettings();
    }

    async saveSettings() {
      if (this.storageManager) {
        await this.storageManager.save('vivideoSettings', this.settings);
      }
    }

    async saveProfiles() {
      if (this.storageManager) {
        await this.storageManager.save('vivideoProfiles', this.profiles);
      }
    }

    async saveAppState() {
      const appState = {
        activeProfile: this.activeProfile,
        panelPosition: this.panelPosition
      };

      if (this.storageManager) {
        await this.storageManager.save('vivideoAppState', appState);
      }
    }

    // Profile management
    loadProfile(profileName) {
      const profile = this.profiles.find((p) => p.name === profileName);
      if (profile) {
        this.activeProfile = profileName;
        this.updateSettings(profile.settings);

        // Update panel UI
        if (this.mainPanel) {
          this.mainPanel.updateSettings(profile.settings);
          this.mainPanel.handleProfileSelect(profileName);
        }

        this.saveAppState();
        console.log('Vivideo: Loaded profile:', profileName);
      }
    }

    createNewProfile(currentSettings) {
      const profileName = prompt('Enter profile name:');
      if (!profileName || profileName.trim() === '') {
        return;
      }

      const trimmedName = profileName.trim();

      // Check if profile already exists
      if (this.profiles.find((p) => p.name === trimmedName)) {
        alert('Profile with this name already exists!');
        return;
      }

      const newProfile = {
        name: trimmedName,
        description: `Custom profile created on ${new Date().toLocaleDateString()}`,
        settings: { ...currentSettings }
      };

      this.profiles.push(newProfile);
      this.saveProfiles();

      // Update panel UI
      if (this.mainPanel) {
        this.mainPanel.updateProfiles(this.profiles);
      }

      console.log('Vivideo: Created new profile:', trimmedName);
    }

    deleteProfile(profileName) {
      if (profileName === 'DEFAULT') {
        alert('Cannot delete the DEFAULT profile!');
        return;
      }

      if (confirm(`Are you sure you want to delete profile "${profileName}"?`)) {
        this.profiles = this.profiles.filter((p) => p.name !== profileName);

        // If deleted profile was active, switch to DEFAULT
        if (this.activeProfile === profileName) {
          this.loadProfile('DEFAULT');
        }

        this.saveProfiles();

        // Update panel UI
        if (this.mainPanel) {
          this.mainPanel.updateProfiles(this.profiles);
        }

        console.log('Vivideo: Deleted profile:', profileName);
      }
    }

    // Theme management
    changeTheme(themeName) {
      this.currentTheme = themeName;

      if (this.mainPanel) {
        this.mainPanel.applyTheme(themeName);
      }

      // Save theme
      if (this.storageManager) {
        this.storageManager.save('vivideoTheme', themeName);
      }
    }

    previousTheme() {
      const themes = ['cybernetic', 'casual'];
      const currentIndex = themes.indexOf(this.currentTheme);
      const previousIndex = (currentIndex - 1 + themes.length) % themes.length;
      this.changeTheme(themes[previousIndex]);
    }

    nextTheme() {
      const themes = ['cybernetic', 'casual'];
      const currentIndex = themes.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      this.changeTheme(themes[nextIndex]);
    }

    // Speed control shortcuts
    adjustSpeed(delta) {
      const newSpeed = Math.max(0.25, Math.min(4.0, this.settings.speed + delta));
      this.updateSettings({ speed: newSpeed });

      if (this.mainPanel && this.mainPanel.speedControllerSection) {
        this.mainPanel.speedControllerSection.setSpeed(newSpeed);
      }
    }

    resetSpeed() {
      this.updateSettings({ speed: 1.0 });

      if (this.mainPanel && this.mainPanel.speedControllerSection) {
        this.mainPanel.speedControllerSection.setSpeed(1.0);
      }
    }

    resetAllSettings() {
      const defaultSettings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        colorTemp: 0,
        sharpness: 0,
        speed: 1.0
      };

      this.updateSettings(defaultSettings);

      if (this.mainPanel) {
        this.mainPanel.updateSettings(defaultSettings);
      }
    }

    // Video detection and auto-activation
    getVideoCount() {
      return document.querySelectorAll('video').length;
    }

    autoDetectAndActivate() {
      const videos = document.querySelectorAll('video');
      if (videos.length > 0 && this.filterEngine) {
        console.log(`Vivideo: Auto-activating for ${videos.length} video(s)`);
        this.filterEngine.applyFiltersToAllVideos(this.settings);
      }
    }

    // Import/Export functionality (simplified)
    importSettings() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedData = JSON.parse(e.target.result);

              if (importedData.settings) {
                this.updateSettings(importedData.settings);
              }

              if (importedData.profiles && Array.isArray(importedData.profiles)) {
                this.profiles = importedData.profiles;
                this.saveProfiles();

                if (this.mainPanel) {
                  this.mainPanel.updateProfiles(this.profiles);
                }
              }

              alert('Settings imported successfully!');
            } catch (error) {
              console.error('Import failed:', error);
              alert('Failed to import settings: Invalid file format');
            }
          };
          reader.readAsText(file);
        }
      };

      input.click();
    }

    exportSettings() {
      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: this.settings,
        profiles: this.profiles,
        theme: this.currentTheme
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `vivideo-settings-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    }

    showInfoDialog() {
      alert(`Vivideo - Real-time Video Enhancement v1.0.0

Features:
• Real-time video filter controls
• Multiple profiles for different scenarios  
• Customizable themes
• Import/Export settings
• Keyboard shortcuts

Shortcuts:
• Alt+\\ - Toggle panel
• Alt+M - Reset to DEFAULT profile
• Alt+[ / Alt+] - Change theme (previous/next)

Component Architecture:
This version uses a React-like component system built in vanilla JavaScript for better organization and maintainability.`);
    }

    // Cleanup and destruction
    destroy() {
      console.log('Vivideo: Destroying controller...');

      if (this.mainPanel) {
        this.mainPanel.unmount();
        this.mainPanel = null;
      }

      if (this.filterEngine && this.filterEngine.destroy) {
        this.filterEngine.destroy();
        this.filterEngine = null;
      }

      this.isInitialized = false;

      // Clear global reference
      if (window.vivideoController === this) {
        window.vivideoController = null;
      }
    }
  }

  // Initialize the controller
  new VivideoController();
}
