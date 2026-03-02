// Popup script for Vivideo (save profile helper)
// Provides a minimal UI to save the current in-page settings as a profile.

(function () {
  'use strict';

  function generateProfileId() {
    return 'p_' + Math.random().toString(36).substr(2, 9);
  }

  function sanitizeSettings(settings = {}) {
    const defaults = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1,
      colorTemp: 0,
      sharpness: 0,
      speed: 1.0
    };
    const out = {};
    Object.keys(defaults).forEach((k) => {
      const v =
        settings && Object.prototype.hasOwnProperty.call(settings, k) ? settings[k] : undefined;
      out[k] = typeof v === 'number' && !Number.isNaN(v) ? v : defaults[k];
    });
    if (typeof settings.autoActivate === 'boolean') out.autoActivate = settings.autoActivate;
    return out;
  }

  function showMessage(text, kind = 'info') {
    const el = document.getElementById('message');
    if (!el) return;
    el.textContent = text;
    el.style.color = kind === 'error' ? '#ff4d4f' : kind === 'success' ? '#7ed321' : '';
  }

  async function getProfiles() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(['vivideoProfiles'], (res) => {
          resolve(Array.isArray(res.vivideoProfiles) ? res.vivideoProfiles : []);
        });
      } catch (e) {
        console.warn('Vivideo popup: getProfiles failed', e);
        resolve([]);
      }
    });
  }

  async function getCurrentSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(['vivideoSettings'], (res) => {
          const s =
            res && res.vivideoSettings
              ? res.vivideoSettings
              : {
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  gamma: 1,
                  colorTemp: 0,
                  sharpness: 0,
                  speed: 1.0,
                  autoActivate: true
                };
          resolve(s);
        });
      } catch (e) {
        console.warn('Vivideo popup: getCurrentSettings failed', e);
        resolve({});
      }
    });
  }

  async function saveProfiles(profiles) {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.set({ vivideoProfiles: profiles }, () => {
          resolve(true);
        });
      } catch (e) {
        console.warn('Vivideo popup: saveProfiles failed', e);
        resolve(false);
      }
    });
  }

  function notifyActiveTabEnsure() {
    try {
      chrome.tabs && chrome.tabs.query
        ? chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].id) {
              try {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'ensure-vivideo' }, () => {});
              } catch (err) {
                console.warn('Vivideo popup: notify tab failed', err);
              }
            }
          })
        : null;
    } catch (err) {
      console.warn('Vivideo popup: notifyActiveTabEnsure failed', err);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const input = document.getElementById('profile-name-popup');
    const saveBtn = document.getElementById('save-profile-btn');
    const saveNewBtn = document.getElementById('save-profile-new-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => window.close());
    }

    if (!input || !saveBtn || !saveNewBtn) return;

    saveBtn.addEventListener('click', async () => {
      const name = (input.value || '').trim();
      if (!name) {
        showMessage('Please enter a profile name', 'error');
        return;
      }

      const current = await getCurrentSettings();
      const profiles = await getProfiles();
      const existingIndex = profiles.findIndex((p) => p.name === name);

      const sanitized = sanitizeSettings(current || {});

      if (existingIndex >= 0) {
        // Overwrite existing profile, preserve id if present
        const existing = profiles[existingIndex];
        const id = existing.id || generateProfileId();
        profiles[existingIndex] = {
          id,
          name,
          profileCategory: existing.profileCategory || 'General',
          settings: sanitized
        };
        const ok = await saveProfiles(profiles);
        if (ok) {
          showMessage(`Profile "${name}" overwritten`, 'success');
          notifyActiveTabEnsure();
        } else {
          showMessage('Failed to save profile', 'error');
        }
      } else {
        // Create new profile
        const profile = {
          id: generateProfileId(),
          name,
          profileCategory: 'General',
          settings: sanitized
        };
        profiles.push(profile);
        const ok = await saveProfiles(profiles);
        if (ok) {
          showMessage(`Profile "${name}" saved`, 'success');
          notifyActiveTabEnsure();
        } else {
          showMessage('Failed to save profile', 'error');
        }
      }
      setTimeout(() => window.close(), 800);
    });

    saveNewBtn.addEventListener('click', async () => {
      const name = (input.value || '').trim();
      if (!name) {
        showMessage('Please enter a profile name', 'error');
        return;
      }
      const current = await getCurrentSettings();
      const profiles = await getProfiles();
      const profile = {
        id: generateProfileId(),
        name,
        profileCategory: 'General',
        settings: sanitizeSettings(current || {})
      };
      profiles.push(profile);
      const ok = await saveProfiles(profiles);
      if (ok) {
        showMessage(`Profile "${name}" saved as new`, 'success');
        notifyActiveTabEnsure();
      } else {
        showMessage('Failed to save profile', 'error');
      }
      setTimeout(() => window.close(), 800);
    });
  });
})();
