import React from 'react';

const SpeedControllerSection = ({
  speed = 1.0,
  speedStep = 0.25,
  onSpeedChange,
  overwritePlayerSpeed = true,
  autoApplyPreviousSpeed = false,
  onToggleOverwrite,
  onToggleAutoApply
}) => {
  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
  };

  return (
    <div className="vivideo-speed-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontWeight: 600 }}>Speed: {speed.toFixed(2)}x</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Overwrite player speed when Vivideo changes"
          >
            <input
              type="checkbox"
              checked={overwritePlayerSpeed}
              onChange={(e) => onToggleOverwrite && onToggleOverwrite(e.target.checked)}
            />
            <span style={{ fontSize: 12 }}>Overwrite</span>
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Auto activate previous Vivideo speed on new videos"
          >
            <input
              type="checkbox"
              checked={autoApplyPreviousSpeed}
              onChange={(e) => onToggleAutoApply && onToggleAutoApply(e.target.checked)}
            />
            <span style={{ fontSize: 12 }}>AutoPrev</span>
          </label>
        </div>
      </div>
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
