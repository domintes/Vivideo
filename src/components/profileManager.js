// Profile Manager Component
// Handles profile creation, loading, deletion and UI

class ProfileManager {
  constructor(controller) {
    this.controller = controller;
  }

  createProfilesHTML() {
    return /*html*/ `
      <!-- Profiles Section -->
      <div class="vivideo-bottom-controls">
        <div class="profiles-button-section button-section">
          <button class="vivideo-control-btn" id="profiles-btn" title="Configuration profiles">Profiles</button>
          <div class="active-item-status active-profile-status" id="active-profile-display">
            DEFAULT
          </div>
        </div>
      </div>

      <div class="vivideo-profiles" id="profiles-panel" style="display: none;">
        <div class="vivideo-profile-list" id="profile-list"></div>
      </div>

      <!-- Profile Save Form -->
      <div class="vivideo-profile-save-section">
        <div class="vivideo-profile-form">
          <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profile_5">
          <button class="vivideo-profile-save" id="save-profile">Save</button>
        </div>
      </div>
    `;
  }

  bindEvents(container) {
    // Profile controls
    container.querySelector('#profiles-btn').addEventListener('click', () => {
      this.controller.toggleProfiles();
    });

    container.querySelector('#save-profile').addEventListener('click', () => {
      this.saveCurrentProfile(container);
    });
  }

  updateProfilesList(container, profiles, settings, defaultProfile) {
    const profileList = container.querySelector('#profile-list');
    if (!profileList) return;
    
    profileList.innerHTML = '';

    // Add DEFAULT profile
    const defaultProfileItem = document.createElement('div');
    defaultProfileItem.className = 'vivideo-profile-item';
    const isDefaultActive = !settings.activeProfile && this.isDefaultProfile(settings);
    if (isDefaultActive) {
      defaultProfileItem.classList.add('vivideo-profile-active');
    }
    
    defaultProfileItem.innerHTML = `
      <span class="vivideo-profile-name">DEFAULT</span>
    `;
    
    defaultProfileItem.addEventListener('click', () => {
      this.controller.loadProfile(defaultProfile);
    });
    
    profileList.appendChild(defaultProfileItem);
    
    // Add user profiles with delete buttons
    profiles.forEach((profile, index) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'vivideo-profile-item';
      const isActive = settings.activeProfile === profile.name;
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
      profileNameInput.placeholder = `Profile_${profiles.length + 1}`;
    }
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
    this.updateProfilesList(container, this.controller.profiles, this.controller.settings, this.controller.defaultProfile);
    this.updateActiveProfileDisplay(container, this.controller.settings);
    nameInput.value = '';
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
    this.controller.loadProfile(allProfiles[nextIndex]);
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
    this.controller.loadProfile(allProfiles[prevIndex]);
  }
}

// Export for use in other files
window.ProfileManager = ProfileManager;
