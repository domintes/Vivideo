// Vivideo Content Script - Main Controller (Refactored)
// Main controller that orchestrates all components

// Only run in top window to avoid iframe duplicates
if (window !== window.top) {
  console.log('Vivideo: Skipping initialization in iframe/frame');
  // Exit early - don't initialize in frames
} else {
  // Prevent multiple instances - improved
  if (window.vivideoController) {
    window.vivideoController.destroy();
    window.vivideoController = null;
  }

  class VivideoController {
  constructor() {
    // Prevent multiple instances - strict check
    if (window.vivideoController) {
      console.warn('Vivideo: Instance already exists, destroying previous one');
      window.vivideoController.destroy();
    }
    
    this.isVisible = false;
    this.container = null;
    this.settings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0,
      sharpness: 0,
      autoActivate: true,
      workOnImagesActivate: false,
      activeProfile: null,
      extendedLimits: false
    };
    this.defaultSettings = { ...this.settings };
    this.profiles = [];
    this.defaultProfile = {
      name: 'DEFAULT',
      settings: { ...this.defaultSettings }
    };
    this.currentTheme = window.VivideoConfig.defaultTheme;
    this.themeColors = {
      casual: { 
        fontHue: 200, 
        backgroundHue: 220,
        saturation: 100, 
        lightness: 50 
      },
      cybernetic: { 
        fontHue: 120, 
        backgroundHue: 140,
        saturation: 100, 
        lightness: 40 
      }
    };
    this.profilesVisible = false;
    this.themesVisible = false;
    this.infoVisible = false;
    this.settingsManagementVisible = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.clickOutsideHandler = null;
    this.isInitialized = false;
    this.dragHandlers = null;
    
    // Initialize components (will be created later)
    this.videoControls = null;
    this.profileManager = null;
    this.themeManager = null;
    this.filterEngine = null;
    this.settingsManager = null;
    
    // Set global reference
    window.vivideoController = this;
    
    this.init();
  }

  async init() {
    if (this.isInitialized) {
      console.warn('Vivideo: Already initialized');
      return;
    }
    
    console.log('Vivideo: Starting initialization...');
    await this.loadSettings();
    this.finishInitialization();
  }

  async loadSettings() {
    try {
      const response = await StorageUtils.loadSettings();
      
      if (response && response.vivideoSettings) {
        this.settings = { ...this.settings, ...response.vivideoSettings };
      }
      if (response && response.vivideoProfiles) {
        this.profiles = response.vivideoProfiles;
      }
      if (response && response.vivideoTheme) {
        this.currentTheme = response.vivideoTheme;
      }
      if (response && response.vivideoThemeColors) {
        this.themeColors = { ...this.themeColors, ...response.vivideoThemeColors };
      }
      if (response && response.vivideoAppState) {
        this.loadActiveProfile(response.vivideoAppState.activeProfile);
      }
    } catch (error) {
      console.error('Vivideo: Error loading settings:', error);
    }
  }

  finishInitialization() {
    // Initialize components here when all classes are available
    if (!this.initializeComponents()) {
      console.error('Vivideo: Failed to initialize components');
      return;
    }
    
    this.createUI();
    this.bindEvents();
    this.observeVideos();
    
    if (this.themeManager) {
      this.themeManager.applyThemeColors(this.currentTheme, this.themeColors, this.container);
    }
    
    this.updateUI();
    
    // Initialize default profile button state (User profiles active by default)
    if (this.profileManager && this.container) {
      this.profileManager.showUserProfiles(this.container);
    }
    
    this.isInitialized = true;
    console.log('Vivideo: Initialization complete');
    
    // Auto-apply filters if autoActivate is enabled
    if (this.settings.autoActivate) {
      this.applyFilters();
    }
  }

  initializeComponents() {
    // Check if classes are available before creating instances
    if (typeof VideoControls === 'undefined') {
      console.error('VideoControls class not available');
      return false;
    }
    if (typeof ProfileManager === 'undefined') {
      console.error('ProfileManager class not available');
      return false;
    }
    if (typeof ThemeManager === 'undefined') {
      console.error('ThemeManager class not available');
      return false;
    }
    if (typeof VideoFilterEngine === 'undefined') {
      console.error('VideoFilterEngine class not available');
      return false;
    }

    // Create component instances
    this.videoControls = new VideoControls(this);
    this.profileManager = new ProfileManager(this);
    this.themeManager = new ThemeManager(this);
    this.filterEngine = new VideoFilterEngine(this);
    this.settingsManager = new SettingsManager(this);
    
    console.log('Vivideo: All components initialized successfully');
    return true;
  }

  loadActiveProfile(profileName) {
    if (profileName && this.profiles.length > 0) {
      const profile = this.profiles.find(p => p.name === profileName);
      if (profile) {
        this.settings = { ...this.settings, ...profile.settings };
        this.settings.activeProfile = profileName;
      }
    }
  }

  createUI() {
    if (!this.videoControls || !this.profileManager || !this.themeManager) {
      console.error('Vivideo: Cannot create UI - components not initialized');
      return;
    }
    
    this.container = document.createElement('div');
    this.container.className = `vivideo-container vivideo-theme-${this.currentTheme}`;
    
    // Add extended limits class if enabled
    if (this.settings.extendedLimits) {
      this.container.classList.add('extended-limits');
    }
    
    // Build HTML conditionally based on config
    let htmlContent = UIHelper.createHeaderHTML();
    
    // Only add themes section if testMode is enabled
    if (window.VivideoConfig.testMode && window.VivideoConfig.features.themesPanel) {
      htmlContent += this.themeManager.createThemesHTML();
    }
    
    htmlContent += this.profileManager.createProfilesHTML() +
      this.settingsManager.createImportExportHTML() +
      UIHelper.createCheckboxesHTML(this.settings) +
      UIHelper.createInfoHTML() +
      this.videoControls.createControlsHTML() +
      UIHelper.createShortcutsHTML();

    this.container.innerHTML = htmlContent;

    document.body.appendChild(this.container);
    this.updateProfilesList();
    
    // Only update theme selection if themes panel is enabled
    if (window.VivideoConfig.testMode && window.VivideoConfig.features.themesPanel) {
      this.updateThemeSelection();
    }
  }

  bindEvents() {
    if (!this.videoControls || !this.profileManager || !this.themeManager) {
      console.error('Vivideo: Cannot bind events - components not initialized');
      return;
    }
    
    // Header events
    UIHelper.bindHeaderEvents(this.container, this);
    
    // Checkbox events
    UIHelper.bindCheckboxEvents(this.container, this);
    
    // Component events
    this.videoControls.bindEvents(this.container);
    this.profileManager.bindEvents(this.container);
    this.settingsManager.bindEvents(this.container);
    
    // Only bind theme events if themes panel is enabled
    if (window.VivideoConfig.testMode && window.VivideoConfig.features.themesPanel) {
      this.themeManager.bindEvents(this.container);
    }

    // Click outside to hide
    this.clickOutsideHandler = (e) => {
      if (this.isVisible && !this.container.contains(e.target) && !this.isDragging) {
        this.hide();
      }
    };
    document.addEventListener('click', this.clickOutsideHandler, true);

    // Prevent panel clicks from hiding
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Dragging functionality
    this.dragHandlers = UIHelper.setupDragging(this.container, this);

    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.container.classList.add('vivideo-fullscreen');
        console.log('Vivideo: Fullscreen mode detected, enhancing panel visibility');
      } else {
        this.container.classList.remove('vivideo-fullscreen');
        console.log('Vivideo: Exited fullscreen mode');
      }
    });

    // Additional fullscreen API support for cross-browser compatibility
    const fullscreenEvents = [
      'webkitfullscreenchange',
      'mozfullscreenchange', 
      'MSFullscreenChange'
    ];
    
    fullscreenEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        const fullscreenElement = document.fullscreenElement || 
                                 document.webkitFullscreenElement || 
                                 document.mozFullScreenElement || 
                                 document.msFullscreenElement;
        
        if (fullscreenElement) {
          this.container.classList.add('vivideo-fullscreen');
          console.log('Vivideo: Cross-browser fullscreen detected');
        } else {
          this.container.classList.remove('vivideo-fullscreen');
          console.log('Vivideo: Cross-browser fullscreen exit detected');
        }
      });
    });
  }

  updateControl(control, value) {
    value = UIHelper.clampValue(control, value, this.settings.extendedLimits);
    this.settings[control === 'colortemp' ? 'colorTemp' : control] = value;
    this.updateUI();
    this.applyFilters();
    this.saveSettings();
  }

  updateUI() {
    if (!this.videoControls || !this.profileManager || !this.themeManager) {
      console.warn('Vivideo: Components not initialized yet for updateUI');
      return;
    }
    this.videoControls.updateUI(this.settings, this.container);
    UIHelper.updateCheckboxes(this.container, this.settings);
    this.profileManager.updateActiveProfileDisplay(this.container, this.settings);
    this.themeManager.updateActiveThemeDisplay(this.container, this.currentTheme);
  }

  applyFilters() {
    if (!this.filterEngine) {
      console.warn('Vivideo: FilterEngine not initialized yet');
      return;
    }
    this.filterEngine.applyFilters(this.settings);
  }

  removeFilters() {
    if (!this.filterEngine) {
      console.warn('Vivideo: FilterEngine not initialized yet');
      return;
    }
    this.filterEngine.removeFilters();
  }

  observeVideos() {
    if (!this.filterEngine) {
      console.warn('Vivideo: FilterEngine not initialized yet');
      return;
    }
    this.filterEngine.observeVideos(() => {
      if (this.settings.autoActivate || this.isVisible) {
        this.applyFilters();
      }
    });
  }

  resetAll() {
    this.settings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0,
      sharpness: 0,
      autoActivate: this.settings.autoActivate,
      workOnImagesActivate: this.settings.workOnImagesActivate,
      extendedLimits: this.settings.extendedLimits,
      activeProfile: null
    };
    
    this.filterEngine.removeFilters();
    this.updateUI();
    this.applyFilters();
    this.saveSettings();
  }

  resetSingle(control) {
    const defaultValue = this.defaultSettings[control === 'colortemp' ? 'colorTemp' : control];
    this.settings[control === 'colortemp' ? 'colorTemp' : control] = defaultValue;
    this.updateUI();
    this.applyFilters();
    this.saveSettings();
  }

  updateSliderLimits() {
    if (!this.container) return;

    // Rebuild the entire controls section with new limits
    const controlsSection = this.container.querySelector('.vivideo-controls-section');
    if (controlsSection) {
      controlsSection.innerHTML = this.videoControls.createControlsHTML();
      
      // Re-bind events for the new controls
      this.videoControls.bindEvents(this.container);
      
      // Update UI with current values
      this.updateUI();
    } else {
      // If controls section doesn't exist, rebuild entire UI
      this.rebuildUI();
    }
  }

  rebuildUI() {
    if (!this.container) return;
    
    const wasVisible = this.isVisible;
    const currentPosition = {
      left: this.container.style.left,
      top: this.container.style.top
    };
    
    // Remove old container
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Recreate UI
    this.createUI();
    this.bindEvents();
    
    // Restore position and visibility
    if (currentPosition.left) this.container.style.left = currentPosition.left;
    if (currentPosition.top) this.container.style.top = currentPosition.top;
    
    if (wasVisible) {
      this.show();
    }
  }

  // Panel visibility methods
  toggleProfiles() {
    this.showPanel('profiles');
    if (this.profilesVisible) {
      this.updateProfilesList();
    }
  }

  toggleThemes() {
    this.showPanel('themes');
    if (this.themesVisible && this.themeManager) {
      this.themeManager.updateThemeColorSliders(this.container, this.currentTheme);
    }
  }

  toggleInfo() {
    this.showPanel('info');
  }

  toggleSettingsManagement() {
    this.showPanel('settingsManagement');
  }

  showPanel(panelType) {
    const panels = {
      profiles: this.container.querySelector('#profiles-panel'),
      themes: this.container.querySelector('#themes-panel'),
      info: this.container.querySelector('#info-panel'),
      settingsManagement: this.container.querySelector('#settings-management')
    };

    // Simple toggle logic - if panel is visible, hide it, otherwise show it and hide others
    const currentPanel = panels[panelType];
    if (!currentPanel) return;

    const isCurrentlyVisible = 
      (panelType === 'profiles' && this.profilesVisible) ||
      (panelType === 'themes' && this.themesVisible) ||
      (panelType === 'info' && this.infoVisible) ||
      (panelType === 'settingsManagement' && this.settingsManagementVisible);

    // Hide all panels with animation
    Object.values(panels).forEach(panel => {
      if (panel && panel.style.display !== 'none') {
        panel.classList.remove('panel-opening');
        panel.classList.add('panel-closing');
        setTimeout(() => {
          panel.style.display = 'none';
          panel.classList.remove('panel-closing');
        }, 300);
      }
    });
    
    this.profilesVisible = false;
    this.themesVisible = false;
    this.infoVisible = false;
    this.settingsManagementVisible = false;

    // If panel was hidden, show it with animation
    if (!isCurrentlyVisible) {
      setTimeout(() => {
        currentPanel.style.display = 'block';
        currentPanel.classList.add('panel-opening');
        setTimeout(() => {
          currentPanel.classList.remove('panel-opening');
        }, 300);
      }, isCurrentlyVisible ? 0 : 50);
      
      if (panelType === 'profiles') {
        this.profilesVisible = true;
      } else if (panelType === 'themes') {
        this.themesVisible = true;
      } else if (panelType === 'info') {
        this.infoVisible = true;
      } else if (panelType === 'settingsManagement') {
        this.settingsManagementVisible = true;
      }
    }

    this.updateActiveStates();
  }

  updateActiveStates() {
    const profilesBtn = this.container.querySelector('#profiles-btn');
    const themesBtn = this.container.querySelector('#themes-btn');
    const infoBtn = this.container.querySelector('.vivideo-info');
    const settingsBtn = this.container.querySelector('#settings-btn');

    [profilesBtn, themesBtn, infoBtn, settingsBtn].forEach(btn => {
      if (btn) btn.classList.remove('vivideo-active');
    });

    if (this.profilesVisible && profilesBtn) profilesBtn.classList.add('vivideo-active');
    if (this.themesVisible && themesBtn) themesBtn.classList.add('vivideo-active');
    if (this.infoVisible && infoBtn) infoBtn.classList.add('vivideo-active');
    if (this.settingsManagementVisible && settingsBtn) settingsBtn.classList.add('vivideo-active');
  }

  // Profile methods
  updateProfilesList() {
    if (!this.profileManager) {
      console.warn('Vivideo: ProfileManager not initialized yet');
      return;
    }
    
    // Update the current view based on what's active
    if (this.profileManager.showingDefaultProfiles) {
      this.profileManager.updateDefaultProfilesList(this.container);
    } else {
      this.profileManager.updateUserProfilesList(this.container);
    }
  }

  loadProfile(profile) {
    if (profile.name === 'DEFAULT') {
      this.settings.activeProfile = null;
      Object.keys(this.defaultSettings).forEach(key => {
        if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
          this.settings[key] = this.defaultSettings[key];
        }
      });
    } else {
      this.settings.activeProfile = profile.name;
      Object.keys(profile.settings).forEach(key => {
        if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
          this.settings[key] = profile.settings[key];
        }
      });
      if (profile.settings.autoActivate !== undefined) {
        this.settings.autoActivate = profile.settings.autoActivate;
      }
    }

    this.updateUI();
    this.applyFilters();
    this.saveSettings();
    this.saveAppState();
    this.updateProfilesList();
    // Panel profiles pozostaje otwarty po wyborze profilu
  }

  deleteProfile(index) {
    const deletedProfile = this.profiles[index];
    if (this.settings.activeProfile === deletedProfile.name) {
      this.settings.activeProfile = null;
      this.saveAppState();
    }
    
    this.profiles.splice(index, 1);
    this.saveProfiles();
    this.updateProfilesList();
  }

  // Theme methods
  updateThemeSelection() {
    if (!this.themeManager) {
      console.warn('Vivideo: ThemeManager not initialized yet');
      return;
    }
    this.themeManager.updateThemeSelection(this.container, this.currentTheme);
  }

  changeTheme(theme) {
    if (!this.themeManager) {
      console.warn('Vivideo: ThemeManager not initialized yet');
      return;
    }
    
    // Krótko ukryj panel aby przeładować style
    const wasVisible = this.isVisible;
    const wasThemesVisible = this.themesVisible;
    
    if (wasVisible) {
      this.container.style.opacity = '0.7';
      this.container.style.transition = 'opacity 0.2s ease';
    }
    
    this.currentTheme = theme;
    this.themeManager.updateThemeColorSliders(this.container, this.currentTheme);
    this.themeManager.applyThemeColors(this.currentTheme, this.themeColors, this.container);
    this.updateThemeSelection();
    this.saveTheme();
    this.saveThemeColors();
    
    // Przywróć widoczność po przeładowaniu stylów
    if (wasVisible) {
      setTimeout(() => {
        this.container.style.opacity = '1';
        // Utrzymaj panel themes otwarty jeśli był otwarty
        if (wasThemesVisible) {
          this.themesVisible = true;
          const themesPanel = this.container.querySelector('#themes-panel');
          if (themesPanel) themesPanel.style.display = 'block';
          this.updateActiveStates();
        }
      }, 200);
    }
  }

  updateFontThemeColor(hue) {
    if (!this.themeManager) {
      console.warn('Vivideo: ThemeManager not initialized yet');
      return;
    }
    this.themeColors[this.currentTheme].fontHue = hue;
    this.themeManager.applyThemeColors(this.currentTheme, this.themeColors, this.container);
    this.themeManager.updateColorPreviews(this.container, this.currentTheme);
    this.saveThemeColors();
  }

  updateBackgroundThemeColor(hue) {
    if (!this.themeManager) {
      console.warn('Vivideo: ThemeManager not initialized yet');
      return;
    }
    this.themeColors[this.currentTheme].backgroundHue = hue;
    this.themeManager.applyThemeColors(this.currentTheme, this.themeColors, this.container);
    this.themeManager.updateColorPreviews(this.container, this.currentTheme);
    this.saveThemeColors();
  }

  // Main visibility controls
  toggle() {
    console.log('Vivideo: Toggle called, isVisible:', this.isVisible, 'timestamp:', Date.now());
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.container.classList.add('vivideo-visible');
    this.container.className = `vivideo-container vivideo-theme-${this.currentTheme} vivideo-visible`;
    this.isVisible = true;
    this.profilesVisible = false;
    this.themesVisible = false;
    this.infoVisible = false;
    
    // Hide all panels
    ['profiles-panel', 'themes-panel', 'info-panel'].forEach(panelId => {
      const panel = this.container.querySelector(`#${panelId}`);
      if (panel) panel.style.display = 'none';
    });
    
    this.updateActiveStates();
    this.applyFilters();
  }

  hide() {
    // Dodaj animację chowania panelu
    this.container.classList.add('vivideo-hiding');
    
    setTimeout(() => {
      this.container.classList.remove('vivideo-visible');
      this.container.classList.remove('vivideo-hiding');
      this.isVisible = false;
      
      if (!this.settings.autoActivate) {
        this.removeFilters();
      }
      
      // Reset all active states when hiding
      this.profilesVisible = false;
      this.themesVisible = false;
      this.infoVisible = false;
      this.updateActiveStates();
    }, 300);
  }

  // Storage methods
  async saveSettings() {
    await StorageUtils.saveSettings(this.settings);
  }

  async saveProfiles() {
    await StorageUtils.saveProfiles(this.profiles);
  }

  async saveTheme() {
    await StorageUtils.saveTheme(this.currentTheme);
  }

  async saveThemeColors() {
    await StorageUtils.saveThemeColors(this.themeColors);
  }

  async saveAppState() {
    await StorageUtils.saveAppState({
      activeProfile: this.settings.activeProfile,
      autoActivate: this.settings.autoActivate
    });
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler, true);
    }
    
    // Cleanup drag handlers
    if (this.dragHandlers) {
      if (this.dragHandlers.header) {
        this.dragHandlers.header.removeEventListener('mousedown', this.dragHandlers.mouseDown);
      }
      document.removeEventListener('mousemove', this.dragHandlers.mouseMove);
      document.removeEventListener('mouseup', this.dragHandlers.mouseUp);
    }

    // Clean up filters and SVG
    if (this.filterEngine) {
      this.filterEngine.removeFilters();
    }
    
    // Remove dynamic theme styles
    const existingStyle = document.querySelector('#vivideo-dynamic-theme');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    this.isInitialized = false;
    this.container = null;
    
    if (window.vivideoController === this) {
      window.vivideoController = null;
    }
  }
}

// Initialization functions
function initializeVivideo() {
  if (window.vivideoController) {
    return;
  }
  
  // Check if all required classes are available
  const requiredClasses = ['VideoControls', 'ProfileManager', 'ThemeManager', 'VideoFilterEngine', 'StorageUtils', 'UIHelper'];
  const missingClasses = requiredClasses.filter(className => typeof window[className] === 'undefined');
  
  if (missingClasses.length > 0) {
    console.warn('Vivideo: Missing classes:', missingClasses, '- retrying in 100ms');
    setTimeout(initializeVivideo, 100);
    return;
  }
  
  console.log('Vivideo: All classes available, creating controller');
  new VivideoController();
}

// Variable to track if we should handle keyboard shortcuts directly
let shouldHandleKeyboardShortcuts = true;

// Check if user has set custom shortcuts
if (chrome && chrome.commands) {
  chrome.commands.getAll((commands) => {
    const toggleCommand = commands.find(cmd => cmd.name === 'toggle-vivideo');
    if (toggleCommand && toggleCommand.shortcut && toggleCommand.shortcut !== '') {
      console.log('Vivideo: User has custom shortcut:', toggleCommand.shortcut);
      shouldHandleKeyboardShortcuts = false; // Let Chrome handle it
    } else {
      console.log('Vivideo: Using default Alt+V shortcut handling');
      shouldHandleKeyboardShortcuts = true; // Handle it ourselves
    }
  });
} else {
  console.log('Vivideo: Chrome commands API not available, using direct handling');
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Vivideo Content: Message received:', request);
  
  if (request.action === 'toggle-vivideo') {
    // Add small delay to prevent conflict with direct keyboard listener
    setTimeout(() => {
      if (window.vivideoController) {
        window.vivideoController.toggle();
      } else {
        initializeVivideo();
        setTimeout(() => {
          if (window.vivideoController) {
            window.vivideoController.show();
          }
        }, 100);
      }
    }, 10);
    sendResponse({ success: true });
  }
  
  if (request.action === 'next-profile') {
    if (window.vivideoController && window.vivideoController.profileManager) {
      window.vivideoController.profileManager.nextProfile();
    } else {
      console.warn('Vivideo: Controller or ProfileManager not available for next-profile');
    }
    sendResponse({ success: true });
  }
  
  if (request.action === 'previous-profile') {
    if (window.vivideoController && window.vivideoController.profileManager) {
      window.vivideoController.profileManager.previousProfile();
    } else {
      console.warn('Vivideo: Controller or ProfileManager not available for previous-profile');
    }
    sendResponse({ success: true });
  }
  
  return true;
});

// Initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVivideo);
} else {
  initializeVivideo();
}

window.addEventListener('load', () => {
  if (!window.vivideoController) {
    initializeVivideo();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Only handle keyboard shortcut if user hasn't set a custom one
  if (shouldHandleKeyboardShortcuts && e.altKey && e.key === 'v') {
    e.preventDefault();
    e.stopPropagation();
    console.log('Vivideo: Alt+V keyboard shortcut detected (direct handling)');
    if (window.vivideoController) {
      window.vivideoController.toggle();
    } else {
      initializeVivideo();
      setTimeout(() => {
        if (window.vivideoController) {
          window.vivideoController.show();
        }
      }, 100);
    }
  }
});

} // End of top window check
