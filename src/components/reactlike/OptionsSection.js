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
        <label>
          <input
            type="checkbox"
            checked={extendedLimits}
            onChange={(e) => onExtendedLimitsChange && onExtendedLimitsChange(e.target.checked)}
          />
          Extended Limits
        </label>
      </div>
      <div className="vivideo-option">
        <label>
          <input
            type="checkbox"
            checked={autoActivate}
            onChange={(e) => onAutoActivateChange && onAutoActivateChange(e.target.checked)}
          />
          Auto Activate
        </label>
      </div>
      <div className="vivideo-option">
        <label>
          <input
            type="checkbox"
            checked={workOnImages}
            onChange={(e) => onWorkOnImagesChange && onWorkOnImagesChange(e.target.checked)}
          />
          Work on Images
        </label>
      </div>
      <div className="vivideo-option">
        <label>
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => onCompareModeChange && onCompareModeChange(e.target.checked)}
          />
          Compare Mode
        </label>
      </div>
      <button onClick={onResetAll}>Reset All</button>
    </div>
  );
};

export default OptionsSection;
