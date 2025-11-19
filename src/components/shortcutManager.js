// Keyboard Shortcut Manager
// Lets users bind Viviprovides and playback speeds to custom key combinations

class ShortcutManager {
  constructor(controller) {
    this.controller = controller;
    this.shortcuts = [];
    this.recording = false;
    this.pendingCombo = null;
    this.boundKeyHandler = (event) => this.handleKeydown(event);
    this.recorderInput = null;
    this.recordButton = null;
    this.actionSelect = null;
    this.dynamicFieldsContainer = null;
    this.shortcutListElement = null;
    this.feedbackElement = null;
  }

  loadShortcuts(initialShortcuts) {
    if (Array.isArray(initialShortcuts) && initialShortcuts.length > 0) {
      this.shortcuts = this.normalizeShortcuts(initialShortcuts);
    } else {
      this.shortcuts = this.getDefaultShortcuts();
    }
  }

  getDefaultShortcuts() {
    return [
      { id: 'toggle-panel', combo: 'Alt+V', action: 'togglePanel' },
      { id: 'next-viviprovide', combo: 'Alt+B', action: 'nextViviprovide' },
      { id: 'prev-viviprovide', combo: 'Alt+C', action: 'previousViviprovide' },
      { id: 'speed-up', combo: 'Alt+.', action: 'adjustSpeed', payload: { delta: 0.25 } },
      { id: 'speed-down', combo: 'Alt+,', action: 'adjustSpeed', payload: { delta: -0.25 } }
    ];
  }

  normalizeShortcuts(shortcuts) {
    return shortcuts
      .map((shortcut, index) => ({
        id: shortcut.id || `shortcut-${index}`,
        combo: this.normalizeComboString(shortcut.combo || ''),
        action: shortcut.action,
        payload: shortcut.payload || {}
      }))
      .filter((shortcut) => shortcut.combo && shortcut.action);
  }

  normalizeComboString(combo) {
    if (!combo) return '';
    const parts = combo
      .split('+')
      .map((part) => part.trim())
      .filter(Boolean);

    const modifiers = [];
    let keyPart = '';

    parts.forEach((part) => {
      const normalized = part.toLowerCase();
      if (normalized === 'ctrl' || normalized === 'control') modifiers.push('Ctrl');
      else if (normalized === 'alt') modifiers.push('Alt');
      else if (normalized === 'shift') modifiers.push('Shift');
      else if (normalized === 'meta' || normalized === 'cmd' || normalized === 'command')
        modifiers.push('Meta');
      else keyPart = this.normalizeKey(part);
    });

    const uniqueModifiers = [...new Set(modifiers)];
    if (keyPart) uniqueModifiers.push(keyPart);
    return uniqueModifiers.join('+');
  }

  normalizeKey(key) {
    if (!key) return '';
    if (key.length === 1) {
      return key.toUpperCase();
    }

    const specialMap = {
      ArrowUp: 'ArrowUp',
      ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight',
      Space: 'Space',
      ' ': 'Space',
      Escape: 'Escape',
      Esc: 'Escape',
      Enter: 'Enter',
      Tab: 'Tab',
      Backspace: 'Backspace',
      Delete: 'Delete',
      '.': '.',
      ',': ',',
      ';': ';'
    };

    return specialMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  createShortcutsHTML() {
    return /*html*/ `
      <div class="vivideo-shortcut-manager">
        <div class="vivideo-shortcut-header">
          <div>
            <h4>⌨️ Shortcut Studio</h4>
            <p>Assign Viviprovides, playback speeds and deck actions to your favorite keys.</p>
          </div>
          <div class="vivideo-shortcut-inline-help">
            <span>Default: Alt + B / Alt + C</span>
          </div>
        </div>
        <div class="vivideo-shortcut-list" id="vivideo-shortcut-list"></div>
        <div class="vivideo-shortcut-form" id="vivideo-shortcut-form">
          <div class="vivideo-shortcut-field">
            <label for="vivideo-shortcut-display">Shortcut</label>
            <div class="vivideo-shortcut-recorder">
              <input type="text" id="vivideo-shortcut-display" readonly placeholder="Press Record and hit keys" />
              <button type="button" id="vivideo-shortcut-record" class="vivideo-profile-save compact">Record</button>
            </div>
          </div>
          <div class="vivideo-shortcut-field">
            <label for="vivideo-shortcut-action">Action</label>
            <select id="vivideo-shortcut-action">
              <option value="nextViviprovide">Next Viviprovide</option>
              <option value="previousViviprovide">Previous Viviprovide</option>
              <option value="setViviprovide">Set specific Viviprovide</option>
              <option value="setSpeed">Set playback speed</option>
              <option value="increaseSpeed">Increase playback speed</option>
              <option value="decreaseSpeed">Decrease playback speed</option>
              <option value="togglePanel">Toggle Vivideo panel</option>
            </select>
          </div>
          <div class="vivideo-shortcut-field" id="vivideo-shortcut-dynamic"></div>
          <div class="vivideo-shortcut-actions">
            <button type="button" id="vivideo-shortcut-save" class="vivideo-profile-save">Create shortcut</button>
          </div>
          <div class="vivideo-shortcut-feedback" id="vivideo-shortcut-feedback"></div>
        </div>
      </div>
    `;
  }

  bindEvents(container) {
    this.container = container;
    this.shortcutListElement = container.querySelector('#vivideo-shortcut-list');
    this.recorderInput = container.querySelector('#vivideo-shortcut-display');
    this.recordButton = container.querySelector('#vivideo-shortcut-record');
    this.actionSelect = container.querySelector('#vivideo-shortcut-action');
    this.dynamicFieldsContainer = container.querySelector('#vivideo-shortcut-dynamic');
    this.feedbackElement = container.querySelector('#vivideo-shortcut-feedback');

    if (!this.recordButton || !this.actionSelect) {
      return;
    }

    this.renderShortcutList();
    this.updateDynamicFields();

    this.recordButton.addEventListener('click', () => this.startRecording());
    this.actionSelect.addEventListener('change', () => this.updateDynamicFields());
    const saveButton = container.querySelector('#vivideo-shortcut-save');
    if (saveButton) {
      saveButton.addEventListener('click', () => this.createShortcutFromForm());
    }

    this.shortcutListElement.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-remove-shortcut]');
      if (removeBtn) {
        this.removeShortcut(removeBtn.getAttribute('data-remove-shortcut'));
      }
    });

    document.addEventListener('keydown', this.boundKeyHandler, true);
  }

  refreshProfileOptions() {
    if (!this.dynamicFieldsContainer) return;
    const select = this.dynamicFieldsContainer.querySelector('#vivideo-shortcut-profile-target');
    if (select) {
      select.innerHTML = this.buildProfileOptionsHtml(select.value);
    }
  }

  renderShortcutList() {
    if (!this.shortcutListElement) return;
    if (!this.shortcuts.length) {
      this.shortcutListElement.innerHTML =
        '<p class="vivideo-shortcut-empty">No custom shortcuts yet.</p>';
      return;
    }

    const rows = this.shortcuts
      .map((shortcut) => {
        return `
          <div class="vivideo-shortcut-row">
            <div>
              <strong>${shortcut.combo}</strong>
              <span>${this.describeShortcutAction(shortcut)}</span>
            </div>
            <button class="vivideo-profile-delete" data-remove-shortcut="${shortcut.id}" title="Remove shortcut">✖</button>
          </div>
        `;
      })
      .join('');

    this.shortcutListElement.innerHTML = rows;
  }

  describeShortcutAction(shortcut) {
    switch (shortcut.action) {
      case 'nextViviprovide':
        return 'Next Viviprovide';
      case 'previousViviprovide':
        return 'Previous Viviprovide';
      case 'setViviprovide':
        return `Activate "${shortcut.payload?.profileName || 'Unknown'}"`;
      case 'setSpeed':
        return `Set playback speed to ${(shortcut.payload?.speed || 1).toFixed(2)}x`;
      case 'adjustSpeed': {
        const delta = shortcut.payload?.delta || 0;
        const prefix = delta > 0 ? '+' : '';
        return `Adjust speed by ${prefix}${delta.toFixed(2)}x`;
      }
      case 'togglePanel':
        return 'Toggle Vivideo panel';
      default:
        return shortcut.action;
    }
  }

  startRecording() {
    this.recording = true;
    this.pendingCombo = null;
    if (this.recorderInput) {
      this.recorderInput.value = 'Press desired keys...';
    }
    this.showFeedback('Listening for shortcut…', 'info');
  }

  captureRecording(event) {
    event.preventDefault();
    event.stopPropagation();

    const combo = this.formatEventToCombo(event);
    if (!combo) {
      this.showFeedback('Please include at least one key.', 'error');
      return;
    }

    const comboParts = combo.split('+');
    const hasMainKey = comboParts.some((part) => !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(part));

    if (!hasMainKey) {
      this.showFeedback('Add a letter, number or symbol to the shortcut.', 'error');
      return;
    }

    this.pendingCombo = combo;
    if (this.recorderInput) {
      this.recorderInput.value = combo;
    }
    this.recording = false;
    this.showFeedback(`Captured ${combo}`, 'success');
  }

  handleKeydown(event) {
    if (this.recording) {
      this.captureRecording(event);
      return;
    }

    if (this.shouldIgnoreEvent(event)) {
      return;
    }

    const combo = this.formatEventToCombo(event);
    if (!combo) return;

    const shortcut = this.shortcuts.find((item) => item.combo === combo);
    if (!shortcut) return;

    event.preventDefault();
    event.stopPropagation();
    this.controller.executeShortcutAction(shortcut);
  }

  shouldIgnoreEvent(event) {
    const tagName = event.target?.tagName;
    const isEditable =
      event.target?.isContentEditable ||
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT';

    return isEditable;
  }

  formatEventToCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    const normalizedKey = this.normalizeKey(event.key);
    if (!normalizedKey) {
      return parts.join('+');
    }

    if (!['Ctrl', 'Alt', 'Shift', 'Meta'].includes(normalizedKey)) {
      parts.push(normalizedKey);
    }

    return parts.join('+');
  }

  updateDynamicFields() {
    if (!this.dynamicFieldsContainer) return;
    const action = this.actionSelect.value;
    let html = '';

    if (action === 'setViviprovide') {
      html = `
        <label for="vivideo-shortcut-profile-target">Viviprovide</label>
        <select id="vivideo-shortcut-profile-target">
          ${this.buildProfileOptionsHtml()}
        </select>
      `;
    } else if (action === 'setSpeed') {
      html = `
        <label for="vivideo-shortcut-speed">Playback speed</label>
        <input type="number" id="vivideo-shortcut-speed" min="0.05" max="25" step="0.05" value="1.00" />
      `;
    } else if (action === 'increaseSpeed' || action === 'decreaseSpeed') {
      html = `
        <label for="vivideo-shortcut-speed-delta">Change by</label>
        <input type="number" id="vivideo-shortcut-speed-delta" min="0.05" max="5" step="0.05" value="0.25" />
      `;
    }

    this.dynamicFieldsContainer.innerHTML = html;
  }

  buildProfileOptionsHtml(selectedValue = '') {
    const options = [];
    options.push(`<option value="DEFAULT">DEFAULT</option>`);
    (this.controller.profiles || []).forEach((profile) => {
      options.push(
        `<option value="${profile.name}" ${profile.name === selectedValue ? 'selected' : ''}>${profile.name}</option>`
      );
    });
    return options.join('');
  }

  createShortcutFromForm() {
    const combo = this.pendingCombo || this.recorderInput?.value;
    if (!combo) {
      this.showFeedback('Record a shortcut before saving.', 'error');
      return;
    }

    const normalizedCombo = this.normalizeComboString(combo);
    if (this.shortcuts.some((item) => item.combo === normalizedCombo)) {
      this.showFeedback(
        'Shortcut already assigned. Remove it first or pick another combo.',
        'error'
      );
      return;
    }

    const action = this.actionSelect.value;
    const shortcut = {
      id: `shortcut-${Date.now()}`,
      combo: normalizedCombo,
      action,
      payload: {}
    };

    if (action === 'setViviprovide') {
      const select = this.dynamicFieldsContainer.querySelector('#vivideo-shortcut-profile-target');
      const profileName = select?.value;
      if (!profileName) {
        this.showFeedback('Choose a Viviprovide.', 'error');
        return;
      }
      shortcut.payload.profileName = profileName;
    } else if (action === 'setSpeed') {
      const speedInput = this.dynamicFieldsContainer.querySelector('#vivideo-shortcut-speed');
      const speedValue = parseFloat(speedInput?.value || '1');
      if (Number.isNaN(speedValue) || speedValue < 0.05 || speedValue > 25) {
        this.showFeedback('Speed must be between 0.05x and 25x.', 'error');
        return;
      }
      shortcut.payload.speed = speedValue;
    } else if (action === 'increaseSpeed' || action === 'decreaseSpeed') {
      const deltaInput = this.dynamicFieldsContainer.querySelector('#vivideo-shortcut-speed-delta');
      const deltaValue = parseFloat(deltaInput?.value || '0.25');
      if (Number.isNaN(deltaValue) || deltaValue <= 0) {
        this.showFeedback('Enter a positive change amount.', 'error');
        return;
      }
      shortcut.action = 'adjustSpeed';
      shortcut.payload.delta = action === 'increaseSpeed' ? deltaValue : deltaValue * -1;
    }

    this.shortcuts.push(shortcut);
    this.persistShortcuts();
    this.renderShortcutList();
    this.pendingCombo = null;
    if (this.recorderInput) {
      this.recorderInput.value = '';
    }
    this.showFeedback('Shortcut saved.', 'success');
  }

  removeShortcut(shortcutId) {
    this.shortcuts = this.shortcuts.filter((shortcut) => shortcut.id !== shortcutId);
    this.persistShortcuts();
    this.renderShortcutList();
    this.showFeedback('Shortcut removed.', 'success');
  }

  async persistShortcuts() {
    try {
      await StorageUtils.saveShortcuts(this.shortcuts);
    } catch (error) {
      console.warn('Vivideo: Unable to save shortcuts', error);
    }
  }

  showFeedback(message, type = 'info') {
    if (!this.feedbackElement) return;
    this.feedbackElement.textContent = message;
    this.feedbackElement.dataset.state = type;
  }

  cleanup() {
    document.removeEventListener('keydown', this.boundKeyHandler, true);
  }
}

window.ShortcutManager = ShortcutManager;
