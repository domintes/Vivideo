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
        <div class="active-item-status active-profile-status" id="active-profile-display">
          DEFAULT
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
          <div class="vivideo-profile-form">
            <input type="text" class="vivideo-profile-input" id="profile-name" placeholder="Profile_1">
            <button class="vivideo-profile-save" id="save-profile">Save Current Settings</button>
          </div>
        </div>
      </div>

      <!-- Profile Settings Section -->
      <div class="vivideo-profile-settings-section">
        <div class="vivideo-checkbox-container">
          <input type="checkbox" id="show-profile-after-change-checkbox" class="vivideo-checkbox" checked>
          <label for="show-profile-after-change-checkbox" class="vivideo-checkbox-label">
            <span class="vivideo-checkbox-text">Show current profile after change</span>
            <span class="vivideo-checkbox-description">Display profile name for 3 seconds after switching</span>
          </label>
        </div>
        
        <div class="vivideo-checkbox-container">
          <input type="checkbox" id="work-on-all-sites-checkbox" class="vivideo-checkbox">
          <label for="work-on-all-sites-checkbox" class="vivideo-checkbox-label">
            <span class="vivideo-checkbox-text">Work on all websites</span>
            <span class="vivideo-checkbox-description">Apply video filters to all websites, not just YouTube</span>
          </label>
        </div>


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
    // Themes button
    container.querySelector('#themes-btn').addEventListener('click', () => {
      this.showThemes(container);
    });

    // Settings management button
    container.querySelector('#settings-btn').addEventListener('click', () => {
      this.controller.toggleSettingsManagement();
    });

    container.querySelector('#save-profile').addEventListener('click', () => {
      this.saveCurrentProfile(container);
    });

    // Display default profiles checkbox
    // (display-default-profiles removed)

    // Show profile after change checkbox
    container
      .querySelector('#show-profile-after-change-checkbox')
      .addEventListener('change', (e) => {
        this.showProfileAfterChange = e.target.checked;
        console.log('Vivideo: Show profile after change:', this.showProfileAfterChange);

        // Save setting
        this.controller.saveAppState();
      });

    // Work on all sites checkbox
    container.querySelector('#work-on-all-sites-checkbox').addEventListener('change', (e) => {
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

    // Speed step input
    container.querySelector('#speed-step-input').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && value >= 0.05 && value <= 1.0) {
        this.controller.settings.speedStep = value;
        this.controller.saveSettings();
        console.log(`Vivideo: Speed step changed to ${value}x`);
      }
    });

    // Compare Mode controls
    container.querySelector('#compare-mode-checkbox').addEventListener('change', (e) => {
      this.toggleCompareMode(container, e.target.checked);
    });

    container.querySelector('#compare-profile-select').addEventListener('change', (e) => {
      this.selectCompareProfile(container, e.target.value);
    });
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

        const displayName = profile.name.length > 20 ? profile.name.substring(0, 17) + '...' : profile.name;

        profileItem.innerHTML = `
          <span class="vivideo-profile-name" title="${profile.name}">${displayName}</span>
          <button class="vivideo-profile-delete" data-index="${index}" title="Delete profile">✖</button>
        `;

        // Click loads profile immediately
        profileItem.addEventListener('click', (e) => {
          if (e.target.classList.contains('vivideo-profile-delete')) return;
          e.preventDefault();
          e.stopPropagation();
          container.querySelectorAll('.vivideo-profile-item').forEach((item) => item.classList.remove('vivideo-profile-active'));
          profileItem.classList.add('vivideo-profile-active');
          this.controller.loadProfile(profile);
        });

        // Delete
        profileItem.querySelector('.vivideo-profile-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(e.currentTarget.getAttribute('data-index'));
          this.controller.deleteProfile(idx);
        });

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
    const isDefaultActive = !this.controller.settings.activeProfile || this.controller.settings.activeProfile === 'DEFAULT';
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
      container.querySelectorAll('.vivideo-profile-item').forEach((item) => item.classList.remove('vivideo-profile-active'));
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

    // Check if settings match any existing profile
    const matchingProfile = this.findMatchingProfile(currentSettings);

    if (matchingProfile) {
      // Settings match an existing profile - show warning and don't save
      console.warn('Vivideo: Cannot save - settings match existing profile:', matchingProfile.name);

      // Show temporary warning message
      const originalPlaceholder = nameInput.placeholder;
      nameInput.placeholder = `Already exists: ${matchingProfile.name}`;
      nameInput.style.color = '#ff6b6b';
      nameInput.style.backgroundColor = '#2d1b1b';

      setTimeout(() => {
        nameInput.placeholder = originalPlaceholder;
        nameInput.style.color = '';
        nameInput.style.backgroundColor = '';
      }, 3000);

      // Auto-select the matching profile
      this.controller.settings.activeProfile = matchingProfile.name;
      this.controller.saveSettings();
      this.controller.saveAppState();
      this.updateProfilesList(container);
      this.updateActiveProfileDisplay(container, this.controller.settings);
      nameInput.value = '';

      return;
    }

    // Check if profile name already exists
    const existingProfile = this.controller.profiles.find((p) => p.name === profileName);
    if (existingProfile) {
      // Update existing profile
      existingProfile.settings = {
        ...currentSettings,
        autoActivate: this.controller.settings.autoActivate
      };
      console.log('Vivideo: Profile updated:', profileName);
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
    }

    this.controller.settings.activeProfile = profileName;
    this.controller.saveProfiles();
    this.controller.saveSettings();
    this.controller.saveAppState();

    // Update profiles list
    this.updateProfilesList(container);
    this.updateActiveProfileDisplay(container, this.controller.settings);
    nameInput.value = '';
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
    if (!this.controller.settings.activeProfile || this.controller.settings.activeProfile === 'DEFAULT') {
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
    if (!this.controller.settings.activeProfile || this.controller.settings.activeProfile === 'DEFAULT') {
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
