import React, { useState, useEffect, useRef } from 'react';

const HeaderSection = ({
  title = 'Vivideo',
  version = '1.0.0',
  collapsed = false,
  theme = 'cybernetic',
  onClose,
  onToggleCollapse,
  onDragStart,
  onInfo
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const headerRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isDragging || !headerRef.current) return;
      // Drag logic will be handled by parent component
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (event) => {
    // Only start dragging if clicking on header background, not buttons
    if (event.target.closest('.vivideo-header-controls')) {
      return;
    }

    const rect = headerRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    setIsDragging(true);

    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleToggleCollapseClick = () => {
    if (onToggleCollapse) {
      onToggleCollapse(!collapsed);
    }
  };

  const handleCloseClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleInfoClick = () => {
    if (onInfo) {
      onInfo();
    }
  };

  return (
    <div
      ref={headerRef}
      className="vivideo-header"
      onMouseDown={handleMouseDown}
      data-theme={theme}
    >
      <div className="vivideo-header-content">
        <div className="vivideo-header-title">
          <span className="vivideo-title">{title}</span>
          <span className="vivideo-version">v{version}</span>
        </div>
        <div className="vivideo-header-controls">
          <button className="vivideo-info-btn" onClick={handleInfoClick} title="Info">
            ℹ️
          </button>
          <button
            className="vivideo-toggle-btn"
            onClick={handleToggleCollapseClick}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '⤢' : '⤡'}
          </button>
          <button className="vivideo-close-btn" onClick={handleCloseClick} title="Close">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderSection;
