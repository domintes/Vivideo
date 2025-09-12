const fs = require('fs');
const path = require('path');

// Simple build script for Chrome extension
// Just copies files to dist directory

const distDir = path.join(__dirname, 'dist');

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Copy manifest and main files
copyFile('manifest.json', path.join(distDir, 'manifest.json'));
copyFile('background.js', path.join(distDir, 'background.js'));
copyFile('popup.html', path.join(distDir, 'popup.html'));
copyFile('popup.js', path.join(distDir, 'popup.js'));
copyFile('styles.css', path.join(distDir, 'styles.css'));

// Copy src directory
copyDir('src', path.join(distDir, 'src'));

// Copy icons
copyDir('icons', path.join(distDir, 'icons'));

console.log('Build completed successfully!');
