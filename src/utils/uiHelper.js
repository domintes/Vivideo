// UI Helper Functions - cleaned and minimal version
// Common UI utilities and helper functions used across the extension.

const UIHelper = {
  createInfoHTML() {
    return `
      <div class="vivideo-info-panel" id="info-panel" style="display: none;">
        <div class="vivideo-info-content">
          <h4>🎥 Vivideo</h4>
          <h5>Real-time Video Enhancement</h5>

          <div class="vivideo-info-stats">
            <div id="vivideo-video-count">0 videos found</div>
            <div id="vivideo-enhancement-status">Enhancement: None</div>
          </div>

          <h5>Quick features</h5>
          <ul>
            <li>Alt + \\ - Toggle panel</li>
            <li>Alt + [ / Alt + ] - Previous / Next theme</li>
            <li>Real-time operation</li>
            <li>All video platforms supported</li>
            <li>Fullscreen mode</li>
          </ul>

          <h5>Controls</h5>
          <ul>
            <li>Brightness: -100% to +100%</li>
            <li>Contrast: -100% to +100%</li>
            <li>Saturation: -90% to +100%</li>
            <li>Gamma: 0.1 to 3.0</li>
            <li>Temperature: Cold ↔ Warm</li>
          </ul>
        </div>
      </div>
    `;
  },

  createCheckboxesHTML(settings = {}) {
    return `
      <div class="vivideo-auto-activate switch-section">
        <label class="vivideo-switch-container">
          <input type="checkbox" id="auto-activate-checkbox" class="vivideo-switch-input" ${
            settings.autoActivate ? 'checked' : ''
          }>
          <span class="vivideo-switch-track"></span>
          <span class="vivideo-switch-knob"></span>
          <span class="vivideo-switch-label">Auto-activate</span>
        </label>
      </div>
      <div class="vivideo-auto-activate switch-section vivideo-quality-section">
        <div class="profile-panel-header">✨ Improve quality</div>
        <div class="vivideo-quality-subtitle">Video Quality</div>
        <label class="vivideo-switch-container">
          <input type="checkbox" id="keep-quality-checkbox" class="vivideo-switch-input" ${
            settings.keepQuality ? 'checked' : ''
          }>
          <span class="vivideo-switch-track"></span>
          <span class="vivideo-switch-knob"></span>
          <span class="vivideo-switch-label">Keep Quality</span>
        </label>
        <label class="vivideo-switch-container">
          <input type="checkbox" id="force-high-quality-scaling-checkbox" class="vivideo-switch-input" ${
            settings.forceHighQualityScaling ? 'checked' : ''
          }>
          <span class="vivideo-switch-track"></span>
          <span class="vivideo-switch-knob"></span>
          <span class="vivideo-switch-label">High quality scaling</span>
        </label>
        <label class="vivideo-switch-container">
          <input type="checkbox" id="linear-color-pipeline-checkbox" class="vivideo-switch-input" ${
            settings.linearColorPipeline ? 'checked' : ''
          }>
          <span class="vivideo-switch-track"></span>
          <span class="vivideo-switch-knob"></span>
          <span class="vivideo-switch-label">Linear color pipeline</span>
        </label>
        <label class="vivideo-switch-container">
          <input type="checkbox" id="upscale-quality-boost-checkbox" class="vivideo-switch-input" ${
            settings.upscaleQualityBoost ? 'checked' : ''
          }>
          <span class="vivideo-switch-track"></span>
          <span class="vivideo-switch-knob"></span>
          <span class="vivideo-switch-label">Upscale boost</span>
        </label>
        <!-- Targeted quality slider moved to the Controls section (VideoControls) -->
      </div>
    `;
  },

  createShortcutsHTML() {
    return `
      <div class="vivideo-shortcuts">Press Alt+V to toggle</div>
    `;
  },

  // Safe query helpers
  safeQuery(container, selector) {
    try {
      if (!container) return null;
      if (typeof container.querySelector === 'function') return container.querySelector(selector);
      return document.querySelector(selector);
    } catch {
      return null;
    }
  },

  safeQueryAll(container, selector) {
    try {
      if (!container) return [];
      if (typeof container.querySelectorAll === 'function')
        return container.querySelectorAll(selector);
      return document.querySelectorAll(selector);
    } catch {
      return [];
    }
  },

  createHeaderHTML() {
    return `
      <div class="vivideo-header vivideo-draggable">
        <h3 class="vivideo-title">Vivideo</h3>
        <div class="vivideo-header-buttons">
          <button class="vivideo-restore" title="Restore Defaults">↻ Restore Defaults</button>
          <button class="vivideo-save" title="Save State">💾 Save State</button>
          <button class="vivideo-layout-toggle" title="Toggle layout">❏</button>
          <button class="vivideo-info" title="Information">𝒾</button>
          <button class="vivideo-close" title="Close (Alt+V)">✕</button>
        </div>
      </div>
    `;
  },

  bindHeaderEvents(container, controller) {
    const closeBtn = this.safeQuery(container, '.vivideo-close');
    if (closeBtn) closeBtn.addEventListener('click', () => controller.hide());

    const infoBtn = this.safeQuery(container, '.vivideo-info');
    if (infoBtn)
      infoBtn.addEventListener('click', (_e) => {
        _e.stopPropagation();
        controller.toggleInfo();
      });

    const saveBtn = this.safeQuery(container, '.vivideo-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', (_e) => {
        _e.stopPropagation();
        // Prefer a full-state save method if available
        if (controller && typeof controller.saveFullState === 'function') {
          controller.saveFullState();
        } else if (controller && typeof controller.saveAppState === 'function') {
          controller.saveAppState();
        }
      });
    }

    const layoutBtn = this.safeQuery(container, '.vivideo-layout-toggle');
    if (layoutBtn) {
      // set initial icon based on controller-provided layout if available
      try {
        const currentLayout =
          controller && typeof controller.getActiveLayout === 'function'
            ? controller.getActiveLayout()
            : container.classList.contains('vivideo-stacked')
              ? 'Vertical Layout'
              : 'Horizontal Layout';
        layoutBtn.textContent = currentLayout === 'Vertical Layout' ? '⿻' : '❏';
      } catch (err) {
        console.warn('layout init failed', err);
      }

      layoutBtn.addEventListener('click', (_e) => {
        _e.stopPropagation();
        try {
          if (controller && typeof controller.toggleLayout === 'function') {
            controller.toggleLayout();
            // controller will update DOM/classes and icon
          } else {
            // Fallback to legacy toggle behavior
            const grid = container.querySelector('.vivideo-main-grid');
            if (!grid) return;

            const isStacked = container.classList.toggle('vivideo-stacked');

            if (isStacked) {
              try {
                const cs = window.getComputedStyle(grid);
                container.dataset.prevGridTemplate = cs.gridTemplateColumns || '';
              } catch (err) {
                container.dataset.prevGridTemplate = '';
                console.warn('failed to read grid computed style', err);
              }
              grid.style.gridTemplateColumns = '1fr';
              layoutBtn.textContent = '⿻';
            } else {
              const prev = container.dataset.prevGridTemplate;
              if (prev && prev.length > 0) {
                grid.style.gridTemplateColumns = prev;
              } else {
                const divider = container.querySelector('.vivideo-grid-divider');
                if (divider) {
                  grid.style.gridTemplateColumns = '220px 8px 1fr';
                } else {
                  grid.style.gridTemplateColumns = '220px 1fr';
                }
              }
              layoutBtn.textContent = '❏';
            }
          }
        } catch (err) {
          console.warn('layout toggle failed', err);
        }
      });
    }

    const restoreBtn = this.safeQuery(container, '.vivideo-restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', (_e) => {
        _e.stopPropagation();
        if (controller && typeof controller.restoreDefaults === 'function') {
          controller.restoreDefaults();
        }
      });
    }
  },

  showToast(message = '', duration = 2500) {
    try {
      const existing = document.querySelector('.vivideo-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = 'vivideo-toast';
      toast.textContent = message;
      toast.style.position = 'fixed';
      toast.style.right = '16px';
      toast.style.bottom = '16px';
      toast.style.zIndex = 2147483647;
      UIHelper.safeAppend(toast);
      setTimeout(() => {
        try {
          toast.classList.add('vivideo-toast-hide');
          setTimeout(() => toast.remove(), 300);
        } catch (err) {
          console.warn('Toast hide failed', err);
        }
      }, duration);
    } catch (e) {
      console.warn('showToast failed', e);
    }
  },

  bindCheckboxEvents(container, controller) {
    const autoActivateCheckbox = this.safeQuery(container, '#auto-activate-checkbox');
    if (autoActivateCheckbox) {
      autoActivateCheckbox.addEventListener('change', (e) => {
        controller.settings.autoActivate = e.target.checked;
        if (typeof controller.saveSettings === 'function') controller.saveSettings();
        if (typeof controller.saveAppState === 'function') controller.saveAppState();
      });
    }

    const qualityToggles = [
      ['#keep-quality-checkbox', 'keepQuality'],
      ['#force-high-quality-scaling-checkbox', 'forceHighQualityScaling'],
      ['#linear-color-pipeline-checkbox', 'linearColorPipeline'],
      ['#upscale-quality-boost-checkbox', 'upscaleQualityBoost']
    ];
    qualityToggles.forEach(([selector, settingKey]) => {
      const checkbox = this.safeQuery(container, selector);
      if (!checkbox) return;
      checkbox.addEventListener('change', (e) => {
        controller.settings[settingKey] = e.target.checked;
        if (typeof controller.saveSettings === 'function') controller.saveSettings();
        if (typeof controller.applyFilters === 'function') controller.applyFilters();
      });
    });

    // Targeted quality control lives inside the Video Controls component now.
  },

  updateCheckboxes(container, settings = {}) {
    const autoActivateCheckbox = this.safeQuery(container, '#auto-activate-checkbox');
    if (autoActivateCheckbox) autoActivateCheckbox.checked = !!settings.autoActivate;
    const keepQualityCheckbox = this.safeQuery(container, '#keep-quality-checkbox');
    if (keepQualityCheckbox) keepQualityCheckbox.checked = !!settings.keepQuality;
    const scalingCheckbox = this.safeQuery(container, '#force-high-quality-scaling-checkbox');
    if (scalingCheckbox) scalingCheckbox.checked = !!settings.forceHighQualityScaling;
    const linearCheckbox = this.safeQuery(container, '#linear-color-pipeline-checkbox');
    if (linearCheckbox) linearCheckbox.checked = !!settings.linearColorPipeline;
    const upscaleCheckbox = this.safeQuery(container, '#upscale-quality-boost-checkbox');
    if (upscaleCheckbox) upscaleCheckbox.checked = !!settings.upscaleQualityBoost;
    // Targeted quality control is handled in VideoControls.updateUI
  },

  setupDragging(container, _controller) {
    const header = this.safeQuery(container, '.vivideo-header');
    if (!header) return null;
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    const down = (e) => {
      if (e.target.closest('.vivideo-close') || e.target.closest('.vivideo-info')) return;
      isDragging = true;
      const rect = container.getBoundingClientRect();
      offset.x = e.clientX - rect.left;
      offset.y = e.clientY - rect.top;
      container.classList.add('vivideo-dragging');
    };
    const move = (e) => {
      if (!isDragging) return;
      container.style.left =
        Math.max(0, Math.min(e.clientX - offset.x, window.innerWidth - container.offsetWidth)) +
        'px';
      container.style.top =
        Math.max(0, Math.min(e.clientY - offset.y, window.innerHeight - container.offsetHeight)) +
        'px';
    };
    const up = () => {
      isDragging = false;
      container.classList.remove('vivideo-dragging');
    };
    header.addEventListener('mousedown', down);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return { down, move, up, header };
  },

  setupResizing(container) {
    if (!container) return null;

    // create handles if they don't exist
    let leftHandle = container.querySelector('.vivideo-resize-left');
    let topHandle = container.querySelector('.vivideo-resize-top');

    if (!leftHandle) {
      leftHandle = document.createElement('div');
      leftHandle.className = 'vivideo-resize-left';
      container.appendChild(leftHandle);
    }

    if (!topHandle) {
      topHandle = document.createElement('div');
      topHandle.className = 'vivideo-resize-top';
      container.appendChild(topHandle);
    }

    let isResizingLeft = false;
    let isResizingTop = false;
    let startX = 0;
    let startY = 0;
    let startRect = null;

    const onMouseDownLeft = (e) => {
      e.preventDefault();
      isResizingLeft = true;
      startX = e.clientX;
      startRect = container.getBoundingClientRect();
      container.classList.add('vivideo-resizing');
    };

    const onMouseDownTop = (e) => {
      e.preventDefault();
      isResizingTop = true;
      startY = e.clientY;
      startRect = container.getBoundingClientRect();
      container.classList.add('vivideo-resizing');
    };

    const onMouseMove = (e) => {
      if (isResizingLeft && startRect) {
        // dragging left edge: change width and left position
        const dx = e.clientX - startX; // positive if moved right
        // new width = startWidth - dx (because dragging left edge)
        let newWidth = startRect.width - dx;
        // enforce minimum width
        const minWidth = 280;
        const maxWidth = Math.min(window.innerWidth - 20, 1200);
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        // compute new left so right edge stays same
        const newLeft = startRect.right - newWidth;
        container.style.width = newWidth + 'px';
        container.style.left = Math.max(0, Math.min(newLeft, window.innerWidth - newWidth)) + 'px';
      }

      if (isResizingTop && startRect) {
        const dy = e.clientY - startY; // positive if moved down
        // dragging top edge: new height = startHeight - dy
        let newHeight = startRect.height - dy;
        const minHeight = 120;
        const maxHeight = Math.min(window.innerHeight - 20, 1200);
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        const newTop = startRect.bottom - newHeight;
        container.style.height = newHeight + 'px';
        container.style.top = Math.max(0, Math.min(newTop, window.innerHeight - newHeight)) + 'px';
      }
    };

    const onMouseUp = () => {
      if (isResizingLeft || isResizingTop) {
        isResizingLeft = false;
        isResizingTop = false;
        startRect = null;
        container.classList.remove('vivideo-resizing');
      }
    };

    leftHandle.addEventListener('mousedown', onMouseDownLeft);
    topHandle.addEventListener('mousedown', onMouseDownTop);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return {
      leftHandle,
      topHandle,
      destroy() {
        leftHandle.removeEventListener('mousedown', onMouseDownLeft);
        topHandle.removeEventListener('mousedown', onMouseDownTop);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    };
  },

  clampValue(control, value, extendedLimits = false) {
    const limits = this.getControlLimits(control, extendedLimits);
    return Math.max(limits.min, Math.min(limits.max, value));
  },

  getControlLimits(control, extendedLimits = false) {
    switch (control) {
      case 'brightness':
        return extendedLimits ? { min: -90, max: 300, step: 1 } : { min: -50, max: 80, step: 1 };
      case 'contrast':
        return extendedLimits ? { min: -100, max: 400, step: 1 } : { min: -70, max: 100, step: 1 };
      case 'saturation':
        return extendedLimits ? { min: -100, max: 200, step: 1 } : { min: -80, max: 60, step: 1 };
      case 'gamma':
        return extendedLimits
          ? { min: 0.1, max: 4.0, step: 0.01 }
          : { min: 0.4, max: 2.2, step: 0.01 };
      case 'colortemp':
        return extendedLimits ? { min: -100, max: 100, step: 1 } : { min: -60, max: 60, step: 1 };
      case 'sharpness':
        return extendedLimits ? { min: 0, max: 120, step: 1 } : { min: 0, max: 60, step: 1 };
      case 'speed':
        return extendedLimits
          ? { min: 0.25, max: 4.0, step: 0.01 }
          : { min: 0.5, max: 2.0, step: 0.01 };
      default:
        return { min: 0, max: 100, step: 1 };
    }
  },

  // Safe append helpers to avoid calling appendChild on null parents
  safeAppend(node) {
    if (!node) return;
    if (document && document.body) {
      try {
        document.body.appendChild(node);
      } catch (e) {
        console.warn('UIHelper.safeAppend failed', e);
      }
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          if (document && document.body) document.body.appendChild(node);
        } catch (e) {
          console.warn('UIHelper.safeAppend failed on DOMContentLoaded', e);
        }
      });
    }
  },

  safeAppendTo(parent, node) {
    if (!node) return;
    if (parent && typeof parent.appendChild === 'function') {
      try {
        parent.appendChild(node);
      } catch (e) {
        console.warn('UIHelper.safeAppendTo failed', e);
      }
      return;
    }

    // If parent is a selector string, try to resolve it
    try {
      const resolved = typeof parent === 'string' ? document.querySelector(parent) : parent;
      if (resolved && typeof resolved.appendChild === 'function') {
        resolved.appendChild(node);
        return;
      }
    } catch (e) {
      console.warn('UIHelper.safeAppendTo selector resolution failed', e);
    }

    // Fallback to appending to body when parent not available yet
    this.safeAppend(node);
  }
};

// Export for use in other files
window.UIHelper = UIHelper;
