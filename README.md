# 🎬 Vivideo - Real-time Video Enhancement

## 📜 Privacy Policy

Vivideo does not collect, store, or transmit any personally identifiable user data.  
All settings and enhancement profiles are stored locally in the user's browser.  
No data is shared with third parties.

## ✨ Features

- **Brightness** (-100% to +100%) - Adjust video brightness
- **Contrast** (-100% to +100%) - Adjust video contrast
- **Saturation** (-90% to +100%) - Adjust color saturation
- **Gamma** (0.1 to 3.0) - Gamma correction
- **Color Temperature** (-100% to +100%) - Adjust color temperature (cool/warm)

## 🚀 Installation

1. Download the `Vivideo` extension folder
2. Open Chrome/Edge/Opera and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `Vivideo` folder

## 📋 Usage

### Basic Controls

- **Click the extension icon** - Opens the info page and the button to launch the control panel
- **Alt + V** - Toggles the visibility of the control panel
- **Drag the header** - Moves the panel to a different position
- **Click X** - Closes the panel
- **Click outside the panel** - Automatically hides the panel
- **ⓘ Button** - Shows/hides information in the panel

### Parameter Adjustment

- **Sliders** - Drag to change the value
- **Text fields** - Enter an exact value
- **Reset All** - Restores all settings to defaults
- **Single reset** - Restores a single parameter to its default

## 🎯 Default Values

All parameters have a default value of 0 (or 1.0 for gamma), meaning no modification of the original video.

## 🔧 Expected Behavior

- **Brightness -50%** → Video darker
- **Brightness +50%** → Video brighter
- **Contrast -50%** → Flat image, less contrast
- **Contrast +50%** → Increased contrast
- **Saturation -90%** → Almost black-and-white video
- **Saturation +72%** → Very vivid, saturated colors
- **Gamma 0.5** → Darker midtones
- **Gamma 2.0** → Brighter midtones
- **Color Temp -50%** → Cool/blue tint
- **Color Temp +50%** → Warm/yellow tint

## 🌐 Compatibility

- ✅ YouTube
- ✅ Vimeo
- ✅ Netflix
- ✅ Twitch
- ✅ Facebook Video
- ✅ Instagram
- ✅ TikTok
- ✅ Any website with `<video>` elements

## 🎥 Testing

Open `test.html` in your browser to test all extension features.

## 🔄 Advanced Features

- **Real-time operation** - All changes are applied immediately
- **Fullscreen compatibility** - Panel works even in fullscreen mode
- **Automatic video detection** - Extension automatically finds all video elements on the page
- **Shadow DOM support** - Works with advanced web components
- **Settings memory** - Settings are preserved between sessions
