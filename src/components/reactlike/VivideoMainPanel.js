import React, { useState, useEffect, useRef } from 'react';
import HeaderSection from './HeaderSection';
import CollapseMenuSection from './CollapseMenuSection';
import SpeedControllerSection from './SpeedControllerSection';
import OptionsSection from './OptionsSection';
import FooterSection from './FooterSection';
import SliderElement from './SliderElement';

// VivideoMainPanel Component - Main container that orchestrates all other components
const VivideoMainPanel = ({
  isVisible: initialVisible = false,
  collapsed: initialCollapsed = false,
  theme: initialTheme = 'cybernetic',
  position: initialPosition = { x: 20, y: 20 },
  settings: initialSettings = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    gamma: 1,
    colorTemp: 0,
    sharpness: 0,
    speed: 1.0,
    extendedLimits: false,
    autoActivate: true,
    workOnImages: false,
    compareMode: false,
    overwritePlayerSpeed: true,
    autoApplyPreviousSpeed: false
  },
  profiles: initialProfiles = [],
  activeProfile: initialActiveProfile = 'DEFAULT',
  onMount,
  onUnmount,
  onClose,
  onSettingsChange,
  onPositionChange,
  onProfileSelect,
  onThemeSelect
}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [theme, setTheme] = useState(initialTheme);
  const [position, setPosition] = useState(initialPosition);
  const [settings, setSettings] = useState(initialSettings);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [activeProfile, setActiveProfile] = useState(initialActiveProfile);
  const [activeTab, setActiveTab] = useState('profiles');
  const [compatibilityMode, setCompatibilityMode] = useState(false);

  const panelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Notify parent that panel is mounted
    if (onMount) {
      onMount({
        show: () => setIsVisible(true),
        hide: () => setIsVisible(false),
        toggle: () => setIsVisible((prev) => !prev),
        updatePosition: setPosition,
        updateSettings: setSettings
      });
    }

    // Add drag event listeners
    const handleMouseMove = (event) => {
      if (!isDraggingRef.current || !panelRef.current) return;

      const newPosition = {
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y
      };

      setPosition(newPosition);
      if (panelRef.current) {
        panelRef.current.style.left = newPosition.x + 'px';
        panelRef.current.style.top = newPosition.y + 'px';
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      if (panelRef.current) {
        panelRef.current.classList.remove('dragging');
      }
      if (onPositionChange) {
        onPositionChange(position);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (onUnmount) {
        onUnmount();
      }
    };
  }, []);

  // Bind info-icon popovers for react-rendered icons inside panel
  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;

    const icons = root.querySelectorAll('.vivideo-info-icon');
    const handlers = [];

    icons.forEach((icon) => {
      let hoverTimer = null;
      let popup = null;

      const showPopup = () => {
        const text = icon.getAttribute('title') || icon.getAttribute('data-info') || '';
        if (!text) return;
        popup = document.createElement('div');
        popup.className = 'vivideo-info-popup';
        popup.textContent = text;
        UIHelper.safeAppend(popup);
        const rect = icon.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.left = rect.right + 8 + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.zIndex = 2147483647;
      };

      const hidePopup = () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        if (popup && popup.parentNode) {
          popup.parentNode.removeChild(popup);
          popup = null;
        }
      };

      const enter = () => {
        hoverTimer = setTimeout(showPopup, 500);
      };
      const leave = () => {
        hidePopup();
      };
      const click = (e) => {
        e.stopPropagation();
        if (popup) hidePopup();
        else {
          showPopup();
          setTimeout(hidePopup, 2500);
        }
      };

      icon.addEventListener('mouseenter', enter);
      icon.addEventListener('mouseleave', leave);
      icon.addEventListener('click', click);

      handlers.push({ icon, enter, leave, click });
    });

    return () => {
      handlers.forEach(({ icon, enter, leave, click }) => {
        icon.removeEventListener('mouseenter', enter);
        icon.removeEventListener('mouseleave', leave);
        icon.removeEventListener('click', click);
      });
    };
  }, [panelRef.current]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.left = position.x + 'px';
      panelRef.current.style.top = position.y + 'px';
    }
  }, [position]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleToggleCollapse = (newCollapsed) => {
    setCollapsed(newCollapsed);
  };

  const handleDragStart = (event) => {
    if (event.target.closest('.vivideo-header-controls')) {
      return;
    }

    const rect = panelRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    isDraggingRef.current = true;
    panelRef.current.classList.add('dragging');
  };

  const handleSliderChange = (name, value) => {
    const newSettings = {
      ...settings,
      [name]: value
    };
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const handleSpeedChange = (speed) => {
    handleSliderChange('speed', speed);
  };

  const handleOptionsChange = (optionName, value) => {
    handleSliderChange(optionName, value);
  };

  const handleProfileSelect = (profileName) => {
    setActiveProfile(profileName);
    if (onProfileSelect) {
      onProfileSelect(profileName);
    }
  };

  const handleThemeSelect = (themeName) => {
    setTheme(themeName);
    if (onThemeSelect) {
      onThemeSelect(themeName);
    }
  };

  const sliderConfigs = [
    {
      name: 'brightness',
      defaultValue: 0,
      minValue: -100,
      maxValue: 100,
      minValueExtended: -200,
      maxValueExtended: 200,
      unit: '%'
    },
    {
      name: 'contrast',
      defaultValue: 0,
      minValue: -100,
      maxValue: 100,
      minValueExtended: -200,
      maxValueExtended: 200,
      unit: '%'
    },
    {
      name: 'saturation',
      defaultValue: 0,
      minValue: -90,
      maxValue: 100,
      minValueExtended: -100,
      maxValueExtended: 300,
      unit: '%'
    },
    {
      name: 'gamma',
      defaultValue: 1,
      minValue: 0.1,
      maxValue: 3.0,
      minValueExtended: 0.1,
      maxValueExtended: 5.0,
      step: 0.1,
      unit: ''
    },
    {
      name: 'colorTemp',
      defaultValue: 0,
      minValue: -100,
      maxValue: 100,
      minValueExtended: -200,
      maxValueExtended: 200,
      unit: '°K'
    },
    {
      name: 'sharpness',
      defaultValue: 0,
      minValue: 0,
      maxValue: 100,
      minValueExtended: 0,
      maxValueExtended: 300,
      unit: '%'
    }
  ];

  return (
    <div
      ref={panelRef}
      className="vivideo-main-panel"
      data-theme={theme}
      style={{
        display: isVisible ? 'block' : 'none',
        left: position.x,
        top: position.y
      }}
      id="vivideo-panel"
    >
      <div className="vivideo-panel-content">
        <HeaderSection
          title="Vivideo"
          version="1.0.0"
          collapsed={collapsed}
          theme={theme}
          onClose={handleClose}
          onToggleCollapse={handleToggleCollapse}
          onDragStart={handleDragStart}
          onInfo={() => console.log('Info clicked')}
        />

        <CollapseMenuSection collapsed={collapsed} />

        <SpeedControllerSection
          speed={settings.speed}
          speedStep={settings.speedStep || 0.25}
          onSpeedChange={handleSpeedChange}
          overwritePlayerSpeed={settings.overwritePlayerSpeed}
          autoApplyPreviousSpeed={settings.autoApplyPreviousSpeed}
          onToggleOverwrite={(enabled) => handleOptionsChange('overwritePlayerSpeed', enabled)}
          onToggleAutoApply={(enabled) => handleOptionsChange('autoApplyPreviousSpeed', enabled)}
        />

        <OptionsSection
          extendedLimits={settings.extendedLimits}
          autoActivate={settings.autoActivate}
          workOnImages={settings.workOnImages}
          compareMode={settings.compareMode}
          compatibilityMode={compatibilityMode}
          onExtendedLimitsChange={(enabled) => handleOptionsChange('extendedLimits', enabled)}
          onAutoActivateChange={(enabled) => handleOptionsChange('autoActivate', enabled)}
          onWorkOnImagesChange={(enabled) => handleOptionsChange('workOnImages', enabled)}
          onCompareModeChange={(enabled) => handleOptionsChange('compareMode', enabled)}
          onCompatibilityModeChange={(enabled) => setCompatibilityMode(enabled)}
          onResetAll={() => {
            const defaultSettings = {
              brightness: 0,
              contrast: 0,
              saturation: 0,
              gamma: 1,
              colorTemp: 0,
              sharpness: 0,
              speed: 1.0,
              extendedLimits: false,
              autoActivate: true
            };
            setSettings(defaultSettings);
            if (onSettingsChange) {
              onSettingsChange(defaultSettings);
            }
          }}
        />

        {sliderConfigs.map((config) => (
          <SliderElement
            key={config.name}
            name={config.name}
            defaultValue={settings[config.name] ?? config.defaultValue}
            minValue={config.minValue}
            maxValue={config.maxValue}
            minValueExtended={config.minValueExtended}
            maxValueExtended={config.maxValueExtended}
            step={config.step}
            unit={config.unit}
            extendedLimits={settings.extendedLimits}
            onChange={handleSliderChange}
          />
        ))}

        <FooterSection
          activeTab={activeTab}
          activeProfile={activeProfile}
          activeTheme={theme}
          profiles={profiles}
          themes={['cybernetic', 'dark', 'light']}
          onTabChange={setActiveTab}
          onProfileSelect={handleProfileSelect}
          onThemeSelect={handleThemeSelect}
          onCreateProfile={() => console.log('Save profile')}
          onDeleteProfile={(profileName) => console.log('Delete profile', profileName)}
          onImportSettings={() => console.log('Import settings')}
          onExportSettings={() => console.log('Export settings')}
        />
      </div>
    </div>
  );
};

export default VivideoMainPanel;
