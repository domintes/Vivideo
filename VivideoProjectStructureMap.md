# Vivideo project structure map

## Core UI entry points
- [Vivideo extension entry](src/content.js) – main controller that initializes the whole panel, loads settings, binds events, and coordinates the UI.
- [Extension manifest](manifest.json) – defines content scripts, permissions, and browser integration.
- [Build and dev scripts](package.json) – Vite + TypeScript build pipeline for the extension.

## Main application modules
- [Main controller](src/content.js) – central orchestration point for the whole extension.
- [Video controls](src/components/videoControls.js) – slider controls for brightness, contrast, saturation, gamma, temperature, sharpness, and speed.
- [Profile manager](src/components/profileManager.js) – profile creation, loading, saving, normalization, and profile-list UI.
- [Theme manager](src/components/themeManager.js) – theme switching and UI theming.
- [Settings manager](src/components/settingsManager.js) – import/export of settings and profiles.
- [Speed controller](src/components/speedController.js) – playback speed handling and synchronization with video elements.
- [Filter engine](src/components/videoFilterEngine.js) – actual video filter application logic.
- [Storage helpers](src/utils/storage.js) – browser storage wrappers.
- [UI helpers](src/utils/uiHelper.js) – shared DOM helpers, header wiring, checkbox binding, and toast UI.

## Key classes and functions to search for
- `VivideoController` – main controller in [src/content.js](src/content.js).
- `VideoControls` – control-panel UI logic in [src/components/videoControls.js](src/components/videoControls.js).
- `ProfileManager` – profile lifecycle and profile list behavior in [src/components/profileManager.js](src/components/profileManager.js).
- `ThemeManager` – UI theme behavior in [src/components/themeManager.js](src/components/themeManager.js).
- `SettingsManager` – settings import/export in [src/components/settingsManager.js](src/components/settingsManager.js).
- `SpeedController` – speed application and video synchronization in [src/components/speedController.js](src/components/speedController.js).
- `VideoFilterEngine` – actual filter rendering in [src/components/videoFilterEngine.js](src/components/videoFilterEngine.js).
- `UIHelper` – shared helpers in [src/utils/uiHelper.js](src/utils/uiHelper.js).
- `StorageUtils` – storage access helpers in [src/utils/storage.js](src/utils/storage.js).

## Useful sections inside the main controller
- [UI creation](src/content.js) – the `createUI()` method builds the panel layout.
- [Initialization flow](src/content.js) – `init()`, `loadSettings()`, `initializeComponents()`, and `finishInitialization()` manage startup.
- [Layout and resizing](src/content.js) – layout switching and column resizing live in the controller.
- [Filter application](src/content.js) – `applyFilters()` and related update methods are the main runtime path for live video changes.
- [Profile persistence](src/content.js) – save/load profile state is wired from the controller.

## Project folders
- [src](src) – active extension source.
- [src/components](src/components) – component modules.
- [src/utils](src/utils) – shared helpers and storage wrappers.
- [src/assets](src/assets) – icons and fonts used by the extension.
- [privacy](privacy) – privacy-related assets and page.
