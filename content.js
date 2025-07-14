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
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.init();
  }

  init() {
    this.loadSettings();
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

  saveSettings() {
    chrome.runtime.sendMessage({
      action: 'set-storage',
      data: { vivideoSettings: this.settings }
    });
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.className = 'vivideo-container';
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
        </div>
      </div>

      <button class="vivideo-reset" id="reset-button">Reset All</button>
      
      <div class="vivideo-shortcuts">
        Press Alt+V to toggle • Drag header to move
      </div>
    `;

    document.body.appendChild(this.container);
  }

  bindEvents() {
    // Close button
    this.container.querySelector('.vivideo-close').addEventListener('click', () => {
      this.hide();
    });

    // Reset button
    this.container.querySelector('#reset-button').addEventListener('click', () => {
      this.resetAll();
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

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.container.classList.add('vivideo-visible');
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
