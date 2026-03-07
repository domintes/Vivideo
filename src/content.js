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
      this.profileLoadTimeout = null;
      this.autoDetectionTimeout = null;
      this.settings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        colorTemp: 0,
        sharpness: 0,
        keepQuality: true,
        videoQualityMode: 'balanced',
        targetedQualityLevel: 50,
        upscaleQualityBoost: false,
        linearColorPipeline: true,
        forceHighQualityScaling: true,
        speed: 1.0,
        previousSpeed: 1.0,
        speedStep: 0.25, // Configurable speed increment/decrement
        autoApplyPreviousSpeed: false,
        overwritePlayerSpeed: true, // New: when enabled Vivideo will overwrite website player speed when user changes speed here
        autoSaveProfiles: false,     // New: autosave active profile when settings change
        autoActivate: true,
        overwritePlayerSpeed: true,
        autoSaveProfiles: false,
        workOnImagesActivate: true,
        activeProfile: null,
        extendedLimits: true,
        toggleWithoutAlt: false,
        compareMode: false,
        compareProfile: null,
        workOnEverything: false
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
      this.originalParent = null; // For fullscreen panel management

      // Initialize components (will be created later)
      this.videoControls = null;
      this.profileManager = null;
      this.themeManager = null;
      this.filterEngine = null;
      this.settingsManager = null;
      this.speedController = null;

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
          // Backwards compatibility: derive numeric targetedQualityLevel from videoQualityMode
          if (this.settings.targetedQualityLevel === undefined) {
            if (this.settings.videoQualityMode === 'soft') this.settings.targetedQualityLevel = 0;
            else if (this.settings.videoQualityMode === 'detail')
              this.settings.targetedQualityLevel = 100;
            else this.settings.targetedQualityLevel = 50;
          }
          // Ensure preferredSpeed has a default value
          if (this.settings.preferredSpeed === undefined) {
            this.settings.preferredSpeed = 1.72;
          }
        }
        if (response && response.vivideoProfiles) {
          this.profiles = response.vivideoProfiles;
        }
        // Profile List stay empty by default. Built-ins are rendered from ProfileManager.
        if (!this.profiles || this.profiles.length === 0) {
          this.profiles = [];
        }
        if (response && response.vivideoTheme) {
          this.currentTheme = response.vivideoTheme;
        }
        if (response && response.vivideoThemeColors) {
          this.themeColors = { ...this.themeColors, ...response.vivideoThemeColors };
        }
        if (response && response.vivideoAppState) {
          this.loadActiveProfile(response.vivideoAppState.activeProfile);
          // Load displayDefaultProfiles setting
          if (response.vivideoAppState.displayDefaultProfiles !== undefined) {
            this.tempDisplayDefaultProfiles = response.vivideoAppState.displayDefaultProfiles;
          }
          // Load showProfileAfterChange setting
          if (response.vivideoAppState.showProfileAfterChange !== undefined) {
            this.tempShowProfileAfterChange = response.vivideoAppState.showProfileAfterChange;
          }
          // Load applyProfileSpeed setting
          if (response.vivideoAppState.applyProfileSpeed !== undefined) {
            this.tempApplyProfileSpeed = response.vivideoAppState.applyProfileSpeed;
          }
          // Load workOnAllSites setting
          if (response.vivideoAppState.workOnAllSites !== undefined) {
            this.tempWorkOnAllSites = response.vivideoAppState.workOnAllSites;
          }
          // Load workOnEverything setting
          if (response.vivideoAppState.workOnEverything !== undefined) {
            this.tempWorkOnEverything = response.vivideoAppState.workOnEverything;
          }
          if (Array.isArray(response.vivideoAppState.profileCategories)) {
            this.tempProfileCategories = response.vivideoAppState.profileCategories;
          }
          if (Array.isArray(response.vivideoAppState.builtinProfiles)) {
            this.tempBuiltinProfiles = response.vivideoAppState.builtinProfiles;
          }
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
      
      // Initialize speed controller BEFORE observing videos
      if (this.speedController) {
        this.speedController.init();
      }
      
      this.observeVideos();

      if (this.themeManager) {
        this.themeManager.applyThemeColors(this.currentTheme, this.themeColors, this.container);
      }

      this.updateUI();

      // Initialize default profile button state (Profile List active by default)
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
      if (typeof SpeedController === 'undefined') {
        console.error('SpeedController class not available');
        return false;
      }

      // Create component instances
      this.videoControls = new VideoControls(this);
      this.profileManager = new ProfileManager(this);
      this.themeManager = new ThemeManager(this);
      this.filterEngine = new VideoFilterEngine(this);
      this.settingsManager = new SettingsManager(this);
      this.speedController = new SpeedController(this);

      // (removed legacy displayDefaultProfiles behaviour) - profile list is simplified

      // Apply saved showProfileAfterChange setting if available
      if (this.tempShowProfileAfterChange !== undefined) {
        this.profileManager.showProfileAfterChange = this.tempShowProfileAfterChange;
        delete this.tempShowProfileAfterChange;
      }

      // Apply saved workOnAllSites setting if available
      if (this.tempWorkOnAllSites !== undefined) {
        this.profileManager.workOnAllSites = this.tempWorkOnAllSites;
        delete this.tempWorkOnAllSites;
      }
      if (this.tempWorkOnEverything !== undefined) {
        this.profileManager.workOnEverything = this.tempWorkOnEverything;
        delete this.tempWorkOnEverything;
      }
      // Apply saved applyProfileSpeed setting if available
      if (this.tempApplyProfileSpeed !== undefined) {
        this.profileManager.applyProfileSpeed = this.tempApplyProfileSpeed;
        delete this.tempApplyProfileSpeed;
      }
      if (Array.isArray(this.tempProfileCategories)) {
        this.profileManager.profileCategories = [...this.tempProfileCategories];
        delete this.tempProfileCategories;
      }
      if (Array.isArray(this.tempBuiltinProfiles) && this.tempBuiltinProfiles.length > 0) {
        this.profileManager.defaultProfiles = [...this.tempBuiltinProfiles];
        delete this.tempBuiltinProfiles;
      }

      console.log('Vivideo: All components initialized successfully');
      return true;
    }

    ensureFilterEngine() {
      if (this.filterEngine) return true;
      if (typeof VideoFilterEngine === 'undefined') {
        console.warn('Vivideo: VideoFilterEngine class not available for lazy init');
        return false;
      }
      try {
        this.filterEngine = new VideoFilterEngine(this);
        console.log('Vivideo: FilterEngine lazy-initialized');
        return true;
      } catch (e) {
        console.error('Vivideo: Failed to lazy-initialize FilterEngine', e);
        return false;
      }
    }

    safeAppend(node) {
      if (!node) return;
      if (document && document.body) {
        try {
          document.body.appendChild(node);
        } catch (e) {
          console.warn('Vivideo: safeAppend failed', e);
        }
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (document && document.body) {
            try {
              document.body.appendChild(node);
            } catch (e) {
              console.warn('Vivideo: safeAppend failed on DOMContentLoaded', e);
            }
          }
        });
      }
    }

    loadActiveProfile(profileRef) {
      if (!profileRef) return;

      // If saved ref is 'DEFAULT', keep default behavior
      if (profileRef === 'DEFAULT') {
        this.settings.activeProfile = 'DEFAULT';
        return;
      }

      // Try to find user profile by id first, then by name
      if (this.profiles && this.profiles.length > 0) {
        const byId = this.profiles.find((p) => p.id && p.id === profileRef);
        const byName = this.profiles.find((p) => p.name === profileRef);
        const profile = byId || byName;
        if (profile) {
          this.settings = { ...this.settings, ...profile.settings };
          this.settings.activeProfile = profile.id || profile.name;
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

      // New layout structure
      let htmlContent = `
        <!-- Fixed Header -->
        <div class="vivideo-header-fixed">
          ${UIHelper.createHeaderHTML()}
        </div>

        <!-- Main Content Grid -->
        <div class="vivideo-main-grid">
          <!-- Left Section: Profiles -->
          <div class="vivideo-profile-section">
            ${this.profileManager.createProfilesHTML()}
            ${this.settingsManager.createImportExportHTML()}
            ${UIHelper.createCheckboxesHTML(this.settings)}
            ${UIHelper.createInfoHTML()}
          </div>

          <!-- Right Section: Core Controls -->
          <div class="vivideo-core-section">
            ${this.videoControls.createControlsHTML()}
            ${this.speedController ? this.speedController.createSpeedControlHTML() : ''}
            <div class="vivideo-reset-section">
              <button class="vivideo-reset" id="reset-button">Reset all values ⟳</button>
            </div>
            ${UIHelper.createShortcutsHTML()}
          </div>
        </div>
      `;

      // Only add themes section if testMode is enabled (in profile section)
      if (window.VivideoConfig.testMode && window.VivideoConfig.features.themesPanel) {
        // Insert themes into profile section
        const profileSectionContent = `
          ${this.profileManager.createProfilesHTML()}
          ${this.themeManager.createThemesHTML()}
          ${this.settingsManager.createImportExportHTML()}
          ${UIHelper.createCheckboxesHTML(this.settings)}
          ${UIHelper.createInfoHTML()}
        `;

        htmlContent = htmlContent.replace(
          /(<div class="vivideo-profile-section">)([\s\S]*?)(<\/div>)/,
          `$1${profileSectionContent}$3`
        );
      }

      this.container.innerHTML = htmlContent;

      this.safeAppend(this.container);
      this.updateProfilesList();

      // Initialize checkbox and button states based on showDefaultProfiles setting
      this.initializeProfilesUI();

      // Only update theme selection if themes panel is enabled
      if (window.VivideoConfig.testMode && window.VivideoConfig.features.themesPanel) {
        this.updateThemeSelection();
      }
    }

    initializeProfilesUI() {
      if (!this.profileManager || !this.container) return;

      // Set checkbox state based on displayDefaultProfiles setting
      const displayDefaultCheckbox = this.container.querySelector(
        '#display-default-profiles-checkbox'
      );
      if (displayDefaultCheckbox) {
        displayDefaultCheckbox.checked = this.profileManager.displayDefaultProfiles;
      }

      // Set checkbox state based on showProfileAfterChange setting
      const showProfileAfterChangeCheckbox = this.container.querySelector(
        '#show-profile-after-change-checkbox'
      );
      if (showProfileAfterChangeCheckbox) {
        showProfileAfterChangeCheckbox.checked = this.profileManager.showProfileAfterChange;
      }

      // Set checkbox state based on workOnAllSites setting
      const workOnAllSitesCheckbox = this.container.querySelector('#work-on-all-sites-checkbox');
      if (workOnAllSitesCheckbox) {
        workOnAllSitesCheckbox.checked = this.profileManager.workOnAllSites;
      }

      // Set checkbox state based on workOnEverything setting
      const workOnEverythingCheckbox = this.container.querySelector('#work-on-everything-checkbox');
      if (workOnEverythingCheckbox) {
        workOnEverythingCheckbox.checked = !!this.profileManager.workOnEverything;
      }

      // Set checkbox state based on applyProfileSpeed setting
      const applyProfileSpeedCheckbox = this.container.querySelector(
        '#apply-profile-speed-checkbox'
      );
      if (applyProfileSpeedCheckbox) {
        applyProfileSpeedCheckbox.checked = !!this.profileManager.applyProfileSpeed;
      }

      // Set preferred speed input value
      const preferredSpeedInput = this.container.querySelector('#preferred-speed-input');
      if (preferredSpeedInput) {
        preferredSpeedInput.value = this.settings.preferredSpeed || 1.72;
      }

      console.log('Vivideo: Profiles UI initialized with settings:', {
        displayDefaultProfiles: this.profileManager.displayDefaultProfiles,
        showProfileAfterChange: this.profileManager.showProfileAfterChange,
        workOnAllSites: this.profileManager.workOnAllSites,
        workOnEverything: this.profileManager.workOnEverything
      });
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

      // Bind speed controller events
      if (this.speedController) {
        this.speedController.bindSpeedControlEvents(this.container);
      }

      // Bind reset button
      const resetButton = this.container.querySelector('#reset-button');
      if (resetButton) {
        resetButton.addEventListener('click', () => {
          this.resetAll();
        });
      }

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
      // Resizing functionality (left edge: ew-resize, top edge: ns-resize)
      this.resizeHandlers = UIHelper.setupResizing(this.container);

      // Handle fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          this.enterFullscreenMode(document.fullscreenElement);
        } else {
          this.exitFullscreenMode();
        }
      });

      // Additional fullscreen API support for cross-browser compatibility
      const fullscreenEvents = [
        'webkitfullscreenchange',
        'mozfullscreenchange',
        'MSFullscreenChange'
      ];

      fullscreenEvents.forEach((eventType) => {
        document.addEventListener(eventType, () => {
          const fullscreenElement =
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

          if (fullscreenElement) {
            this.enterFullscreenMode(fullscreenElement);
          } else {
            this.exitFullscreenMode();
          }
        });
      });
    }

    enterFullscreenMode(fullscreenElement) {
      console.log('Vivideo: Entering fullscreen mode');

      // Store original parent for restoration
      this.originalParent = this.container.parentNode;

      // Add fullscreen class for styling
      this.container.classList.add('vivideo-fullscreen');

      // Move panel to fullscreen element to make it visible
      try {
        if (fullscreenElement && fullscreenElement.appendChild) {
          try {
            fullscreenElement.appendChild(this.container);
            console.log('Vivideo: Panel moved to fullscreen element');
          } catch (e) {
            console.warn('Vivideo: Could not append to fullscreenElement', e);
            UIHelper.safeAppend(this.container);
          }
        }
      } catch (error) {
        console.warn('Vivideo: Could not move panel to fullscreen element:', error);
        // Fallback: ensure panel is visible with higher z-index
        this.container.style.zIndex = '2147483647';
        this.container.style.position = 'fixed';
      }
    }

    exitFullscreenMode() {
      console.log('Vivideo: Exiting fullscreen mode');

      // Remove fullscreen class
      this.container.classList.remove('vivideo-fullscreen');

      // Restore panel to original parent
      try {
        if (this.originalParent && typeof this.originalParent.appendChild === 'function') {
          try {
            this.originalParent.appendChild(this.container);
            console.log('Vivideo: Panel restored to original position');
          } catch (e) {
            console.warn('Vivideo: Could not restore to originalParent', e);
            UIHelper.safeAppend(this.container);
            console.log('Vivideo: Panel restored to document body');
          }
        } else {
          UIHelper.safeAppend(this.container);
          console.log('Vivideo: Panel restored to document body');
        }
      } catch (error) {
        console.warn('Vivideo: Could not restore panel position:', error);
      }

      // Reset inline styles
      this.container.style.zIndex = '';
      this.container.style.position = '';
    }

    updateControl(control, value) {
      value = UIHelper.clampValue(control, value, this.settings.extendedLimits);
      this.settings[control === 'colortemp' ? 'colorTemp' : control] = value;

      // Special handling for speed control
      if (control === 'speed') {
        if (this.speedController) {
          this.speedController.setSpeed(value);
        } else {
          this.updateVideoSpeed(value);
        }
      }

      // Clear any pending auto-detection timeout to prevent rapid updates
      if (this.autoDetectionTimeout) {
        clearTimeout(this.autoDetectionTimeout);
      }

      this.updateUI();
      this.applyFilters();
      this.saveSettings();

      // Trigger auto-detection with slight delay to avoid rapid changes
      this.autoDetectionTimeout = setTimeout(() => {
        if (this.profileManager) {
          this.profileManager.updateActiveProfileDisplay(this.container, this.settings);
        }
      }, 100);
    }

    updateVideoSpeed(speed) {
      // Find all video elements on the page
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        try {
          video.playbackRate = speed;
        } catch (error) {
          console.warn('Vivideo: Could not set video speed:', error);
        }
      });

      // Update speed overlay if it exists
      this.updateSpeedOverlay(speed);
    }

    updateSpeedOverlay(speed) {
      let overlay = document.getElementById('vivideo-speed-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'vivideo-speed-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;
        this.safeAppend(overlay);
      }

      overlay.textContent = `${speed.toFixed(2)}x`;
      overlay.style.opacity = '1';

      // Hide overlay after 2 seconds
      clearTimeout(this.speedOverlayTimeout);
      this.speedOverlayTimeout = setTimeout(() => {
        overlay.style.opacity = '0';
      }, 2000);
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

      // Update speed controller UI
      if (this.speedController) {
        this.speedController.updateUI(this.container);
      }
    }

    applyFilters() {
      if (!this.ensureFilterEngine()) {
        console.warn('Vivideo: FilterEngine not initialized yet');
        return;
      }

      // Check if compare mode is active
      if (this.settings.compareMode && this.settings.compareProfile) {
        this.applyCompareFilters();
      } else {
        this.filterEngine.applyFilters(this.settings);
        // Ensure play listeners are attached so new plays reapply filters
        if (this.filterEngine && typeof this.filterEngine.attachPlayListeners === 'function') {
          this.filterEngine.attachPlayListeners();
        }
      }

      // Apply global page filters when requested by profile manager
      try {
        if (this.profileManager && this.profileManager.workOnEverything) {
          this.applyGlobalPageFilters();
        } else {
          this.removeGlobalPageFilters();
        }
      } catch (e) {
        console.warn('Vivideo: applyGlobalPageFilters failed', e);
      }
    }

    applyCompareFilters() {
      if (!this.ensureFilterEngine()) {
        console.warn('Vivideo: FilterEngine not initialized yet');
        return;
      }

      // Apply split-screen filters
      const leftSettings = this.settings; // Current profile
      const rightSettings = this.settings.compareProfile.settings; // Compare profile

      this.filterEngine.applySplitFilters(leftSettings, rightSettings);
    }

    removeFilters() {
      if (!this.ensureFilterEngine()) {
        console.warn('Vivideo: FilterEngine not initialized yet');
        return;
      }
      if (this.filterEngine && typeof this.filterEngine.removeFilters === 'function') {
        this.filterEngine.removeFilters();
      }
      try {
        this.removeGlobalPageFilters();
      } catch (e) {
        console.warn('Vivideo: removeGlobalPageFilters failed', e);
      }
    }

    applyGlobalPageFilters() {
      try {
        // Compute CSS filter values similar to VideoFilterEngine.applyFilterToElement
        const adjusted = this.filterEngine
          ? this.filterEngine.getAdjustedSettings(this.settings)
          : this.settings;
        const brightness = 1 + (adjusted.brightness || 0) / 100;
        const contrast = 1 + (adjusted.contrast || 0) / 100;
        const saturate = Math.max(0, 1 + (adjusted.saturation || 0) / 100);

        let cssFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

        // If advanced filters would be used (gamma/colorTemp/sharpness), note in comment
        const advancedExists =
          (adjusted.gamma && adjusted.gamma !== 1) ||
          (adjusted.colorTemp && adjusted.colorTemp !== 0) ||
          (adjusted.sharpness && adjusted.sharpness > 0);
        if (advancedExists) {
          // Add a CSS comment indicating advanced SVG filter usage (SVG not applied globally here)
          cssFilter += ' /* advanced-filter-present */';
        }

        const selector = 'body:not(.vivideo-container), body:not(.vivideo-container) *';
        let styleEl = document.getElementById('vivideo-global-filter');
        const rule = `${selector} { filter: ${cssFilter} !important; backdrop-filter: ${cssFilter} !important; }`;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'vivideo-global-filter';
          styleEl.type = 'text/css';
          styleEl.appendChild(document.createTextNode(rule));
          document.head.appendChild(styleEl);
        } else {
          // Replace content
          if (styleEl.firstChild) styleEl.firstChild.nodeValue = rule;
          else styleEl.textContent = rule;
        }
      } catch (e) {
        console.warn('Vivideo: applyGlobalPageFilters error', e);
      }
    }

    removeGlobalPageFilters() {
      try {
        const existing = document.getElementById('vivideo-global-filter');
        if (existing) existing.remove();
      } catch (e) {
        console.warn('Vivideo: removeGlobalPageFilters error', e);
      }
    }

    observeVideos() {
      if (!this.ensureFilterEngine()) {
        console.warn('Vivideo: FilterEngine not initialized yet');
        return;
      }

      console.log('Vivideo: Starting video observation, autoActivate:', this.settings.autoActivate);

      // Main observer for DOM changes
      this.filterEngine.observeVideos(() => {
        console.log(
          'Vivideo: New media detected, autoActivate:',
          this.settings.autoActivate,
          'isVisible:',
          this.isVisible
        );

        // Always apply filters and speed if autoActivate is enabled
        if (this.settings.autoActivate) {
          // Apply filters immediately
          this.applyFilters();

          // Apply speed through speed controller
          if (this.speedController) {
            setTimeout(() => {
              const videos = this.filterEngine.findVideos();
              videos.forEach((video) => {
                if (
                  this.speedController.isAutoApplyPreviousSpeedEnabled() &&
                  this.speedController.getPreviousSpeed() !== 1.0
                ) {
                  this.speedController.applySpeedToVideo(
                    video,
                    this.speedController.getPreviousSpeed()
                  );
                } else {
                  this.speedController.applySpeedToVideo(video, this.speedController.getSpeed());
                }
              });
            }, 100);
          }

          // Attach play listeners
          if (this.filterEngine && typeof this.filterEngine.attachPlayListeners === 'function') {
            this.filterEngine.attachPlayListeners();
          }
        }
        // If panel is visible but autoActivate is off, still apply current settings
        else if (this.isVisible) {
          this.applyFilters();
          if (this.filterEngine && typeof this.filterEngine.attachPlayListeners === 'function') {
            this.filterEngine.attachPlayListeners();
          }
        }
      });

      // Additional periodic check for dynamically loaded content (more aggressive)
      this.startPeriodicMediaCheck();
      
      // Mark that observer is active
      this.videoObserverActive = true;
    }

    startPeriodicMediaCheck() {
      // Use faster interval when autoActivate is enabled (1 second instead of 3)
      const checkInterval = this.settings.autoActivate ? 1000 : 3000;
      
      // Check periodically for new media elements that might have been missed
      this.periodicCheckInterval = setInterval(() => {
        if (this.settings.autoActivate) {
          const videos = this.filterEngine.findVideos();
          this.filterEngine.findImages();

          // Check if any videos don't have filters applied
          let needsReapply = false;
          videos.forEach((video) => {
            if (!video.style.filter || video.style.filter === 'none' || video.style.filter === '') {
              needsReapply = true;
              unprocessedCount++;
            }
          });

          if (needsReapply) {
            console.log(`Vivideo: Periodic check found ${unprocessedCount} unprocessed video(s), reapplying filters`);
            this.applyFilters();

            // Apply speed
            if (this.speedController) {
              videos.forEach((video) => {
                if (
                  this.speedController.isAutoApplyPreviousSpeedEnabled() &&
                  this.speedController.getPreviousSpeed() !== 1.0
                ) {
                  this.speedController.applySpeedToVideo(
                    video,
                    this.speedController.getPreviousSpeed()
                  );
                } else {
                  this.speedController.applySpeedToVideo(video, this.speedController.getSpeed());
                }
              });
            }
            
            // Attach play listeners to new videos
            if (this.filterEngine && typeof this.filterEngine.attachPlayListeners === 'function') {
              this.filterEngine.attachPlayListeners();
            }
          }
        }
      }, checkInterval);
    }

    resetAll() {
      this.settings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        colorTemp: 0,
        sharpness: 0,
        keepQuality: this.settings.keepQuality,
        videoQualityMode: this.settings.videoQualityMode,
        upscaleQualityBoost: this.settings.upscaleQualityBoost,
        linearColorPipeline: this.settings.linearColorPipeline,
        forceHighQualityScaling: this.settings.forceHighQualityScaling,
        targetedQualityLevel: this.settings.targetedQualityLevel,
        speed: 1.0,
        autoActivate: this.settings.autoActivate,
        workOnImagesActivate: this.settings.workOnImagesActivate,
        extendedLimits: this.settings.extendedLimits,
        activeProfile: null
      };

      this.filterEngine.removeFilters();

      // Sync speed controller with reset settings
      if (this.speedController) {
        this.speedController.currentSpeed = 1.0; // Default speed
        this.speedController.applySpeedToAllVideos(1.0);
      }

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

    resetToDefault() {
      // Simple reset to neutral DEFAULT profile
      console.log('Vivideo: Resetting to DEFAULT profile');
      this.settings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        colorTemp: 0,
        sharpness: 0,
        keepQuality: this.settings.keepQuality,
        videoQualityMode: this.settings.videoQualityMode,
        upscaleQualityBoost: this.settings.upscaleQualityBoost,
        linearColorPipeline: this.settings.linearColorPipeline,
        forceHighQualityScaling: this.settings.forceHighQualityScaling,
        speed: 1.0,
        speedStep: this.settings.speedStep || 0.25, // Keep user's speed step setting
        autoActivate: this.settings.autoActivate,
        workOnImagesActivate: this.settings.workOnImagesActivate,
        extendedLimits: this.settings.extendedLimits,
        activeProfile: 'DEFAULT'
      };

      // Sync speed controller with default settings
      if (this.speedController) {
        this.speedController.currentSpeed = 1.0; // Default speed
        this.speedController.applySpeedToAllVideos(1.0);
      }

      this.updateUI();
      this.applyFilters();
      this.saveSettings();

      // Update profile display
      if (this.profileManager) {
        this.profileManager.updateActiveProfileDisplay(this.container, this.settings);
      }
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
      Object.values(panels).forEach((panel) => {
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
        setTimeout(
          () => {
            currentPanel.style.display = 'block';
            currentPanel.classList.add('panel-opening');
            setTimeout(() => {
              currentPanel.classList.remove('panel-opening');
            }, 300);
          },
          isCurrentlyVisible ? 0 : 50
        );

        if (panelType === 'profiles') {
          this.profilesVisible = true;
        } else if (panelType === 'themes') {
          this.themesVisible = true;
        } else if (panelType === 'info') {
          this.infoVisible = true;
          // Update info panel content whenever it's opened
          try {
            this.updateInfoPanel();
          } catch (e) {
            console.warn('Vivideo: Failed to update info panel', e);
          }
        } else if (panelType === 'settingsManagement') {
          this.settingsManagementVisible = true;
        }
      }

      this.updateActiveStates();
    }

    updateActiveStates() {
      const themesBtn = this.container.querySelector('#themes-btn');
      const infoBtn = this.container.querySelector('.vivideo-info');
      const settingsBtn = this.container.querySelector('#settings-btn');

      [themesBtn, infoBtn, settingsBtn].forEach((btn) => {
        if (btn) btn.classList.remove('vivideo-active');
      });

      if (this.themesVisible && themesBtn) themesBtn.classList.add('vivideo-active');
      if (this.infoVisible && infoBtn) infoBtn.classList.add('vivideo-active');
      if (this.settingsManagementVisible && settingsBtn)
        settingsBtn.classList.add('vivideo-active');
    }

    // Profile methods
    updateProfilesList() {
      if (!this.profileManager) {
        console.warn('Vivideo: ProfileManager not initialized yet');
        return;
      }

      // Update the profiles list
      this.profileManager.updateProfilesList(this.container);
    }

    loadProfile(profile) {
      console.log('Vivideo: Loading profile:', profile.name);

      // Clear any existing timeout to prevent race conditions
      if (this.profileLoadTimeout) {
        clearTimeout(this.profileLoadTimeout);
      }

      try {
        const profileScopedExclusions = [
          'autoActivate',
          'workOnImagesActivate',
          'keepQuality',
          'videoQualityMode',
          'upscaleQualityBoost',
          'linearColorPipeline',
          'forceHighQualityScaling'
        ];
        if (profile.name === 'DEFAULT') {
          this.settings.activeProfile = null;
          Object.keys(this.defaultSettings).forEach((key) => {
            if (!profileScopedExclusions.includes(key)) {
              this.settings[key] = this.defaultSettings[key];
            }
          });
        } else {
          // Use id for Profile List when available (migrate activeProfile to id)
          this.settings.activeProfile = profile.id || profile.name;
          // Sanitize profile settings to avoid missing/invalid values
          let sanitized = profile.settings || {};
          if (this.profileManager && typeof this.profileManager.sanitizeSettings === 'function') {
            sanitized = this.profileManager.sanitizeSettings(profile.settings || {});
          } else {
            // Fallback sanitization
            const defaults = this.defaultSettings || {};
            const keys = [
              'brightness',
              'contrast',
              'saturation',
              'gamma',
              'colorTemp',
              'sharpness',
              'speed'
            ];
            keys.forEach((k) => {
              const v =
                sanitized && Object.prototype.hasOwnProperty.call(sanitized, k)
                  ? sanitized[k]
                  : undefined;
              sanitized[k] =
                typeof v === 'number' && !Number.isNaN(v)
                  ? v
                  : defaults[k] !== undefined
                    ? defaults[k]
                    : k === 'gamma'
                      ? 1
                      : k === 'speed'
                        ? 1.0
                        : 0;
            });
          }
          Object.keys(sanitized).forEach((key) => {
            if (!profileScopedExclusions.includes(key)) {
              this.settings[key] = sanitized[key];
            }
          });
          if (sanitized.autoActivate !== undefined) {
            this.settings.autoActivate = sanitized.autoActivate;
          }
        }

        console.log(
          'Vivideo: Profile settings loaded, active profile:',
          this.settings.activeProfile
        );

        // Sync speed controller with loaded profile settings
        if (this.speedController && this.settings.speed !== undefined) {
          if (this.profileManager && this.profileManager.applyProfileSpeed) {
            this.speedController.currentSpeed = this.settings.speed;
            this.speedController.applySpeedToAllVideos(this.settings.speed);
          } else {
            // Apply currently-set controller speed to videos (do not override from profile)
            const current =
              this.speedController.currentSpeed !== undefined
                ? this.speedController.currentSpeed
                : this.settings.speed || 1.0;
            this.speedController.applySpeedToAllVideos(current);
          }
        }

        // Force immediate UI update with delay to ensure DOM is ready
        setTimeout(() => {
          this.updateUI();
          // Force update controls specifically
          if (this.videoControls && this.container) {
            this.videoControls.updateUI(this.settings, this.container);
          }
          this.applyFilters();
        }, 50);

        // Save settings with slight delay to ensure consistency
        this.profileLoadTimeout = setTimeout(() => {
          this.saveSettings();
          this.saveAppState();
          this.updateProfilesList();
          console.log('Vivideo: Profile fully loaded and saved');
        }, 50);
      } catch (error) {
        console.error('Vivideo: Error loading profile:', error);
      }
    }

    deleteProfile(index) {
      const deletedProfile = this.profiles[index];
      if (
        this.settings.activeProfile === deletedProfile.name ||
        (deletedProfile.id && this.settings.activeProfile === deletedProfile.id)
      ) {
        this.settings.activeProfile = null;
        this.saveAppState();
      }

      this.profiles.splice(index, 1);
      this.saveProfiles();
      this.updateProfilesList();
      // Refresh duplicate warnings / active profile display after deletion so UI updates immediately
      if (
        this.profileManager &&
        typeof this.profileManager.updateActiveProfileDisplay === 'function'
      ) {
        try {
          this.profileManager.updateActiveProfileDisplay(this.container, this.settings);
        } catch (e) {
          console.warn('Vivideo: updateActiveProfileDisplay after delete failed', e);
        }
      }
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

      // Restore visibility after reloading styles
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

    // Update info panel dynamic content (video count and enhancement status)
    updateInfoPanel() {
      if (!this.container) return;
      const infoPanel = this.container.querySelector('#info-panel');
      if (!infoPanel) return;

      const videoCountDiv = infoPanel.querySelector('#vivideo-video-count');
      const enhancementStatusDiv = infoPanel.querySelector('#vivideo-enhancement-status');

      let videoCount = 0;
      try {
        if (this.filterEngine && typeof this.filterEngine.findVideos === 'function') {
          videoCount = this.filterEngine.findVideos().length;
        } else {
          videoCount = document.querySelectorAll('video').length;
        }
      } catch (e) {
        console.warn('Vivideo: Could not determine video count', e);
      }

      if (videoCountDiv) {
        videoCountDiv.textContent = `${videoCount} ${videoCount === 1 ? 'video found' : 'videos found'}`;
      }

      const hasChanges =
        this.settings.brightness !== 0 ||
        this.settings.contrast !== 0 ||
        this.settings.saturation !== 0 ||
        this.settings.gamma !== 1 ||
        this.settings.colorTemp !== 0 ||
        this.settings.sharpness !== 0 ||
        (this.settings.speed !== undefined && this.settings.speed !== 1.0);

      if (enhancementStatusDiv) {
        enhancementStatusDiv.textContent = `Enhancement: ${hasChanges ? 'Modified' : 'None'}`;
      }
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
      this.profilesVisible = true; // Default to profiles visible
      this.themesVisible = false;
      this.infoVisible = false;

      // Hide all panels except profiles
      ['themes-panel', 'info-panel'].forEach((panelId) => {
        const panel = this.container.querySelector(`#${panelId}`);
        if (panel) panel.style.display = 'none';
      });

      // Show profiles panel by default
      const profilesPanel = this.container.querySelector('#profiles-panel');
      if (profilesPanel) {
        profilesPanel.style.display = 'block';
        profilesPanel.classList.add('panel-opening');
        setTimeout(() => {
          profilesPanel.classList.remove('panel-opening');
        }, 300);
      }

      // Check if we're in fullscreen and need to reposition panel
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (fullscreenElement) {
        this.enterFullscreenMode(fullscreenElement);
      }

      this.updateActiveStates();
      this.updateProfilesList(); // Update profiles list when showing panel
      // Sync speed controller with actual player speeds immediately when panel opens
      if (this.speedController && typeof this.speedController.syncWithVideoSpeeds === 'function') {
        try {
          this.speedController.syncWithVideoSpeeds();
        } catch (e) {
          console.warn('Vivideo: Failed to sync speed controller on show', e);
        }
      }
      this.applyFilters();
      // Update info panel status while showing
      try {
        this.updateInfoPanel();
      } catch (e) {
        // Non-fatal: log and continue
        console.warn('Vivideo: updateInfoPanel failed on show', e);
      }
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
        // Clear any profile edit flags to avoid leaving UI in edit state
        if (this.profileManager) {
          try {
            this.profileManager.isEditingProfile = false;
            this.profileManager.editingIndex = null;
          } catch (e) {
            console.warn('Vivideo: Failed to clear profile edit state on hide', e);
          }
        }
      }, 300);
    }

    // Storage methods
    async saveSettings() {
      await StorageUtils.saveSettings(this.settings);

      // If auto-save profiles is enabled, update the active user profile with current settings
      try {
        if (
          this.settings.autoSaveProfiles &&
          this.settings.activeProfile &&
          this.settings.activeProfile !== 'DEFAULT'
        ) {
          const idx = this.profiles.findIndex(
            (p) =>
              (p.id && p.id === this.settings.activeProfile) ||
              p.name === this.settings.activeProfile
          );
          if (idx !== -1) {
            // Copy only relevant visual settings into profile
            const profileSettings = {
              brightness: this.settings.brightness,
              contrast: this.settings.contrast,
              saturation: this.settings.saturation,
              gamma: this.settings.gamma,
              colorTemp: this.settings.colorTemp,
              sharpness: this.settings.sharpness,
              speed: this.settings.speed
            };
            this.profiles[idx].settings = profileSettings;
            await StorageUtils.saveProfiles(this.profiles);
          }
        }
      } catch (e) {
        console.warn('Vivideo: Auto-save profile failed', e);
      }
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
        autoActivate: this.settings.autoActivate,
        showProfileAfterChange: this.profileManager
          ? this.profileManager.showProfileAfterChange
          : true,
        applyProfileSpeed: this.profileManager ? this.profileManager.applyProfileSpeed : false,
        workOnAllSites: this.profileManager ? this.profileManager.workOnAllSites : false,
        workOnEverything: this.profileManager ? this.profileManager.workOnEverything : false,
        profileCategories: this.profileManager ? this.profileManager.profileCategories : [],
        builtinProfiles: this.profileManager ? this.profileManager.defaultProfiles : []
      });
    }

    destroy() {
      // Clear any pending timeouts
      if (this.profileLoadTimeout) {
        clearTimeout(this.profileLoadTimeout);
        this.profileLoadTimeout = null;
      }

      if (this.autoDetectionTimeout) {
        clearTimeout(this.autoDetectionTimeout);
        this.autoDetectionTimeout = null;
      }

      if (this.periodicCheckInterval) {
        clearInterval(this.periodicCheckInterval);
        this.periodicCheckInterval = null;
      }

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

      // Clean up speed controller
      if (this.speedController) {
        this.speedController.cleanup();
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
    const requiredClasses = [
      'VideoControls',
      'ProfileManager',
      'ThemeManager',
      'VideoFilterEngine',
      'StorageUtils',
      'UIHelper'
    ];
    const missingClasses = requiredClasses.filter(
      (className) => typeof window[className] === 'undefined'
    );

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
      const toggleCommand = commands.find((cmd) => cmd.name === 'toggle-vivideo');
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

    if (request.action === 'ensure-vivideo') {
      // Sent from background when tab is activated or updated
      tryEnsureInitializedAndApply();
      sendResponse({ success: true });
    }

    if (request.action === 'default-profile') {
      // Simple toggle to default profile
      if (window.vivideoController) {
        console.log('Vivideo: Alt+M shortcut - Reset to DEFAULT profile');
        window.vivideoController.resetToDefault();
      } else {
        console.warn('Vivideo: Controller not available for default-profile');
      }
      sendResponse({ success: true });
    }

    if (request.action === 'next-profile') {
      if (window.vivideoController && window.vivideoController.profileManager) {
        console.log('Vivideo: Alt+B shortcut - Next profile');
        window.vivideoController.profileManager.nextProfile();
      } else {
        console.warn('Vivideo: Controller not available for next-profile');
      }
      sendResponse({ success: true });
    }

    if (request.action === 'prev-profile') {
      if (window.vivideoController && window.vivideoController.profileManager) {
        console.log('Vivideo: Alt+C shortcut - Previous profile');
        window.vivideoController.profileManager.previousProfile();
      } else {
        console.warn('Vivideo: Controller not available for prev-profile');
      }
      sendResponse({ success: true });
    }

    // Profile saved from popup - update controller and storage
    if (request.action === 'profile-saved' && request.profile) {
      try {
        const profile = request.profile;
        const overwrite = !!request.overwrite;

        if (window.vivideoController) {
          // Update or add profile in controller.profiles
          const existingIndex = window.vivideoController.profiles.findIndex((p) => p.name === profile.name);
          if (existingIndex >= 0) {
            window.vivideoController.profiles[existingIndex] = profile;
          } else {
            window.vivideoController.profiles.push(profile);
          }

          // Persist profiles via StorageUtils
          if (window.StorageUtils && window.StorageUtils.saveProfiles) {
            window.StorageUtils.saveProfiles(window.vivideoController.profiles).catch((e) => {
              console.warn('Vivideo: Failed to save profiles from popup', e);
            });
          } else {
            // Fallback to direct chrome.storage
            try {
              chrome.storage.sync.set({ vivideoProfiles: window.vivideoController.profiles });
            } catch (e) {
              console.warn('Vivideo: chrome.storage not available to persist profiles', e);
            }
          }

          // Update UI
          if (window.vivideoController.container) {
            window.vivideoController.updateProfilesList();
            window.vivideoController.updateActiveProfileDisplay(window.vivideoController.settings);
          }
        }

        sendResponse({ success: true });
      } catch (err) {
        console.error('Vivideo: Error handling profile-saved message', err);
        sendResponse({ success: false, error: err && err.message });
      }
    }

    return true;
  });

  // Additional automatic re-checks to improve auto-activation reliability
  function tryEnsureInitializedAndApply() {
    try {
      if (!window.vivideoController) {
        initializeVivideo();
        setTimeout(() => {
          if (window.vivideoController) window.vivideoController.applyFilters();
        }, 150);
      } else {
        // Controller exists - ensure filters are applied and videos observed
        try {
          window.vivideoController.applyFilters();
          if (
            window.vivideoController.filterEngine &&
            typeof window.vivideoController.filterEngine.observeVideos === 'function'
          ) {
            // Re-attach observers if needed
            // observeVideos already sets up observers; calling ensure doesn't duplicate heavy work
          }
        } catch (e) {
          console.warn('Vivideo: Error during auto apply', e);
        }
      }
    } catch (e) {
      console.warn('Vivideo: tryEnsureInitializedAndApply failed', e);
    }
  }

  // Visibility and navigation events: re-check on tab switch, back/forward, pageshow and focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      tryEnsureInitializedAndApply();
    }
  });

  window.addEventListener('pageshow', () => {
    tryEnsureInitializedAndApply();
  });

  window.addEventListener('focus', () => {
    tryEnsureInitializedAndApply();
  });

  // Listen for media play events globally to ensure filters apply to newly started media
  document.addEventListener(
    'play',
    () => {
      try {
        // Only apply filters if our controller exists and is fully initialized
        if (window.vivideoController && window.vivideoController.isInitialized) {
          window.vivideoController.applyFilters();
        }
      } catch (err) {
        console.warn('Vivideo: play handler error', err);
      }
    },
    true
  );

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

  // Keyboard shortcuts - dynamic based on toggleWithoutAlt setting
  document.addEventListener('keydown', (e) => {
    const controller = window.vivideoController;
    // Always get fresh toggleWithoutAlt setting
    const toggleWithoutAlt =
      controller && controller.settings ? controller.settings.toggleWithoutAlt : false;

    // Handle V key for panel toggle
    // Guard access to `e.key` in case it's undefined in some environments
    if (shouldHandleKeyboardShortcuts && typeof e.key === 'string' && e.key.toLowerCase() === 'v') {
      // Check if we should handle V without Alt or Alt+V
      const shouldToggle = toggleWithoutAlt
        ? !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey
        : e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey;

      if (shouldToggle) {
        // Additional check to avoid conflicts with input fields
        const activeElement = document.activeElement;
        const isInputField =
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true' ||
            activeElement.isContentEditable);

        // If toggle without Alt is enabled, be extra careful about input fields
        if (toggleWithoutAlt && isInputField) {
          console.log('Vivideo: Skipping V key in input field');
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        console.log(`Vivideo: ${toggleWithoutAlt ? 'V' : 'Alt+V'} keyboard shortcut detected`);

        if (controller) {
          controller.toggle();
        } else {
          initializeVivideo();
          setTimeout(() => {
            if (window.vivideoController) {
              window.vivideoController.show();
            }
          }, 100);
        }
        return;
      }
    }

    // Only handle other shortcuts with Alt key to avoid conflicts with typing
    if (!e.altKey || e.ctrlKey || e.shiftKey) return;

    // Profile control shortcuts - Alt+B/C only
    if (window.vivideoController) {
      const controller = window.vivideoController;
      const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';

      // Alt + C: Previous Profile
      if (key === 'c') {
        e.preventDefault();
        if (controller.profileManager) {
          controller.profileManager.previousProfile();
          console.log('Vivideo: Previous profile selected (Alt+C)');
        }
      }

      // Alt + B: Next Profile
      else if (key === 'b') {
        e.preventDefault();
        if (controller.profileManager) {
          controller.profileManager.nextProfile();
          console.log('Vivideo: Next profile selected (Alt+B)');
        }
      }
    }

    // Handle B and C keys for profile switching when toggleWithoutAlt is enabled
    if (
      controller &&
      controller.settings &&
      controller.settings.toggleWithoutAlt &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey
    ) {
      const keyNoAlt = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      // C: Previous Profile (without Alt)
      if (keyNoAlt === 'c') {
        e.preventDefault();
        e.stopPropagation();
        if (controller.profileManager) {
          controller.profileManager.previousProfile();
          console.log('Vivideo: Previous profile selected (C)');
        }
        return;
      }

      // B: Next Profile (without Alt)
      else if (keyNoAlt === 'b') {
        e.preventDefault();
        e.stopPropagation();
        if (controller.profileManager) {
          controller.profileManager.nextProfile();
          console.log('Vivideo: Next profile selected (B)');
        }
        return;
      }
    }
  });
} // End of top window check
