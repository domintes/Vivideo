const fs = require('fs');
const espree = require('espree');
const s = fs.readFileSync('src/utils/uiHelper.js', 'utf8');
try {
  espree.parse(s, { ecmaVersion: 2021, sourceType: 'script' });
  console.log('Parsed OK as script');
} catch (err) {
  console.error('Script parse error:', err.message);
}
// Quick self-test: can espree parse a minimal class with static?
try {
  espree.parse('class A { static f() { return `x`; } }', {
    ecmaVersion: 2021,
    sourceType: 'script'
  });
  console.log('espree can parse minimal static class');
} catch (err) {
  console.error('espree failed to parse minimal class:', err.message);
}
try {
  espree.parse(s, { ecmaVersion: 2021, sourceType: 'module' });
  console.log('Parsed OK as module');
} catch (err) {
  console.error('Module parse error:', err.message);
}

// Try parsing only the class block
const start = s.indexOf('class UIHelper');
const end = s.indexOf('window.UIHelper');
if (start !== -1 && end !== -1) {
  const classBlock = s.slice(start, end + 'window.UIHelper'.length);
  try {
    espree.parse(classBlock, { ecmaVersion: 2021, sourceType: 'script' });
    console.log('Class block parsed OK');
  } catch (err) {
    console.error('Class block parse error:', err.message);
    // print first 40 lines of classBlock
    const lines = classBlock.split(/\r?\n/);
    console.log('Class block head:');
    for (let i = 0; i < Math.min(40, lines.length); i++) console.log(i + 1 + ': ' + lines[i]);
  }
}

// Try sanitizing template literals by emptying them
if (start !== -1 && end !== -1) {
  const classBlock = s.slice(start, end + 'window.UIHelper'.length);
  const sanitized = classBlock.replace(/`[\s\S]*?`/g, '``');
  try {
    espree.parse(sanitized, { ecmaVersion: 2021, sourceType: 'script' });
    console.log('Sanitized class block parsed OK');
  } catch (err) {
    console.error('Sanitized parse error:', err.message);
  }
}
