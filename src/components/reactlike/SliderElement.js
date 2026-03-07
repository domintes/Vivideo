import React, { useState, useEffect } from 'react';

const SliderElement = ({
  name,
  defaultValue = 0,
  minValue = -100,
  maxValue = 100,
  minValueExtended = -200,
  maxValueExtended = 200,
  step = 1,
  unit = '%',
  extendedLimits = false,
  onChange
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const min = extendedLimits ? minValueExtended : minValue;
  const max = extendedLimits ? maxValueExtended : maxValue;

  const handleSliderChange = (event) => {
    const newValue = parseFloat(event.target.value);
    setValue(newValue);
    if (onChange) {
      onChange(name, newValue);
    }
  };

  const handleInputChange = (event) => {
    const inputValue = event.target.value.trim();
    const newValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(newValue)) {
      setValue(newValue);
      if (onChange) {
        onChange(name, newValue);
      }
    }
  };

  const handleReset = () => {
    setValue(0);
    if (onChange) {
      onChange(name, 0);
    }
  };

  return (
    <div className="vivideo-slider-element" data-name={name}>
      <div className="vivideo-slider-header">
        <label className="vivideo-slider-label">
          {name.charAt(0).toUpperCase() + name.slice(1)}:
        </label>
        <div className="vivideo-slider-controls">
          <input
            type="number"
            className="vivideo-input"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
          />
          <span className="vivideo-unit">{unit}</span>
          <button className="vivideo-reset-single" onClick={handleReset} title="Reset to default">
            ↺
          </button>
        </div>
      </div>
      <div className="vivideo-slider-container">
        <input
          type="range"
          className="vivideo-slider"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
        />
        <div className="vivideo-slider-track">
          <div
            className="vivideo-slider-fill"
            style={{
              width: `${((value - min) / (max - min)) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SliderElement;
