const fs = require('fs');
const s = fs.readFileSync('src/utils/uiHelper.js', 'utf8');
const i = s.indexOf('class UIHelper');
console.log('class at', i);
let depth = 0;
let start = -1;
for (let j = i; j < s.length; j++) {
  const ch = s[j];
  if (ch === '{') {
    depth++;
    if (start === -1) start = j;
  } else if (ch === '}') {
    depth--;
    if (depth === 0) {
      console.log('matching brace at', j);
      console.log(
        'snippet around match:\n' + s.slice(Math.max(0, j - 120), Math.min(s.length, j + 120))
      );
      break;
    }
  }
}
if (i === -1) console.log('class not found');
