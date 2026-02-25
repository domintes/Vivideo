// Profile Manager Component

class ProfileManager {
  constructor(controller) {
    this.controller = controller || null;
    this.profileCategories = ['General'];
    this.showProfileAfterChange = true;
    this.isEditingProfile = false;
    this.editingIndex = null;
    this.userCategoryCollapsedMap = {};
  }

  createProfilesHTML() {
    return `
      <div class="vivideo-profiles-panel">
        <div class="vivideo-profiles-header">
          <div class="profile-panel-header">User Profiles</div>
          <div id="active-profile-display" class="active-item-status active-profile-status default">Default</div>
        </div>

        <div class="vivideo-edit-profile-section">
          <div class="vivideo-edit-profile-header" style="background: linear-gradient(90deg,#ff8a00,#da1b60); padding:8px;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:8px;color:#fff;">
            <div class="edit-header-icon">✎</div>
            <div class="edit-header-title">Edit Profile</div>
          </div>
        </div>

        <div id="profile-list" class="vivideo-profile-list"></div>

        <!-- Compare Profile Selection (hidden by default) -->
        <div class="vivideo-compare-controls" id="compare-controls" style="display:none;">
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

  // Small save form for use inside the Controls view (keeps profiles list separate)
  createProfileSaveHTML() {
    return `
      <div class="vivideo-profile-save-form">
        <div class="vivideo-profile-save-header" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div class="profile-save-icon">📝</div>
          <div class="profile-save-title">Create New Profile</div>
        </div>
        <div class="vivideo-profile-form">
          <input type="text" id="profile-name" class="vivideo-profile-input" placeholder="Profile name" maxlength="16">
          <button id="save-profile" class="vivideo-profile-save vivideo-btn"><span class="save-icon">💾</span> <span class="save-text">Save</span></button>
        </div>
      </div>
    `;
  }

  // Return ordered list of user categories (ensure General exists)
  getOrderedUserCategories() {
    const set = new Set(this.profileCategories || ['General']);
    const profiles = Array.isArray(this.controller && this.controller.profiles)
      ? this.controller.profiles
      : [];
    profiles.forEach((p) => {
      const cat = this.normalizeCategoryName(p && p.profileCategory) || 'General';
      set.add(cat);
    });
    const arr = [...set];
    arr.sort((a, b) => a.localeCompare(b));
    if (!arr.includes('General')) arr.unshift('General');
    return arr;
  }

  normalizeCategoryName(name) {
    if (!name && name !== '') return '';
    try {
      const s = String(name || '').trim();
      return s.length === 0 ? '' : s;
    } catch {
      return '';
    }
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

    // edit-mode removed: inline per-profile edit will be used

    const mainCategorySelect = UIHelper.safeQuery(container, '#profile-category');
    if (mainCategorySelect) {
      mainCategorySelect.addEventListener('change', () => {
        this.updateActiveStatus('EDITING', '');
      });
    }

    // Category create/delete buttons removed — categories are managed via the main selector

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
      // Clear value on first focus for new profile creation (keep when editing)
      profileNameInput.addEventListener('focus', (e) => {
        try {
          const cleared = profileNameInput.getAttribute('data-cleared');
          if (cleared === '0') {
            profileNameInput.value = '';
            profileNameInput.setAttribute('data-cleared', '1');
          }
        } catch (err) {
          // ignore
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

  getProfileCategoryByType(profile, _profileType) {
    const normalized = this.normalizeCategoryName(profile && profile.profileCategory);
    return normalized || 'General';
  }

  getOrderedCategoriesForType(_profileType, editModeActive) {
    const categories = new Set();
    // Only user categories are relevant in the simplified model
    this.getOrderedUserCategories().forEach((categoryName) => categories.add(categoryName));
    if (editModeActive) categories.add('General');
    return [...categories];
  }

  getCategoryCollapseStore(_profileType) {
    if (!this.userCategoryCollapsedMap) this.userCategoryCollapsedMap = {};
    return this.userCategoryCollapsedMap;
  }

  getProfilesArrayByType(_profileType) {
    return this.controller.profiles;
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

  // Update unified profiles list (simplified: single array of profiles)
  updateProfilesList(container) {
    const profileList = container.querySelector('#profile-list');
    if (!profileList) return;

    profileList.innerHTML = '';

    const profiles = Array.isArray(this.controller.profiles) ? this.controller.profiles : [];

    profiles.forEach((profile, index) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'vivideo-profile-item';
      profileItem.setAttribute('data-index', index);

      const isActive =
        this.controller.settings.activeProfile === profile.name ||
        (!this.controller.settings.activeProfile &&
          profile.name &&
          profile.name.toLowerCase() === 'default');
      if (isActive) profileItem.classList.add('vivideo-profile-active');

      const displayName =
        profile.name && profile.name.length > 20
          ? profile.name.substring(0, 17) + '...'
          : profile.name;

      profileItem.innerHTML = `
        <button class="vivideo-profile-inline-edit vivideo-btn" data-index="${index}" title="Edit name">✎</button>
        <span class="vivideo-profile-name" title="${profile.name}">${displayName}</span>
        <button class="vivideo-profile-delete vivideo-btn vivideo-profile-delete-btn" data-index="${index}" title="Delete profile">✖</button>
      `;

      // Click to activate profile (unless clicking on buttons)
      profileItem.addEventListener('click', (e) => {
        if (
          e.target.closest('.vivideo-profile-delete') ||
          e.target.closest('.vivideo-profile-inline-edit')
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

      // Edit button: open Controls view and populate the profile save form for editing
      const editBtn = profileItem.querySelector('.vivideo-profile-inline-edit');
      editBtn &&
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Mark editing state
          this.isEditingProfile = true;
          this.editingIndex = index;

          // Switch to Controls view where the save form lives
          try {
            if (this.controller && typeof this.controller.showView === 'function') {
              this.controller.showView('controls');
            }
          } catch (err) {
            console.warn('Vivideo: Could not switch to controls view for edit', err);
          }

          // Prefill the profile save form in controls view
          setTimeout(() => {
            try {
              const containerEl = this.controller && this.controller.container;
              if (!containerEl) return;
              const profileNameInput = containerEl.querySelector('#profile-name');
              const saveBtn = containerEl.querySelector('#save-profile');
              const headerTitle = containerEl.querySelector('.profile-save-title');
              if (profileNameInput) {
                profileNameInput.value = profile.name || '';
                // mark as already filled so first-focus won't clear it during edit
                profileNameInput.setAttribute('data-cleared', '1');
                profileNameInput.focus();
              }
              if (saveBtn) {
                saveBtn.dataset.editIndex = String(index);
                saveBtn.dataset.overwrite = 'true';
                saveBtn.classList.add('overwrite');
                const saveText = saveBtn.querySelector('.save-text');
                const saveIcon = saveBtn.querySelector('.save-icon');
                if (saveText) saveText.textContent = 'Overwrite';
                if (saveIcon) saveIcon.textContent = '🔁';
              }
              if (headerTitle) headerTitle.textContent = 'Edit Profile';
            } catch (err) {
              console.warn('Vivideo: Prefill profile form failed', err);
            }
          }, 60);
        });

      // Delete profile
      const deleteBtn = profileItem.querySelector('.vivideo-profile-delete');
      deleteBtn &&
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.controller.deleteProfile(index);
        });

      profileList.appendChild(profileItem);
    });

    // Update placeholder for new profile name
    const profileNameInput = container.querySelector('#profile-name');
    if (profileNameInput) {
      profileNameInput.placeholder = `Profile_${this.controller.profiles.length + 1}`;
    }
    this.refreshCategorySelectors(container);
  }

  // Show user profiles panel (compat for controller calls)
  showUserProfiles(container) {
    this.showingProfiles = true;
    if (container) {
      // Ensure profiles panel is rendered and active
      try {
        this.updateProfilesList(container);
        // inline editing used; no global quick-save panel
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
    const profileCategory = 'General';

    const saveBtn = container.querySelector('#save-profile');
    const editingIndex = saveBtn && saveBtn.dataset && saveBtn.dataset.editIndex ? parseInt(saveBtn.dataset.editIndex, 10) : null;

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

    // If editing an existing profile (edit button was used), update that index
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < this.controller.profiles.length) {
      // Ensure the new name doesn't collide with another profile (excluding the one being edited)
      const dup = this.controller.profiles.some((p, i) => i !== editingIndex && p.name === profileName);
      if (dup) {
        this.updateActiveStatus('Profile name exists', '#ff4d4f');
        return;
      }

      this.controller.profiles[editingIndex].name = profileName;
      this.controller.profiles[editingIndex].settings = {
        ...currentSettings,
        autoActivate: this.controller.settings.autoActivate
      };
      this.controller.profiles[editingIndex].profileCategory = profileCategory;
      console.log('Vivideo: Profile updated at index', editingIndex, profileName);

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
    } else {
      // Create new profile (ensure not duplicate)
      const existingProfileIndex = this.controller.profiles.findIndex((p) => p.name === profileName);
      if (existingProfileIndex !== -1) {
        // Ask user to confirm overwrite
        this.showOverwriteModal(
          profileName,
          () => {
            try {
              this.controller.profiles[existingProfileIndex].settings = {
                ...currentSettings,
                autoActivate: this.controller.settings.autoActivate
              };
              this.controller.profiles[existingProfileIndex].profileCategory = profileCategory;
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
        // Create new profile
        const profile = {
          name: profileName,
          profileCategory,
          settings: {
            ...currentSettings,
            autoActivate: this.controller.settings.autoActivate
          }
        };
        this.controller.profiles.push(profile);
        console.log('Vivideo: Profile saved:', profileName);
        // Clear any status
        this.updateActiveStatus(profileName === 'Default' ? 'Default' : profileName, '');
      }
    }

    this.controller.settings.activeProfile = profileName;
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
    const mainSaveBtn = container.querySelector('#save-profile');
    if (mainSaveBtn) {
      try {
        delete mainSaveBtn.dataset.editIndex;
        delete mainSaveBtn.dataset.editBuiltinIndex;
        delete mainSaveBtn.dataset.editType;
      } catch (e) {
        console.warn('Vivideo: Clearing save markers failed', e);
      }
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
    // normalize "default" id
    if (profileId && profileId.toLowerCase() === 'default') {
      selectedProfile =
        this.controller.profiles.find((p) => p.name && p.name.toLowerCase() === 'default') ||
        this.controller.defaultProfile;
    } else {
      selectedProfile = this.controller.profiles.find((p) => p.name === profileId) || null;
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
    // Add Default profile option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'Default';
    defaultOption.textContent = 'Default';
    selectElement.appendChild(defaultOption);

    // Add user profiles
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
          option.value = profile.name;
          option.textContent = profile.name;
          userGroup.appendChild(option);
        });
        selectElement.appendChild(userGroup);
      });
    }
    // no separate built-in default profiles list — single profile array is used
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
        'active-profile-status-warning',
        'active-profile-status-error',
        'active-profile-status-editing'
      );

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
    const keys = ['brightness', 'contrast', 'saturation', 'gamma', 'colorTemp', 'sharpness'];
    return keys.every((key) => settings1[key] === settings2[key]);
  }

  // Auto-detect profile based on current settings
  autoDetectProfile(settings) {
    // Check all saved profiles first (includes Default)
    for (const profile of this.controller.profiles) {
      if (this.profilesMatch(settings, profile.settings)) {
        console.log('Vivideo: Auto-detected profile:', profile.name);
        const isDefault = profile.name && profile.name.toLowerCase() === 'default';
        return { profile, isDefault };
      }
    }

    // Check if it matches the neutral default settings
    if (this.isDefaultProfile(settings)) {
      console.log('Vivideo: Auto-detected neutral Default profile');
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
    return (
      (this.controller.settings.activeProfile &&
        this.controller.settings.activeProfile.toLowerCase() === 'default') ||
      (this.controller.profiles || []).some(
        (p) =>
          p.name && p.name.toLowerCase() === this.controller.settings.activeProfile.toLowerCase()
      )
    );
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

        profileDisplay.textContent = detection.profile.name;
        profileDisplay.className =
          detection.profile.name && detection.profile.name.toLowerCase() === 'default'
            ? 'active-item-status active-profile-status default'
            : 'active-item-status active-profile-status active';

        // Update profile list to show correct active state
        this.controller.updateProfilesList();
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

        // No edit-mode panel: user can create/rename inline instead
      }
    }, 10);
  }

  // Profile switching methods for keyboard shortcuts
  nextProfile() {
    console.log('Vivideo: Next profile shortcut (Alt+B)');
    // Build combined list of profiles (single profiles array)
    const combined = Array.isArray(this.controller.profiles) ? this.controller.profiles : [];

    if (!Array.isArray(combined) || combined.length === 0) {
      console.log('Vivideo: No profiles to cycle through');
      return;
    }

    // Find current profile index within combined list
    let currentIndex = combined.findIndex((p) => p.name === this.controller.settings.activeProfile);
    // If activeProfile not set or not found, try locating Default (case-insensitive)
    if (currentIndex === -1) {
      currentIndex = combined.findIndex((p) => p.name && p.name.toLowerCase() === 'default');
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

    // Build combined list of profiles (single profiles array)
    const combined = Array.isArray(this.controller.profiles) ? this.controller.profiles : [];

    if (!Array.isArray(combined) || combined.length === 0) {
      console.log('Vivideo: No profiles to cycle through');
      return;
    }

    // Find current profile index within combined list
    let currentIndex = combined.findIndex((p) => p.name === this.controller.settings.activeProfile);
    // If activeProfile not set or not found, try locating Default (case-insensitive)
    if (currentIndex === -1) {
      currentIndex = combined.findIndex((p) => p.name && p.name.toLowerCase() === 'default');
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

    const defaultProfile =
      this.controller.profiles.find((p) => p.name && p.name.toLowerCase() === 'default') ||
      this.controller.defaultProfile;

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

      // Load Default profile
      this.controller.loadProfile(defaultProfile);
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
        this.currentProfile && this.currentProfile.name ? this.currentProfile.name : 'Default';
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
