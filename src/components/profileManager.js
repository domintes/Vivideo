// Profile Manager Component
// Handles profile creation, loading, deletion and UI

class ProfileManager {
  constructor(controller) {
    this.controller = controller;
    this.defaultProfiles = this.createDefaultProfiles();
    this.showingDefaultProfiles = false;
  }

  createDefaultProfiles() {
    return [
      {
        name: 'Default',
        description: 'Standard neutral settings',
        settings: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          gamma: 1,
          colorTemp: 0,
          sharpness: 0,
          autoActivate: true
        }
      },
      {
        name: 'Black & White',
        description: 'Classic monochrome effect',
        settings: {
          brightness: 5,
          contrast: 15,
          saturation: -100,
          gamma: 1.1,
          colorTemp: 0,
          sharpness: 10,
          autoActivate: true
        }
      },
      {
        name: 'Vibrant Colors',
        description: 'Enhanced color saturation',
        settings: {
          brightness: 8,
          contrast: 12,
          saturation: 45,
          gamma: 0.95,
          colorTemp: 5,
          sharpness: 8,
          autoActivate: true
        }
      },
      {
        name: 'Dark Scene',
        description: 'Brighten very dark content',
        settings: {
          brightness: 35,
          contrast: 25,
          saturation: 10,
          gamma: 0.7,
          colorTemp: -8,
          sharpness: 15,
          autoActivate: true
        }
      },
      {
        name: 'Cinematic',
        description: 'Film-like color grading',
        settings: {
          brightness: -5,
          contrast: 20,
          saturation: -15,
          gamma: 1.2,
          colorTemp: -20,
          sharpness: 5,
          autoActivate: true
        }
      },
      {
        name: 'High Contrast',
        description: 'Sharp, distinct details',
        settings: {
          brightness: 10,
          contrast: 40,
          saturation: -20,
          gamma: 1.3,
          colorTemp: 0,
          sharpness: 25,
          autoActivate: true
        }
      },
      {
        name: 'Warm Tone',
        description: 'Cozy, warm atmosphere',
        settings: {
          brightness: 8,
          contrast: 5,
          saturation: 20,
          gamma: 0.9,
          colorTemp: 35,
          sharpness: 0,
          autoActivate: true
        }
      },
      {
        name: 'Cool Tone',
        description: 'Modern, cool atmosphere',
        settings: {
          brightness: 3,
          contrast: 8,
          saturation: 15,
          gamma: 1.05,
          colorTemp: -30,
          sharpness: 5,
          autoActivate: true
        }
      },
      {
        name: 'Gaming',
        description: 'Enhanced visibility for games',
        settings: {
          brightness: 20,
          contrast: 30,
          saturation: 25,
          gamma: 0.8,
          colorTemp: 10,
          sharpness: 20,
          autoActivate: true
        }
      },
      {
        name: 'Retro',
        description: 'Vintage, washed-out look',
        settings: {
          brightness: -8,
          contrast: -15,
          saturation: -30,
          gamma: 1.4,
          colorTemp: 25,
          sharpness: -5,
          autoActivate: true
        }
      }
    ];
  }

  createProfilesHTML() {
    return /*html*/ `
      <!-- Profiles Section -->
      <div class="vivideo-bottom-controls">
        <div class="profiles-button-section button-section">
          <button class="vivideo-control-btn compact active" id="user-profiles-btn" title="User created profiles">User</button>
          <button class="vivideo-control-btn compact" id="default-profiles-btn" title="Built-in default profiles">Defaults</button>
          <button class="vivideo-control-btn compact" id="settings-btn" title="Import/Export settings">⚙️</button>
          <div class="active-item-status active-profile-status" id="active-profile-display">
            DEFAULT
          </div>
        </div>
      </div>

      <!-- User Profiles Panel (visible by default) -->
      <div class="vivideo-profiles" id="user-profiles-panel">
        <div class="profile-panel-header">👤 User Profiles</div>
        <div class="vivideo-profile-list" id="profile-list"></div>
        <!-- Profile Save Form - always visible for user profiles -->
        <div class="vivideo-profile-save-section">
          <div class="vivideo-profile-form">
            <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profile_1">
            <button class="vivideo-profile-save" id="save-profile">Save Current Settings</button>
          </div>
        </div>
      </div>

      <!-- Default Profiles Panel (hidden by default) -->
      <div class="vivideo-profiles" id="default-profiles-panel" style="display: none;">
        <div class="profile-panel-header">⭐ Default Profiles</div>
        <div class="vivideo-profile-list" id="default-profile-list"></div>
      </div>

      <!-- Compare Mode Section -->
      <div class="vivideo-compare-section">
        <div class="vivideo-compare-header">
          <div class="vivideo-checkbox-container">
            <input type="checkbox" id="compare-mode-checkbox" class="vivideo-checkbox">
            <label for="compare-mode-checkbox" class="vivideo-checkbox-label">
              <span class="vivideo-checkbox-text">Compare Mode</span>
              <span class="vivideo-checkbox-description">Split-screen profile comparison</span>
            </label>
          </div>
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

  bindEvents(container) {
    // Profile controls
    container.querySelector('#user-profiles-btn').addEventListener('click', () => {
      this.showUserProfiles(container);
    });

    container.querySelector('#default-profiles-btn').addEventListener('click', () => {
      this.showDefaultProfiles(container);
    });

    // Settings management button
    container.querySelector('#settings-btn').addEventListener('click', () => {
      this.controller.toggleSettingsManagement();
    });

    container.querySelector('#save-profile').addEventListener('click', () => {
      this.saveCurrentProfile(container);
    });

    // Compare Mode controls
    container.querySelector('#compare-mode-checkbox').addEventListener('change', (e) => {
      this.toggleCompareMode(container, e.target.checked);
    });

    container.querySelector('#compare-profile-select').addEventListener('change', (e) => {
      this.selectCompareProfile(container, e.target.value);
    });
  }

  showUserProfiles(container) {
    this.showingDefaultProfiles = false;
    
    // Update button states
    const userBtn = container.querySelector('#user-profiles-btn');
    const defaultBtn = container.querySelector('#default-profiles-btn');
    const userPanel = container.querySelector('#user-profiles-panel');
    const defaultPanel = container.querySelector('#default-profiles-panel');
    
    if (userBtn && defaultBtn && userPanel && defaultPanel) {
      // Update button states
      userBtn.classList.add('active');
      defaultBtn.classList.remove('active');
      
      // Show user panel, hide default panel
      userPanel.style.display = 'block';
      defaultPanel.style.display = 'none';
      
      // Update user profile list
      this.updateUserProfilesList(container);
      
      console.log('Vivideo: Switched to User profiles view');
    }
  }

  showDefaultProfiles(container) {
    this.showingDefaultProfiles = true;
    
    // Update button states
    const userBtn = container.querySelector('#user-profiles-btn');
    const defaultBtn = container.querySelector('#default-profiles-btn');
    const userPanel = container.querySelector('#user-profiles-panel');
    const defaultPanel = container.querySelector('#default-profiles-panel');
    
    if (userBtn && defaultBtn && userPanel && defaultPanel) {
      // Update button states
      userBtn.classList.remove('active');
      defaultBtn.classList.add('active');
      
      // Show default panel, hide user panel
      userPanel.style.display = 'none';
      defaultPanel.style.display = 'block';
      
      // Update default profile list
      this.updateDefaultProfilesList(container);
      
      console.log('Vivideo: Switched to Default profiles view');
    }
  }

  updateUserProfilesList(container) {
    const profileList = container.querySelector('#profile-list');
    if (!profileList) return;
    
    profileList.innerHTML = '';

    // Add DEFAULT profile
    const defaultProfileItem = document.createElement('div');
    defaultProfileItem.className = 'vivideo-profile-item';
    const isDefaultActive = !this.controller.settings.activeProfile && this.isDefaultProfile(this.controller.settings);
    if (isDefaultActive) {
      defaultProfileItem.classList.add('vivideo-profile-active');
    }
    
    defaultProfileItem.innerHTML = `
      <span class="vivideo-profile-name">DEFAULT</span>
    `;
    
    defaultProfileItem.addEventListener('click', () => {
      this.controller.loadProfile(this.controller.defaultProfile);
    });
    
    profileList.appendChild(defaultProfileItem);
    
    // Add user profiles with delete buttons
    this.controller.profiles.forEach((profile, index) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'vivideo-profile-item';
      const isActive = this.controller.settings.activeProfile === profile.name;
      if (isActive) {
        profileItem.classList.add('vivideo-profile-active');
      }
      
      // Truncate long profile names with ellipsis
      const displayName = profile.name.length > 20 ? profile.name.substring(0, 17) + '...' : profile.name;
      
      profileItem.innerHTML = `
        <span class="vivideo-profile-name" title="${profile.name}">${displayName}</span>
        <button class="vivideo-profile-delete" data-index="${index}" title="Delete profile">✖</button>
      `;
      
      profileItem.querySelector('.vivideo-profile-name').addEventListener('click', () => {
        this.controller.loadProfile(profile);
      });
      
      profileItem.querySelector('.vivideo-profile-delete').addEventListener('click', (e) => {
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
  }

  updateDefaultProfilesList(container) {
    const defaultProfileList = container.querySelector('#default-profile-list');
    if (!defaultProfileList) return;
    
    defaultProfileList.innerHTML = '';

    // Show default profiles (read-only)
    const defaultProfiles = this.createDefaultProfiles();
    defaultProfiles.forEach((profile) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'vivideo-profile-item';
      
      profileItem.innerHTML = `
        <span class="vivideo-profile-name" title="${profile.description}">${profile.name}</span>
        <span class="vivideo-profile-description">${profile.description}</span>
      `;
      
      profileItem.addEventListener('click', () => {
        this.controller.loadProfile(profile);
        // Switch back to user view after loading default profile
        setTimeout(() => this.showUserProfiles(container), 100);
      });
      
      defaultProfileList.appendChild(profileItem);
    });
  }

  saveCurrentProfile(container) {
    const nameInput = container.querySelector('#profile-name');
    let profileName = nameInput.value.trim();
    
    if (!profileName) {
      profileName = `Profile_${this.controller.profiles.length + 1}`;
    }

    const profile = {
      name: profileName,
      settings: { 
        brightness: this.controller.settings.brightness,
        contrast: this.controller.settings.contrast,
        saturation: this.controller.settings.saturation,
        gamma: this.controller.settings.gamma,
        colorTemp: this.controller.settings.colorTemp,
        sharpness: this.controller.settings.sharpness,
        autoActivate: this.controller.settings.autoActivate
      }
    };
    
    this.controller.profiles.push(profile);
    this.controller.settings.activeProfile = profileName;
    this.controller.saveProfiles();
    this.controller.saveSettings();
    this.controller.saveAppState();
    
    // Update user profiles list (we're always in user view when saving)
    this.updateUserProfilesList(container);
    this.updateActiveProfileDisplay(container, this.controller.settings);
    nameInput.value = '';
    
    console.log('Vivideo: Profile saved:', profileName);
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
      selectedProfile = this.controller.profiles.find(p => p.name === profileId);
      
      // Check default profiles if not found in user profiles
      if (!selectedProfile) {
        const defaultProfiles = this.createDefaultProfiles();
        selectedProfile = defaultProfiles.find(p => p.name === profileId);
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
      
      this.controller.profiles.forEach(profile => {
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
    defaultProfiles.slice(1).forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.name;
      option.textContent = `${profile.name} - ${profile.description}`;
      defaultGroup.appendChild(option);
    });
    
    selectElement.appendChild(defaultGroup);
  }

  isDefaultProfile(settings) {
    return settings.brightness === 0 &&
           settings.contrast === 0 &&
           settings.saturation === 0 &&
           settings.gamma === 1 &&
           settings.colorTemp === 0 &&
           settings.sharpness === 0;
  }

  isProfileModified(settings, profiles) {
    if (settings.activeProfile) {
      const activeProfile = profiles.find(p => p.name === settings.activeProfile);
      if (activeProfile) {
        return !this.profilesMatch(settings, activeProfile.settings);
      }
    }
    return !this.isDefaultProfile(settings);
  }

  profilesMatch(settings1, settings2) {
    const keys = ['brightness', 'contrast', 'saturation', 'gamma', 'colorTemp', 'sharpness'];
    return keys.every(key => settings1[key] === settings2[key]);
  }

  updateActiveProfileDisplay(container, settings) {
    const profileDisplay = container.querySelector('#active-profile-display');
    if (!profileDisplay) return;
    
    if (settings.activeProfile) {
      if (this.isProfileModified(settings, this.controller.profiles)) {
        profileDisplay.textContent = 'NOT SAVED';
        profileDisplay.className = 'active-item-status active-profile-status modified';
      } else {
        profileDisplay.textContent = settings.activeProfile;
        profileDisplay.className = 'active-item-status active-profile-status active';
      }
    } else if (this.isDefaultProfile(settings)) {
      profileDisplay.textContent = 'DEFAULT';
      profileDisplay.className = 'active-item-status active-profile-status default';
    } else {
      profileDisplay.textContent = 'NOT SAVED';
      profileDisplay.className = 'active-item-status active-profile-status modified';
    }
  }

  // Profile switching methods for keyboard shortcuts
  nextProfile() {
    const allProfiles = [this.controller.defaultProfile, ...this.controller.profiles];
    let currentIndex = -1;
    
    if (!this.controller.settings.activeProfile) {
      // Currently on DEFAULT
      currentIndex = 0;
    } else {
      currentIndex = allProfiles.findIndex(p => p.name === this.controller.settings.activeProfile);
    }
    
    const nextIndex = (currentIndex + 1) % allProfiles.length;
    
    // Dodaj animację przewijania do przodu dla active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-next');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-next');
      }, 400);
    }
    
    // Załaduj profil bez otwierania menu profiles
    const targetProfile = allProfiles[nextIndex];
    if (targetProfile.name === 'DEFAULT') {
      this.controller.settings.activeProfile = null;
      Object.keys(this.controller.defaultSettings).forEach(key => {
        if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
          this.controller.settings[key] = this.controller.defaultSettings[key];
        }
      });
    } else {
      this.controller.settings.activeProfile = targetProfile.name;
      Object.keys(targetProfile.settings).forEach(key => {
        if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
          this.controller.settings[key] = targetProfile.settings[key];
        }
      });
      if (targetProfile.settings.autoActivate !== undefined) {
        this.controller.settings.autoActivate = targetProfile.settings.autoActivate;
      }
    }

    this.controller.updateUI();
    this.controller.applyFilters();
    this.controller.saveSettings();
    this.controller.saveAppState();
    this.controller.updateProfilesList();
  }

  previousProfile() {
    const allProfiles = [this.controller.defaultProfile, ...this.controller.profiles];
    let currentIndex = -1;
    
    if (!this.controller.settings.activeProfile) {
      // Currently on DEFAULT
      currentIndex = 0;
    } else {
      currentIndex = allProfiles.findIndex(p => p.name === this.controller.settings.activeProfile);
    }
    
    const prevIndex = currentIndex === 0 ? allProfiles.length - 1 : currentIndex - 1;
    
    // Dodaj animację przewijania do tyłu dla active-profile-display
    const profileDisplay = this.controller.container.querySelector('#active-profile-display');
    if (profileDisplay) {
      profileDisplay.classList.add('scroll-prev');
      setTimeout(() => {
        profileDisplay.classList.remove('scroll-prev');
      }, 400);
    }
    
    // Załaduj profil bez otwierania menu profiles
    const targetProfile = allProfiles[prevIndex];
    if (targetProfile.name === 'DEFAULT') {
      this.controller.settings.activeProfile = null;
      Object.keys(this.controller.defaultSettings).forEach(key => {
        if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
          this.controller.settings[key] = this.controller.defaultSettings[key];
        }
      });
    } else {
      this.controller.settings.activeProfile = targetProfile.name;
      Object.keys(targetProfile.settings).forEach(key => {
        if (key !== 'autoActivate' && key !== 'workOnImagesActivate') {
          this.controller.settings[key] = targetProfile.settings[key];
        }
      });
      if (targetProfile.settings.autoActivate !== undefined) {
        this.controller.settings.autoActivate = targetProfile.settings.autoActivate;
      }
    }

    this.controller.updateUI();
    this.controller.applyFilters();
    this.controller.saveSettings();
    this.controller.saveAppState();
    this.controller.updateProfilesList();
  }
}

// Export for use in other files
window.ProfileManager = ProfileManager;
