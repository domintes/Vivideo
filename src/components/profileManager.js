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
  }

  createDefaultProfiles() {
    // Simplified - only one default profile with neutral settings
    return [
      {
        name: 'Default',
        description: 'Neutral settings (no changes)',
        settings: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          gamma: 1,
          colorTemp: 0,
          sharpness: 0,
          speed: 1.0,
          speedStep: 0.25,
          autoActivate: true
        }
      }
    ];
  }

  createProfilesHTML() {
    return /*html*/ `
      <!-- Profiles Section -->
      <div class="vivideo-bottom-controls">
        <div class="control-buttons">
          <button class="vivideo-control-btn themes-btn" id="themes-btn" title="Themes">Themes</button>
          <button class="vivideo-control-btn settings-btn" id="settings-btn" title="Import/Export settings">⚙️</button>
        </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <div class="active-item-status active-profile-status" id="active-profile-display">DEFAULT</div>

            <!-- Unsaved quick-save row (shown when settings are not saved) -->
            <div id="unsaved-save-panel" style="display: none; width:100%;">
              <div class="vivideo-profile-form" style="display:flex;flex-direction:column;gap:6px;">
                <div class="profile-panel-header">🛠️ Create Profile</div>
                <div style="display:grid;grid-template-columns:3fr 1fr;gap:6px;align-items:center;">
                  <input type="text" id="unsaved-profile-name" class="vivideo-profile-input" placeholder="New profile" style="width:100%;padding:6px 8px;">
                  <button id="unsaved-save-btn" class="vivideo-profile-save">💾</button>
                </div>
              </div>
              <!-- Overwrite confirmation modal -->
              <div id="overwrite-confirm-modal" class="vivideo-modal" style="display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483700;padding:12px;background:rgba(0,0,0,0.9);border:1px solid rgba(255,255,255,0.06);border-radius:8px;min-width:260px;max-width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
                <div class="overwrite-message" style="margin-bottom:10px;color:#fff;font-weight:600;font-size:13px;"></div>
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                  <button class="overwrite-cancel" style="padding:6px 10px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,0.08);color:#fff;">Cancel</button>
                  <button class="overwrite-confirm" style="padding:6px 10px;border-radius:6px;background:#bb531e;border:none;color:#fff;">Overwrite</button>
                </div>
              </div>
            </div>
          </div>
      </div>

      <!-- Profiles Panel -->
      <div class="vivideo-profiles" id="profiles-panel">
        <div class="profile-panel-header">
          🎥 Video Profiles
            <!-- removed "Display default profiles" option - simplified single default profile model -->
        </div>
        <div class="vivideo-profile-list" id="profile-list"></div>
        <!-- Profile Save Form -->
        <div class="vivideo-profile-save-section">
          <div class="vivideo-profile-form" style="display:flex;flex-direction:column;gap:6px;">
            <div class="profile-panel-header">🛠️ Create Profile</div>
            <div style="display:grid;grid-template-columns:3fr 1fr;gap:6px;align-items:center;">
              <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profile_1" style="width:100%;">
              <button class="vivideo-profile-save" id="save-profile" data-overwrite="false">💾</button>
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
            <button class="vivideo-info-icon" data-info="Display profile name for 3 seconds after switching">i</button>
          </label>
        </div>

        <div class="vivideo-switch-row">
          <label class="vivideo-switch-container">
            <input type="checkbox" id="work-on-all-sites-checkbox" class="vivideo-switch-input">
            <span class="vivideo-switch-track"></span>
            <span class="vivideo-switch-label">Work on all websites</span>
            <button class="vivideo-info-icon" data-info="Apply video filters to all websites, not just YouTube">i</button>
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
            <button class="vivideo-info-icon" data-info="Split-screen profile comparison">i</button>
          </label>
        </div>
        
        <!-- Compare Profile Selection (hidden by default) -->
        <div class="vivideo-compare-controls" id="compare-controls" style="display: none;">
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
      const container = this.controller && this.controller.container ? this.controller.container : document.body;
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
        try { if (typeof onConfirm === 'function') onConfirm(); } catch (e) { console.warn(e); }
        cleanup();
      };

      const onCancelWrapper = () => {
        try { if (typeof onCancel === 'function') onCancel(); } catch (e) { console.warn(e); }
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
    // Themes button
    const themesBtn = UIHelper.safeQuery(container, '#themes-btn');
    if (themesBtn) {
      themesBtn.addEventListener('click', () => {
        this.showThemes(container);
      });
    }

    // Settings management button
    const settingsBtn = UIHelper.safeQuery(container, '#settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.controller.toggleSettingsManagement();
      });
    }

    const saveProfileBtn = UIHelper.safeQuery(container, '#save-profile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        this.saveCurrentProfile(container);
      });
    }

    // Unsaved quick-save handlers
    const unsavedSaveBtn = UIHelper.safeQuery(container, '#unsaved-save-btn');
    const unsavedInput = UIHelper.safeQuery(container, '#unsaved-profile-name');
    if (unsavedSaveBtn && unsavedInput) {
      unsavedSaveBtn.addEventListener('click', () => {
        this.saveUnsavedProfile(container);
      });

      unsavedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.saveUnsavedProfile(container);
        }
      });
      // live validation for unsaved input: show message if >16 chars or warn on duplicate
      unsavedInput.addEventListener('input', (e) => {
        const val = (e.target.value || '').trim();
        if (val.length > 16) {
          this.updateActiveStatus('Nazwa nie może mieć więcej niż 16 znaków', '#ff4d4f');
          return;
        }
        // duplicate check
        const exists = this.controller.profiles.some((p) => p.name === val);
        if (exists && val.length > 0) {
          this.updateActiveStatus(`You will overwrite ${val}`, '#bb531e');
          return;
        }
        // default editing state
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
          this.updateActiveStatus('Nazwa nie może mieć więcej niż 16 znaków', '#ff4d4f');
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

  // Update unified profiles list
  updateProfilesList(container) {
    const profileList = container.querySelector('#profile-list');
    if (!profileList) return;

    profileList.innerHTML = '';

    // Add User Profiles Section
    if (this.controller.profiles.length > 0) {
      const userSection = document.createElement('div');
      userSection.className = 'profile-section';
      userSection.innerHTML = '<div class="profile-section-header">👤 User Profiles</div>';
      profileList.appendChild(userSection);

      // Add user profiles
      this.controller.profiles.forEach((profile, index) => {
        const profileItem = document.createElement('div');
        profileItem.className = 'vivideo-profile-item user-profile';
        profileItem.setAttribute('data-index', index);
        const isActive = this.controller.settings.activeProfile === profile.name;
        if (isActive) profileItem.classList.add('vivideo-profile-active');

        const displayName =
          profile.name.length > 20 ? profile.name.substring(0, 17) + '...' : profile.name;

        profileItem.innerHTML = `
          <span class="vivideo-profile-name" title="${profile.name}">${displayName}</span>
          <button class="vivideo-profile-edit" data-index="${index}" title="Edit profile">✎</button>
          <button class="vivideo-profile-delete" data-index="${index}" title="Delete profile">✖</button>
        `;

        // Click loads profile immediately (but ignore clicks on edit/delete buttons)
        profileItem.addEventListener('click', (e) => {
          if (
            e.target.classList.contains('vivideo-profile-delete') ||
            e.target.classList.contains('vivideo-profile-edit') ||
            profileItem.classList.contains('editing')
          )
            return;
          e.preventDefault();
          e.stopPropagation();
          container
            .querySelectorAll('.vivideo-profile-item')
            .forEach((item) => item.classList.remove('vivideo-profile-active'));
          profileItem.classList.add('vivideo-profile-active');
          this.controller.loadProfile(profile);
        });

        // Edit button - open the unified profile form for editing (do NOT auto-save)
        const editBtn = profileItem.querySelector('.vivideo-profile-edit');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));

            // Load profile so user can tweak values while editing
            // If filterEngine not initialized yet, avoid calling loadProfile (prevents early applyFilters warning)
            try {
              if (this.controller && this.controller.filterEngine) {
                this.controller.loadProfile(this.controller.profiles[idx]);
              } else if (this.controller) {
                // Minimal safe apply: copy settings without triggering applyFilters
                const p = this.controller.profiles[idx];
                if (p && p.settings) {
                  Object.keys(p.settings).forEach((key) => {
                    if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
                      this.controller.settings[key] = p.settings[key];
                    }
                  });
                  if (p.settings.autoActivate !== undefined) {
                    this.controller.settings.autoActivate = p.settings.autoActivate;
                  }
                  // Update UI only (do not call applyFilters)
                  if (this.controller.videoControls) {
                    this.controller.videoControls.updateUI(this.controller.settings, this.controller.container);
                  }
                }
              }
            } catch (e) {
                    console.warn('Vivideo: Safe load profile failed', e);
                    try { this.updateActiveStatus('Unknown error!', 'error'); } catch (err) {}
            }

            // Show the profile save section (unified form) and populate it for editing
            const unsavedPanel = container.querySelector('#unsaved-save-panel');
            const unsavedInput = container.querySelector('#unsaved-profile-name');
            const unsavedSaveBtn = container.querySelector('#unsaved-save-btn');
            const mainProfileNameInput = container.querySelector('#profile-name');
            const mainSaveBtn = container.querySelector('#save-profile');

            // Ensure the correct panel is shown and header updated
            if (unsavedPanel) {
              const header = unsavedPanel.querySelector('.profile-panel-header');
              if (header) header.textContent = '✏️ Edit profile';
              unsavedPanel.style.display = 'block';
            }

            // Populate the quick-save input with current profile name
            if (unsavedInput) {
              unsavedInput.value = this.controller.profiles[idx].name || '';
              // attach edit index marker so save handler knows which profile to overwrite
              if (unsavedSaveBtn) unsavedSaveBtn.dataset.editIndex = String(idx);
              // focus for convenience
                setTimeout(() => unsavedInput.focus(), 40);
            }

            // Also populate main save input for consistency (if visible)
            if (mainProfileNameInput) mainProfileNameInput.value = this.controller.profiles[idx].name || '';
            if (mainSaveBtn) mainSaveBtn.dataset.editIndex = String(idx);

            // Mark editing state so auto-detection doesn't hide the edit form
            this.isEditingProfile = true;
            this.editingIndex = idx;
            // Clear status color/message until user attempts to save
            this.updateActiveStatus('EDITING', '');
          });
        }

        // Delete
        const deleteBtn = profileItem.querySelector('.vivideo-profile-delete');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            this.controller.deleteProfile(idx);
          });
        }

        profileList.appendChild(profileItem);
      });
    }

    // Add Default Built-in Section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'profile-section';
    defaultSection.innerHTML = '<div class="profile-section-header">🛠️ Default Built-in</div>';
    profileList.appendChild(defaultSection);

    // Add DEFAULT profile
    const defaultProfileItem = document.createElement('div');
    defaultProfileItem.className = 'vivideo-profile-item default-builtin';
    const isDefaultActive =
      !this.controller.settings.activeProfile ||
      this.controller.settings.activeProfile === 'DEFAULT';
    if (isDefaultActive) {
      defaultProfileItem.classList.add('vivideo-profile-active');
    }

    defaultProfileItem.innerHTML = `
      <span class="vivideo-profile-name">DEFAULT</span>
      <span class="vivideo-profile-badge">Built-in</span>
    `;

    // Default profile click loads immediately
    defaultProfileItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container
        .querySelectorAll('.vivideo-profile-item')
        .forEach((item) => item.classList.remove('vivideo-profile-active'));
      defaultProfileItem.classList.add('vivideo-profile-active');
      this.controller.loadProfile(this.controller.defaultProfile);
    });

    profileList.appendChild(defaultProfileItem);

    // Update placeholder for new profile name
    const profileNameInput = container.querySelector('#profile-name');
    if (profileNameInput) {
      profileNameInput.placeholder = `Profile_${this.controller.profiles.length + 1}`;
    }
  }

  // Show user profiles panel (compat for controller calls)
  showUserProfiles(container) {
    this.showingProfiles = true;
    if (container) {
      // Ensure profiles panel is rendered and active
      try {
        this.updateProfilesList(container);
        // ensure unsaved panel hidden unless editing
        const unsavedPanel = container.querySelector('#unsaved-save-panel');
        if (unsavedPanel && !this.isEditingProfile) unsavedPanel.style.display = 'none';
      } catch (e) {
        console.warn('Vivideo: showUserProfiles failed', e);
        try { this.updateActiveStatus('Unknown error!', 'error'); } catch (err) {}
      }
    }
  }

  saveCurrentProfile(container) {
    const nameInput = container.querySelector('#profile-name');
    let profileName = nameInput.value.trim();

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
      this.updateActiveStatus('Wprowadzono niedozwoloną wartość', '#bb531e');
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
    if (existingProfileIndex !== -1) {
      // Ask user to confirm overwrite
      this.showOverwriteModal(profileName, () => {
        try {
          this.controller.profiles[existingProfileIndex].settings = {
            ...currentSettings,
            autoActivate: this.controller.settings.autoActivate
          };
          console.log('Vivideo: Profile overwritten:', profileName);

          // proceed with save flow (same as new profile path)
          this.controller.settings.activeProfile = profileName;
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
          try { this.updateActiveStatus('Unknown error!', 'error'); } catch (err) {}
        }
      }, () => {
        // cancel
        this.updateActiveStatus('Canceled', '');
      });

      // return early - action will continue in confirm callback
      return;
    } else {
      // Create new profile
      const profile = {
        name: profileName,
        settings: {
          ...currentSettings,
          autoActivate: this.controller.settings.autoActivate
        }
      };
      this.controller.profiles.push(profile);
      console.log('Vivideo: Profile saved:', profileName);
      // Clear any status
      this.updateActiveStatus(profileName === 'Default' ? 'DEFAULT' : profileName, '');
    }

    this.controller.settings.activeProfile = profileName;
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
  }

  // Save profile from the unsaved quick-save input
  saveUnsavedProfile(container) {
    const input = container.querySelector('#unsaved-profile-name');
    if (!input) return;
    let name = input.value.trim();
    const editBtn = container.querySelector('#unsaved-save-btn');
    const editIndex = editBtn && editBtn.dataset && typeof editBtn.dataset.editIndex !== 'undefined'
      ? parseInt(editBtn.dataset.editIndex)
      : null;

    if (!name) {
      // show red error only on save attempt
      this.updateActiveStatus('Nazwa profilu jest wymagana', '#ff4d4f');
      return;
    }

    // Trim name if too long
    if (name.length > 16) {
      this.updateActiveStatus('Nazwa nie może mieć więcej niż 16 znaków', '#ff4d4f');
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
      this.updateActiveStatus('Wprowadzono niedozwoloną wartość', '#bb531e');
      return;
    }

    // Check duplicate name
    const existingIndex = this.controller.profiles.findIndex((p) => p.name === name);

    if (existingIndex !== -1 && existingIndex !== editIndex) {
      // Will overwrite different existing profile - inform user (orange) and overwrite
      this.controller.profiles[existingIndex].settings = currentSettings;
      console.log('Vivideo: Unsaved profile overwrite (existing):', name);
      this.updateActiveStatus(`You will overwrite ${name}`, '#bb531e');
      this.controller.settings.activeProfile = name;
    } else if (editIndex !== null && editIndex >= 0) {
      // Overwrite the profile we're editing
      this.controller.profiles[editIndex].name = name;
      this.controller.profiles[editIndex].settings = currentSettings;
      console.log('Vivideo: Unsaved profile overwrite (edit):', name);
      this.controller.settings.activeProfile = name;
    } else {
      // Create new profile
      this.controller.profiles.push({ name, settings: currentSettings });
      console.log('Vivideo: Unsaved profile saved:', name);
      this.controller.settings.activeProfile = name;
      this.updateActiveStatus(name, '');
    }

    this.controller.saveProfiles();
    this.controller.saveSettings();
    this.controller.saveAppState();

    // Update UI
    this.updateProfilesList(container);
    this.updateActiveProfileDisplay(container, this.controller.settings);

    // Hide quick-save panel and clear edit marker
    const panel = container.querySelector('#unsaved-save-panel');
    if (panel) panel.style.display = 'none';
    if (editBtn) delete editBtn.dataset.editIndex;
    // clear editing state
    this.isEditingProfile = false;
    this.editingIndex = null;
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
    // Check user profiles
    else {
      selectedProfile = this.controller.profiles.find((p) => p.name === profileId);

      // Check default profiles if not found in user profiles
      if (!selectedProfile) {
        const defaultProfiles = this.createDefaultProfiles();
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

    // Add user profiles
    if (this.controller.profiles.length > 0) {
      const userGroup = document.createElement('optgroup');
      userGroup.label = '👤 User Profiles';

      this.controller.profiles.forEach((profile) => {
        const option = document.createElement('option');
        option.value = profile.name;
        option.textContent = profile.name;
        userGroup.appendChild(option);
      });

      selectElement.appendChild(userGroup);
    }

    // Add default profiles
    const defaultProfiles = this.createDefaultProfiles();
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
    if (!name || name.length === 0) return { valid: false, msg: 'Nazwa profilu jest wymagana' };
    if (name.length > 16) return { valid: false, msg: 'Nazwa nie może mieć więcej niż 16 znaków' };
    return { valid: true };
  }

  // Update active profile status element with message and optional color
  updateActiveStatus(message, color) {
    try {
      const el = this.controller && this.controller.container && this.controller.container.querySelector
        ? this.controller.container.querySelector('#active-profile-display')
        : document.querySelector('#active-profile-display');
      if (!el) return;
      // update message
      if (typeof message !== 'undefined' && message !== null) el.textContent = message;

      // normalize and remove warning/error/editing classes first
      el.classList.remove('active-profile-status-warning', 'active-profile-status-error', 'active-profile-status-editing');

      // Interpret color parameter as either a hex color or a semantic type
      const param = color || '';
      if (param === '#bb531e' || param === 'warning') {
        el.classList.add('active-profile-status-warning');
        el.style.color = '';
      } else if (param === '#ff4d4f' || param === 'error') {
        el.classList.add('active-profile-status-error');
        el.style.color = '';
      } else if (message === 'EDITING') {
        el.classList.add('active-profile-status-editing');
        el.style.color = '';
      } else {
        // clear inline color and leave visual state to other classes
        el.style.color = '';
      }
    } catch (e) {
      // silent
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
    const keys = ['brightness', 'contrast', 'saturation', 'gamma', 'colorTemp', 'sharpness'];
    return keys.every((key) => settings1[key] === settings2[key]);
  }

  // Auto-detect profile based on current settings
  autoDetectProfile(settings) {
    // First check default profiles
    const defaultProfiles = this.createDefaultProfiles();
    for (const profile of defaultProfiles) {
      if (this.profilesMatch(settings, profile.settings)) {
        console.log('Vivideo: Auto-detected default profile:', profile.name);
        return { profile, isDefault: true };
      }
    }

    // Then check user profiles
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

  // Helper methods to determine profile type
  isCurrentProfileDefault() {
    if (!this.controller.settings.activeProfile) {
      return this.isDefaultProfile(this.controller.settings);
    }

    const defaultProfiles = this.createDefaultProfiles();
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
      // Try to auto-detect profile based on current settings
      const detection = this.autoDetectProfile(settings);

      if (detection) {
        // Settings match an existing profile - auto-select it
        if (settings.activeProfile !== detection.profile.name) {
          console.log('Vivideo: Auto-switching to detected profile:', detection.profile.name);
          this.controller.settings.activeProfile = detection.profile.name;
          this.controller.saveSettings();
          this.controller.saveAppState();
        }

        profileDisplay.textContent =
          detection.profile.name === 'Default' ? 'DEFAULT' : detection.profile.name;
        profileDisplay.className =
          detection.profile.name === 'Default'
            ? 'active-item-status active-profile-status default'
            : 'active-item-status active-profile-status active';

        // Update profile list to show correct active state
        this.controller.updateProfilesList();

        // Hide unsaved quick-save panel if visible — but respect active edit mode
        const unsavedPanel = container.querySelector('#unsaved-save-panel');
        if (unsavedPanel && !this.isEditingProfile) unsavedPanel.style.display = 'none';
      } else {
        // Settings don't match any existing profile
        profileDisplay.textContent = 'NOT SAVED';
        profileDisplay.className = 'active-item-status active-profile-status modified';

        // Clear active profile since settings don't match any profile
        if (settings.activeProfile) {
          this.controller.settings.activeProfile = null;
          this.controller.saveSettings();
          this.controller.saveAppState();
        }

        // Show unsaved quick-save panel (unless user is actively editing another profile)
        const unsavedPanel = container.querySelector('#unsaved-save-panel');
        if (unsavedPanel && !this.isEditingProfile) {
          unsavedPanel.style.display = 'block';
          const input = unsavedPanel.querySelector('#unsaved-profile-name');
          if (input) {
            input.value = '';
            input.placeholder = 'New profile';
            setTimeout(() => input.focus(), 50);
          }
        }
      }
    }, 10);
  }

  // Profile switching methods for keyboard shortcuts
  nextProfile() {
    console.log('Vivideo: Next profile shortcut (Alt+B)');

    // Build target profiles list: user profiles + one default built-in profile
    let targetProfiles = [...this.controller.profiles]; // User profiles first
    targetProfiles.push({ name: 'DEFAULT', settings: { ...this.controller.defaultSettings } }); // Add default built-in at end

    console.log('Vivideo: Cycling through user profiles + default built-in');

    // Find current profile index
    let currentIndex = -1;
    if (
      !this.controller.settings.activeProfile ||
      this.controller.settings.activeProfile === 'DEFAULT'
    ) {
      // Currently on DEFAULT built-in - find it at the end
      currentIndex = targetProfiles.length - 1;
    } else {
      // Find current user profile
      currentIndex = targetProfiles.findIndex(
        (p) => p.name === this.controller.settings.activeProfile
      );
    }

    // If no profiles available, do nothing
    if (targetProfiles.length === 0) {
      console.log('Vivideo: No profiles to cycle through');
      return;
    }

    const nextIndex = (currentIndex + 1) % targetProfiles.length;

    // Add animation for active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-next');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-next');
      }, 400);
    }

    // Load the target profile
    const targetProfile = targetProfiles[nextIndex];
    console.log('Vivideo: Switching to next profile:', targetProfile.name);
    this.controller.loadProfile(targetProfile);

    // Show notification if enabled
    if (this.showProfileAfterChange) {
      this.showProfileNotification(targetProfile.name);
    }
  }

  previousProfile() {
    console.log('Vivideo: Previous profile shortcut (Alt+C)');

    // Build target profiles list: user profiles + one default built-in profile
    let targetProfiles = [...this.controller.profiles]; // User profiles first
    targetProfiles.push({ name: 'DEFAULT', settings: { ...this.controller.defaultSettings } }); // Add default built-in at end

    console.log('Vivideo: Cycling through user profiles + default built-in');

    // Find current profile index
    let currentIndex = -1;
    if (
      !this.controller.settings.activeProfile ||
      this.controller.settings.activeProfile === 'DEFAULT'
    ) {
      // Currently on DEFAULT built-in - find it at the end
      currentIndex = targetProfiles.length - 1;
    } else {
      // Find current user profile
      currentIndex = targetProfiles.findIndex(
        (p) => p.name === this.controller.settings.activeProfile
      );
    }

    // If no profiles available, do nothing
    if (targetProfiles.length === 0) {
      console.log('Vivideo: No profiles to cycle through');
      return;
    }

    const prevIndex = currentIndex === 0 ? targetProfiles.length - 1 : currentIndex - 1;

    // Add animation for active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-prev');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-prev');
      }, 400);
    }

    // Load the target profile
    const targetProfile = targetProfiles[prevIndex];
    console.log('Vivideo: Switching to previous profile:', targetProfile.name);
    this.controller.loadProfile(targetProfile);

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

      // Base styles
      const baseStyles = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(40, 44, 52, 0.95);
        color: #61dafb;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Orbitron', monospace;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(97, 218, 251, 0.3);
        border: 1px solid rgba(97, 218, 251, 0.5);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        pointer-events: none;
        backdrop-filter: blur(10px);
      `;

      // Adjust z-index for fullscreen
      const zIndex = isFullscreen ? '2147483647' : '10000';
      notification.style.cssText = baseStyles + `z-index: ${zIndex};`;

      // Use document.body for fullscreen to ensure visibility
      const container = isFullscreen ? document.body : document.body;
      container.appendChild(notification);
    } else {
      // Update z-index for existing notification
      const zIndex = isFullscreen ? '2147483647' : '10000';
      notification.style.zIndex = zIndex;
    }

    // Update content and show
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🎥</span>
        <span>Profile: <strong>${profileName}</strong></span>
        ${isFullscreen ? '<span style="font-size: 12px; opacity: 0.8;">(Fullscreen)</span>' : ''}
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
