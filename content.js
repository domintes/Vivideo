// Vivideo Content Script
class VivideoController {
  constructor() {
    this.isVisible = false;
    this.container = null;
    this.videos = [];
    this.settings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0
    };
    this.defaultSettings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0
    };
    this.profiles = [];
    this.currentTheme = 'cyberdark';
    this.profilesVisible = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.loadProfiles();
    this.loadTheme();
    this.createUI();
    this.bindEvents();
    this.observeVideos();
  }

  loadSettings() {
    chrome.runtime.sendMessage({
      action: 'get-storage',
      keys: ['vivideoSettings']
    }, (response) => {
      if (response && response.vivideoSettings) {
        this.settings = { ...this.settings, ...response.vivideoSettings };
        this.updateUI();
        this.applyFilters();
      }
    });
  }

  loadProfiles() {
    chrome.runtime.sendMessage({
      action: 'get-storage',
      keys: ['vivideoProfiles']
    }, (response) => {
      if (response && response.vivideoProfiles) {
        this.profiles = response.vivideoProfiles;
      }
    });
  }

  loadTheme() {
    chrome.runtime.sendMessage({
      action: 'get-storage',
      keys: ['vivideoTheme']
    }, (response) => {
      if (response && response.vivideoTheme) {
        this.currentTheme = response.vivideoTheme;
      }
    });
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

  createUI() {
    this.container = document.createElement('div');
    this.container.className = `vivideo-container vivideo-theme-${this.currentTheme}`;
    this.container.innerHTML = `
      <div class="vivideo-header vivideo-draggable">
        <h3 class="vivideo-title">Vivideo</h3>
        <button class="vivideo-close" title="Close (Alt+V)">×</button>
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

      <button class="vivideo-reset" id="reset-button">Resetuj wszystkie wartości ⟳</button>
      
      <div class="vivideo-bottom-controls">
        <button class="vivideo-control-btn" id="profiles-btn" title="Profile konfiguracji">🎚️</button>
        <button class="vivideo-control-btn" id="themes-btn" title="Motywy">🎨</button>
      </div>

      <div class="vivideo-profiles" id="profiles-panel">
        <div class="vivideo-profile-form">
          <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profil_1">
          <button class="vivideo-profile-save" id="save-profile">💾</button>
        </div>
        <div class="vivideo-profile-list" id="profile-list"></div>
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
      
      <div class="vivideo-shortcuts">
        Naciśnij <code>Alt + V</code>, aby przełączyć • Przeciągnij nagłówek, aby przesunąć
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
    header.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.container.classList.add('vivideo-dragging');
      const rect = this.container.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      
      this.container.style.left = Math.max(0, Math.min(x, window.innerWidth - this.container.offsetWidth)) + 'px';
      this.container.style.top = Math.max(0, Math.min(y, window.innerHeight - this.container.offsetHeight)) + 'px';
      this.container.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.classList.remove('vivideo-dragging');
      }
    });

    // Bind all control events
    this.bindControlEvents();

    // Listen for keyboard shortcut
    chrome.runtime.onMessage.addListener((message) => {
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
    const controls = ['brightness', 'contrast', 'saturation', 'gamma', 'colortemp'];
    
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
    if (this.settings.colorTemp < -30) tempText = 'Very Cold';
    else if (this.settings.colorTemp < -10) tempText = 'Cold';
    else if (this.settings.colorTemp > 30) tempText = 'Very Hot';
    else if (this.settings.colorTemp > 10) tempText = 'Hot';
    
    colorTempValue.textContent = tempText;
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
    const hue = this.settings.colorTemp * 1.8; // Convert to hue rotation
    
    // Apply CSS filters
    video.style.filter = `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
      hue-rotate(${hue}deg)
    `;
    
    // Apply gamma correction using SVG filter
    this.applyGammaCorrection(video);
  }

  applyGammaCorrection(video) {
    const gamma = this.settings.gamma;
    
    // Remove existing gamma filter
    const existingFilter = document.querySelector('#vivideo-gamma-filter');
    if (existingFilter) {
      existingFilter.remove();
    }
    
    // Create SVG filter for gamma correction
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'vivideo-gamma-filter';
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.innerHTML = `
      <filter id="gamma-correction">
        <feComponentTransfer>
          <feFuncR type="gamma" exponent="${gamma}"/>
          <feFuncG type="gamma" exponent="${gamma}"/>
          <feFuncB type="gamma" exponent="${gamma}"/>
        </feComponentTransfer>
      </filter>
    `;
    
    document.body.appendChild(svg);
    
    // Apply gamma filter if not default
    if (gamma !== 1) {
      const currentFilter = video.style.filter || '';
      video.style.filter = `${currentFilter} url(#gamma-correction)`;
    }
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
              this.applyFilterToVideo(video);
            });
            
            if (node.tagName === 'VIDEO') {
              this.applyFilterToVideo(node);
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

  resetAll() {
    this.settings = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0
    };
    
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
    
    if (this.profilesVisible) {
      profilesPanel.style.display = 'block';
      themesPanel.style.display = 'none';
      this.updateProfilesList();
    } else {
      profilesPanel.style.display = 'none';
    }
  }

  toggleThemes() {
    const themesPanel = this.container.querySelector('#themes-panel');
    const profilesPanel = this.container.querySelector('#profiles-panel');
    
    if (themesPanel.style.display === 'block') {
      themesPanel.style.display = 'none';
    } else {
      themesPanel.style.display = 'block';
      profilesPanel.style.display = 'none';
      this.profilesVisible = false;
    }
  }

  updateProfilesList() {
    const profileList = this.container.querySelector('#profile-list');
    if (!profileList) return;
    
    profileList.innerHTML = '';
    
    this.profiles.forEach((profile, index) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'vivideo-profile-item';
      profileItem.innerHTML = `
        <span class="vivideo-profile-name">${profile.name}</span>
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
      profileName = `Profil_${this.profiles.length + 1}`;
    }
    
    const profile = {
      name: profileName,
      settings: { ...this.settings }
    };
    
    this.profiles.push(profile);
    this.saveProfiles();
    this.updateProfilesList();
    nameInput.value = '';
  }

  loadProfile(profile) {
    this.settings = { ...profile.settings };
    this.updateUI();
    this.applyFilters();
    this.saveSettings();
    this.toggleProfiles(); // Hide profiles panel after loading
  }

  deleteProfile(index) {
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
    this.applyFilters(); // Apply filters when showing
  }

  hide() {
    this.container.classList.remove('vivideo-visible');
    this.isVisible = false;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VivideoController();
  });
} else {
  new VivideoController();
}

// Also initialize on window load to catch any late-loading content
window.addEventListener('load', () => {
  if (!window.vivideoController) {
    window.vivideoController = new VivideoController();
  }
});
