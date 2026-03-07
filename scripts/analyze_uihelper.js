const fs = require('fs');
const path = 'src/utils/uiHelper.js';
const s = fs.readFileSync(path, 'utf8');
const backticks = (s.match(/`/g) || []).length;
const classes = (s.match(/class\s+UIHelper/g) || []).length;
console.log('backticks:', backticks);
console.log('class UIHelper occurrences:', classes);

// Check for unbalanced template literals by splitting on backticks
const parts = s.split('`');
console.log('parts length (should be odd for balanced):', parts.length);

// Print surrounding lines near 220-235
const lines = s.split(/\r?\n/);
console.log('Context lines 216-236:');
for (let i = 215; i < 236 && i < lines.length; i++) {
  console.log(i + 1 + ': ' + lines[i]);
}

console.log('\nFirst 6 lines with visible chars:');
for (let i = 0; i < 6 && i < lines.length; i++) {
  console.log(i + 1 + ':', JSON.stringify(lines[i]));
}

// Find first line that causes parse error
for (let i = 1; i <= lines.length; i++) {
  const snippet = lines.slice(0, i).join('\n');
  try {
    new Function(snippet);
  } catch (err) {
    console.log('Parse error at line', i, '-', err.message);
    break;
  }
}
