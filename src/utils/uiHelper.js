// UI Helper Functions
// Common UI utilities and helper functions

class UIHelper {
  static createInfoHTML() {
    return /*html*/ `
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
            <li><strong>Playback Speed:</strong> 0.25x to 4.0x - Video playback speed</li>
          </ul>
          <h5>Keyboard shortcuts:</h5>
          <ul>
            <li><code>Alt + V</code> - Toggle panel</li>
            <li><code>Alt + M</code> - Reset to DEFAULT profile</li>
            <li><code>Alt + [</code> - Increase speed</li>
            <li><code>Alt + ]</code> - Decrease speed</li>
            <li><code>Alt + \\</code> - Reset speed to 1.00x</li>
            <li><code>Alt + -</code> - Previous theme</li>
            <li><code>Alt + =</code> - Next theme</li>
            <li>Drag header - Move panel</li>
            <li>Click outside panel - Hide panel</li>
          </ul>
        </div>
      </div>
    `;
  }

  static createCheckboxesHTML(settings) {
    return /*html*/ `
      <div class="vivideo-auto-activate checkbox-section">
        <label class="vivideo-checkbox-container">
          <input type="checkbox" id="auto-activate-checkbox" ${settings.autoActivate ? 'checked' : ''}>
          <span class="vivideo-checkmark"></span>
          <span class="vivideo-checkbox-label">Auto-activate extension</span>
        </label>
      </div>

      <div class="vivideo-work-on-images-activate checkbox-section">
        <label class="vivideo-checkbox-container">
          <input type="checkbox" id="work-on-images-checkbox" ${settings.workOnImagesActivate ? 'checked' : ''}>
          <span class="vivideo-checkmark"></span>
          <span class="vivideo-checkbox-label">Work on images</span>
        </label>
      </div>

      <div class="vivideo-extended-limits checkbox-section">
        <label class="vivideo-checkbox-container">
          <input type="checkbox" id="extended-limits-checkbox" ${settings.extendedLimits ? 'checked' : ''}>
          <span class="vivideo-checkmark"></span>
          <span class="vivideo-checkbox-label">Extended limits (max technical range)</span>
        </label>
      </div>
    `;
  }

  static createShortcutsHTML() {
    return /*html*/ `
      <div class="vivideo-shortcuts">
        Press <code>Alt + V</code> to toggle • <code>Alt + N/B</code> to switch profiles • Drag header to move
      </div>
    `;
  }

  static createHeaderHTML() {
    return /*html*/ `
      <div class="vivideo-header vivideo-draggable">
        <h3 class="vivideo-title">Vivideo</h3>
        <button class="vivideo-info" title="Information">𝒾</button>
        <button class="vivideo-close" title="Close (Alt+V)">✕</button>
      </div>
    `;
  }

  static bindHeaderEvents(container, controller) {
    // Close button
    container.querySelector('.vivideo-close').addEventListener('click', () => {
      controller.hide();
    });

    // Info button
    container.querySelector('.vivideo-info').addEventListener('click', (e) => {
      e.stopPropagation();
      controller.toggleInfo();
    });
  }

  static bindCheckboxEvents(container, controller) {
    // Auto-activate checkbox
    container.querySelector('#auto-activate-checkbox').addEventListener('change', (e) => {
      controller.settings.autoActivate = e.target.checked;
      controller.saveSettings();
      controller.saveAppState();

      // Apply or remove filters based on checkbox state
      if (controller.settings.autoActivate) {
        controller.applyFilters();
      } else {
        // Only remove filters if panel is not visible
        if (!controller.isVisible) {
          controller.removeFilters();
        }
      }
    });

    // Work on images checkbox
    container.querySelector('#work-on-images-checkbox').addEventListener('change', (e) => {
      controller.settings.workOnImagesActivate = e.target.checked;
      controller.saveSettings();

      // Apply or remove filters based on checkbox state
      if (controller.settings.workOnImagesActivate) {
        controller.filterEngine.applyFiltersToImages(controller.settings);
      } else {
        controller.filterEngine.removeFiltersFromImages();
      }
    });

    // Extended limits checkbox
    container.querySelector('#extended-limits-checkbox').addEventListener('change', (e) => {
      controller.settings.extendedLimits = e.target.checked;
      controller.saveSettings();
      controller.saveAppState();

      // Toggle CSS class for visual indication
      if (controller.settings.extendedLimits) {
        controller.container.classList.add('extended-limits');
      } else {
        controller.container.classList.remove('extended-limits');
      }

      // Update slider limits and current values
      controller.updateSliderLimits();
      controller.updateUI();
    });
  }

  static updateCheckboxes(container, settings) {
    const autoActivateCheckbox = container.querySelector('#auto-activate-checkbox');
    if (autoActivateCheckbox) {
      autoActivateCheckbox.checked = settings.autoActivate;
    }

    const workOnImagesCheckbox = container.querySelector('#work-on-images-checkbox');
    if (workOnImagesCheckbox) {
      workOnImagesCheckbox.checked = settings.workOnImagesActivate;
    }

    const extendedLimitsCheckbox = container.querySelector('#extended-limits-checkbox');
    if (extendedLimitsCheckbox) {
      extendedLimitsCheckbox.checked = settings.extendedLimits;
    }
  }

  static setupDragging(container, controller) {
    const header = container.querySelector('.vivideo-header');
    let mouseDownHandler = null;
    let mouseMoveHandler = null;
    let mouseUpHandler = null;

    mouseDownHandler = (e) => {
      // Only start dragging if clicking on the header area, not buttons
      if (
        e.target.classList.contains('vivideo-close') ||
        e.target.classList.contains('vivideo-info')
      ) {
        return;
      }

      controller.isDragging = true;
      container.classList.add('vivideo-dragging');
      const rect = container.getBoundingClientRect();
      controller.dragOffset.x = e.clientX - rect.left;
      controller.dragOffset.y = e.clientY - rect.top;
      e.preventDefault();
    };

    mouseMoveHandler = (e) => {
      if (!controller.isDragging) return;

      const x = e.clientX - controller.dragOffset.x;
      const y = e.clientY - controller.dragOffset.y;

      container.style.left =
        Math.max(0, Math.min(x, window.innerWidth - container.offsetWidth)) + 'px';
      container.style.top =
        Math.max(0, Math.min(y, window.innerHeight - container.offsetHeight)) + 'px';
      container.style.right = 'auto';
      e.preventDefault();
    };

    mouseUpHandler = () => {
      if (controller.isDragging) {
        controller.isDragging = false;
        container.classList.remove('vivideo-dragging');

        // Small delay to prevent immediate hiding when drag ends
        setTimeout(() => {
          controller.isDragging = false;
        }, 10);
      }
    };

    header.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    // Store handlers for cleanup
    return {
      mouseDown: mouseDownHandler,
      mouseMove: mouseMoveHandler,
      mouseUp: mouseUpHandler,
      header: header
    };
  }

  static clampValue(control, value, extendedLimits = false) {
    const limits = this.getControlLimits(control, extendedLimits);
    return Math.max(limits.min, Math.min(limits.max, value));
  }

  // Get limits for a control
  static getControlLimits(control, extendedLimits = false) {
    switch (control) {
      case 'brightness':
        // CSS brightness: 1 + (value/100)
        // Casual: 0.5 to 1.8 (-50% to +80%) - usuable range
        // Extended: 0.1 to 4.0 (-90% to +300%) - technical maximum
        return extendedLimits ? { min: -90, max: 300, step: 1 } : { min: -50, max: 80, step: 1 };

      case 'contrast':
        // CSS contrast: 1 + (value/100)
        // Casual: 0.3 to 2.0 (-70% to +100%) - visible improvements
        // Extended: 0 to 5.0 (-100% to +400%) - extreme effects
        return extendedLimits ? { min: -100, max: 400, step: 1 } : { min: -70, max: 100, step: 1 };

      case 'saturation':
        // CSS saturate: max(0, 1 + (value/100))
        // Casual: 0.2 to 1.6 (-80% to +60%) - natural look
        // Extended: 0 to 3.0 (-100% to +200%) - artistic effects
        return extendedLimits ? { min: -100, max: 200, step: 1 } : { min: -80, max: 60, step: 1 };

      case 'gamma':
        // SVG feComponentTransfer gamma correction
        // Casual: 0.4 to 2.2 - practical gamma range
        // Extended: 0.1 to 4.0 - full technical range
        return extendedLimits
          ? { min: 0.1, max: 4.0, step: 0.01 }
          : { min: 0.4, max: 2.2, step: 0.01 };

      case 'colortemp':
        // Custom algorithm for color temperature
        // Casual: -60 to +60 - noticeable but natural
        // Extended: -100 to +100 - extreme color shifts
        return extendedLimits ? { min: -100, max: 100, step: 1 } : { min: -60, max: 60, step: 1 };

      case 'sharpness':
        // SVG feConvolveMatrix sharpening
        // Casual: 0% to 60% - visible improvement without artifacts
        // Extended: 0% to 120% - aggressive sharpening
        return extendedLimits ? { min: 0, max: 120, step: 1 } : { min: 0, max: 60, step: 1 };

      case 'speed':
        // Video playback speed
        // Casual: 0.5 to 2.0 - practical speed range
        // Extended: 0.25 to 4.0 - full technical range
        return extendedLimits
          ? { min: 0.25, max: 4.0, step: 0.01 }
          : { min: 0.5, max: 2.0, step: 0.01 };

      default:
        return { min: 0, max: 100, step: 1 };
    }
  }
}

// Export for use in other files
window.UIHelper = UIHelper;
