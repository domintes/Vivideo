// Vivideo Content Script
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
    this.videos = [];
    this.settings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0,
      sharpness: 0,
      autoActivate: true,
      activeProfile: null
    };
    this.defaultSettings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0,
      sharpness: 0,
      autoActivate: true,
      activeProfile: null
    };
    this.profiles = [];
    this.currentTheme = 'cyberdark';
    this.profilesVisible = false;
    this.themesVisible = false;
    this.infoVisible = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.clickOutsideHandler = null;
    this.isInitialized = false;
    
    // Set global reference
    window.vivideoController = this;
    
    this.init();
  }

  init() {
    if (this.isInitialized) {
      console.warn('Vivideo: Already initialized');
      return;
    }
    
    console.log('Vivideo: Starting initialization...');
    // Load settings first, then initialize UI
    this.loadSettings();
  }

  loadSettings() {
    chrome.runtime.sendMessage({
      action: 'get-storage',
      keys: ['vivideoSettings', 'vivideoProfiles', 'vivideoTheme', 'vivideoAppState']
    }, (response) => {
      if (response && response.vivideoSettings) {
        this.settings = { ...this.settings, ...response.vivideoSettings };
      }
      if (response && response.vivideoProfiles) {
        this.profiles = response.vivideoProfiles;
      }
      if (response && response.vivideoTheme) {
        this.currentTheme = response.vivideoTheme;
      }
      if (response && response.vivideoAppState) {
        this.loadActiveProfile(response.vivideoAppState.activeProfile);
      }
      
      // Continue initialization after settings are loaded
      this.finishInitialization();
    });
  }

  finishInitialization() {
    this.createUI();
    this.bindEvents();
    this.observeVideos();
    this.updateUI(); // Make sure UI is updated after creation
    this.isInitialized = true;
    console.log('Vivideo: Initialization complete');
    
    // Auto-apply filters if autoActivate is enabled
    if (this.settings.autoActivate) {
      this.applyFilters();
    }
  }

  loadProfiles() {
    // Now handled in loadSettings for better synchronization
  }

  loadTheme() {
    // Now handled in loadSettings for better synchronization
  }

  loadAppState() {
    // Now handled in loadSettings for better synchronization
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

  saveSettings() {
    chrome.runtime.sendMessage({
      action: 'set-storage',
      data: { vivideoSettings: this.settings }
    });
  }

  saveProfiles() {
    chrome.runtime.sendMessage({
      action: 'set-storage',
      data: { vivideoProfiles: this.profiles }
    });
  }

  saveTheme() {
    chrome.runtime.sendMessage({
      action: 'set-storage',
      data: { vivideoTheme: this.currentTheme }
    });
  }

  saveAppState() {
    chrome.runtime.sendMessage({
      action: 'set-storage',
      data: { 
        vivideoAppState: { 
          activeProfile: this.settings.activeProfile,
          autoActivate: this.settings.autoActivate
        }
      }
    });
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.className = `vivideo-container vivideo-theme-${this.currentTheme}`;
    this.container.innerHTML = `
      <div class="vivideo-header vivideo-draggable">
        <h3 class="vivideo-title">Vivideo</h3>
        <button class="vivideo-info" title="Information">ⓘ</button>
        <button class="vivideo-close" title="Close (Alt+V)">✕</button>
      </div>
      <div class="vivideo-bottom-controls">
        <div class="profiles-button-section button-section">
          <button class="vivideo-control-btn" id="profiles-btn" title="Configuration profiles">Profiles</button>
          <div class="active-item-status active-profile-status">
            [HERE SHOULD BE ACTIVE PROFILE (If default values - 'DEFAULT'. If edited - 'NOT SAVED']
          </div>

      <div class="vivideo-profiles" id="profiles-panel">
        <div class="vivideo-profile-form">
          <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profile_1">
          <button class="vivideo-profile-save" id="save-profile">Save</button>
        </div>
        <div class="vivideo-profile-list" id="profile-list"></div>
      </div>

        </div>
        <div class="themes-button-section button-section">
          <button class="vivideo-control-btn" id="themes-btn" title="Themes">Themes</button>
          <div class="active-item-status active-theme-status">
            [HERE SHOULD BE ACTIVE THEME E.G CYBERDARK (IF ACTIVE)]
          </div>
        </div>
      </div>

      <div class="vivideo-themes" id="themes-panel">
        <div class="vivideo-theme-option" data-theme="cyberdark">
          <div class="vivideo-theme-preview cyberdark-preview"></div>
          <span>Cyberdark</span>
        </div>
        <div class="vivideo-theme-option" data-theme="blue">
          <div class="vivideo-theme-preview blue-preview"></div>
          <span>Blue</span>
        </div>
      </div>
      <div class="vivideo-auto-activate">
        <label class="vivideo-checkbox-container">
          <input type="checkbox" id="auto-activate-checkbox" ${this.settings.autoActivate ? 'checked' : ''}>
          <span class="vivideo-checkmark"></span>
          <span class="vivideo-checkbox-label">Auto-activate extension</span>
        </label>
      </div>

      <div class="vivideo-info-panel" id="info-panel" style="display: none;">
        <div class="vivideo-info-content">
          <h4>Vivideo - Real-time Video Enhancement</h4>
          <p>Extension for real-time video parameter adjustment.</p>
          <h5>Features:</h5>
          <ul>
            <li><strong>Brightness:</strong> -100% to +100% - Brightness adjustment</li>
            <li><strong>Contrast:</strong> -100% to +100% - Contrast adjustment</li>
            <li><strong>Saturation:</strong> -90% to +100% - Color saturation</li>
            <li><strong>Gamma:</strong> 0.1 to 3.0 - Gamma correction</li>
            <li><strong>Color Temp:</strong> -100% to +100% - Color temperature</li>
            <li><strong>Sharpness:</strong> 0% to 100% - Image sharpness</li>
          </ul>
          <h5>Keyboard shortcuts:</h5>
          <ul>
            <li><code>Alt + V</code> - Toggle panel</li>
            <li>Drag header - Move panel</li>
            <li>Click outside panel - Hide panel</li>
          </ul>
        </div>
      </div>
      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Brightness</span>
          <span class="vivideo-value" id="brightness-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="brightness-slider" 
                 min="-100" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="brightness-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="brightness" title="Reset brightness">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Contrast</span>
          <span class="vivideo-value" id="contrast-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="contrast-slider" 
                 min="-100" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="contrast-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="contrast" title="Reset contrast">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Saturation</span>
          <span class="vivideo-value" id="saturation-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="saturation-slider" 
                 min="-90" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="saturation-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="saturation" title="Reset saturation">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Gamma</span>
          <span class="vivideo-value" id="gamma-value">1.00</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="gamma-slider" 
                 min="0.1" max="3" value="1" step="0.01">
          <span>►</span>
          <input type="text" class="vivideo-input" id="gamma-input" 
                 placeholder="1.00" maxlength="4">
          <button class="vivideo-reset-single" data-control="gamma" title="Reset gamma">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Color Temp.</span>
          <span class="vivideo-value" id="colortemp-value">Neutral</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="colortemp-slider" 
                 min="-100" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="colortemp-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="colortemp" title="Reset color temperature">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Sharpness</span>
          <span class="vivideo-value" id="sharpness-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="sharpness-slider" 
                 min="0" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="sharpness-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="sharpness" title="Reset sharpness">↺</button>
        </div>
      </div>

      <button class="vivideo-reset" id="reset-button">Reset all values ⟳</button>
 
      <div class="vivideo-shortcuts">
        Press <code>Alt + V</code> to toggle • Drag header to move
      </div>
    `;

    document.body.appendChild(this.container);
    this.updateProfilesList();
    this.updateThemeSelection();
  }

  bindEvents() {
    // Close button
    this.container.querySelector('.vivideo-close').addEventListener('click', () => {
      this.hide();
    });

    // Info button
    this.container.querySelector('.vivideo-info').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleInfo();
    });

    // Auto-activate checkbox
    this.container.querySelector('#auto-activate-checkbox').addEventListener('change', (e) => {
      this.settings.autoActivate = e.target.checked;
      this.saveSettings();
      this.saveAppState();
      
      // Apply or remove filters based on checkbox state
      if (this.settings.autoActivate) {
        this.applyFilters();
      } else {
        // Only remove filters if panel is not visible
        if (!this.isVisible) {
          this.removeFilters();
        }
      }
    });

    // Click outside to hide - improved implementation
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

    // Reset all button
    this.container.querySelector('#reset-button').addEventListener('click', () => {
      this.resetAll();
    });

    // Single reset buttons
    this.container.querySelectorAll('.vivideo-reset-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const control = e.target.getAttribute('data-control');
        this.resetSingle(control);
      });
    });

    // Profile controls
    this.container.querySelector('#profiles-btn').addEventListener('click', () => {
      this.toggleProfiles();
    });

    this.container.querySelector('#save-profile').addEventListener('click', () => {
      this.saveCurrentProfile();
    });

    // Theme controls
    this.container.querySelector('#themes-btn').addEventListener('click', () => {
      this.toggleThemes();
    });

    this.container.querySelectorAll('.vivideo-theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        this.changeTheme(theme);
      });
    });

    // Dragging functionality
    const header = this.container.querySelector('.vivideo-header');
    let mouseDownHandler = null;
    let mouseMoveHandler = null;
    let mouseUpHandler = null;
    
    mouseDownHandler = (e) => {
      // Only start dragging if clicking on the header area, not buttons
      if (e.target.classList.contains('vivideo-close') || e.target.classList.contains('vivideo-info')) {
        return;
      }
      
      this.isDragging = true;
      this.container.classList.add('vivideo-dragging');
      const rect = this.container.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      e.preventDefault();
    };

    mouseMoveHandler = (e) => {
      if (!this.isDragging) return;
      
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      
      this.container.style.left = Math.max(0, Math.min(x, window.innerWidth - this.container.offsetWidth)) + 'px';
      this.container.style.top = Math.max(0, Math.min(y, window.innerHeight - this.container.offsetHeight)) + 'px';
      this.container.style.right = 'auto';
      e.preventDefault();
    };

    mouseUpHandler = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.classList.remove('vivideo-dragging');
        
        // Small delay to prevent immediate hiding when drag ends
        setTimeout(() => {
          this.isDragging = false;
        }, 10);
      }
    };
    
    header.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    // Store handlers for cleanup
    this.dragHandlers = {
      mouseDown: mouseDownHandler,
      mouseMove: mouseMoveHandler,
      mouseUp: mouseUpHandler,
      header: header
    };

    // Bind all control events
    this.bindControlEvents();

    // Listen for keyboard shortcut
    chrome.runtime.onMessage.addListener((message) => {
      console.log('Vivideo: Received message:', message);
      if (message.action === 'toggle-vivideo') {
        this.toggle();
      }
      if (message.action === 'reset-vivideo') {
        this.resetAll();
      }
    });

    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.container.classList.add('vivideo-fullscreen');
      } else {
        this.container.classList.remove('vivideo-fullscreen');
      }
    });
  }

  bindControlEvents() {
    const controls = ['brightness', 'contrast', 'saturation', 'gamma', 'colortemp', 'sharpness'];
    
    controls.forEach(control => {
      const slider = this.container.querySelector(`#${control}-slider`);
      const input = this.container.querySelector(`#${control}-input`);
      
      slider.addEventListener('input', (e) => {
        this.updateControl(control, parseFloat(e.target.value));
      });
      
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          this.updateControl(control, value);
        }
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
    });
  }

  updateControl(control, value) {
    // Clamp values to their respective ranges
    switch (control) {
      case 'brightness':
      case 'contrast':
        value = Math.max(-100, Math.min(100, value));
        break;
      case 'saturation':
        value = Math.max(-90, Math.min(100, value));
        break;
      case 'gamma':
        value = Math.max(0.1, Math.min(3, value));
        break;
      case 'colortemp':
        value = Math.max(-100, Math.min(100, value));
        break;
      case 'sharpness':
        value = Math.max(0, Math.min(100, value));
        break;
    }

    this.settings[control === 'colortemp' ? 'colorTemp' : control] = value;
    this.updateUI();
    this.applyFilters();
    this.saveSettings();
  }

  updateUI() {
    // Update brightness
    const brightnessSlider = this.container.querySelector('#brightness-slider');
    const brightnessInput = this.container.querySelector('#brightness-input');
    const brightnessValue = this.container.querySelector('#brightness-value');
    
    brightnessSlider.value = this.settings.brightness;
    brightnessInput.value = this.settings.brightness;
    brightnessValue.textContent = `${this.settings.brightness}%`;

    // Update contrast
    const contrastSlider = this.container.querySelector('#contrast-slider');
    const contrastInput = this.container.querySelector('#contrast-input');
    const contrastValue = this.container.querySelector('#contrast-value');
    
    contrastSlider.value = this.settings.contrast;
    contrastInput.value = this.settings.contrast;
    contrastValue.textContent = `${this.settings.contrast}%`;

    // Update saturation
    const saturationSlider = this.container.querySelector('#saturation-slider');
    const saturationInput = this.container.querySelector('#saturation-input');
    const saturationValue = this.container.querySelector('#saturation-value');
    
    saturationSlider.value = this.settings.saturation;
    saturationInput.value = this.settings.saturation;
    saturationValue.textContent = `${this.settings.saturation}%`;

    // Update gamma
    const gammaSlider = this.container.querySelector('#gamma-slider');
    const gammaInput = this.container.querySelector('#gamma-input');
    const gammaValue = this.container.querySelector('#gamma-value');
    
    gammaSlider.value = this.settings.gamma;
    gammaInput.value = this.settings.gamma.toFixed(2);
    gammaValue.textContent = this.settings.gamma.toFixed(2);

    // Update color temperature
    const colorTempSlider = this.container.querySelector('#colortemp-slider');
    const colorTempInput = this.container.querySelector('#colortemp-input');
    const colorTempValue = this.container.querySelector('#colortemp-value');
    
    colorTempSlider.value = this.settings.colorTemp;
    colorTempInput.value = this.settings.colorTemp;
    
    let tempText = 'Neutral';
    if (this.settings.colorTemp < -75) tempText = 'Very Cold';
    else if (this.settings.colorTemp < -40) tempText = 'Cold';
    else if (this.settings.colorTemp < -15) tempText = 'Cool';
    else if (this.settings.colorTemp < -5) tempText = 'Slightly Cool';
    else if (this.settings.colorTemp > 75) tempText = 'Very Warm';
    else if (this.settings.colorTemp > 40) tempText = 'Warm';
    else if (this.settings.colorTemp > 15) tempText = 'Cozy';
    else if (this.settings.colorTemp > 5) tempText = 'Slightly Warm';
    
    colorTempValue.textContent = tempText;

    // Update sharpness
    const sharpnessSlider = this.container.querySelector('#sharpness-slider');
    const sharpnessInput = this.container.querySelector('#sharpness-input');
    const sharpnessValue = this.container.querySelector('#sharpness-value');
    
    sharpnessSlider.value = this.settings.sharpness;
    sharpnessInput.value = this.settings.sharpness;
    sharpnessValue.textContent = `${this.settings.sharpness}%`;

    // Update auto-activate checkbox
    const autoActivateCheckbox = this.container.querySelector('#auto-activate-checkbox');
    if (autoActivateCheckbox) {
      autoActivateCheckbox.checked = this.settings.autoActivate;
    }
  }

  applyFilters() {
    this.findVideos().forEach(video => {
      this.applyFilterToVideo(video);
    });
  }

  applyFilterToVideo(video) {
    const brightness = 1 + (this.settings.brightness / 100);
    const contrast = 1 + (this.settings.contrast / 100);
    const saturation = Math.max(0, 1 + (this.settings.saturation / 100));
    
    // Apply CSS filters first (basic adjustments)
    let cssFilters = `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
    `;
    
    // Apply gamma correction, color temperature, and sharpness using SVG filter
    this.applyAdvancedFilters(video);
    
    // Combine CSS filters with SVG filter
    const advancedFilterExists = this.settings.gamma !== 1 || this.settings.colorTemp !== 0 || this.settings.sharpness > 0;
    if (advancedFilterExists) {
      cssFilters += ` url(#vivideo-advanced-filter)`;
    }
    
    video.style.filter = cssFilters.trim();
  }

  applyAdvancedFilters(video) {
    const gamma = this.settings.gamma;
    const colorTemp = this.settings.colorTemp;
    const sharpness = this.settings.sharpness;

    // Remove existing SVG container
    const existingSvg = document.querySelector('#vivideo-svg-container');
    if (existingSvg) {
      existingSvg.remove();
    }

    // Skip if no advanced effects are needed
    if (gamma === 1 && colorTemp === 0 && sharpness === 0) {
      return;
    }

    // Create SVG container for advanced effects
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'vivideo-svg-container';
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';

    // Calculate color temperature values - improved algorithm
    const tempFactor = colorTemp / 100;
    let rSlope = 1, gSlope = 1, bSlope = 1;
    let rExponent = gamma, gExponent = gamma, bExponent = gamma;

    if (tempFactor > 0) {
      // Warmer - increase red/yellow, decrease blue
      rSlope = 1 + (tempFactor * 0.3);
      gSlope = 1 + (tempFactor * 0.15);
      bSlope = Math.max(0.4, 1 - (tempFactor * 0.4));
    } else if (tempFactor < 0) {
      // Cooler - increase blue, decrease red/yellow
      const coolness = Math.abs(tempFactor);
      rSlope = Math.max(0.5, 1 - (coolness * 0.3));
      gSlope = Math.max(0.7, 1 - (coolness * 0.1));
      bSlope = 1 + (coolness * 0.4);
    }

    // Calculate sharpness matrix
    const sharpAmount = sharpness / 100 * 0.8;
    const sharpCenter = 1 + (4 * sharpAmount);
    const sharpEdge = -sharpAmount;

    let filterContent = '';
    let lastResult = '';

    // Add sharpness filter if needed
    if (sharpness > 0) {
      filterContent += `
        <feConvolveMatrix order="3,3"
                         kernelMatrix="${sharpEdge} ${sharpEdge} ${sharpEdge}
                                      ${sharpEdge} ${sharpCenter} ${sharpEdge}
                                      ${sharpEdge} ${sharpEdge} ${sharpEdge}"
                         result="sharpened"/>
      `;
      lastResult = 'sharpened';
    }

    // Add gamma and color temperature correction
    filterContent += `
      <feComponentTransfer ${lastResult ? `in="${lastResult}"` : ''}>
        <feFuncR type="gamma" amplitude="${rSlope}" exponent="${rExponent}"/>
        <feFuncG type="gamma" amplitude="${gSlope}" exponent="${gExponent}"/>
        <feFuncB type="gamma" amplitude="${bSlope}" exponent="${bExponent}"/>
      </feComponentTransfer>
    `;

    svg.innerHTML = `
      <filter id="vivideo-advanced-filter" x="0%" y="0%" width="100%" height="100%">
        ${filterContent}
      </filter>
    `;

    document.body.appendChild(svg);
  }

  findVideos() {
    const videos = [];
    
    // Find videos in main document
    videos.push(...document.querySelectorAll('video'));
    
    // Find videos in shadow DOM
    const elementsWithShadow = document.querySelectorAll('*');
    elementsWithShadow.forEach(element => {
      if (element.shadowRoot) {
        videos.push(...element.shadowRoot.querySelectorAll('video'));
      }
    });
    
    return videos;
  }

  observeVideos() {
    // Create observer for dynamically added videos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
            videos.forEach(video => {
              // Only apply filters if auto-activate is enabled or panel is visible
              if (this.settings.autoActivate || this.isVisible) {
                this.applyFilterToVideo(video);
              }
            });
            
            if (node.tagName === 'VIDEO') {
              if (this.settings.autoActivate || this.isVisible) {
                this.applyFilterToVideo(node);
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  removeFilters() {
    this.findVideos().forEach(video => {
      video.style.filter = '';
    });
    
    // Remove SVG filters
    const existingSvg = document.querySelector('#vivideo-svg-container');
    if (existingSvg) {
      existingSvg.remove();
    }
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
      activeProfile: null
    };
    
    // Remove existing SVG filters
    const existingSvg = document.querySelector('#vivideo-svg-container');
    if (existingSvg) {
      existingSvg.remove();
    }
    
    // Reset all video filters
    this.findVideos().forEach(video => {
      video.style.filter = '';
    });
    
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

  toggleProfiles() {
    this.profilesVisible = !this.profilesVisible;
    const profilesPanel = this.container.querySelector('#profiles-panel');
    const themesPanel = this.container.querySelector('#themes-panel');
    const infoPanel = this.container.querySelector('#info-panel');
    const profilesBtn = this.container.querySelector('#profiles-btn');
    
    // Update active states
    this.updateActiveStates();
    
    if (this.profilesVisible) {
      profilesPanel.style.display = 'block';
      themesPanel.style.display = 'none';
      infoPanel.style.display = 'none';
      this.themesVisible = false;
      this.infoVisible = false;
      this.updateProfilesList();
    } else {
      profilesPanel.style.display = 'none';
    }
  }

  toggleThemes() {
    this.themesVisible = !this.themesVisible;
    const themesPanel = this.container.querySelector('#themes-panel');
    const profilesPanel = this.container.querySelector('#profiles-panel');
    const infoPanel = this.container.querySelector('#info-panel');
    
    // Update active states
    this.updateActiveStates();
    
    if (this.themesVisible) {
      themesPanel.style.display = 'block';
      profilesPanel.style.display = 'none';
      infoPanel.style.display = 'none';
      this.profilesVisible = false;
      this.infoVisible = false;
    } else {
      themesPanel.style.display = 'none';
    }
  }

  toggleInfo() {
    this.infoVisible = !this.infoVisible;
    const infoPanel = this.container.querySelector('#info-panel');
    const profilesPanel = this.container.querySelector('#profiles-panel');
    const themesPanel = this.container.querySelector('#themes-panel');
    
    // Update active states
    this.updateActiveStates();
    
    if (this.infoVisible) {
      infoPanel.style.display = 'block';
      profilesPanel.style.display = 'none';
      themesPanel.style.display = 'none';
      this.profilesVisible = false;
      this.themesVisible = false;
    } else {
      infoPanel.style.display = 'none';
    }
  }

  updateActiveStates() {
    const profilesBtn = this.container.querySelector('#profiles-btn');
    const themesBtn = this.container.querySelector('#themes-btn');
    const infoBtn = this.container.querySelector('.vivideo-info');
    
    // Remove all active classes
    profilesBtn.classList.remove('vivideo-active');
    themesBtn.classList.remove('vivideo-active');
    infoBtn.classList.remove('vivideo-active');
    
    // Add active class to currently active button
    if (this.profilesVisible) {
      profilesBtn.classList.add('vivideo-active');
    }
    if (this.themesVisible) {
      themesBtn.classList.add('vivideo-active');
    }
    if (this.infoVisible) {
      infoBtn.classList.add('vivideo-active');
    }
  }

  updateProfilesList() {
    const profileList = this.container.querySelector('#profile-list');
    if (!profileList) return;
    
    profileList.innerHTML = '';
    
    this.profiles.forEach((profile, index) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'vivideo-profile-item';
      
      // Add active class if this is the current active profile
      const isActive = this.settings.activeProfile === profile.name;
      if (isActive) {
        profileItem.classList.add('vivideo-profile-active');
      }
      
      profileItem.innerHTML = `
        <span class="vivideo-profile-name">${profile.name}${isActive ? ' (aktywny)' : ''}</span>
        <button class="vivideo-profile-delete" data-index="${index}">❌</button>
      `;
      
      profileItem.querySelector('.vivideo-profile-name').addEventListener('click', () => {
        this.loadProfile(profile);
      });
      
      profileItem.querySelector('.vivideo-profile-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteProfile(index);
      });
      
      profileList.appendChild(profileItem);
    });
    
    // Update profile name placeholder
    const profileNameInput = this.container.querySelector('#profile-name');
    if (profileNameInput) {
      profileNameInput.placeholder = `Profil_${this.profiles.length + 1}`;
    }
  }

  saveCurrentProfile() {
    const nameInput = this.container.querySelector('#profile-name');
    let profileName = nameInput.value.trim();
    
    if (!profileName) {
      profileName = `Profile_${this.profiles.length + 1}`;
    }
    
    // Include current theme and auto-activate state in profile
    const profile = {
      name: profileName,
      settings: { 
        ...this.settings,
        theme: this.currentTheme,
        autoActivate: this.settings.autoActivate
      }
    };
    
    this.profiles.push(profile);
    this.saveProfiles();
    this.updateProfilesList();
    nameInput.value = '';
  }

  loadProfile(profile) {
    // Set as active profile
    this.settings.activeProfile = profile.name;
    
    // Load all settings from profile
    this.settings = { ...this.settings, ...profile.settings };
    
    // Load theme if saved in profile
    if (profile.settings.theme) {
      this.currentTheme = profile.settings.theme;
      this.container.className = `vivideo-container vivideo-theme-${this.currentTheme}`;
      if (this.isVisible) {
        this.container.classList.add('vivideo-visible');
      }
      this.saveTheme();
    }
    
    this.updateUI();
    this.applyFilters();
    this.saveSettings();
    this.saveAppState();
    this.updateProfilesList();
    this.toggleProfiles(); // Hide profiles panel after loading
  }

  deleteProfile(index) {
    const deletedProfile = this.profiles[index];
    
    // If deleting active profile, clear active profile
    if (this.settings.activeProfile === deletedProfile.name) {
      this.settings.activeProfile = null;
      this.saveAppState();
    }
    
    this.profiles.splice(index, 1);
    this.saveProfiles();
    this.updateProfilesList();
  }

  changeTheme(theme) {
    this.currentTheme = theme;
    this.container.className = `vivideo-container vivideo-theme-${theme}`;
    if (this.isVisible) {
      this.container.classList.add('vivideo-visible');
    }
    this.updateThemeSelection();
    this.saveTheme();
    this.toggleThemes(); // Hide themes panel after selection
  }

  updateThemeSelection() {
    this.container.querySelectorAll('.vivideo-theme-option').forEach(option => {
      const theme = option.getAttribute('data-theme');
      if (theme === this.currentTheme) {
        option.classList.add('vivideo-theme-selected');
      } else {
        option.classList.remove('vivideo-theme-selected');
      }
    });
  }

  toggle() {
    console.log('Vivideo: Toggle called, isVisible:', this.isVisible);
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
    this.applyFilters(); // Always apply filters when showing panel
  }

  hide() {
    this.container.classList.remove('vivideo-visible');
    this.isVisible = false;
    
    // Remove filters only if auto-activate is disabled
    if (!this.settings.autoActivate) {
      this.removeFilters();
    }
    
    // Reset all active states when hiding
    this.profilesVisible = false;
    this.themesVisible = false;
    this.infoVisible = false;
    this.updateActiveStates();
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
    
    // Remove SVG filters
    const existingSvg = document.querySelector('#vivideo-svg-container');
    if (existingSvg) {
      existingSvg.remove();
    }
    
    // Reset all video filters
    this.findVideos().forEach(video => {
      video.style.filter = '';
    });
    
    this.isInitialized = false;
    this.container = null;
    
    if (window.vivideoController === this) {
      window.vivideoController = null;
    }
  }
}

// Initialize when DOM is ready
function initializeVivideo() {
  // Prevent multiple instances
  if (window.vivideoController) {
    return;
  }
  
  new VivideoController();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVivideo);
} else {
  initializeVivideo();
}

// Also initialize on window load to catch any late-loading content
window.addEventListener('load', () => {
  if (!window.vivideoController) {
    initializeVivideo();
  }
});
