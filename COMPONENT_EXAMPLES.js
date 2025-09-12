// Example: How to use the new React-like components
// This file demonstrates how to work with the refactored architecture

// ============================================
// 1. BASIC COMPONENT USAGE
// ============================================

// Creating a simple slider component
const brightnessSlider = new SliderElement({
  name: 'brightness',
  defaultValue: 0,
  minValue: -100,
  maxValue: 100,
  minValueExtended: -200,
  maxValueExtended: 200,
  unit: '%',
  extendedLimits: false,
  onChange: (name, value) => {
    console.log(`Brightness changed to: ${value}%`);
    // Apply the filter to videos
    applyBrightnessFilter(value);
  }
});

// Mount it to a container
const container = document.querySelector('.slider-container');
brightnessSlider.mount(container);

// Update the value programmatically
brightnessSlider.updateValue(25);

// ============================================
// 2. MAIN PANEL USAGE
// ============================================

// Create the main panel with full configuration
const mainPanel = new VivideoMainPanel({
  isVisible: false,
  collapsed: false,
  theme: 'cybernetic',
  position: { x: 20, y: 20 },
  settings: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    gamma: 1,
    colorTemp: 0,
    sharpness: 0,
    speed: 1.0,
    extendedLimits: false,
    autoActivate: true
  },
  profiles: [
    {
      name: 'DEFAULT',
      description: 'Neutral settings',
      settings: { brightness: 0, contrast: 0, saturation: 0 }
    },
    {
      name: 'BRIGHT',
      description: 'Increased brightness',
      settings: { brightness: 30, contrast: 10, saturation: 5 }
    }
  ],
  activeProfile: 'DEFAULT',

  // Event handlers
  onMount: (panel) => {
    console.log('Panel mounted successfully');
  },

  onClose: () => {
    console.log('Panel closed');
    saveUserPreferences();
  },

  onSettingsChange: (newSettings) => {
    console.log('Settings changed:', newSettings);
    // Apply filters to all videos
    applyFiltersToVideos(newSettings);
    // Save to storage
    saveSettings(newSettings);
  },

  onPositionChange: (position) => {
    console.log('Panel moved to:', position);
    localStorage.setItem('panelPosition', JSON.stringify(position));
  },

  onProfileSelect: (profileName) => {
    console.log('Profile selected:', profileName);
    loadProfile(profileName);
  },

  onThemeSelect: (themeName) => {
    console.log('Theme changed to:', themeName);
    applyTheme(themeName);
  }
});

// Mount the main panel
mainPanel.mount(document.body);

// ============================================
// 3. WORKING WITH STATE
// ============================================

// Show/hide the panel
mainPanel.show();
mainPanel.hide();
mainPanel.toggle();

// Update panel settings
mainPanel.updateSettings({
  brightness: 25,
  contrast: 15,
  saturation: 10
});

// Change theme
mainPanel.applyTheme('casual');

// Update position
mainPanel.updatePosition({ x: 100, y: 50 });

// ============================================
// 4. COMPONENT COMPOSITION
// ============================================

// Creating a custom control section
class CustomControlSection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      customValue: props.customValue || 0
    };

    // Create child components
    this.customSlider = new SliderElement({
      name: 'custom',
      defaultValue: this.state.customValue,
      minValue: 0,
      maxValue: 100,
      unit: '%',
      onChange: (name, value) => {
        this.setState({ customValue: value });
        if (this.props.onChange) {
          this.props.onChange(value);
        }
      }
    });
  }

  componentDidMount() {
    // Mount child components
    const sliderContainer = this.querySelector('.custom-slider-container');
    if (sliderContainer) {
      this.customSlider.mount(sliderContainer);
    }
  }

  componentWillUnmount() {
    // Clean up child components
    if (this.customSlider) {
      this.customSlider.unmount();
    }
  }

  render() {
    const { customValue } = this.state;

    return `
      <div class="custom-control-section">
        <h4>Custom Control</h4>
        <div class="custom-slider-container"></div>
        <div class="custom-info">
          Current value: ${customValue}%
        </div>
      </div>
    `;
  }
}

// Use the custom component
const customControl = new CustomControlSection({
  customValue: 50,
  onChange: (value) => {
    console.log('Custom value changed:', value);
  }
});

customControl.mount(document.querySelector('.custom-controls'));

// ============================================
// 5. EVENT HANDLING PATTERNS
// ============================================

// Method 1: Direct event handlers
const speedController = new SpeedControllerSection({
  speed: 1.0,
  onSpeedChange: (speed) => {
    console.log(`Speed changed to: ${speed}x`);
    applySpeedToVideos(speed);
  }
});

// Method 2: Using class methods
class VideoController {
  constructor() {
    this.speedController = new SpeedControllerSection({
      speed: 1.0,
      onSpeedChange: this.handleSpeedChange.bind(this)
    });
  }

  handleSpeedChange(speed) {
    console.log(`VideoController: Speed changed to ${speed}x`);
    this.applySpeed(speed);
    this.saveSpeed(speed);
  }

  applySpeed(speed) {
    document.querySelectorAll('video').forEach((video) => {
      video.playbackRate = speed;
    });
  }

  saveSpeed(speed) {
    localStorage.setItem('videoSpeed', speed);
  }
}

// ============================================
// 6. ADVANCED USAGE PATTERNS
// ============================================

// Creating a profile manager
class ProfileManager {
  constructor() {
    this.profiles = [];
    this.activeProfile = 'DEFAULT';

    this.footerSection = new FooterSection({
      activeTab: 'profiles',
      activeProfile: this.activeProfile,
      profiles: this.profiles,
      onProfileSelect: this.selectProfile.bind(this),
      onCreateProfile: this.createProfile.bind(this),
      onDeleteProfile: this.deleteProfile.bind(this)
    });
  }

  selectProfile(profileName) {
    const profile = this.profiles.find((p) => p.name === profileName);
    if (profile) {
      this.activeProfile = profileName;
      this.applyProfileSettings(profile.settings);
      this.footerSection.updateActiveProfile(profileName);
    }
  }

  createProfile(currentSettings) {
    const name = prompt('Enter profile name:');
    if (name && !this.profiles.find((p) => p.name === name)) {
      const newProfile = {
        name: name,
        description: `Created on ${new Date().toLocaleDateString()}`,
        settings: { ...currentSettings }
      };

      this.profiles.push(newProfile);
      this.footerSection.updateProfiles(this.profiles);
      console.log('Created profile:', name);
    }
  }

  deleteProfile(profileName) {
    if (profileName !== 'DEFAULT' && confirm(`Delete "${profileName}"?`)) {
      this.profiles = this.profiles.filter((p) => p.name !== profileName);

      if (this.activeProfile === profileName) {
        this.selectProfile('DEFAULT');
      }

      this.footerSection.updateProfiles(this.profiles);
      console.log('Deleted profile:', profileName);
    }
  }

  applyProfileSettings(settings) {
    // Apply settings to main panel and video filters
    console.log('Applying profile settings:', settings);
  }
}

// ============================================
// 7. INTEGRATION WITH EXISTING CODE
// ============================================

// Integrating with the original VivideoController
class ModernVivideoController {
  constructor() {
    this.settings = this.loadSettings();
    this.profiles = this.loadProfiles();

    // Create the main panel with the new architecture
    this.mainPanel = new VivideoMainPanel({
      settings: this.settings,
      profiles: this.profiles,
      onSettingsChange: this.handleSettingsChange.bind(this),
      onProfileSelect: this.handleProfileSelect.bind(this)
    });

    // Mount to document
    this.mainPanel.mount(document.body);

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  handleSettingsChange(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.applyFilters(this.settings);
    this.saveSettings();
  }

  handleProfileSelect(profileName) {
    const profile = this.profiles.find((p) => p.name === profileName);
    if (profile) {
      this.settings = { ...profile.settings };
      this.mainPanel.updateSettings(this.settings);
      this.applyFilters(this.settings);
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.code === 'KeyV') {
        event.preventDefault();
        this.mainPanel.toggle();
      }
    });
  }

  applyFilters(settings) {
    // Use existing VideoFilterEngine
    if (window.VideoFilterEngine) {
      const filterEngine = new VideoFilterEngine(this);
      filterEngine.applyFiltersToAllVideos(settings);
    }
  }

  loadSettings() {
    // Load from storage
    return (
      JSON.parse(localStorage.getItem('vivideoSettings')) || {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        speed: 1.0
      }
    );
  }

  saveSettings() {
    localStorage.setItem('vivideoSettings', JSON.stringify(this.settings));
  }

  loadProfiles() {
    return (
      JSON.parse(localStorage.getItem('vivideoProfiles')) || [
        {
          name: 'DEFAULT',
          description: 'Default neutral settings',
          settings: { brightness: 0, contrast: 0, saturation: 0, gamma: 1 }
        }
      ]
    );
  }
}

// ============================================
// 8. UTILITY FUNCTIONS
// ============================================

// Helper functions for working with components
function findComponentByName(parent, componentName) {
  return parent.children.find((child) => child.constructor.name === componentName);
}

function getAllSliders(mainPanel) {
  return Object.values(mainPanel.sliderElements);
}

function resetAllSliders(mainPanel) {
  getAllSliders(mainPanel).forEach((slider) => {
    slider.updateValue(slider.props.defaultValue || 0);
  });
}

function exportComponentState(component) {
  return {
    props: component.props,
    state: component.state,
    mounted: component.mounted
  };
}

function logComponentTree(component, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${component.constructor.name}`, component.state);

  if (component.children) {
    component.children.forEach((child) => {
      logComponentTree(child, depth + 1);
    });
  }
}

// Example of debugging the component tree
// logComponentTree(mainPanel);

// ============================================
// 9. INITIALIZATION EXAMPLE
// ============================================

// Complete initialization example
function initializeVivideoWithComponents() {
  // Wait for components to be loaded
  if (window.VivideoComponentsLoaded) {
    startVivideo();
  } else {
    window.addEventListener('VivideoComponentsReady', startVivideo);
  }

  function startVivideo() {
    console.log('Starting Vivideo with React-like components...');

    // Create the modern controller
    const controller = new ModernVivideoController();

    // Make it globally accessible
    window.vivideoController = controller;

    console.log('Vivideo initialized successfully!');
  }
}

// Start the initialization
initializeVivideoWithComponents();
