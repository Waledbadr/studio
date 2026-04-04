const fs = require('fs');
const path = 'd:/EstateCare/studio/src/app/timesheet/history/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const s1 = '  // Calculate days in selected fiscal month using company standard';

const idx1 = code.indexOf(s1);
const idx2 = code.indexOf(s1, idx1 + 1);

if (idx1 !== -1 && idx2 !== -1) {
  code = code.slice(0, idx1) + code.slice(idx2);
  fs.writeFileSync(path, code);
  console.log('Removed duplicate block');
} else {
  console.log('Could not find duplicates');
}
