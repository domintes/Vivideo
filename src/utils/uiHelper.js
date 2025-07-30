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
          </ul>
          <h5>Keyboard shortcuts:</h5>
          <ul>
            <li><code>Alt + V</code> - Toggle panel</li>
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
    `;
  }

  static createShortcutsHTML() {
    return /*html*/ `
      <div class="vivideo-shortcuts">
        Press <code>Alt + V</code> to toggle • Drag header to move
      </div>
    `;
  }

  static createHeaderHTML() {
    return /*html*/ `
      <div class="vivideo-header vivideo-draggable">
        <h3 class="vivideo-title">Vivideo</h3>
        <button class="vivideo-info" title="Information">ⓘ</button>
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
  }

  static setupDragging(container, controller) {
    const header = container.querySelector('.vivideo-header');
    let mouseDownHandler = null;
    let mouseMoveHandler = null;
    let mouseUpHandler = null;
    
    mouseDownHandler = (e) => {
      // Only start dragging if clicking on the header area, not buttons
      if (e.target.classList.contains('vivideo-close') || e.target.classList.contains('vivideo-info')) {
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
      
      container.style.left = Math.max(0, Math.min(x, window.innerWidth - container.offsetWidth)) + 'px';
      container.style.top = Math.max(0, Math.min(y, window.innerHeight - container.offsetHeight)) + 'px';
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

  static clampValue(control, value) {
    switch (control) {
      case 'brightness':
      case 'contrast':
        return Math.max(-100, Math.min(100, value));
      case 'saturation':
        return Math.max(-90, Math.min(100, value));
      case 'gamma':
        return Math.max(0.1, Math.min(3, value));
      case 'colortemp':
        return Math.max(-100, Math.min(100, value));
      case 'sharpness':
        return Math.max(0, Math.min(100, value));
      default:
        return value;
    }
  }
}

// Export for use in other files
window.UIHelper = UIHelper;
