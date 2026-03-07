import React from 'react';

const CollapseMenuSection = ({ collapsed = false }) => {
  return (
    <div className="vivideo-collapse-section">
      {!collapsed && (
        <div className="vivideo-collapse-content">
          <div className="vivideo-controls-section">{/* Sliders will be rendered here */}</div>
        </div>
      )}
    </div>
  );
};

export default CollapseMenuSection;
