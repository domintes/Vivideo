import React from 'react';

const SpeedControllerSection = ({ speed = 1.0, speedStep = 0.25, onSpeedChange }) => {
  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
  };

  return (
    <div className="vivideo-speed-section">
      <label>Speed: {speed.toFixed(2)}x</label>
      <input
        type="range"
        min="0.25"
        max="4.0"
        step={speedStep}
        value={speed}
        onChange={handleSpeedChange}
      />
    </div>
  );
};

export default SpeedControllerSection;
