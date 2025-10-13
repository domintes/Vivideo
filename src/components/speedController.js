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
    this.startSpeedSyncInterval();
  }

  // Start periodic sync with video speeds
  startSpeedSyncInterval() {
    // Sync every 2 seconds to detect external speed changes
    this.syncInterval = setInterval(() => {
      this.syncWithVideoSpeeds();
    }, 2000);
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

  // Detect current speed from video element
  detectCurrentSpeed(video) {
    if (!video) return 1.0;
    
    try {
      return video.playbackRate || 1.0;
    } catch (error) {
      return 1.0;
    }
  }

  // Sync controller with actual video speeds
  syncWithVideoSpeeds() {
    const videos = this.controller.filterEngine.findVideos();
    if (videos.length === 0) return;

    // Get speed from first video as reference
    const currentVideoSpeed = this.detectCurrentSpeed(videos[0]);
    
    // Only update if there's a significant difference
    if (Math.abs(currentVideoSpeed - this.currentSpeed) > 0.01) {
      console.log(`Vivideo SpeedController: Syncing with detected speed ${currentVideoSpeed}x`);
      this.currentSpeed = currentVideoSpeed;
      
      // Update controller settings without triggering save
      this.controller.settings.speed = currentVideoSpeed;
      
      // Update UI
      this.controller.updateUI();
    }
  }

  // Apply speed to a specific video element
  applySpeedToVideo(video, speed) {
    if (!video || typeof speed !== 'number' || speed <= 0) return;

    // Clamp speed between 0.05 and 25
    const clampedSpeed = Math.max(0.05, Math.min(25, speed));
    
    try {
      // Force set playback rate to override website controls
      video.playbackRate = clampedSpeed;
      this.videoSpeedMap.set(video, clampedSpeed);
      
      // Set a small delay to ensure it sticks
      setTimeout(() => {
        if (video.playbackRate !== clampedSpeed) {
          video.playbackRate = clampedSpeed;
        }
      }, 50);
      
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
    
    // Force override any website speed controls with multiple attempts
    this.forceSpeedOverride(speed);
  }

  // Aggressively force speed override
  forceSpeedOverride(speed) {
    const clampedSpeed = Math.max(0.05, Math.min(25, speed));
    
    // Multiple attempts to ensure override
    const attempts = [0, 100, 300, 1000]; // Try immediately, then with delays
    
    attempts.forEach(delay => {
      setTimeout(() => {
        const videos = this.controller.filterEngine.findVideos();
        videos.forEach(video => {
          if (video && Math.abs(video.playbackRate - clampedSpeed) > 0.01) {
            try {
              video.playbackRate = clampedSpeed;
              
              // Also try to override any possible speed controls
              if (video.defaultPlaybackRate !== undefined) {
                video.defaultPlaybackRate = clampedSpeed;
              }
            } catch (error) {
              // Silent fail for repeated attempts
            }
          }
        });
      }, delay);
    });
  }

  // Set new speed and apply it
  setSpeed(newSpeed) {
    // Clamp speed between 0.05 and 25
    newSpeed = Math.max(0.05, Math.min(25, newSpeed));
    
    // Store previous speed before changing
    this.previousSpeed = this.currentSpeed;
    this.currentSpeed = newSpeed;
    
    // Apply to all current videos with force override
    this.applySpeedToAllVideos(newSpeed);
    
    // Update controller settings
    this.controller.settings.speed = newSpeed;
    this.controller.settings.previousSpeed = this.previousSpeed;
    
    // Save settings
    this.saveSpeedSettings();
    
    // Trigger UI update
    this.controller.updateUI();
    
    console.log(`Vivideo SpeedController: Speed set to ${newSpeed}x`);
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

    const rateChangeHandler = () => {
      // Detect when video speed changes externally
      const videoSpeed = this.detectCurrentSpeed(video);
      if (Math.abs(videoSpeed - this.currentSpeed) > 0.01) {
        console.log(`Vivideo SpeedController: External speed change detected: ${videoSpeed}x`);
        // Update our controller to match
        this.currentSpeed = videoSpeed;
        this.controller.settings.speed = videoSpeed;
        // Update UI without saving (user might be adjusting)
        this.controller.updateUI();
      }
    };

    video.addEventListener('play', playHandler);
    video.addEventListener('loadedmetadata', loadedMetadataHandler);
    video.addEventListener('canplay', canPlayHandler);
    video.addEventListener('ratechange', rateChangeHandler);

    // Store handlers for cleanup
    this.speedObservers.set(video, {
      playHandler,
      loadedMetadataHandler,
      canPlayHandler,
      rateChangeHandler
    });
  }

  // Remove speed listeners from a video
  removeSpeedListeners(video) {
    const observers = this.speedObservers.get(video);
    if (observers) {
      video.removeEventListener('play', observers.playHandler);
      video.removeEventListener('loadedmetadata', observers.loadedMetadataHandler);
      video.removeEventListener('canplay', observers.canPlayHandler);
      video.removeEventListener('ratechange', observers.rateChangeHandler);
      this.speedObservers.delete(video);
    }
  }

  // Clean up all listeners
  cleanup() {
    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

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
        
        <div class="vivideo-speed-buttons-block">
          <button class="vivideo-speed-button speed-decrease" data-change="-0.5">-0.50x</button>
          <button class="vivideo-speed-button speed-decrease" data-change="-0.25">-0.25x</button>
          <button class="vivideo-speed-button speed-reset" data-reset="1.0">Reset</button>
          <button class="vivideo-speed-button speed-increase" data-change="+0.25">+0.25x</button>
          <button class="vivideo-speed-button speed-increase" data-change="+0.5">+0.50x</button>
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
    const speedButtons = container.querySelectorAll('.vivideo-speed-button');
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

    // Speed control button events
    speedButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        let newSpeed;
        
        if (e.target.dataset.reset) {
          // Reset button
          newSpeed = 1.0;
        } else if (e.target.dataset.change) {
          // Increment/Decrement buttons
          const change = parseFloat(e.target.dataset.change);
          newSpeed = Math.max(0.05, Math.min(25, this.currentSpeed + change));
        }
        
        if (newSpeed) {
          this.setSpeed(newSpeed);
          if (slider) {
            slider.value = newSpeed;
          }
          if (valueDisplay) {
            valueDisplay.textContent = `${newSpeed.toFixed(2)}x`;
          }
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