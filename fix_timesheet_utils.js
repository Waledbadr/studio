const fs = require('fs');
const tsPath = 'd:/EstateCare/studio/src/utils/timesheet-utils.ts';
let content = fs.readFileSync(tsPath, 'utf8');

content = content.replace(/export const calculateAttendanceStats[\s\S]*?(?=export const processPunches)/, '');
content = content.replace(/export const processPunches[\s\S]*?(?=^$|^\})/m, '');
// It's probably easier to just overwrite the files.
// Let me read the original first.
