// Component Loader - Loads all React-like components in the correct order
// This file ensures all components are loaded before the main application starts

(function () {
  'use strict';

  // Check if components are already loaded
  if (window.VivideoComponentsLoaded) {
    return;
  }

  console.log('Vivideo: Loading React-like components...');

  // List of components to load in order
  const componentFiles = [
    'Component.js', // Base component class
    'SliderElement.js', // Individual slider controls
    'HeaderSection.js', // Header with drag functionality
    'CollapseMenuSection.js', // Collapsible menu container
    'SpeedControllerSection.js', // Speed controls
    'OptionsSection.js', // Settings and options
    'FooterSection.js', // Footer with tabs
    'VivideoMainPanel.js' // Main panel container
  ];

  // Base path for components
  const basePath = 'chrome-extension://' + chrome.runtime.id + '/src/components/reactlike/';

  // Function to load a script dynamically
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log('Vivideo: Loaded component:', src.split('/').pop());
        resolve();
      };
      script.onerror = () => {
        console.error('Vivideo: Failed to load component:', src);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  // Function to load CSS
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        console.log('Vivideo: Loaded CSS:', href.split('/').pop());
        resolve();
      };
      link.onerror = () => {
        console.error('Vivideo: Failed to load CSS:', href);
        reject(new Error(`Failed to load ${href}`));
      };
      document.head.appendChild(link);
    });
  }

  // Load all components
  async function loadAllComponents() {
    try {
      // First load the CSS
      await loadCSS(basePath + 'components.css');

      // Then load all JavaScript components in order
      for (const file of componentFiles) {
        await loadScript(basePath + file);
      }

      // Mark components as loaded
      window.VivideoComponentsLoaded = true;

      // Dispatch event to notify that components are ready
      window.dispatchEvent(new CustomEvent('VivideoComponentsReady'));

      console.log('Vivideo: All React-like components loaded successfully');
    } catch (error) {
      console.error('Vivideo: Failed to load components:', error);

      // Fallback: try to load from local paths if chrome-extension URLs fail
      console.log('Vivideo: Attempting fallback loading...');
      await loadComponentsFallback();
    }
  }

  // Fallback loading method for development/testing
  async function loadComponentsFallback() {
    try {
      // For development, we might need to load from relative paths
      const fallbackBasePath = './src/components/reactlike/';

      // Load CSS
      await loadCSS(fallbackBasePath + 'components.css');

      // Load JavaScript components
      for (const file of componentFiles) {
        await loadScript(fallbackBasePath + file);
      }

      window.VivideoComponentsLoaded = true;
      window.dispatchEvent(new CustomEvent('VivideoComponentsReady'));

      console.log('Vivideo: Components loaded via fallback method');
    } catch (error) {
      console.error('Vivideo: Fallback loading also failed:', error);

      // Final fallback: define minimal component stubs
      defineComponentStubs();
    }
  }

  // Define minimal component stubs if loading fails
  function defineComponentStubs() {
    console.warn('Vivideo: Using component stubs - full functionality may not be available');

    // Define a minimal Component base class
    if (!window.Component) {
      window.Component = class {
        constructor(props = {}) {
          this.props = props;
          this.state = {};
          this.element = null;
          this.mounted = false;
        }

        setState(newState) {
          this.state = { ...this.state, ...newState };
        }

        render() {
          return '<div>Component not loaded</div>';
        }

        mount(parent) {
          const div = document.createElement('div');
          div.innerHTML = this.render();
          this.element = div.firstElementChild;
          if (parent) parent.appendChild(this.element);
          this.mounted = true;
          return this.element;
        }

        unmount() {
          if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
          }
          this.mounted = false;
        }
      };
    }

    // Define stubs for other components
    const componentNames = [
      'SliderElement',
      'HeaderSection',
      'CollapseMenuSection',
      'SpeedControllerSection',
      'OptionsSection',
      'FooterSection',
      'VivideoMainPanel'
    ];

    componentNames.forEach((name) => {
      if (!window[name]) {
        window[name] = class extends window.Component {
          render() {
            return `<div class="vivideo-component-stub">${name} (stub)</div>`;
          }
        };
      }
    });

    window.VivideoComponentsLoaded = true;
    window.dispatchEvent(new CustomEvent('VivideoComponentsReady'));
  }

  // Start loading components
  loadAllComponents();
})();
