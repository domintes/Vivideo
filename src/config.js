// Configuration file for Vivideo Extension
// Controls visibility of test/development features

const VivideoConfig = {
    // Test mode - when true, shows development features like Themes panel
    // When false, hides experimental features for production release
    testMode: false,
    
    // Default theme for production
    defaultTheme: 'casual',
    
    // Version info
    version: '4.1.1',
    
    // Feature flags
    features: {
        themesPanel: false, // Controlled by testMode
        profileAnimations: true,
        panelAnimations: true,
        keyboardShortcuts: true
    }
};

// Update feature flags based on testMode
if (VivideoConfig.testMode) {
    VivideoConfig.features.themesPanel = true;
}

// Make config available globally
window.VivideoConfig = VivideoConfig;
