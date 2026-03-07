// Profile Manager Component
// Handles profile creation, loading, deletion and UI

class ProfileManager {
  constructor(controller) {
    this.controller = controller;
    this.defaultProfiles = this.createDefaultProfiles();
    this.showingProfiles = true; // Currently showing profiles (vs themes)
    this.displayDefaultProfiles = true; // Display default profile in list
    this.previousProfile = null; // Store previous profile for Alt+M toggle
    this.showProfileAfterChange = true; // Show profile name notification
    this.workOnAllSites = false; // Work on all websites, not just YouTube
    this.applyProfileSpeed = false; // When true, apply profile.speed to video playback
    // Collapsible state for sections
    this.builtinCollapsed = true; // Default Built-in collapsed by default
    this.userCollapsed = true; // Profile List collapsed by default
    this.isEditingBuiltin = false; // track editing built-in profile
    this.profileCategories = [];
    this.workOnEverything = false; // apply filters to whole page when enabled
  }

  createDefaultProfiles() {
    // Canonical default built-in profiles
    return [
      {
        name: 'DEFAULT',
        description: 'Default Vivideo profile, without any value changed',
        profileCategory: 'Built-in',
        settings: {
          contrast: 0,
          colorTemp: 0,
          saturation: 0,
          gamma: 1,
          sharpness: 0,
          brightness: 0,
          speed: 1.0
        }
      },
      {
        name: 'Vivid Colors',
        description: 'High saturation and contrast for vivid playback',
        profileCategory: 'Built-in',
        settings: {
          contrast: 27,
          colorTemp: -72,
          saturation: 72,
          gamma: 1,
          sharpness: 0,
          brightness: 0,
          speed: 1.0
        }
      },
      {
        name: 'Black & White',
        description: 'Desaturate to create a black & white effect',
        profileCategory: 'Built-in',
        settings: {
          contrast: 0,
          colorTemp: 0,
          saturation: -100,
          gamma: 1,
          sharpness: 0,
          brightness: 0,
          speed: 1.0
        }
      },
      {
        name: 'High Gamma / Low Contrast',
        description: 'Brighter midtones with reduced contrast',
        profileCategory: 'Built-in',
        settings: {
          contrast: -15,
          gamma: 1.6,
          saturation: 0,
          colorTemp: 0,
          sharpness: 0,
          brightness: 0,
          speed: 1.0
        }
      },
      {
        name: 'Low Gamma / High Contrast',
        description: 'Deeper tones with stronger contrast',
        profileCategory: 'Built-in',
        settings: {
          contrast: 25,
          gamma: 0.8,
          saturation: 0,
          colorTemp: 0,
          sharpness: 0,
          brightness: 0,
          speed: 1.0
        }
      },
      {
        name: 'Matrix (Sharp)',
        description: 'Sharpness boost only (matrix-like)',
        profileCategory: 'Built-in',
        settings: {
          contrast: 0,
          gamma: 1,
          saturation: 0,
          colorTemp: 0,
          sharpness: 31,
          brightness: 0,
          speed: 1.0
        }
      }
    ];
  }

  normalizeCategoryName(categoryName) {
    return (categoryName || '').trim();
  }

  // Generate a short unique id for profile list
  generateProfileId() {
    return 'p_' + Math.random().toString(36).substr(2, 9);
  }

  // Ensure settings object has all required numeric keys with sane defaults
  sanitizeSettings(settings = {}) {
    const defaults = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0,
      sharpness: 0,
      speed: 1.0
    };
    const out = {};
    Object.keys(defaults).forEach((k) => {
      const v = settings && Object.prototype.hasOwnProperty.call(settings, k) ? settings[k] : undefined;
      // Accept numbers only; fall back to default for missing or invalid values
      out[k] = typeof v === 'number' && !Number.isNaN(v) ? v : defaults[k];
    });
    // Preserve autoActivate if present and boolean
    if (typeof settings.autoActivate === 'boolean') out.autoActivate = settings.autoActivate;
    return out;
  }

  // Return a stable reference string for a profile: use id if present, otherwise name
  getProfileRef(profile) {
    if (!profile) return null;
    return profile.id ? profile.id : profile.name;
  }

  // Find a profile (user or builtin) by a stored reference (id or name)
  findProfileByRef(ref) {
    if (!ref) return null;
    // Try profile list by id first
    const users = this.controller && Array.isArray(this.controller.profiles) ? this.controller.profiles : [];
    let idx = users.findIndex((p) => p.id && p.id === ref);
    if (idx !== -1) return { profile: users[idx], profileType: 'user', index: idx };
    // Fallback to profile list by name
    idx = users.findIndex((p) => p.name === ref);
    if (idx !== -1) return { profile: users[idx], profileType: 'user', index: idx };

    // Check built-in profiles by name
    const defaults = this.defaultProfiles || this.createDefaultProfiles();
    idx = defaults.findIndex((p) => p.name === ref);
    if (idx !== -1) return { profile: defaults[idx], profileType: 'builtin', index: idx };

    // Special-case DEFAULT
    if (ref === 'DEFAULT' && this.controller && this.controller.defaultProfile) {
      return { profile: this.controller.defaultProfile, profileType: 'builtin', index: 0 };
    }

    return null;
  }

  getProfileCategory(profile) {
    const normalized = this.normalizeCategoryName(profile && profile.profileCategory);
    return normalized || 'General';
  }

  getOrderedUserCategories() {
    const categories = new Set(this.profileCategories || []);
    this.controller.profiles.forEach((profile) => categories.add(this.getProfileCategory(profile)));
    if (categories.size === 0) {
      categories.add('General');
    }
    return [...categories];
  }

  createProfilesHTML() {
    return /*html*/ `
      <!-- Profiles Section -->
      <div class="vivideo-bottom-controls">
            <div class="vivideo-active-item-section">
              <div class="vivideo-box-header profile-panel-header">➤ Active Profile</div>
              <div class="vivideo-active-item-row">
                <div class="active-item-status" id="active-profile-display">DEFAULT</div>
                <div class="vivideo-active-item-actions">
                  <button class="vivideo-profile-edit-btn vivideo-btn" title="Overwrite active profile with current values">💾</button>
                  <button class="vivideo-profile-remove-btn vivideo-btn" title="Delete active profile">✖</button>
                </div>
              </div>
            </div>
            <div class="vivideo-bottom-controls-right">
            <!-- Profile form (always visible) -->
            <div id="profile-form-panel" class="vivideo-profile-form vivideo-profile-form-compact vivideo-profile-form-panel">
              <div class="vivideo-box-header profile-panel-header">💾 Save Profile</div>
              <div class="vivideo-grid-1-3-1">
                <input type="text" id="profile-display-name-input" class="vivideo-profile-input profile-display-name-input" placeholder="New profile">
                <button id="profile-form-save-button" class="vivideo-profile-save vivideo-btn profile-form-save-button" data-overwrite="false">💾</button>
                <button id="profile-form-cancel-button" class="profile-form-cancel-button vivideo-btn" title="Cancel">✖</button>
              </div>
            </div>
          </div>
      </div>

      <!-- Profiles Panel -->
      <div class="vivideo-profiles vivideo-border-box" id="profiles-panel">
        <div class="vivideo-box-header profile-panel-header">
          🎥 Profile List
            <!-- removed "Display default profiles" option - simplified single default profile model -->
        </div>
        <div class="vivideo-profile-list" id="profile-list"></div>
        <!-- Profile Save Form -->
        <div class="vivideo-profile-save-section">
          <div class="vivideo-profile-form vivideo-profile-form-compact">
            <div class="vivideo-box-header profile-panel-header">💾 Save Profile</div>
            <div class="vivideo-grid-3-1">
              <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profile_1">
              <button class="vivideo-profile-save vivideo-btn" id="save-profile" data-overwrite="false">💾</button>
            </div>
            <div class="vivideo-grid-3-1 vivideo-category-row">
              <select id="profile-category" class="vivideo-profile-input">
                <option value="">General</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Settings Section -->
      <div class="vivideo-profile-settings-section">
        <div class="vivideo-switch-row">
          <label class="vivideo-switch-container">
            <input type="checkbox" id="show-profile-after-change-checkbox" class="vivideo-switch-input" checked>
            <span class="vivideo-switch-track"></span>
            <span class="vivideo-switch-label">Show profile after change</span>
            <button class="vivideo-info-icon" data-info="Display profile name for 3 seconds after switching">❔</button>
          </label>
        </div>

        <div class="vivideo-switch-row">
          <label class="vivideo-switch-container">
            <input type="checkbox" id="work-on-all-sites-checkbox" class="vivideo-switch-input">
            <span class="vivideo-switch-track"></span>
            <span class="vivideo-switch-label">Work on all websites</span>
            <button class="vivideo-info-icon" data-info="Apply video filters to all websites, not just YouTube">❔</button>
          </label>
        </div>

        <div class="vivideo-switch-row">
          <label class="vivideo-switch-container">
            <input type="checkbox" id="work-on-everything-checkbox" class="vivideo-switch-input">
            <span class="vivideo-switch-track"></span>
            <span class="vivideo-switch-label">Work on everything on website</span>
            <button class="vivideo-info-icon" data-info="Apply filters to whole page except Vivideo UI">❔</button>
          </label>
        </div>

        <div class="vivideo-switch-row">
          <label class="vivideo-switch-container">
            <input type="checkbox" id="apply-profile-speed-checkbox" class="vivideo-switch-input">
            <span class="vivideo-switch-track"></span>
            <span class="vivideo-switch-knob"></span>
            <span class="vivideo-switch-label">Apply Profile Video Speed</span>
            <button class="vivideo-info-icon" data-info="When enabled, Vivideo will set video playback speed from the profile's speed value">❔</button>
          </label>
        </div>


      </div>

      <!-- Compare Mode Section -->
      <div class="vivideo-compare-section">
        <div class="vivideo-compare-header">
          <label class="vivideo-switch-container">
            <input type="checkbox" id="compare-mode-checkbox" class="vivideo-switch-input">
            <span class="vivideo-switch-track"></span>
            <span class="vivideo-switch-label">Compare Mode</span>
            <button class="vivideo-info-icon" data-info="Split-screen profile comparison">❔</button>
          </label>
        </div>
        
        <!-- Compare Profile Selection (hidden by default) -->
        <div class="vivideo-compare-controls" id="compare-controls">
          <div class="vivideo-compare-info">
            <div class="compare-side-label">
              <span class="side-indicator left">L</span>
              <span>Current Profile</span>
            </div>
            <div class="compare-vs">VS</div>
            <div class="compare-side-label">
              <span class="side-indicator right">R</span>
              <span>Compare With:</span>
            </div>
          </div>
          <select id="compare-profile-select" class="vivideo-compare-select">
            <option value="">Select profile to compare...</option>
          </select>
        </div>
      </div>
    `;
  }

  // Append modal HTML to HTML template by patching container after render (fallback if missing)
  // The modal markup will be present in the container when createProfilesHTML output is inserted.

  // Show overwrite confirmation modal with callbacks
  showOverwriteModal(profileName, onConfirm, onCancel) {
    try {
      const container =
        this.controller && this.controller.container ? this.controller.container : document.body;
      let modal = container.querySelector('#overwrite-confirm-modal');
      if (!modal) return; // modal should exist in markup

      const msgEl = modal.querySelector('.overwrite-message');
      const confirmBtn = modal.querySelector('.overwrite-confirm');
      const cancelBtn = modal.querySelector('.overwrite-cancel');

      if (msgEl) msgEl.textContent = `This will overwrite profile "${profileName}". Confirm?`;

      const cleanup = () => {
        confirmBtn.removeEventListener('click', onConfirmWrapper);
        cancelBtn.removeEventListener('click', onCancelWrapper);
        modal.style.display = 'none';
      };

      const onConfirmWrapper = () => {
        try {
          if (typeof onConfirm === 'function') onConfirm();
        } catch (e) {
          console.warn(e);
        }
        cleanup();
      };

      const onCancelWrapper = () => {
        try {
          if (typeof onCancel === 'function') onCancel();
        } catch (e) {
          console.warn(e);
        }
        cleanup();
      };

      confirmBtn.addEventListener('click', onConfirmWrapper);
      cancelBtn.addEventListener('click', onCancelWrapper);

      modal.style.display = 'block';
    } catch (e) {
      console.warn('Vivideo: showOverwriteModal failed', e);
    }
  }

  bindEvents(container) {
    // (themes and settings buttons removed from UI) - no bindings here

    const saveProfileBtn = UIHelper.safeQuery(container, '#save-profile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        this.saveCurrentProfile(container);
      });
    }

    // Profile form handlers (always visible)
    const profileFormSaveBtn = UIHelper.safeQuery(container, '#profile-form-save-button');
    const profileDisplayInput = UIHelper.safeQuery(container, '#profile-display-name-input');
    if (profileFormSaveBtn && profileDisplayInput) {
      profileFormSaveBtn.addEventListener('click', () => {
        this.saveProfileForm(container);
      });

      profileDisplayInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.saveProfileForm(container);
        }
      });

      profileDisplayInput.addEventListener('input', (e) => {
        const val = (e.target.value || '').trim();
        const panel = container.querySelector('#profile-form-panel');
        const grid = panel ? panel.querySelector('.vivideo-grid-1-3-1') : null;
        const inlineId = 'profile-inline-actions';
        let inline = panel ? panel.querySelector(`#${inlineId}`) : null;

        if (val.length > 16) {
          this.updateActiveStatus('Profile name cannot exceed 16 characters', '#ff4d4f');
          return;
        }

        const exists = this.controller.profiles.some((p) => p.name === val);

        // Remove inline actions if value changed to a non-conflicting name
        if (!exists && inline) {
          inline.remove();
          inline = null;
          // restore main save button visibility when inline removed
          if (profileFormSaveBtn) profileFormSaveBtn.style.display = '';
        }

        if (exists && val.length > 0) {
          // Show inline overwrite / save-as-new actions under the input
          this.updateActiveStatus(`You will overwrite ${val}`, '#bb531e');
          if (!inline && grid) {
            inline = document.createElement('div');
            inline.id = inlineId;
            inline.className = 'profile-inline-actions';
            inline.innerHTML = `
              <button id="profile-overwrite-btn" class="vivideo-profile-save vivideo-btn vivideo-inline-action">Overwrite</button>
              <button id="profile-save-new-btn" class="vivideo-profile-save vivideo-btn vivideo-inline-action">Save as new</button>
            `;
            grid.appendChild(inline);
            // hide the main quick-save button while inline actions are shown
            if (profileFormSaveBtn) profileFormSaveBtn.style.display = 'none';

            const overwriteBtn = inline.querySelector('#profile-overwrite-btn');
            const saveNewBtn = inline.querySelector('#profile-save-new-btn');

            // Overwrite existing profile with current settings
            if (overwriteBtn) {
              overwriteBtn.onclick = (ev) => {
                ev.preventDefault();
                const currentSettings = {
                  brightness: this.controller.settings.brightness,
                  contrast: this.controller.settings.contrast,
                  saturation: this.controller.settings.saturation,
                  gamma: this.controller.settings.gamma,
                  colorTemp: this.controller.settings.colorTemp,
                  sharpness: this.controller.settings.sharpness,
                  speed: this.controller.settings.speed
                };
                const existingIndex = this.controller.profiles.findIndex((p) => p.name === val);
                if (existingIndex !== -1) {
                  this.controller.profiles[existingIndex].settings = this.sanitizeSettings({
                    ...currentSettings,
                    autoActivate: this.controller.settings.autoActivate
                  });
                  this.controller.profiles[existingIndex].profileCategory = 'General';
                  console.log('Vivideo: Profile overwrite (inline):', val);
                  // Ensure we set activeProfile to the profile id when available
                  const existingProfile = this.controller.profiles[existingIndex];
                  this.controller.settings.activeProfile = existingProfile.id || existingProfile.name;
                  this.controller.saveProfiles();
                  this.controller.saveSettings();
                  this.controller.saveAppState();
                  this.updateProfilesList(container);
                  this.updateActiveProfileDisplay(container, this.controller.settings);
                  this.updateActiveStatus('Saved', '');
                }
                if (inline) {
                  inline.remove();
                  if (profileFormSaveBtn) profileFormSaveBtn.style.display = '';
                }
              };
            }

            // Save a new profile with the same name (distinct id)
            if (saveNewBtn) {
              saveNewBtn.onclick = (ev) => {
                ev.preventDefault();
                const currentSettings = {
                  brightness: this.controller.settings.brightness,
                  contrast: this.controller.settings.contrast,
                  saturation: this.controller.settings.saturation,
                  gamma: this.controller.settings.gamma,
                  colorTemp: this.controller.settings.colorTemp,
                  sharpness: this.controller.settings.sharpness,
                  speed: this.controller.settings.speed
                };
                const profile = {
                  id: this.generateProfileId(),
                  name: val,
                  profileCategory: 'General',
                  settings: this.sanitizeSettings({
                    ...currentSettings,
                    autoActivate: this.controller.settings.autoActivate
                  })
                };
                this.controller.profiles.push(profile);
                console.log('Vivideo: Profile saved (as new with same name):', val);
                // Use the generated id as the active profile reference
                this.controller.settings.activeProfile = profile.id;
                this.controller.saveProfiles();
                this.controller.saveSettings();
                this.controller.saveAppState();
                this.updateProfilesList(container);
                this.updateActiveProfileDisplay(container, this.controller.settings);
                this.updateActiveStatus('Saved', '');
                if (inline) {
                  inline.remove();
                  if (profileFormSaveBtn) profileFormSaveBtn.style.display = '';
                }
              };
            }
          }
          return;
        }

        this.updateActiveStatus('EDITING', '');
      });

      // Cancel button for profile form
      const profileFormCancel = UIHelper.safeQuery(container, '#profile-form-cancel-button');
      if (profileFormCancel) {
        profileFormCancel.addEventListener('click', () => {
          const inputField = container.querySelector('#profile-display-name-input');
          if (inputField) inputField.value = '';
          this.isEditingProfile = false;
          if (this.controller && this.controller.container)
            this.controller.container.classList.remove('vivideo-edit-mode-active');
          // remove inline actions if present and restore main save button
          try {
            const panel = container.querySelector('#profile-form-panel');
            const inline = panel ? panel.querySelector('#profile-inline-actions') : null;
            if (inline) {
              inline.remove();
              if (profileFormSaveBtn) profileFormSaveBtn.style.display = '';
            }
          } catch (e) {
            // ignore
          }

          this.updateProfilesList(container);
          this.updateActiveStatus('NOT SAVED', '');
        });
      }
    }

    const mainCategorySelect = UIHelper.safeQuery(container, '#profile-category');
    if (mainCategorySelect) {
      mainCategorySelect.addEventListener('change', () => {
        this.updateActiveStatus('EDITING', '');
      });
    }

    // Toggle Save/Overwrite button based on input name matching existing profiles
    const profileNameInput = UIHelper.safeQuery(container, '#profile-name');
    const saveBtn = UIHelper.safeQuery(container, '#save-profile');
    if (profileNameInput && saveBtn) {
      profileNameInput.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        const exists = this.controller.profiles.some((p) => p.name === name);
        saveBtn.dataset.overwrite = exists ? 'true' : 'false';
        const saveText = saveBtn.querySelector('.save-text');
        const saveIcon = saveBtn.querySelector('.save-icon');
        if (exists) {
          if (saveText) saveText.textContent = 'Overwrite';
          if (saveIcon) saveIcon.textContent = '🔁';
          saveBtn.classList.add('overwrite');
        } else {
          if (saveText) saveText.textContent = 'Save';
          if (saveIcon) saveIcon.textContent = '💾';
          saveBtn.classList.remove('overwrite');
        }
        // Dynamic validation for max length and duplicate warning
        if (e.target.value.length > 16) {
          this.updateActiveStatus('Profile name cannot exceed 16 characters', '#ff4d4f');
        } else if (exists && name.length > 0) {
          this.updateActiveStatus(`You will overwrite ${name}`, '#bb531e');
        } else {
          // clear visible validation only if safe
          this.updateActiveStatus('EDITING', '');
        }
      });
    }

    // Display default profiles checkbox
    // (display-default-profiles removed)

    // Show profile after change checkbox
    const showProfileCheckbox = UIHelper.safeQuery(
      container,
      '#show-profile-after-change-checkbox'
    );
    if (showProfileCheckbox) {
      showProfileCheckbox.addEventListener('change', (e) => {
        this.showProfileAfterChange = e.target.checked;
        console.log('Vivideo: Show profile after change:', this.showProfileAfterChange);

        // Save setting
        this.controller.saveAppState();
      });
    }

    // Apply profile video speed checkbox
    const applySpeedCheckbox = UIHelper.safeQuery(container, '#apply-profile-speed-checkbox');
    if (applySpeedCheckbox) {
      // initialize checked state
      applySpeedCheckbox.checked = !!this.applyProfileSpeed;
      applySpeedCheckbox.addEventListener('change', (e) => {
        this.applyProfileSpeed = e.target.checked;
        console.log('Vivideo: Apply profile video speed:', this.applyProfileSpeed);
        // Save setting
        if (this.controller) this.controller.saveAppState();
      });
    }

    // Work on all sites checkbox
    const workOnAllSitesCheckbox = UIHelper.safeQuery(container, '#work-on-all-sites-checkbox');
    if (workOnAllSitesCheckbox) {
      workOnAllSitesCheckbox.addEventListener('change', (e) => {
        this.workOnAllSites = e.target.checked;
        console.log('Vivideo: Work on all sites:', this.workOnAllSites);

        // Save setting
        this.controller.saveAppState();

        // Apply or remove filters based on new setting
        if (this.workOnAllSites) {
          // Apply filters to current site if not YouTube
          this.controller.applyFilters();
        } else {
          // Remove filters from non-YouTube sites
          if (!this.isYouTubeSite()) {
            this.controller.removeFilters();
          }
        }
      });
    }

    // Work on everything on website checkbox
    const workOnEverythingCheckbox = UIHelper.safeQuery(container, '#work-on-everything-checkbox');
    if (workOnEverythingCheckbox) {
      workOnEverythingCheckbox.addEventListener('change', (e) => {
        this.workOnEverything = e.target.checked;
        console.log('Vivideo: Work on everything on website:', this.workOnEverything);
        // Save setting
        if (this.controller) this.controller.saveAppState();

        // Apply or remove global page filters
        if (this.workOnEverything) {
          if (this.controller && typeof this.controller.applyGlobalPageFilters === 'function')
            this.controller.applyGlobalPageFilters();
        } else {
          if (this.controller && typeof this.controller.removeGlobalPageFilters === 'function')
            this.controller.removeGlobalPageFilters();
        }
      });
    }

    // Speed step input
    const speedStepInput = UIHelper.safeQuery(container, '#speed-step-input');
    if (speedStepInput) {
      speedStepInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0.05 && value <= 1.0) {
          this.controller.settings.speedStep = value;
          this.controller.saveSettings();
          console.log(`Vivideo: Speed step changed to ${value}x`);
        }
      });
    }

    // Compare Mode controls
    const compareModeCheckbox = UIHelper.safeQuery(container, '#compare-mode-checkbox');
    if (compareModeCheckbox) {
      compareModeCheckbox.addEventListener('change', (e) => {
        this.toggleCompareMode(container, e.target.checked);
      });
    }

    const compareProfileSelect = UIHelper.safeQuery(container, '#compare-profile-select');
    if (compareProfileSelect) {
      compareProfileSelect.addEventListener('change', (e) => {
        this.selectCompareProfile(container, e.target.value);
      });
    }

    // Active profile edit/remove buttons in the top active-item section
    const activeEditBtn = UIHelper.safeQuery(
      container,
      '.vivideo-active-item-section .vivideo-profile-edit-btn'
    );
    const activeRemoveBtn = UIHelper.safeQuery(
      container,
      '.vivideo-active-item-section .vivideo-profile-remove-btn'
    );

    if (activeEditBtn) {
      activeEditBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const currentSettings = {
          brightness: this.controller.settings.brightness,
          contrast: this.controller.settings.contrast,
          saturation: this.controller.settings.saturation,
          gamma: this.controller.settings.gamma,
          colorTemp: this.controller.settings.colorTemp,
          sharpness: this.controller.settings.sharpness,
          speed: this.controller.settings.speed
        };
        if (this.validateSettings(currentSettings)) {
          this.updateActiveStatus('Invalid value entered', '#bb531e');
          return;
        }

        const activeRef = this.controller.settings.activeProfile;
        const found = this.findProfileByRef(activeRef);
        if (found) {
          if (found.profileType === 'builtin') {
            this.defaultProfiles[found.index].settings = this.sanitizeSettings({
              ...currentSettings,
              autoActivate: this.controller.settings.autoActivate
            });
            this.controller.settings.activeProfile = this.defaultProfiles[found.index].name;
          } else {
            this.controller.profiles[found.index].settings = this.sanitizeSettings({
              ...currentSettings,
              autoActivate: this.controller.settings.autoActivate
            });
            const userProfile = this.controller.profiles[found.index];
            this.controller.settings.activeProfile = userProfile.id || userProfile.name;
            this.controller.saveProfiles();
          }
        } else {
          // No matching profile - create a new user profile and activate it
          const profile = {
            id: this.generateProfileId(),
            name: `Profile_${this.controller.profiles.length + 1}`,
            profileCategory: 'General',
            settings: this.sanitizeSettings({
              ...currentSettings,
              autoActivate: this.controller.settings.autoActivate
            })
          };
          this.controller.profiles.push(profile);
          this.controller.settings.activeProfile = profile.id;
          this.controller.saveProfiles();
        }

        this.controller.saveSettings();
        this.controller.saveAppState();
        this.updateProfilesList(container);
        this.updateActiveProfileDisplay(container, this.controller.settings);
        this.updateActiveStatus('Saved', '');
      });
    }

    if (activeRemoveBtn) {
      activeRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const activeRef = this.controller.settings.activeProfile;
        const found = this.findProfileByRef(activeRef);
        if (found) {
          if (found.profileType === 'builtin') {
            this.defaultProfiles.splice(found.index, 1);
            this.updateProfilesList(this.controller.container);
          } else {
            this.controller.deleteProfile(found.index);
          }
          this.controller.saveProfiles();
          this.updateProfilesList(container);
          this.updateActiveProfileDisplay(container, this.controller.settings);
          this.updateActiveStatus('Deleted', '');
        }
      });
    }

    this.refreshCategorySelectors(container);
  }

  // Check if current site is YouTube
  isYouTubeSite() {
    return (
      window.location.hostname.includes('youtube.com') ||
      window.location.hostname.includes('youtu.be')
    );
  }

  // Show themes panel
  showThemes(container) {
    this.showingProfiles = false;

    // Update button states
    const themesBtn = container.querySelector('#themes-btn');
    if (themesBtn) {
      themesBtn.classList.add('active');

      // Show themes panel
      this.controller.toggleThemes();

      console.log('Vivideo: Switched to Themes view');
    }
  }

  refreshCategorySelectors(container, selectedCategory = 'General') {
    const categoryNames = this.getOrderedUserCategories();
    ['#profile-category'].forEach((selector) => {
      const select = container.querySelector(selector);
      if (!select) return;
      const previous = this.normalizeCategoryName(select.value) || selectedCategory;
      select.innerHTML = '';
      categoryNames.forEach((categoryName) => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        select.appendChild(option);
      });
      const finalSelection = categoryNames.includes(previous) ? previous : selectedCategory;
      select.value = categoryNames.includes(finalSelection) ? finalSelection : categoryNames[0];
    });
  }

  getProfileCategoryByType(profile, profileType) {
    const fallback = profileType === 'builtin' ? 'Built-in' : 'General';
    const normalized = this.normalizeCategoryName(profile && profile.profileCategory);
    return normalized || fallback;
  }

  getOrderedCategoriesForType(profileType, editModeActive) {
    const categories = new Set();
    if (profileType === 'builtin') {
      categories.add('Built-in');
      this.defaultProfiles.forEach((profile) =>
        categories.add(this.getProfileCategoryByType(profile, 'builtin'))
      );
      if (editModeActive) {
        (this.profileCategories || []).forEach((categoryName) => categories.add(categoryName));
      }
    } else {
      this.getOrderedUserCategories().forEach((categoryName) => categories.add(categoryName));
      if (editModeActive) categories.add('General');
    }
    return [...categories];
  }

  getCategoryCollapseStore(profileType) {
    if (profileType === 'builtin') {
      if (!this.builtinCategoryCollapsedMap) this.builtinCategoryCollapsedMap = {};
      return this.builtinCategoryCollapsedMap;
    }
    if (!this.userCategoryCollapsedMap) this.userCategoryCollapsedMap = {};
    return this.userCategoryCollapsedMap;
  }

  getProfilesArrayByType(profileType) {
    return profileType === 'builtin' ? this.defaultProfiles : this.controller.profiles;
  }

  moveProfile(profileType, fromIndex, toIndex, targetCategory) {
    const list = this.getProfilesArrayByType(profileType);
    if (
      !Array.isArray(list) ||
      fromIndex < 0 ||
      fromIndex >= list.length ||
      toIndex < 0 ||
      toIndex > list.length
    ) {
      return false;
    }
    const [movingProfile] = list.splice(fromIndex, 1);
    if (!movingProfile) return false;
    const safeCategory =
      this.normalizeCategoryName(targetCategory) ||
      this.getProfileCategoryByType(movingProfile, profileType);
    movingProfile.profileCategory = safeCategory;
    const adjustedTargetIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    list.splice(adjustedTargetIndex, 0, movingProfile);
    if (profileType === 'user') {
      if (!this.profileCategories.includes(safeCategory)) {
        this.profileCategories.push(safeCategory);
        this.profileCategories.sort((a, b) => a.localeCompare(b));
      }
      this.controller.saveProfiles();
    }
    this.controller.saveAppState();
    return true;
  }

  bindDragAndDropForProfileItem(profileItem, container, profileType, profileIndex, categoryName) {
    profileItem.setAttribute('draggable', 'true');
    profileItem.classList.add('vivideo-draggable-profile');
    profileItem.addEventListener('dragstart', (e) => {
      this.dragContext = { profileType, profileIndex, categoryName };
      profileItem.classList.add('vivideo-dragging-item');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ profileType, profileIndex, categoryName })
        );
      }
    });
    profileItem.addEventListener('dragend', () => {
      this.dragContext = null;
      container
        .querySelectorAll('.vivideo-drop-target, .vivideo-dragging-item')
        .forEach((node) => node.classList.remove('vivideo-drop-target', 'vivideo-dragging-item'));
    });
    profileItem.addEventListener('dragover', (e) => {
      if (!this.dragContext || this.dragContext.profileType !== profileType) return;
      e.preventDefault();
      profileItem.classList.add('vivideo-drop-target');
    });
    profileItem.addEventListener('dragleave', () => {
      profileItem.classList.remove('vivideo-drop-target');
    });
    profileItem.addEventListener('drop', (e) => {
      e.preventDefault();
      profileItem.classList.remove('vivideo-drop-target');
      if (!this.dragContext || this.dragContext.profileType !== profileType) return;
      const moved = this.moveProfile(
        profileType,
        this.dragContext.profileIndex,
        profileIndex,
        categoryName
      );
      if (moved) this.updateProfilesList(container);
    });
  }

  bindDragAndDropForCategoryList(categoryList, container, profileType, categoryName) {
    categoryList.addEventListener('dragover', (e) => {
      if (!this.dragContext || this.dragContext.profileType !== profileType) return;
      e.preventDefault();
      categoryList.classList.add('vivideo-drop-target');
    });
    categoryList.addEventListener('dragleave', () => {
      categoryList.classList.remove('vivideo-drop-target');
    });
    categoryList.addEventListener('drop', (e) => {
      e.preventDefault();
      categoryList.classList.remove('vivideo-drop-target');
      if (!this.dragContext || this.dragContext.profileType !== profileType) return;
      const list = this.getProfilesArrayByType(profileType);
      const insertAtEnd = list.length;
      const moved = this.moveProfile(
        profileType,
        this.dragContext.profileIndex,
        insertAtEnd,
        categoryName
      );
      if (moved) this.updateProfilesList(container);
    });
  }

  // Update unified profiles list
  updateProfilesList(container) {
    const profileList = container.querySelector('#profile-list');
    if (!profileList) return;

    profileList.innerHTML = '';

    // Połącz profile built-in i user w jedną tablicę
    const allProfiles = [
      ...this.defaultProfiles.map((profile, index) => ({
        profile,
        index,
        profileType: 'builtin'
      })),
      ...this.controller.profiles.map((profile, index) => ({
        profile,
        index,
        profileType: 'user'
      }))
    ];

    // Renderuj wszystkie profile w jednej liście
    allProfiles.forEach(({ profile, index, profileType }) => {
      const profileItem = document.createElement('div');
      profileItem.className = `vivideo-profiles-list-item`;
      profileItem.setAttribute('data-index', index);
      profileItem.setAttribute('data-type', profileType);
      // Determine active status by comparing the stored activeProfile ref (id or name)
      const currentRef = this.controller.settings.activeProfile;
      let isActive = false;
      if (currentRef) {
        isActive = this.getProfileRef(profile) === currentRef;
      } else {
        isActive = profileType === 'builtin' && profile.name === 'DEFAULT';
      }
      if (isActive) profileItem.classList.add('vivideo-profile-active');

      const displayName =
        profile.name.length > 20 ? profile.name.substring(0, 17) + '...' : profile.name;

      profileItem.innerHTML = `
        <div class="vivideo-profile-name" title="${profile.name}">${displayName}</div>
        <button class="vivideo-profile-edit-btn vivideo-btn vivideo-profile-overwrite" title="Overwrite profile with current values">💾</button>
        <button class="vivideo-profile-remove-btn vivideo-btn vivideo-profile-remove-btn-btn" title="Delete profile">✖</button>
      `;

      profileItem.addEventListener('click', (e) => {
        if (
          e.target.classList.contains('vivideo-profile-remove-btn') ||
          e.target.classList.contains('vivideo-profile-edit-btn') ||
          profileItem.classList.contains('editing')
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        container
          .querySelectorAll('.vivideo-profiles-list-item')
          .forEach((item) => item.classList.remove('vivideo-profile-active'));
        profileItem.classList.add('vivideo-profile-active');
        if (profileType === 'builtin' && profile.name === 'DEFAULT') {
          this.controller.loadProfile(this.controller.defaultProfile);
        } else {
          this.controller.loadProfile(profile);
        }
      });

      const editBtn = profileItem.querySelector('.vivideo-profile-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentSettings = {
            brightness: this.controller.settings.brightness,
            contrast: this.controller.settings.contrast,
            saturation: this.controller.settings.saturation,
            gamma: this.controller.settings.gamma,
            colorTemp: this.controller.settings.colorTemp,
            sharpness: this.controller.settings.sharpness,
            speed: this.controller.settings.speed
          };
          if (this.validateSettings(currentSettings)) {
            this.updateActiveStatus('Invalid value entered', '#bb531e');
            return;
          }
          if (profileType === 'builtin') {
            this.defaultProfiles[index].settings = this.sanitizeSettings({
              ...currentSettings,
              autoActivate: this.controller.settings.autoActivate
            });
            this.controller.settings.activeProfile = this.defaultProfiles[index].name;
          } else {
            this.controller.profiles[index].settings = this.sanitizeSettings({
              ...currentSettings,
              autoActivate: this.controller.settings.autoActivate
            });
            const userProfile = this.controller.profiles[index];
            this.controller.settings.activeProfile = userProfile.id || userProfile.name;
            this.controller.saveProfiles();
          }
          this.controller.saveSettings();
          this.controller.saveAppState();
          this.updateProfilesList(container);
          this.updateActiveProfileDisplay(container, this.controller.settings);
          this.updateActiveStatus('Saved', '');
        });
      }

      const deleteBtn = profileItem.querySelector('.vivideo-profile-remove-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (profileType === 'builtin') {
            this.defaultProfiles.splice(index, 1);
            this.updateProfilesList(this.controller.container);
          } else {
            this.controller.deleteProfile(index);
          }
        });
      }

      profileList.appendChild(profileItem);
    });

    // Przycisk do przywracania domyślnych profili (only show when defaults missing/modified)
    const restoreNeeded = !this.areDefaultProfilesIntact();
    if (restoreNeeded) {
      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'vivideo-btn vivideo-control-btn vivideo-restore-default-profiles-btn';
      restoreBtn.id = 'restore-default-builtins';
      restoreBtn.textContent = 'Restore All Default Profiles';
      restoreBtn.addEventListener('click', () => {
        this.defaultProfiles = this.createDefaultProfiles();
        this.updateProfilesList(this.controller.container);
      });
      profileList.appendChild(restoreBtn);
    }

    // Update placeholder for new profile name
    const profileNameInput = container.querySelector('#profile-name');
    if (profileNameInput) {
      profileNameInput.placeholder = `Profile_${this.controller.profiles.length + 1}`;
    }
    this.refreshCategorySelectors(container);
  }

  // Show profile list panel (compat for controller calls)
  showUserProfiles(container) {
    this.showingProfiles = true;
    if (container) {
      // Ensure profiles panel is rendered and active
      try {
        this.updateProfilesList(container);
        // Profile form is always visible now
      } catch (e) {
        console.warn('Vivideo: showUserProfiles failed', e);
        try {
          this.updateActiveStatus('Unknown error!', 'error');
        } catch (err) {
          console.warn('Vivideo: updateActiveStatus failed', err);
        }
      }
    }
  }

  saveCurrentProfile(container) {
    const nameInput = container.querySelector('#profile-name');
    let profileName = nameInput.value.trim();
    const categorySelect = container.querySelector('#profile-category');
    const selectedCategory = this.normalizeCategoryName(categorySelect ? categorySelect.value : '');
    const profileCategory = selectedCategory || 'General';

    if (!profileName) {
      profileName = `Profile_${this.controller.profiles.length + 1}`;
    }

    const currentSettings = {
      brightness: this.controller.settings.brightness,
      contrast: this.controller.settings.contrast,
      saturation: this.controller.settings.saturation,
      gamma: this.controller.settings.gamma,
      colorTemp: this.controller.settings.colorTemp,
      sharpness: this.controller.settings.sharpness
    };

    // Validate settings first (prevent saving if out-of-range)
    const invalid = this.validateSettings(currentSettings);
    if (invalid) {
      // invalid: show orange error
      this.updateActiveStatus('Invalid value entered', '#bb531e');
      return;
    }

    // Validate name: length and presence
    const nameValidation = this.validateProfileName(profileName);
    if (!nameValidation.valid) {
      // show appropriate error (red)
      this.updateActiveStatus(nameValidation.msg, '#ff4d4f');
      return;
    }

    // Check if profile name already exists
    const existingProfileIndex = this.controller.profiles.findIndex((p) => p.name === profileName);
    // Check if main save button indicates editing a built-in
    const mainSaveBtn = container.querySelector('#save-profile');
    const editBuiltinIndexMain =
      mainSaveBtn &&
      mainSaveBtn.dataset &&
      typeof mainSaveBtn.dataset.editBuiltinIndex !== 'undefined'
        ? parseInt(mainSaveBtn.dataset.editBuiltinIndex)
        : null;
    const editTypeMain = mainSaveBtn && mainSaveBtn.dataset ? mainSaveBtn.dataset.editType : null;
    if (existingProfileIndex !== -1) {
      // Ask user to confirm overwrite
      this.showOverwriteModal(
        profileName,
        () => {
          try {
            this.controller.profiles[existingProfileIndex].settings = this.sanitizeSettings({
              ...currentSettings,
              autoActivate: this.controller.settings.autoActivate
            });
            this.controller.profiles[existingProfileIndex].profileCategory = profileCategory;
            console.log('Vivideo: Profile overwritten:', profileName);

            // proceed with save flow (same as new profile path)
            const existing = this.controller.profiles[existingProfileIndex];
            this.controller.settings.activeProfile = existing.id || existing.name;
            this.controller.saveProfiles();
            this.controller.saveSettings();
            this.controller.saveAppState();

            // Update UI
            this.updateProfilesList(this.controller.container);
            this.updateActiveProfileDisplay(this.controller.container, this.controller.settings);
            if (nameInput) nameInput.value = '';
            this.isEditingProfile = false;
            this.editingIndex = null;
          } catch (e) {
            console.warn('Vivideo: overwrite confirm handler failed', e);
            try {
              this.updateActiveStatus('Unknown error!', 'error');
            } catch (err) {
              console.warn('Vivideo: updateActiveStatus failed', err);
            }
          }
        },
        () => {
          // cancel
          this.updateActiveStatus('Canceled', '');
        }
      );

      // return early - action will continue in confirm callback
      return;
    } else {
      // If main save indicates editing a built-in, update built-in in place
      if (
        editBuiltinIndexMain !== null &&
        editBuiltinIndexMain >= 0 &&
        editTypeMain === 'builtin'
      ) {
        const bp = this.defaultProfiles[editBuiltinIndexMain];
        if (bp) {
          bp.name = profileName;
          bp.settings = this.sanitizeSettings({
            ...currentSettings,
            autoActivate: this.controller.settings.autoActivate
          });
          console.log('Vivideo: Edited built-in profile via main save:', profileName);
        }
      } else {
        // Create new profile
        const profile = {
          id: this.generateProfileId(),
          name: profileName,
          profileCategory,
          settings: this.sanitizeSettings({
            ...currentSettings,
            autoActivate: this.controller.settings.autoActivate
          })
        };
        this.controller.profiles.push(profile);
        console.log('Vivideo: Profile saved:', profileName);
        // Use the generated id as the activeProfile reference
        this.controller.settings.activeProfile = profile.id;
        // Clear any status
        this.updateActiveStatus(profileName === 'Default' ? 'DEFAULT' : profileName, '');
      }
    }

    if (!this.profileCategories.includes(profileCategory)) {
      this.profileCategories.push(profileCategory);
      this.profileCategories.sort((a, b) => a.localeCompare(b));
    }
    this.controller.saveProfiles();
    this.controller.saveSettings();
    this.controller.saveAppState();

    // Update profiles list
    this.updateProfilesList(container);
    this.updateActiveProfileDisplay(container, this.controller.settings);
    nameInput.value = '';
    // clear editing state (if save was from edit mode)
    this.isEditingProfile = false;
    this.editingIndex = null;
    // clear main save button edit markers if present
    try {
      const mainSaveBtn = container.querySelector('#save-profile');
      if (mainSaveBtn) {
        delete mainSaveBtn.dataset.editIndex;
        delete mainSaveBtn.dataset.editBuiltinIndex;
        delete mainSaveBtn.dataset.editType;
      }
    } catch (e) {
      // ensure edit-mode UI cleared after main save
      try {
        if (this.controller && this.controller.container) {
          this.controller.container.classList.remove('vivideo-edit-mode-active');
          const profileFormPanel = this.controller.container.querySelector('#profile-form-panel');
          if (profileFormPanel) profileFormPanel.style.display = 'block';
        }
      } catch (err) {
        console.warn('Vivideo: clearing edit-mode after main save failed', err);
      }
      console.warn('Vivideo: Clearing save markers failed', e);
    }
  }

  // Save profile from the profile form
  saveProfileForm(container) {
    const input = container.querySelector('#profile-display-name-input');
    if (!input) return;
    let name = input.value.trim();
    const editBtn = container.querySelector('#profile-form-save-button');
    const editIndex =
      editBtn && editBtn.dataset && typeof editBtn.dataset.editIndex !== 'undefined'
        ? parseInt(editBtn.dataset.editIndex)
        : null;
    const editBuiltinIndex =
      editBtn && editBtn.dataset && typeof editBtn.dataset.editBuiltinIndex !== 'undefined'
        ? parseInt(editBtn.dataset.editBuiltinIndex)
        : null;
    const editType = editBtn && editBtn.dataset ? editBtn.dataset.editType : null;
    // Quick form doesn't include category selector; default to General
    const profileCategory = 'General';

    if (!name) {
      // show red error only on save attempt
      this.updateActiveStatus('Profile name is required', '#ff4d4f');
      return;
    }

    // Trim name if too long
    if (name.length > 16) {
      this.updateActiveStatus('Profile name cannot exceed 16 characters', '#ff4d4f');
      return;
    }

    const currentSettings = {
      brightness: this.controller.settings.brightness,
      contrast: this.controller.settings.contrast,
      saturation: this.controller.settings.saturation,
      gamma: this.controller.settings.gamma,
      colorTemp: this.controller.settings.colorTemp,
      sharpness: this.controller.settings.sharpness,
      speed: this.controller.settings.speed
    };

    // Validate settings ranges
    const invalid = this.validateSettings(currentSettings);
    if (invalid) {
      this.updateActiveStatus('Invalid value entered', '#bb531e');
      return;
    }

    // Check duplicate name
    const existingIndex = this.controller.profiles.findIndex((p) => p.name === name);

    if (existingIndex !== -1 && existingIndex !== editIndex) {
      // Will overwrite different existing profile - inform user (orange) and overwrite
      this.controller.profiles[existingIndex].settings = this.sanitizeSettings({
        ...currentSettings,
        autoActivate: this.controller.settings.autoActivate
      });
      this.controller.profiles[existingIndex].profileCategory = profileCategory;
      console.log('Vivideo: Profile overwrite (existing):', name);
      this.updateActiveStatus(`You will overwrite ${name}`, '#bb531e');
      // Prefer id reference for active profile when available
      const existing = this.controller.profiles[existingIndex];
      this.controller.settings.activeProfile = existing.id || existing.name;
    } else if (editIndex !== null && editIndex >= 0) {
      // Overwrite the profile we're editing
      this.controller.profiles[editIndex].name = name;
      this.controller.profiles[editIndex].settings = this.sanitizeSettings({
        ...currentSettings,
        autoActivate: this.controller.settings.autoActivate
      });
      this.controller.profiles[editIndex].profileCategory = profileCategory;
      console.log('Vivideo: Profile overwrite (edit):', name);
      this.controller.settings.activeProfile = this.controller.profiles[editIndex].id || name;
    } else if (editBuiltinIndex !== null && editBuiltinIndex >= 0 && editType === 'builtin') {
      // Edit built-in profile in place
      const bp = this.defaultProfiles[editBuiltinIndex];
      if (bp) {
        bp.name = name;
        bp.settings = this.sanitizeSettings({
          ...currentSettings,
          autoActivate: this.controller.settings.autoActivate
        });
        console.log('Vivideo: Edited built-in profile:', name);
        this.controller.settings.activeProfile = name;
      }
    } else {
      // Create new profile
      const newProfile = {
        id: this.generateProfileId(),
        name,
        profileCategory,
        settings: this.sanitizeSettings({
          ...currentSettings,
          autoActivate: this.controller.settings.autoActivate
        })
      };
      this.controller.profiles.push(newProfile);
      console.log('Vivideo: Profile saved:', name);
      this.controller.settings.activeProfile = newProfile.id;
      this.updateActiveStatus(name, '');
    }

    this.controller.saveProfiles();
    this.controller.saveSettings();
    this.controller.saveAppState();

    // Update UI
    this.updateProfilesList(container);
    this.updateActiveProfileDisplay(container, this.controller.settings);

    // Clear edit markers from button
    if (editBtn) {
      delete editBtn.dataset.editIndex;
      delete editBtn.dataset.editBuiltinIndex;
      delete editBtn.dataset.editType;
    }
    // clear editing state
    this.isEditingProfile = false;
    this.editingIndex = null;
    // remove edit-mode active class so overwrite buttons hide
    if (this.controller && this.controller.container) {
      this.controller.container.classList.remove('vivideo-edit-mode-active');
      const editModePanel = this.controller.container.querySelector('#edit-mode-panel');
      if (editModePanel) editModePanel.style.display = 'block';
    }
  }

  editProfile(index) {
    const profile = this.controller.profiles[index];
    if (!profile) return;
    const newName = prompt('Edit profile name:', profile.name);
    if (!newName) return;
    profile.name = newName.trim();
    this.controller.saveProfiles();
    this.updateProfilesList(this.controller.container);
  }

  toggleCompareMode(container, enabled) {
    const compareControls = container.querySelector('#compare-controls');
    const compareSelect = container.querySelector('#compare-profile-select');

    if (enabled) {
      // Show compare controls
      compareControls.style.display = 'block';

      // Populate profile select
      this.populateCompareSelect(compareSelect);

      // Enable compare mode in controller
      this.controller.settings.compareMode = true;
      this.controller.settings.compareProfile = null;

      console.log('Vivideo: Compare mode enabled');
    } else {
      // Hide compare controls
      compareControls.style.display = 'none';

      // Disable compare mode in controller
      this.controller.settings.compareMode = false;
      this.controller.settings.compareProfile = null;

      // Reset video filters to normal
      this.controller.applyFilters();

      console.log('Vivideo: Compare mode disabled');
    }

    // Save settings
    this.controller.saveSettings();
  }

  selectCompareProfile(container, profileId) {
    if (!profileId) {
      this.controller.settings.compareProfile = null;
      this.controller.applyFilters();
      return;
    }

    // Find the selected profile
    let selectedProfile = null;

    // Check if it's DEFAULT profile
    if (profileId === 'DEFAULT') {
      selectedProfile = this.controller.defaultProfile;
    }
    // Check profile list (match by id first, fallback to name)
    else {
      // Use a simple loop to avoid formatting/lint issues with inline arrow functions
      for (let i = 0; i < (this.controller.profiles || []).length; i++) {
        const p = this.controller.profiles[i];
        if ((p.id && p.id === profileId) || p.name === profileId) {
          selectedProfile = p;
          break;
        }
      }

      // Check default profiles if not found in profile list
      if (!selectedProfile) {
        const defaultProfiles = this.defaultProfiles || this.createDefaultProfiles();
        selectedProfile = defaultProfiles.find((p) => p.name === profileId);
      }
    }

    if (selectedProfile) {
      this.controller.settings.compareProfile = selectedProfile;
      this.controller.applyCompareFilters();
      console.log('Vivideo: Compare profile selected:', selectedProfile.name);
    }

    // Save settings
    this.controller.saveSettings();
  }

  populateCompareSelect(selectElement) {
    selectElement.innerHTML = '<option value="">Select profile to compare...</option>';

    // Add DEFAULT profile
    const defaultOption = document.createElement('option');
    defaultOption.value = 'DEFAULT';
    defaultOption.textContent = 'DEFAULT';
    selectElement.appendChild(defaultOption);

    // Add profile list
    if (this.controller.profiles.length > 0) {
      const groupedProfiles = {};
      this.controller.profiles.forEach((profile) => {
        const categoryName = this.getProfileCategory(profile);
        if (!groupedProfiles[categoryName]) groupedProfiles[categoryName] = [];
        groupedProfiles[categoryName].push(profile);
      });
      this.getOrderedUserCategories().forEach((categoryName) => {
        const profiles = groupedProfiles[categoryName] || [];
        if (profiles.length === 0) return;
        const userGroup = document.createElement('optgroup');
        userGroup.label = `👤 ${categoryName}`;
        profiles.forEach((profile) => {
          const option = document.createElement('option');
          option.value = profile.id || profile.name;
          option.textContent = profile.name;
          userGroup.appendChild(option);
        });
        selectElement.appendChild(userGroup);
      });
    }

    // Add default profiles
    const defaultProfiles = this.defaultProfiles || this.createDefaultProfiles();
    const defaultGroup = document.createElement('optgroup');
    defaultGroup.label = '⭐ Default Profiles';

    // Skip first one (DEFAULT) as it's already added
    defaultProfiles.slice(1).forEach((profile) => {
      const option = document.createElement('option');
      option.value = profile.name;
      option.textContent = `${profile.name} - ${profile.description}`;
      defaultGroup.appendChild(option);
    });

    selectElement.appendChild(defaultGroup);
  }

  // Validate numeric settings; return true if invalid
  validateSettings(settings) {
    // reasonable safe limits
    const absLimit = 100000; // hard cap to prevent insane devtools values
    if (!settings) return false;
    const { brightness, contrast, saturation, gamma, colorTemp, sharpness, speed } = settings;

    if (
      Math.abs(brightness) > absLimit ||
      Math.abs(contrast) > absLimit ||
      Math.abs(saturation) > absLimit ||
      Math.abs(sharpness) > absLimit ||
      Math.abs(colorTemp) > absLimit
    ) {
      return true;
    }

    // gamma sensible limits
    if (typeof gamma === 'number' && (gamma <= 0 || gamma > 1000)) return true;
    if (typeof speed === 'number' && (speed <= 0 || speed > 1000)) return true;

    return false;
  }

  // Validate profile name; return {valid,msg}
  validateProfileName(name) {
    if (!name || name.length === 0) return { valid: false, msg: 'Profile name is required' };
    if (name.length > 16) return { valid: false, msg: 'Profile name cannot exceed 16 characters' };
    return { valid: true };
  }

  // Update active profile status element with message and optional color
  updateActiveStatus(message, color) {
    try {
      const el =
        this.controller && this.controller.container && this.controller.container.querySelector
          ? this.controller.container.querySelector('#active-profile-display')
          : document.querySelector('#active-profile-display');
      if (!el) return;
      // update message
      if (typeof message !== 'undefined' && message !== null) el.textContent = message;

      // normalize and remove warning/error/editing classes first
      el.classList.remove(
        'active-item-status active-item-status-warning-warning',
        'active-item-status active-item-status-warning-error',
        'active-item-status active-item-status-warning-editing'
      );

      // Interpret color parameter as either a hex color or a semantic type
      const param = color || '';
      if (param === '#bb531e' || param === 'warning') {
        el.classList.add('active-item-status active-item-status-warning-warning');
        el.style.color = '';
      } else if (param === '#ff4d4f' || param === 'error') {
        el.classList.add('active-item-status active-item-status-warning-error');
        el.style.color = '';
      } else if (message === 'EDITING') {
        el.classList.add('active-item-status active-item-status-warning-editing');
        el.style.color = '';
      } else {
        // clear inline color and leave visual state to other classes
        el.style.color = '';
      }
    } catch (e) {
      console.warn('Vivideo: updateActiveStatus failed', e);
    }
  }

  isDefaultProfile(settings) {
    return (
      settings.brightness === 0 &&
      settings.contrast === 0 &&
      settings.saturation === 0 &&
      settings.gamma === 1 &&
      settings.colorTemp === 0 &&
      settings.sharpness === 0
    );
  }

  isProfileModified(settings, profiles) {
    if (settings.activeProfile) {
      const activeProfile = profiles.find((p) => p.name === settings.activeProfile);
      if (activeProfile) {
        return !this.profilesMatch(settings, activeProfile.settings);
      }
    }
    return !this.isDefaultProfile(settings);
  }

  profilesMatch(settings1, settings2) {
    const keys = [
      'brightness',
      'contrast',
      'saturation',
      'gamma',
      'colorTemp',
      'sharpness',
      'speed'
    ];
    return keys.every((key) => settings1[key] === settings2[key]);
  }

  // Auto-detect profile based on current settings
  autoDetectProfile(settings) {
    // First check default profiles
    const defaultProfiles = this.defaultProfiles || this.createDefaultProfiles();
    for (const profile of defaultProfiles) {
      if (this.profilesMatch(settings, profile.settings)) {
        console.log('Vivideo: Auto-detected default profile:', profile.name);
        return { profile, isDefault: true };
      }
    }

    // Then check profile list
    for (const profile of this.controller.profiles) {
      if (this.profilesMatch(settings, profile.settings)) {
        console.log('Vivideo: Auto-detected user profile:', profile.name);
        return { profile, isDefault: false };
      }
    }

    // Check if it matches the neutral DEFAULT profile
    if (this.isDefaultProfile(settings)) {
      console.log('Vivideo: Auto-detected neutral DEFAULT profile');
      return { profile: this.controller.defaultProfile, isDefault: true };
    }

    return null;
  }

  // Markup for overwrite confirmation modal is injected into createProfilesHTML output.

  // Check if current settings match any existing profile to prevent duplicates
  findMatchingProfile(settings) {
    const detection = this.autoDetectProfile(settings);
    return detection ? detection.profile : null;
  }

  // Return all profiles (default + user) that match the given settings
  findAllMatchingProfiles(settings) {
    const matches = [];
    const defaultProfiles = this.defaultProfiles || this.createDefaultProfiles();

    // Check default profiles
    for (const profile of defaultProfiles) {
      if (this.profilesMatch(settings, profile.settings)) {
        matches.push({ profile, isDefault: true });
      }
    }

    // Check profile list
    for (const profile of this.controller.profiles || []) {
      if (this.profilesMatch(settings, profile.settings)) {
        matches.push({ profile, isDefault: false });
      }
    }

    // If settings are neutral and controller.defaultProfile exists, include it only if not already present
    if (this.isDefaultProfile(settings) && this.controller && this.controller.defaultProfile) {
      const ref = this.controller.defaultProfile.id
        ? this.controller.defaultProfile.id
        : this.controller.defaultProfile.name;
      const already = matches.some((m) => {
        const r = m.profile && (m.profile.id ? m.profile.id : m.profile.name);
        return r === ref;
      });
      if (!already) matches.push({ profile: this.controller.defaultProfile, isDefault: true });
    }

    // Remove duplicates by profile ref (id or name)
    const unique = [];
    const seen = new Set();
    for (const m of matches) {
      const ref = m.profile && (m.profile.id ? m.profile.id : m.profile.name);
      if (!seen.has(ref)) {
        seen.add(ref);
        unique.push(m);
      }
    }

    return unique;
  }

  // Check whether current built-in default profiles exactly match canonical defaults
  areDefaultProfilesIntact() {
    try {
      const canonical = this.createDefaultProfiles();
      const current = this.defaultProfiles || [];
      for (const canon of canonical) {
        const found = current.find((p) => p.name === canon.name);
        if (!found) return false;
        // Compare key settings including speed and brightness
        const keys = [
          'brightness',
          'contrast',
          'saturation',
          'gamma',
          'colorTemp',
          'sharpness',
          'speed'
        ];
        for (const k of keys) {
          const a = typeof found.settings[k] === 'number' ? found.settings[k] : null;
          const b = typeof canon.settings[k] === 'number' ? canon.settings[k] : null;
          if (a !== b) return false;
        }
      }
      return true;
    } catch (e) {
      console.warn('Vivideo: areDefaultProfilesIntact check failed', e);
      return false;
    }
  }

  // Helper methods to determine profile type
  isCurrentProfileDefault() {
    if (!this.controller.settings.activeProfile) {
      return this.isDefaultProfile(this.controller.settings);
    }

    const defaultProfiles = this.defaultProfiles || this.createDefaultProfiles();
    return defaultProfiles.some((p) => p.name === this.controller.settings.activeProfile);
  }

  isCurrentProfileUser() {
    if (!this.controller.settings.activeProfile) {
      return false;
    }

    return this.controller.profiles.some((p) => p.name === this.controller.settings.activeProfile);
  }

  updateActiveProfileDisplay(container, settings) {
    const profileDisplay = container.querySelector('#active-profile-display');
    if (!profileDisplay) return;

    // Force re-check of active profile state
    setTimeout(() => {
      // Find all matching profiles (defaults + user)
      const matches = this.findAllMatchingProfiles(settings) || [];

      if (matches.length > 0) {
        const names = [...new Set(matches.map((m) => (m.profile && m.profile.name) || ''))].filter(
          Boolean
        );

        // Prefer the match that corresponds to the current activeProfile ref (if present)
        let primaryIndex = 0;
        if (settings && settings.activeProfile) {
          const idx = matches.findIndex((m) => {
            const ref = m.profile && (m.profile.id ? m.profile.id : m.profile.name);
            return ref === settings.activeProfile;
          });
          if (idx !== -1) primaryIndex = idx;
        }

        const primary = matches[primaryIndex].profile;
        const primaryRef = primary && (primary.id ? primary.id : primary.name);

        // If there was no activeProfile or it didn't match any found profile, set it to the primary
        const activeRefMatches = matches.some((m) => {
          const ref = m.profile && (m.profile.id ? m.profile.id : m.profile.name);
          return ref === settings.activeProfile;
        });
        if (!activeRefMatches) {
          this.controller.settings.activeProfile = primaryRef;
          this.controller.saveSettings();
          this.controller.saveAppState();
        }

        // Show primary profile in the active-item section (do not display duplicate text here)
        profileDisplay.textContent =
          typeof primary.name === 'string' && primary.name.toUpperCase() === 'DEFAULT'
            ? 'DEFAULT'
            : primary.name;
        profileDisplay.className =
          typeof primary.name === 'string' && primary.name.toUpperCase() === 'DEFAULT'
            ? 'active-item-status-default'
            : 'active-item-status-active';

        // If there are multiple matches, show duplicate warning under the profile form header
        if (matches.length > 1) {
          const namesText = names.join(', ');
          // Prefer to show the warning under the compact profile form header if available
          const profileForm =
            container.querySelector(
              '.vivideo-profile-form.vivideo-profile-form-compact'
            );
          if (profileForm) {
            let dupEl = profileForm.querySelector('#vivideo-duplicate-warning');
            if (!dupEl) {
              dupEl = document.createElement('div');
              dupEl.id = 'vivideo-duplicate-warning';
              dupEl.className = 'vivideo-duplicate-warning';
              const header = profileForm.querySelector('.vivideo-box-header');
              if (header && header.parentNode)
                header.parentNode.insertBefore(dupEl, header.nextSibling);
              else profileForm.insertBefore(dupEl, profileForm.firstChild);
            }
            dupEl.textContent = `Duplicated profiles: ${namesText}`;
          } else {
            // Fallback: place in controls section
            const controlsSection = container.querySelector('.vivideo-controls-section');
            if (controlsSection) {
              let dupEl = controlsSection.querySelector('#vivideo-duplicate-warning');
              if (!dupEl) {
                dupEl = document.createElement('div');
                dupEl.id = 'vivideo-duplicate-warning';
                dupEl.className = 'vivideo-duplicate-warning';
                controlsSection.insertBefore(dupEl, controlsSection.firstChild);
              }
              dupEl.textContent = `Duplicated profiles: ${namesText}`;
            }
          }
        } else {
          // Remove duplicate warning if present from profile form or controls section
          const profileForm =
            container.querySelector(
              '.vivideo-profile-form.vivideo-profile-form-compact'
            );
          if (profileForm) {
            const dupEl = profileForm.querySelector('#vivideo-duplicate-warning');
            if (dupEl) dupEl.remove();
          }
          const controlsSection = container.querySelector('.vivideo-controls-section');
          if (controlsSection) {
            const dupEl = controlsSection.querySelector('#vivideo-duplicate-warning');
            if (dupEl) dupEl.remove();
          }
        }

        // Update profile list and ensure profile form panel visible
        this.controller.updateProfilesList();
        const profileFormPanel = container.querySelector('#profile-form-panel');
        if (profileFormPanel) profileFormPanel.style.display = 'block';
        if (this.controller && this.controller.container) {
          if (this.isEditingProfile) {
            this.controller.container.classList.add('vivideo-edit-mode-active');
          } else {
            this.controller.container.classList.remove('vivideo-edit-mode-active');
          }
        }
      } else {
        // Settings don't match any existing profile
        profileDisplay.textContent = 'NOT SAVED';
        profileDisplay.className = 'active-item-status-modified';

        // Clear active profile since settings don't match any profile
        if (settings.activeProfile) {
          this.controller.settings.activeProfile = null;
          this.controller.saveSettings();
          this.controller.saveAppState();
        }

        // Remove duplicate warning if present
        const controlsSection = container.querySelector('.vivideo-controls-section');
        if (controlsSection) {
          const dupEl = controlsSection.querySelector('#vivideo-duplicate-warning');
          if (dupEl) dupEl.remove();
        }

        // Ensure profile form panel visible; toggle edit-mode active class
        const profileFormPanel2 = container.querySelector('#profile-form-panel');
        if (profileFormPanel2) profileFormPanel2.style.display = 'block';
        if (this.controller && this.controller.container) {
          if (this.isEditingProfile) {
            this.controller.container.classList.add('vivideo-edit-mode-active');
          } else {
            this.controller.container.classList.remove('vivideo-edit-mode-active');
          }
        }
      }
    }, 10);
  }

  // Profile switching methods for keyboard shortcuts
  nextProfile() {
    console.log('Vivideo: Next profile shortcut (Alt+B)');
    // Build combined list of profiles: built-in defaults first, then profile list
    const combined = [...this.defaultProfiles, ...(this.controller.profiles || [])];

    if (!Array.isArray(combined) || combined.length === 0) {
      console.log('Vivideo: No profiles to cycle through');
      return;
    }

    // Find current profile index within combined list (support id or name references)
    let currentIndex = -1;
    for (let i = 0; i < combined.length; i++) {
      if (this.getProfileRef(combined[i]) === this.controller.settings.activeProfile) {
        currentIndex = i;
        break;
      }
    }
    // If activeProfile not set or not found, try locating DEFAULT
    if (currentIndex === -1) {
      currentIndex = combined.findIndex((p) => p.name === 'DEFAULT');
    }
    // If still -1, start at end so nextIndex becomes 0
    if (currentIndex === -1) currentIndex = combined.length - 1;

    const nextIndex = (currentIndex + 1) % combined.length;

    // Add animation for active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-next');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-next');
      }, 400);
    }

    // Load the target profile
    const targetProfile = combined[nextIndex];
    console.log('Vivideo: Switching to next profile:', targetProfile && targetProfile.name);
    if (targetProfile) this.controller.loadProfile(targetProfile);

    // Show notification if enabled
    if (this.showProfileAfterChange) {
      this.showProfileNotification(targetProfile.name);
    }
  }

  previousProfile() {
    console.log('Vivideo: Previous profile shortcut (Alt+C)');

    // Build combined list of profiles: built-in defaults first, then profile list
    const combined = [...this.defaultProfiles, ...(this.controller.profiles || [])];

    if (!Array.isArray(combined) || combined.length === 0) {
      console.log('Vivideo: No profiles to cycle through');
      return;
    }

    // Find current profile index within combined list (support id or name references)
    let currentIndex = -1;
    for (let i = 0; i < combined.length; i++) {
      if (this.getProfileRef(combined[i]) === this.controller.settings.activeProfile) {
        currentIndex = i;
        break;
      }
    }
    // If activeProfile not set or not found, try locating DEFAULT
    if (currentIndex === -1) {
      currentIndex = combined.findIndex((p) => p.name === 'DEFAULT');
    }
    // If still -1, set to 0 so prevIndex becomes last
    if (currentIndex === -1) currentIndex = 0;

    const prevIndex = currentIndex === 0 ? combined.length - 1 : currentIndex - 1;

    // Add animation for active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-prev');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-prev');
      }, 400);
    }

    // Load the target profile
    const targetProfile = combined[prevIndex];
    console.log('Vivideo: Switching to previous profile:', targetProfile && targetProfile.name);
    if (targetProfile) this.controller.loadProfile(targetProfile);

    // Show notification if enabled
    if (this.showProfileAfterChange) {
      this.showProfileNotification(targetProfile.name);
    }
  }

  // Quick access to DEFAULT profile with toggle functionality
  setDefaultProfile() {
    console.log('Vivideo: DEFAULT profile toggle (Alt+M)');

    const defaultProfile = this.controller.defaultProfile;

    // If current profile is DEFAULT, toggle to previous profile
    if (this.currentProfile === defaultProfile && this.previousProfile) {
      console.log('Vivideo: Current is DEFAULT, switching to previous:', this.previousProfile.name);
      this.currentProfile = this.previousProfile;

      // Load the previous profile
      this.controller.loadProfile(this.currentProfile);

      // Store DEFAULT as previous
      this.previousProfile = defaultProfile;
    } else {
      // Store current profile as previous before switching to DEFAULT
      if (this.currentProfile && this.currentProfile !== defaultProfile) {
        this.previousProfile = this.currentProfile;
        console.log('Vivideo: Storing previous profile:', this.previousProfile.name);
      }

      console.log('Vivideo: Switching to DEFAULT profile');
      this.currentProfile = defaultProfile;

      // Load DEFAULT profile
      this.controller.loadProfile(this.controller.defaultProfile);
    }

    // Add animation for active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-default');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-default');
      }, 400);
    }

    // Show notification if enabled
    if (this.showProfileAfterChange) {
      const profileName =
        this.currentProfile.name === 'Default' ? 'DEFAULT' : this.currentProfile.name;
      this.showProfileNotification(profileName);
    }
  }

  // Enhanced fullscreen detection for YouTube
  isVideoFullscreen() {
    // Standard fullscreen API
    const standardFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    // YouTube specific fullscreen detection
    const ytPlayerFullscreen =
      document.querySelector('.html5-video-player.ytp-fullscreen') !== null;

    // Video element specific fullscreen
    const videoElement = document.querySelector('video');
    const videoFullscreen =
      videoElement &&
      (videoElement.webkitDisplayingFullscreen ||
        videoElement.mozDisplayingFullscreen ||
        (videoElement.offsetWidth === screen.width && videoElement.offsetHeight === screen.height));

    // Theater mode (not fullscreen but might be useful for positioning)
    const theaterMode = document.querySelector('.html5-video-player.ytp-large-width-mode') !== null;

    const result = standardFullscreen || ytPlayerFullscreen || videoFullscreen;

    if (result) {
      console.log('Vivideo: Fullscreen mode detected:', {
        standard: standardFullscreen,
        youtube: ytPlayerFullscreen,
        video: videoFullscreen,
        theater: theaterMode
      });
    }

    return result;
  }

  // Show profile change notification
  showProfileNotification(profileName) {
    console.log('Vivideo: Showing profile notification for:', profileName);

    // Use enhanced fullscreen detection
    const isFullscreen = this.isVideoFullscreen();

    // Create or get notification element
    let notification = document.querySelector('#vivideo-profile-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'vivideo-profile-notification';
      notification.className = 'vivideo-notification';
      const zIndex = isFullscreen ? '2147483647' : '10000';
      notification.style.zIndex = zIndex;
      document.body.appendChild(notification);
    } else {
      // Update z-index for existing notification
      const zIndex = isFullscreen ? '2147483647' : '10000';
      notification.style.zIndex = zIndex;
    }

    // Update content and show
    notification.innerHTML = `
      <div class="vivideo-notification-content">
        <span class="vivideo-notification-icon">🎥</span>
        <span>Profile: <strong>${profileName}</strong></span>
        ${isFullscreen ? '<span class="vivideo-notification-fullscreen">(Fullscreen)</span>' : ''}
      </div>
    `;

    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });

    // Auto-hide after duration (longer in fullscreen for better visibility)
    const hideDelay = isFullscreen ? 3000 : 2000;
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, hideDelay);
  }
}

// Export for use in other files
window.ProfileManager = ProfileManager;
