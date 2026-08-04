# Vivideo source notes

This folder contains the active browser-extension implementation for Vivideo.

## Main entry points
- [src/content.js](../src/content.js) – main controller that initializes the UI, loads settings, and coordinates all components.
- [src/components/videoControls.js](components/videoControls.js) – filter sliders and control bindings.
- [src/components/profileManager.js](components/profileManager.js) – profiles, presets, and profile-related UI behavior.
- [src/components/themeManager.js](components/themeManager.js) – theme switching and theme-specific UI updates.
- [src/components/settingsManager.js](components/settingsManager.js) – import/export settings logic.
- [src/components/speedController.js](components/speedController.js) – playback speed handling.
- [src/components/videoFilterEngine.js](components/videoFilterEngine.js) – the actual video filter application logic.
- [src/utils/uiHelper.js](utils/uiHelper.js) – shared DOM and UI helpers.
- [src/utils/storage.js](utils/storage.js) – wrappers for storage access.

## Development notes
- The extension entry point used by the browser is [src/content.js](../src/content.js).
- Keep changes scoped to the active modules listed above.
- Avoid reintroducing legacy experimental UI variants that are no longer loaded.
