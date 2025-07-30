// Video Filter Engine
// Handles video/image detection, filter application, and advanced effects

class VideoFilterEngine {
  constructor(controller) {
    this.controller = controller;
  }

  findVideos() {
    const videos = [];
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

  findImages() {
    const images = [];
    images.push(...document.querySelectorAll('img'));
    
    // Find images in shadow DOM
    const elementsWithShadow = document.querySelectorAll('*');
    elementsWithShadow.forEach(element => {
      if (element.shadowRoot) {
        images.push(...element.shadowRoot.querySelectorAll('img'));
      }
    });
    
    return images;
  }

  applyFilters(settings) {
    this.findVideos().forEach(video => {
      this.applyFilterToElement(video, settings);
    });
    
    if (settings.workOnImagesActivate) {
      this.applyFiltersToImages(settings);
    }
  }

  applyFiltersToImages(settings) {
    if (!settings.workOnImagesActivate) return;
    
    this.findImages().forEach(image => {
      this.applyFilterToElement(image, settings);
    });
  }

  removeFiltersFromImages() {
    this.findImages().forEach(image => {
      image.style.filter = '';
    });
  }

  applyFilterToElement(element, settings) {
    const brightness = 1 + (settings.brightness / 100);
    const contrast = 1 + (settings.contrast / 100);
    const saturation = Math.max(0, 1 + (settings.saturation / 100));
    
    let cssFilters = `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
    `;

    // Apply advanced filters if needed
    this.applyAdvancedFilters(settings);
    const advancedFilterExists = settings.gamma !== 1 || settings.colorTemp !== 0 || settings.sharpness > 0;
    if (advancedFilterExists) {
      cssFilters += ` url(#vivideo-advanced-filter)`;
    }
    
    element.style.filter = cssFilters.trim();
  }

  applyAdvancedFilters(settings) {
    const gamma = settings.gamma;
    const colorTemp = settings.colorTemp;
    const sharpness = settings.sharpness;

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
    let rSlope = 1, gSlope = 1, bSlope = 1;
    let rExponent = gamma, gExponent = gamma, bExponent = gamma;

    if (tempFactor > 0) {
      rSlope = 1 + (tempFactor * 0.3);
      gSlope = 1 + (tempFactor * 0.15);
      bSlope = Math.max(0.4, 1 - (tempFactor * 0.4));
    } else if (tempFactor < 0) {
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

  removeFilters() {
    this.findVideos().forEach(video => {
      video.style.filter = '';
    });
    this.removeFiltersFromImages();
    
    // Remove SVG filters
    const existingSvg = document.querySelector('#vivideo-svg-container');
    if (existingSvg) {
      existingSvg.remove();
    }
  }

  observeVideos(callback) {
    const observer = new MutationObserver((mutations) => {
      let hasNewVideos = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'VIDEO' || node.querySelector('video')) {
              hasNewVideos = true;
            }
          }
        });
      });
      
      if (hasNewVideos && callback) {
        callback();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }
}

// Export for use in other files
window.VideoFilterEngine = VideoFilterEngine;
