// Video Filter Engine
// Handles video/image detection, filter application, and advanced effects

class VideoFilterEngine {
  constructor(controller) {
    this.controller = controller;
  }

  getQualityProfileSettings(mode) {
    const soft = { tone: 0.72, chroma: 0.68, gamma: 0.75 };
    const balanced = { tone: 0.82, chroma: 0.78, gamma: 0.84 };
    const detail = { tone: 0.94, chroma: 0.9, gamma: 0.92 };

    // Numeric mode (0-100) -> interpolate between profiles
    if (typeof mode === 'number') {
      const v = Math.max(0, Math.min(100, mode));
      const t = v / 100;
      if (t <= 0.5) {
        const alpha = t / 0.5;
        return {
          tone: soft.tone * (1 - alpha) + balanced.tone * alpha,
          chroma: soft.chroma * (1 - alpha) + balanced.chroma * alpha,
          gamma: soft.gamma * (1 - alpha) + balanced.gamma * alpha
        };
      }
      const alpha = (t - 0.5) / 0.5;
      return {
        tone: balanced.tone * (1 - alpha) + detail.tone * alpha,
        chroma: balanced.chroma * (1 - alpha) + detail.chroma * alpha,
        gamma: balanced.gamma * (1 - alpha) + detail.gamma * alpha
      };
    }

    switch (mode) {
      case 'soft':
        return soft;
      case 'detail':
        return detail;
      case 'balanced':
      default:
        return balanced;
    }
  }

  getAdjustedSettings(settings, element) {
    const adjusted = {
      brightness: settings.brightness,
      contrast: settings.contrast,
      saturation: settings.saturation,
      gamma: settings.gamma,
      colorTemp: settings.colorTemp,
      sharpness: settings.sharpness
    };

    if (settings.keepQuality) {
      const qualityMode = settings.videoQualityMode || 'balanced';
      const qualityProfile = this.getQualityProfileSettings(qualityMode);
      adjusted.brightness *= qualityProfile.tone;
      adjusted.contrast *= qualityProfile.tone;
      adjusted.saturation *= qualityProfile.chroma;
      adjusted.colorTemp *= qualityProfile.chroma;
      adjusted.gamma = 1 + (adjusted.gamma - 1) * qualityProfile.gamma;
      if (adjusted.contrast > 0) {
        adjusted.brightness -= Math.min(14, adjusted.contrast * 0.08);
      }
      if (adjusted.saturation > 0) {
        adjusted.brightness -= Math.min(8, adjusted.saturation * 0.05);
      }
    }

    if (settings.upscaleQualityBoost && element && element.tagName === 'VIDEO') {
      const sourceWidth = element.videoWidth || element.clientWidth;
      const renderWidth = element.clientWidth || sourceWidth;
      if (sourceWidth > 0 && renderWidth > sourceWidth) {
        const upscaleRatio = renderWidth / sourceWidth;
        adjusted.sharpness += Math.min(24, Math.round((upscaleRatio - 1) * 28));
      }
    }

    adjusted.gamma = Math.max(0.1, Math.min(4.0, adjusted.gamma));
    adjusted.sharpness = Math.max(0, Math.min(120, adjusted.sharpness));
    return adjusted;
  }

  applyRenderQualityOptions(element, settings) {
    if (!element || !element.style) return;
    element.style.imageRendering = settings.forceHighQualityScaling ? 'auto' : '';
    element.style.backfaceVisibility = settings.forceHighQualityScaling ? 'hidden' : '';
    element.style.transform = settings.forceHighQualityScaling ? 'translateZ(0)' : '';
    element.style.willChange = settings.forceHighQualityScaling ? 'filter, transform' : '';
  }

  clearRenderQualityOptions(element) {
    if (!element || !element.style) return;
    element.style.imageRendering = '';
    element.style.backfaceVisibility = '';
    element.style.transform = '';
    element.style.willChange = '';
  }

  findVideos() {
    const videos = [];
    videos.push(...document.querySelectorAll('video'));

    // Find videos in shadow DOM
    const elementsWithShadow = document.querySelectorAll('*');
    elementsWithShadow.forEach((element) => {
      if (element.shadowRoot) {
        videos.push(...element.shadowRoot.querySelectorAll('video'));
      }
    });

    return videos;
  }

  findImages() {
    const images = [];
    images.push(...document.querySelectorAll('img'));

    // Find images in shadow DOM
    const elementsWithShadow = document.querySelectorAll('*');
    elementsWithShadow.forEach((element) => {
      if (element.shadowRoot) {
        images.push(...element.shadowRoot.querySelectorAll('img'));
      }
    });

    return images;
  }

  applyFilters(settings) {
    this.findVideos().forEach((video) => {
      this.applyFilterToElement(video, settings);
    });

    if (settings.workOnImagesActivate) {
      this.applyFiltersToImages(settings);
    }
  }

  applyFiltersToImages(settings) {
    if (!settings.workOnImagesActivate) return;

    this.findImages().forEach((image) => {
      this.applyFilterToElement(image, settings);
    });
  }

  removeFiltersFromImages() {
    this.findImages().forEach((image) => {
      image.style.filter = '';
      this.clearRenderQualityOptions(image);
    });
  }

  applyFilterToElement(element, settings) {
    const adjusted = this.getAdjustedSettings(settings, element);
    let brightness = 1 + adjusted.brightness / 100;
    let contrast = 1 + adjusted.contrast / 100;
    let saturation = Math.max(0, 1 + adjusted.saturation / 100);

    // Apply forceVivideo amplification (Alternative Engine)
    if (settings.forceVivideo) {
      const amplification = 1.4; // 40% stronger effect
      brightness = 1 + (brightness - 1) * amplification;
      contrast = 1 + (contrast - 1) * amplification;
      saturation = Math.max(0.5, saturation * amplification);
    }

    // Apply qualityEnhancer boost
    if (settings.qualityEnhancer) {
      brightness = Math.min(2.5, brightness * 1.15);
      contrast = Math.min(3.0, contrast * 1.25);
      saturation = Math.min(2.5, saturation * 1.2);
    }

    let cssFilters = `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
    `;

    // Apply advanced filters if needed
    this.applyAdvancedFilters(settings, adjusted);
    const advancedFilterExists =
      adjusted.gamma !== 1 || adjusted.colorTemp !== 0 || adjusted.sharpness > 0;
    if (advancedFilterExists) {
      cssFilters += ` url(#vivideo-advanced-filter)`;
    }

    element.style.filter = cssFilters.trim();
    this.applyRenderQualityOptions(element, settings);
  }

  applyAdvancedFilters(settings, adjustedSettings) {
    const gamma = adjustedSettings.gamma;
    const colorTemp = adjustedSettings.colorTemp;
    const sharpness = adjustedSettings.sharpness;

    // Remove existing SVG
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
    let rSlope = 1,
      gSlope = 1,
      bSlope = 1;
    let rExponent = gamma,
      gExponent = gamma,
      bExponent = gamma;

    if (tempFactor > 0) {
      rSlope = 1 + tempFactor * 0.3;
      gSlope = 1 + tempFactor * 0.15;
      bSlope = Math.max(0.4, 1 - tempFactor * 0.4);
    } else if (tempFactor < 0) {
      const coolness = Math.abs(tempFactor);
      rSlope = Math.max(0.5, 1 - coolness * 0.3);
      gSlope = Math.max(0.7, 1 - coolness * 0.1);
      bSlope = 1 + coolness * 0.4;
    }

    // Calculate sharpness matrix
    const sharpAmount = (sharpness / 100) * 0.8;
    const sharpCenter = 1 + 4 * sharpAmount;
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

    const colorInterpolation = settings.linearColorPipeline ? 'linearRGB' : 'sRGB';
    svg.innerHTML = `
      <filter id="vivideo-advanced-filter" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="${colorInterpolation}">
        ${filterContent}
      </filter>
    `;

    UIHelper.safeAppend(svg);
  }

  removeFilters() {
    this.findVideos().forEach((video) => {
      video.style.filter = '';
      this.clearRenderQualityOptions(video);
    });
    this.removeFiltersFromImages();

    // Remove SVG filters
    const existingSvg = document.querySelector('#vivideo-svg-container');
    if (existingSvg) {
      existingSvg.remove();
    }

    // Remove split filters
    this.removeSplitFilters();
  }

  observeVideos(callback) {
    const observer = new MutationObserver((mutations) => {
      let hasNewVideos = false;
      let hasNewImages = false;

      mutations.forEach((mutation) => {
        // Check added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for videos
            if (node.tagName === 'VIDEO' || node.querySelector('video')) {
              hasNewVideos = true;
              console.log('Vivideo: New video element detected:', node);
            }
            // Check for images
            if (node.tagName === 'IMG' || node.querySelector('img')) {
              hasNewImages = true;
              console.log('Vivideo: New image element detected:', node);
            }
            // Check for shadow DOM elements that might contain video/images
            if (node.shadowRoot) {
              const shadowVideos = node.shadowRoot.querySelectorAll('video');
              const shadowImages = node.shadowRoot.querySelectorAll('img');
              if (shadowVideos.length > 0) {
                hasNewVideos = true;
                console.log('Vivideo: Video in shadow DOM detected');
              }
              if (shadowImages.length > 0) {
                hasNewImages = true;
                console.log('Vivideo: Images in shadow DOM detected');
              }
            }
          }
        });

        // Check modified nodes for attribute changes that might affect media elements
        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          const target = mutation.target;
          if (target.tagName === 'VIDEO' || target.tagName === 'IMG') {
            // Video/Image attributes changed, might need reprocessing
            if (mutation.attributeName === 'src' || mutation.attributeName === 'srcset') {
              hasNewVideos = hasNewVideos || target.tagName === 'VIDEO';
              hasNewImages = hasNewImages || target.tagName === 'IMG';
              console.log('Vivideo: Media src changed:', target);
            }
          }
        }
      });

      if ((hasNewVideos || hasNewImages) && callback) {
        // Small delay to ensure elements are fully loaded
        setTimeout(() => {
          callback();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'poster']
    });

    // If document.body is not yet available (rare), retry safely
    if (!document.body) {
      const retryObserver = new MutationObserver(() => {
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'srcset', 'poster']
          });
          retryObserver.disconnect();
        }
      });
      retryObserver.observe(document.documentElement || document, {
        childList: true,
        subtree: true
      });
    }

    return observer;
  }

  // Attach 'play' listeners to videos so filters reapply when a new video starts playing
  attachPlayListeners() {
    this.findVideos().forEach((video) => {
      if (video.__vivideo_play_listener_attached) return;
      const handler = () => {
        try {
          // Reapply current settings when video starts
          if (window.vivideoController) {
            window.vivideoController.applyFilters();
          }
        } catch (e) {
          console.warn('Vivideo: play handler error', e);
        }
      };
      video.addEventListener('play', handler);
      video.__vivideo_play_listener_attached = true;
    });
  }

  applySplitFilters(leftSettings, rightSettings) {
    this.findVideos().forEach((video) => {
      this.applySplitFilterToElement(video, leftSettings, rightSettings);
    });

    if (leftSettings.workOnImagesActivate || rightSettings.workOnImagesActivate) {
      this.applySplitFiltersToImages(leftSettings, rightSettings);
    }
  }

  applySplitFilterToElement(element, leftSettings, rightSettings) {
    // Remove existing split filter elements
    const existingLeftOverlay = element.parentNode.querySelector('.vivideo-left-overlay');
    const existingRightOverlay = element.parentNode.querySelector('.vivideo-right-overlay');
    if (existingLeftOverlay) existingLeftOverlay.remove();
    if (existingRightOverlay) existingRightOverlay.remove();

    // Reset element's direct filters
    element.style.filter = '';
    this.applyRenderQualityOptions(element, leftSettings);

    // Create container if needed
    let container = element.parentNode.querySelector('.vivideo-split-container');
    if (!container || container.querySelector('video') !== element) {
      // Remove any existing container
      const existingContainer = element.parentNode.querySelector('.vivideo-split-container');
      if (existingContainer) existingContainer.remove();

      // Create new container
      container = document.createElement('div');
      container.className = 'vivideo-split-container';
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.overflow = 'hidden';

      // Wrap the video element
      element.parentNode.insertBefore(container, element);
      UIHelper.safeAppendTo(container, element);
    }

    // Create left overlay (current profile)
    const leftOverlay = document.createElement('div');
    leftOverlay.className = 'vivideo-left-overlay';
    this.setupSplitOverlay(leftOverlay, 'left', leftSettings);
    UIHelper.safeAppendTo(container, leftOverlay);

    // Create right overlay (compare profile)
    const rightOverlay = document.createElement('div');
    rightOverlay.className = 'vivideo-right-overlay';
    this.setupSplitOverlay(rightOverlay, 'right', rightSettings);
    UIHelper.safeAppendTo(container, rightOverlay);

    console.log('Vivideo: Split filters applied to video element');
  }

  setupSplitOverlay(overlay, side, settings) {
    const adjusted = this.getAdjustedSettings(settings, null);
    const brightness = 1 + adjusted.brightness / 100;
    const contrast = 1 + adjusted.contrast / 100;
    const saturation = Math.max(0, 1 + adjusted.saturation / 100);

    let cssFilters = `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
    `;

    // Apply advanced filters if needed
    const advancedFilterExists =
      adjusted.gamma !== 1 || adjusted.colorTemp !== 0 || adjusted.sharpness > 0;
    if (advancedFilterExists) {
      // For split mode, we'll use a simplified approach without SVG filters
      // as SVG filters are complex to implement for split-screen
      const gamma = Math.max(0.1, Math.min(3.0, adjusted.gamma));
      const tempFactor = adjusted.colorTemp / 100;

      // Approximate gamma with CSS filters
      if (gamma !== 1) {
        const gammaAdjust = gamma < 1 ? (1 - gamma) * 0.3 : (gamma - 1) * 0.2;
        const gammaContrast = gamma < 1 ? 1 - gammaAdjust : 1 + gammaAdjust;
        cssFilters += ` contrast(${gammaContrast})`;
      }

      // Approximate color temperature with hue-rotate and sepia
      if (tempFactor !== 0) {
        const hueRotate = tempFactor * 15; // Simplified hue adjustment
        const sepia = Math.abs(tempFactor) * 0.2;
        cssFilters += ` hue-rotate(${hueRotate}deg) sepia(${sepia})`;
      }
    }

    // Style the overlay
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = side === 'left' ? '0' : '50%';
    overlay.style.width = '50%';
    overlay.style.height = '100%';
    overlay.style.background = 'inherit';
    overlay.style.filter = cssFilters.trim();
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '1';
    overlay.style.clipPath = side === 'left' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)';

    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.top = '10px';
    indicator.style[side] = '10px';
    indicator.style.background = 'rgba(0, 0, 0, 0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '4px 8px';
    indicator.style.fontSize = '12px';
    indicator.style.borderRadius = '4px';
    indicator.style.fontFamily = 'monospace';
    indicator.style.zIndex = '2';

    const profileName = settings.name || (side === 'left' ? 'Current' : 'Compare');
    indicator.textContent = `${side.toUpperCase()}: ${profileName}`;
    UIHelper.safeAppendTo(overlay, indicator);
  }

  applySplitFiltersToImages(leftSettings, rightSettings) {
    if (!leftSettings.workOnImagesActivate && !rightSettings.workOnImagesActivate) return;

    this.findImages().forEach((image) => {
      // For images, we'll apply a simpler split effect
      this.applySplitFilterToElement(image, leftSettings, rightSettings);
    });
  }

  removeSplitFilters() {
    // Remove all split containers and restore normal state
    const splitContainers = document.querySelectorAll('.vivideo-split-container');
    splitContainers.forEach((container) => {
      const video = container.querySelector('video, img');
      if (video && container.parentNode) {
        // Move video back to original parent
        container.parentNode.insertBefore(video, container);
        container.remove();
      }
    });

    console.log('Vivideo: Split filters removed');
  }
}

// Export for use in other files
window.VideoFilterEngine = VideoFilterEngine;
