import React from 'react';

const FooterSection = ({
  activeTab = 'profiles',
  activeProfile = 'DEFAULT',
  activeTheme = 'cybernetic',
  profiles = [],
  themes = ['cybernetic', 'dark', 'light'],
  onTabChange,
  onProfileSelect,
  onThemeSelect,
  onCreateProfile,
  onDeleteProfile,
  onImportSettings,
  onExportSettings
}) => {
  return (
    <div className="vivideo-footer-section">
      <div className="vivideo-tabs">
        <button
          className={activeTab === 'profiles' ? 'active' : ''}
          onClick={() => onTabChange && onTabChange('profiles')}
        >
          Profiles
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => onTabChange && onTabChange('settings')}
        >
          Settings
        </button>
      </div>

      <div className="vivideo-profile-selector">
        <select
          value={activeProfile}
          onChange={(e) => onProfileSelect && onProfileSelect(e.target.value)}
        >
          <option value="DEFAULT">Default</option>
          {profiles.map((profile) => (
            <option key={profile.name} value={profile.name}>
              {profile.name}
            </option>
          ))}
        </select>
        <button onClick={onCreateProfile}>+</button>
        <button onClick={() => onDeleteProfile && onDeleteProfile(activeProfile)}>-</button>
      </div>

      <div className="vivideo-theme-selector">
        <select
          value={activeTheme}
          onChange={(e) => onThemeSelect && onThemeSelect(e.target.value)}
        >
          {themes.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </div>

      <div className="vivideo-import-export">
        <button onClick={onImportSettings}>Import</button>
        <button onClick={onExportSettings}>Export</button>
      </div>
    </div>
  );
};

export default FooterSection;
