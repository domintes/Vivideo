// Video Controls Component
// Handles all video filter controls (sliders, inputs, reset buttons)

class VideoControls {
  constructor(controller) {
    this.controller = controller;
  }

  createControlsHTML() {
    return /*html*/ `
      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Brightness</span>
          <span class="vivideo-value" id="brightness-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="brightness-slider" 
                 min="-100" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="brightness-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="brightness" title="Reset brightness">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Contrast</span>
          <span class="vivideo-value" id="contrast-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="contrast-slider" 
                 min="-100" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="contrast-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="contrast" title="Reset contrast">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Saturation</span>
          <span class="vivideo-value" id="saturation-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="saturation-slider" 
                 min="-90" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="saturation-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="saturation" title="Reset saturation">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Gamma</span>
          <span class="vivideo-value" id="gamma-value">1.00</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="gamma-slider" 
                 min="0.1" max="3" value="1" step="0.01">
          <span>►</span>
          <input type="text" class="vivideo-input gamma-input" id="gamma-input" 
                 placeholder="1.00" maxlength="4">
          <button class="vivideo-reset-single" data-control="gamma" title="Reset gamma">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Color Temp.</span>
          <span class="vivideo-value" id="colortemp-value">Neutral</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="colortemp-slider" 
                 min="-100" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="colortemp-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="colortemp" title="Reset color temperature">↺</button>
        </div>
      </div>

      <div class="vivideo-control">
        <div class="vivideo-label">
          <span>Sharpness</span>
          <span class="vivideo-value" id="sharpness-value">0%</span>
        </div>
        <div class="vivideo-slider-container">
          <span>◄</span>
          <input type="range" class="vivideo-slider" id="sharpness-slider" 
                 min="0" max="100" value="0" step="1">
          <span>►</span>
          <input type="text" class="vivideo-input" id="sharpness-input" 
                 placeholder="0" maxlength="4">
          <button class="vivideo-reset-single" data-control="sharpness" title="Reset sharpness">↺</button>
        </div>
      </div>

      <button class="vivideo-reset" id="reset-button">Reset all values ⟳</button>
    `;
  }

  bindEvents(container) {
    // Reset all button
    container.querySelector('#reset-button').addEventListener('click', () => {
      this.controller.resetAll();
    });

    // Single reset buttons
    container.querySelectorAll('.vivideo-reset-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const control = e.target.getAttribute('data-control');
        this.controller.resetSingle(control);
      });
    });

    this.bindControlEvents(container);
  }

  bindControlEvents(container) {
    const controls = ['brightness', 'contrast', 'saturation', 'gamma', 'colortemp', 'sharpness'];
    
    controls.forEach(control => {
      const slider = container.querySelector(`#${control}-slider`);
      const input = container.querySelector(`#${control}-input`);
      
      slider.addEventListener('input', (e) => {
        this.controller.updateControl(control, parseFloat(e.target.value));
      });
      
      // Specjalna obsługa dla gamma input z lepszą nawigacją
      if (control === 'gamma') {
        let cursorPosition = 0;
        
        input.addEventListener('focus', (e) => {
          // Zapisz pozycję kursora przy fokusie
          setTimeout(() => {
            cursorPosition = e.target.selectionStart;
          }, 10);
        });
        
        input.addEventListener('keydown', (e) => {
          if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            const currentValue = input.value;
            const newValue = this.insertDigitAtPosition(currentValue, e.key, cursorPosition);
            const numValue = parseFloat(newValue);
            
            if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 3.0) {
              input.value = newValue;
              this.controller.updateControl(control, numValue);
              // Przesuń kursor w prawo po przecinku
              if (cursorPosition === 1) cursorPosition = 3;
              else if (cursorPosition < 4) cursorPosition++;
              setTimeout(() => {
                input.setSelectionRange(cursorPosition, cursorPosition);
              }, 10);
            }
          } else if (e.key === 'ArrowLeft' && cursorPosition > 0) {
            cursorPosition = cursorPosition === 3 ? 1 : cursorPosition - 1;
            setTimeout(() => {
              input.setSelectionRange(cursorPosition, cursorPosition);
            }, 10);
          } else if (e.key === 'ArrowRight' && cursorPosition < 4) {
            cursorPosition = cursorPosition === 1 ? 3 : cursorPosition + 1;
            setTimeout(() => {
              input.setSelectionRange(cursorPosition, cursorPosition);
            }, 10);
          } else if (e.key === 'Backspace') {
            e.preventDefault();
            if (cursorPosition > 0) {
              cursorPosition = cursorPosition === 3 ? 1 : cursorPosition - 1;
              setTimeout(() => {
                input.setSelectionRange(cursorPosition, cursorPosition);
              }, 10);
            }
          }
        });
        
        input.addEventListener('click', (e) => {
          cursorPosition = e.target.selectionStart;
          // Dostosuj pozycję kursora aby ominąć przecinek
          if (cursorPosition === 2) {
            cursorPosition = 1;
            setTimeout(() => {
              input.setSelectionRange(cursorPosition, cursorPosition);
            }, 10);
          }
        });
      } else {
        // Standardowa obsługa dla innych inputów
        input.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            this.controller.updateControl(control, value);
          }
        });
      }
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    });
  }

  insertDigitAtPosition(currentValue, digit, position) {
    // Format: X.XX gdzie X to cyfry
    const parts = currentValue.split('.');
    let wholePart = parts[0] || '1';
    let decimalPart = parts[1] || '00';
    
    if (position === 0) {
      // Pierwsza pozycja - cyfra jedności
      wholePart = digit;
    } else if (position === 3) {
      // Pierwsza pozycja po przecinku
      decimalPart = digit + (decimalPart[1] || '0');
    } else if (position === 4) {
      // Druga pozycja po przecinku
      decimalPart = (decimalPart[0] || '0') + digit;
    }
    
    return wholePart + '.' + decimalPart.padEnd(2, '0');
  }

  updateUI(settings, container) {
    // Update brightness
    const brightnessSlider = container.querySelector('#brightness-slider');
    const brightnessInput = container.querySelector('#brightness-input');
    const brightnessValue = container.querySelector('#brightness-value');
    
    if (brightnessSlider) {
      brightnessSlider.value = settings.brightness;
      brightnessInput.value = settings.brightness;
      brightnessValue.textContent = `${settings.brightness}%`;
    }

    // Update contrast
    const contrastSlider = container.querySelector('#contrast-slider');
    const contrastInput = container.querySelector('#contrast-input');
    const contrastValue = container.querySelector('#contrast-value');
    
    if (contrastSlider) {
      contrastSlider.value = settings.contrast;
      contrastInput.value = settings.contrast;
      contrastValue.textContent = `${settings.contrast}%`;
    }

    // Update saturation
    const saturationSlider = container.querySelector('#saturation-slider');
    const saturationInput = container.querySelector('#saturation-input');
    const saturationValue = container.querySelector('#saturation-value');
    
    if (saturationSlider) {
      saturationSlider.value = settings.saturation;
      saturationInput.value = settings.saturation;
      saturationValue.textContent = `${settings.saturation}%`;
    }

    // Update gamma
    const gammaSlider = container.querySelector('#gamma-slider');
    const gammaInput = container.querySelector('#gamma-input');
    const gammaValue = container.querySelector('#gamma-value');
    
    if (gammaSlider) {
      gammaSlider.value = settings.gamma;
      gammaInput.value = settings.gamma.toFixed(2);
      gammaValue.textContent = settings.gamma.toFixed(2);
    }

    // Update color temperature
    const colorTempSlider = container.querySelector('#colortemp-slider');
    const colorTempInput = container.querySelector('#colortemp-input');
    const colorTempValue = container.querySelector('#colortemp-value');
    
    if (colorTempSlider) {
      colorTempSlider.value = settings.colorTemp;
      colorTempInput.value = settings.colorTemp;
      
      let tempText = 'Neutral';
      if (settings.colorTemp < -75) tempText = 'Very Cold';
      else if (settings.colorTemp < -40) tempText = 'Cold';
      else if (settings.colorTemp < -15) tempText = 'Cool';
      else if (settings.colorTemp < -5) tempText = 'Slightly Cool';
      else if (settings.colorTemp > 75) tempText = 'Very Warm';
      else if (settings.colorTemp > 40) tempText = 'Warm';
      else if (settings.colorTemp > 15) tempText = 'Cozy';
      else if (settings.colorTemp > 5) tempText = 'Slightly Warm';
      
      colorTempValue.textContent = tempText;
    }

    // Update sharpness
    const sharpnessSlider = container.querySelector('#sharpness-slider');
    const sharpnessInput = container.querySelector('#sharpness-input');
    const sharpnessValue = container.querySelector('#sharpness-value');
    
    if (sharpnessSlider) {
      sharpnessSlider.value = settings.sharpness;
      sharpnessInput.value = settings.sharpness;
      sharpnessValue.textContent = `${settings.sharpness}%`;
    }
  }
}

// Export for use in other files
window.VideoControls = VideoControls;
