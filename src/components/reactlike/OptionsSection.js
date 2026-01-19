import React from 'react';

const OptionsSection = ({
  extendedLimits = false,
  autoActivate = true,
  workOnImages = false,
  compareMode = false,
  onExtendedLimitsChange,
  onAutoActivateChange,
  onWorkOnImagesChange,
  onCompareModeChange,
  onResetAll
}) => {
  return (
    <div className="vivideo-options-section">
      <div className="vivideo-option">
        <label className="vivideo-switch-container">
          <input
            type="checkbox"
            className="vivideo-switch-input"
            checked={extendedLimits}
            onChange={(e) => onExtendedLimitsChange && onExtendedLimitsChange(e.target.checked)}
          />
          <span className="vivideo-switch-track" />
          <span className="vivideo-switch-label">Extended</span>
          <button className="vivideo-info-icon" title="Enable extended technical ranges">
            i
          </button>
        </label>
      </div>

      <div className="vivideo-option">
        <label className="vivideo-switch-container">
          <input
            type="checkbox"
            className="vivideo-switch-input"
            checked={autoActivate}
            onChange={(e) => onAutoActivateChange && onAutoActivateChange(e.target.checked)}
          />
          <span className="vivideo-switch-track" />
          <span className="vivideo-switch-label">Auto</span>
          <button
            className="vivideo-info-icon"
            title="Auto-activate extension when videos are detected"
          >
            i
          </button>
        </label>
      </div>

      <div className="vivideo-option">
        <label className="vivideo-switch-container">
          <input
            type="checkbox"
            className="vivideo-switch-input"
            checked={workOnImages}
            onChange={(e) => onWorkOnImagesChange && onWorkOnImagesChange(e.target.checked)}
          />
          <span className="vivideo-switch-track" />
          <span className="vivideo-switch-label">Images</span>
          <button className="vivideo-info-icon" title="Apply filters to images as well">
            i
          </button>
        </label>
      </div>

      <div className="vivideo-option">
        <label className="vivideo-switch-container">
          <input
            type="checkbox"
            className="vivideo-switch-input"
            checked={compareMode}
            onChange={(e) => onCompareModeChange && onCompareModeChange(e.target.checked)}
          />
          <span className="vivideo-switch-track" />
          <span className="vivideo-switch-label">Compare</span>
          <button className="vivideo-info-icon" title="Split-screen profile comparison">
            i
          </button>
        </label>
      </div>
      <button onClick={onResetAll}>Reset All</button>
    </div>
  );
};

export default OptionsSection;
