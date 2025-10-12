// Advanced Speed Controller for Vivideo
// Handles video playback speed with auto-trigger functionality

class SpeedController {
  constructor(controller) {
    this.controller = controller;
    this.currentSpeed = 1.0;
    this.previousSpeed = 1.0;
    this.autoApplyPreviousSpeed = false;
    this.speedObservers = new WeakMap(); // Track speed observers for each video
    this.videoSpeedMap = new WeakMap(); // Track current speed for each video
  }

  // Initialize speed controller
  init() {
    this.loadSpeedSettings();
    this.attachSpeedListeners();
  }

  // Load speed settings from storage
  async loadSpeedSettings() {
    try {
      const data = await StorageUtils.loadSettings();
      if (data && data.vivideoSettings) {
        this.currentSpeed = data.vivideoSettings.speed || 1.0;
        this.previousSpeed = data.vivideoSettings.previousSpeed || 1.0;
        this.autoApplyPreviousSpeed = data.vivideoSettings.autoApplyPreviousSpeed || false;
      }
    } catch (error) {
      console.error('Vivideo SpeedController: Error loading speed settings:', error);
    }
  }

  // Save speed settings to storage
  async saveSpeedSettings() {
    try {
      const currentSettings = this.controller.settings;
      currentSettings.speed = this.currentSpeed;
      currentSettings.previousSpeed = this.previousSpeed;
      currentSettings.autoApplyPreviousSpeed = this.autoApplyPreviousSpeed;

      await StorageUtils.saveSettings(currentSettings);
    } catch (error) {
      console.error('Vivideo SpeedController: Error saving speed settings:', error);
    }
  }

  // Apply speed to a specific video element
  applySpeedToVideo(video, speed) {
    if (!video || typeof speed !== 'number' || speed <= 0) return;

    // Clamp speed between 0.05 and 25
    const clampedSpeed = Math.max(0.05, Math.min(25, speed));
    
    try {
      video.playbackRate = clampedSpeed;
      this.videoSpeedMap.set(video, clampedSpeed);
      console.log(`Vivideo SpeedController: Applied speed ${clampedSpeed}x to video`);
    } catch (error) {
      console.error('Vivideo SpeedController: Error applying speed to video:', error);
    }
  }

  // Apply speed to all videos
  applySpeedToAllVideos(speed) {
    const videos = this.controller.filterEngine.findVideos();
    videos.forEach(video => {
      this.applySpeedToVideo(video, speed);
    });
  }

  // Set new speed and apply it
  setSpeed(newSpeed) {
    // Store previous speed before changing
    this.previousSpeed = this.currentSpeed;
    this.currentSpeed = newSpeed;
    
    // Apply to all current videos
    this.applySpeedToAllVideos(newSpeed);
    
    // Update controller settings
    this.controller.settings.speed = newSpeed;
    this.controller.settings.previousSpeed = this.previousSpeed;
    
    // Save settings
    this.saveSpeedSettings();
    
    // Trigger UI update
    this.controller.updateUI();
  }

  // Get current speed
  getSpeed() {
    return this.currentSpeed;
  }

  // Get previous speed
  getPreviousSpeed() {
    return this.previousSpeed;
  }

  // Toggle auto-apply previous speed
  setAutoApplyPreviousSpeed(enabled) {
    this.autoApplyPreviousSpeed = enabled;
    this.controller.settings.autoApplyPreviousSpeed = enabled;
    this.saveSpeedSettings();
  }

  // Check if auto-apply previous speed is enabled
  isAutoApplyPreviousSpeedEnabled() {
    return this.autoApplyPreviousSpeed;
  }

  // Attach speed listeners to videos
  attachSpeedListeners() {
    // Use MutationObserver to watch for new videos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a video element
            if (node.tagName === 'VIDEO') {
              this.handleNewVideo(node);
            }
            // Check if it contains video elements
            const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
            videos.forEach(video => this.handleNewVideo(video));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle existing videos
    const existingVideos = this.controller.filterEngine.findVideos();
    existingVideos.forEach(video => this.handleNewVideo(video));
  }

  // Handle new video element
  handleNewVideo(video) {
    if (!video || this.speedObservers.has(video)) return;

    console.log('Vivideo SpeedController: New video detected');

    // Apply auto-speed if enabled
    if (this.autoApplyPreviousSpeed && this.previousSpeed !== 1.0) {
      // Small delay to ensure video is ready
      setTimeout(() => {
        this.applySpeedToVideo(video, this.previousSpeed);
      }, 100);
    } else {
      // Apply current speed
      setTimeout(() => {
        this.applySpeedToVideo(video, this.currentSpeed);
      }, 100);
    }

    // Add event listeners for video events
    const playHandler = () => {
      // Reapply speed when video starts playing
      const targetSpeed = this.autoApplyPreviousSpeed && this.previousSpeed !== 1.0 
        ? this.previousSpeed 
        : this.currentSpeed;
      
      setTimeout(() => {
        this.applySpeedToVideo(video, targetSpeed);
      }, 50);
    };

    const loadedMetadataHandler = () => {
      // Apply speed when video metadata is loaded
      const targetSpeed = this.autoApplyPreviousSpeed && this.previousSpeed !== 1.0 
        ? this.previousSpeed 
        : this.currentSpeed;
      
      this.applySpeedToVideo(video, targetSpeed);
    };

    const canPlayHandler = () => {
      // Apply speed when video can start playing
      const targetSpeed = this.autoApplyPreviousSpeed && this.previousSpeed !== 1.0 
        ? this.previousSpeed 
        : this.currentSpeed;
      
      this.applySpeedToVideo(video, targetSpeed);
    };

    video.addEventListener('play', playHandler);
    video.addEventListener('loadedmetadata', loadedMetadataHandler);
    video.addEventListener('canplay', canPlayHandler);

    // Store handlers for cleanup
    this.speedObservers.set(video, {
      playHandler,
      loadedMetadataHandler,
      canPlayHandler
    });
  }

  // Remove speed listeners from a video
  removeSpeedListeners(video) {
    const observers = this.speedObservers.get(video);
    if (observers) {
      video.removeEventListener('play', observers.playHandler);
      video.removeEventListener('loadedmetadata', observers.loadedMetadataHandler);
      video.removeEventListener('canplay', observers.canPlayHandler);
      this.speedObservers.delete(video);
    }
  }

  // Clean up all listeners
  cleanup() {
    // Remove all listeners
    const videos = this.controller.filterEngine.findVideos();
    videos.forEach(video => {
      this.removeSpeedListeners(video);
    });
  }

  // Create speed control UI element
  createSpeedControlHTML() {
    return `
      <div class="vivideo-speed-control-section">
        <div class="vivideo-speed-header">
          <span class="vivideo-label">Video Speed</span>
          <span class="vivideo-speed-value">${this.currentSpeed.toFixed(2)}x</span>
        </div>
        
        <div class="vivideo-speed-slider-container">
          <input 
            type="range" 
            class="vivideo-speed-slider" 
            min="0.05" 
            max="25" 
            step="0.05" 
            value="${this.currentSpeed}"
          >
        </div>
        
        <div class="vivideo-speed-presets">
          <button class="vivideo-speed-preset" data-speed="0.25">0.25x</button>
          <button class="vivideo-speed-preset" data-speed="0.5">0.5x</button>
          <button class="vivideo-speed-preset" data-speed="1.0">1x</button>
          <button class="vivideo-speed-preset" data-speed="1.25">1.25x</button>
          <button class="vivideo-speed-preset" data-speed="1.5">1.5x</button>
          <button class="vivideo-speed-preset" data-speed="2.0">2x</button>
        </div>
        
        <div class="vivideo-speed-options">
          <label class="vivideo-checkbox-container">
            <input 
              type="checkbox" 
              class="vivideo-auto-speed-checkbox"
              ${this.autoApplyPreviousSpeed ? 'checked' : ''}
            >
            <span class="vivideo-checkbox-label">Auto-apply previous speed to new videos</span>
          </label>
        </div>
      </div>
    `;
  }

  // Bind events to speed control UI
  bindSpeedControlEvents(container) {
    const slider = container.querySelector('.vivideo-speed-slider');
    const valueDisplay = container.querySelector('.vivideo-speed-value');
    const presetButtons = container.querySelectorAll('.vivideo-speed-preset');
    const autoSpeedCheckbox = container.querySelector('.vivideo-auto-speed-checkbox');

    // Slider events
    if (slider) {
      slider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        this.setSpeed(speed);
        if (valueDisplay) {
          valueDisplay.textContent = `${speed.toFixed(2)}x`;
        }
      });
    }

    // Preset button events
    presetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        this.setSpeed(speed);
        if (slider) {
          slider.value = speed;
        }
        if (valueDisplay) {
          valueDisplay.textContent = `${speed.toFixed(2)}x`;
        }
      });
    });

    // Auto-speed checkbox event
    if (autoSpeedCheckbox) {
      autoSpeedCheckbox.addEventListener('change', (e) => {
        this.setAutoApplyPreviousSpeed(e.target.checked);
      });
    }
  }

  // Update UI elements with current values
  updateUI(container) {
    if (!container) return;

    const slider = container.querySelector('.vivideo-speed-slider');
    const valueDisplay = container.querySelector('.vivideo-speed-value');
    const autoSpeedCheckbox = container.querySelector('.vivideo-auto-speed-checkbox');

    if (slider) {
      slider.value = this.currentSpeed;
    }

    if (valueDisplay) {
      valueDisplay.textContent = `${this.currentSpeed.toFixed(2)}x`;
    }

    if (autoSpeedCheckbox) {
      autoSpeedCheckbox.checked = this.autoApplyPreviousSpeed;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeedController;
} else {
  window.SpeedController = SpeedController;
}