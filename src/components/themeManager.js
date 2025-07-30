// Theme Manager Component
// Handles theme switching and HSL color customization

class ThemeManager {
  constructor(controller) {
    this.controller = controller;
  }

  createThemesHTML() {
    return /*html*/ `
      <!-- Themes Section -->
      <div class="vivideo-bottom-controls">
        <div class="themes-button-section button-section">
          <button class="vivideo-control-btn" id="themes-btn" title="Themes">Themes</button>
          <div class="active-item-status active-theme-status" id="active-theme-display">
            CYBERNETIC
          </div>
        </div>
      </div>

      <div class="vivideo-themes" id="themes-panel" style="display: none;">
        <div class="vivideo-theme-option" data-theme="cybernetic">
          <span>Cybernetic</span>
        </div>
        <div class="vivideo-theme-option" data-theme="casual">
          <span>Casual</span>
        </div>
        <div class="vivideo-theme-color-picker">
          <label for="font-theme-color-slider">Font Theme Color:</label>
          <input type="range" id="font-theme-color-slider" min="0" max="360" value="120" step="1">
          <div class="color-preview" id="font-color-preview"></div>
        </div>
        <div class="vivideo-theme-color-picker">
          <label for="background-theme-color-slider">Background Theme Color:</label>
          <input type="range" id="background-theme-color-slider" min="0" max="360" value="140" step="1">
          <div class="color-preview" id="background-color-preview"></div>
        </div>
      </div>
    `;
  }

  bindEvents(container) {
    // Theme controls
    container.querySelector('#themes-btn').addEventListener('click', () => {
      this.controller.toggleThemes();
    });

    container.querySelectorAll('.vivideo-theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        this.controller.changeTheme(theme);
      });
    });

    // Theme color pickers
    container.querySelector('#font-theme-color-slider').addEventListener('input', (e) => {
      const hue = parseInt(e.target.value);
      this.controller.updateFontThemeColor(hue);
    });

    container.querySelector('#background-theme-color-slider').addEventListener('input', (e) => {
      const hue = parseInt(e.target.value);
      this.controller.updateBackgroundThemeColor(hue);
    });
  }

  updateThemeSelection(container, currentTheme) {
    container.querySelectorAll('.vivideo-theme-option').forEach(option => {
      const theme = option.getAttribute('data-theme');
      if (theme === currentTheme) {
        option.classList.add('vivideo-theme-selected');
      } else {
        option.classList.remove('vivideo-theme-selected');
      }
    });
    this.updateThemeColorSliders(container, currentTheme);
  }

  updateThemeColorSliders(container, currentTheme) {
    const fontColorSlider = container.querySelector('#font-theme-color-slider');
    const backgroundColorSlider = container.querySelector('#background-theme-color-slider');
    const themeColors = this.controller.themeColors;
    
    if (fontColorSlider && themeColors[currentTheme]) {
      fontColorSlider.value = themeColors[currentTheme].fontHue;
    }
    
    if (backgroundColorSlider && themeColors[currentTheme]) {
      backgroundColorSlider.value = themeColors[currentTheme].backgroundHue;
    }
    
    this.updateColorPreviews(container, currentTheme);
  }

  updateColorPreviews(container, currentTheme) {
    const fontColorPreview = container.querySelector('#font-color-preview');
    const backgroundColorPreview = container.querySelector('#background-color-preview');
    const currentColor = this.controller.themeColors[currentTheme];
    
    if (fontColorPreview && currentColor) {
      const fontHsl = `hsl(${currentColor.fontHue}, ${currentColor.saturation}%, ${currentColor.lightness}%)`;
      fontColorPreview.style.backgroundColor = fontHsl;
    }
    
    if (backgroundColorPreview && currentColor) {
      const backgroundHsl = `hsl(${currentColor.backgroundHue}, ${currentColor.saturation}%, ${Math.max(currentColor.lightness - 30, 10)}%)`;
      backgroundColorPreview.style.backgroundColor = backgroundHsl;
    }
  }

  updateActiveThemeDisplay(container, currentTheme) {
    const themeDisplay = container.querySelector('#active-theme-display');
    if (!themeDisplay) return;
    
    const themeDisplayName = currentTheme === 'cybernetic' ? 'CYBERNETIC' : 'CASUAL';
    themeDisplay.textContent = themeDisplayName;
    themeDisplay.className = 'active-item-status active-theme-status active';
  }

  applyThemeColors(currentTheme, themeColors, container) {
    const currentColor = themeColors[currentTheme];
    if (!currentColor) return;

    // Remove existing style
    const existingStyle = document.querySelector('#vivideo-dynamic-theme');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new dynamic styles
    const style = document.createElement('style');
    style.id = 'vivideo-dynamic-theme';
    
    const fontHue = currentColor.fontHue;
    const backgroundHue = currentColor.backgroundHue;
    const saturation = currentColor.saturation;
    const lightness = currentColor.lightness;
    
    const fontColor = `hsl(${fontHue}, ${saturation}%, ${lightness}%)`;
    const fontLightColor = `hsl(${fontHue}, ${saturation}%, ${Math.min(lightness + 20, 90)}%)`;
    const fontDarkColor = `hsl(${fontHue}, ${saturation}%, ${Math.max(lightness - 20, 10)}%)`;
    
    const bgColor = `hsl(${backgroundHue}, ${saturation}%, ${Math.max(lightness - 30, 10)}%)`;
    const bgLightColor = `hsl(${backgroundHue}, ${saturation}%, ${Math.min(lightness - 15, 25)}%)`;
    const bgDarkColor = `hsl(${backgroundHue}, ${saturation}%, ${Math.max(lightness - 45, 5)}%)`;
    
    style.textContent = /*css*/`
      .vivideo-container.vivideo-theme-${currentTheme} {
        color: ${fontColor};
        background: linear-gradient(135deg, ${bgDarkColor} 0%, ${bgColor} 50%, ${bgDarkColor} 100%);
        border-color: ${fontColor}66;
        box-shadow: 0 0 25px ${fontColor}66, 0 10px 35px rgba(0, 0, 0, 0.8), inset 0 1px 0 ${fontColor}33;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme}::before {
        background-image: 
          linear-gradient(${bgColor}4D 1px, transparent 1px),
          linear-gradient(90deg, ${bgColor}4D 1px, transparent 1px);
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-title {
        background: linear-gradient(45deg, ${fontColor}, ${fontLightColor}, ${fontDarkColor});
        -webkit-background-clip: text;
        -moz-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 15px ${fontColor}99;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-info {
        color: ${fontColor};
        border-color: ${fontColor}4D;
        background: ${fontColor}1A;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-info:hover {
        background: ${fontColor}33;
        border-color: ${fontColor};
        box-shadow: 0 0 15px ${fontColor}66;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-value {
        background: ${fontColor}26;
        border-color: ${fontColor}66;
        color: ${fontColor};
        text-shadow: 0 0 8px ${fontColor}4D;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-slider {
        background: linear-gradient(90deg, ${fontColor}33, ${fontColor}66);
        border-color: ${fontColor}4D;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-slider::-webkit-slider-thumb {
        background: linear-gradient(135deg, ${fontColor}, ${fontLightColor});
        box-shadow: 0 0 25px ${fontColor}4D;
        border-color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-input {
        background: ${fontColor}1A;
        border-color: ${fontColor}4D;
        color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-reset,
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-reset-single,
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-control-btn,
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-profile-save {
        background: ${fontColor}1A;
        border-color: ${fontColor}4D;
        color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-reset:hover,
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-reset-single:hover,
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-control-btn:hover,
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-profile-save:hover {
        background: ${fontColor}33;
        box-shadow: 0 0 15px ${fontColor}66;
        border-color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-theme-option {
        background: ${fontColor}1A;
        border-color: ${fontColor}33;
        color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-theme-option:hover {
        background: ${fontColor}33;
        border-color: ${fontColor}66;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-theme-option.vivideo-theme-selected {
        background: ${fontColor}4D;
        border-color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-profile-item {
        background: ${fontColor}1A;
        border-color: ${fontColor}33;
        color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-profile-item:hover {
        background: ${fontColor}33;
        border-color: ${fontColor}66;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-profile-item.vivideo-profile-active {
        background: ${fontColor}4D;
        border-color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-shortcuts {
        background: ${fontColor}1A;
        border-top-color: ${fontColor}33;
        color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .vivideo-shortcuts code {
        background: ${fontColor}33;
        color: ${fontColor};
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .active-theme-status.active {
        background: ${fontColor}33;
        color: ${fontColor};
        border-color: ${fontColor}66;
        box-shadow: 0 0 8px ${fontColor}4D;
      }
      
      .vivideo-container.vivideo-theme-${currentTheme} .active-profile-status.active {
        background: ${fontColor}33;
        color: ${fontColor};
        border-color: ${fontColor}66;
        box-shadow: 0 0 8px ${fontColor}4D;
      }
    `;
    
    document.head.appendChild(style);
    container.className = `vivideo-container vivideo-theme-${currentTheme}`;
    if (container.classList.contains('vivideo-visible')) {
      container.classList.add('vivideo-visible');
    }
  }
}

// Export for use in other files
window.ThemeManager = ThemeManager;
