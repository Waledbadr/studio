const fs = require('fs');
const path = 'd:/EstateCare/studio/src/components/timesheet/timesheet-settings.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/\{e\.type === "reduced_hours" && \| h \}/g, '{e.type === "reduced_hours" && | h }');
c = c.replace(/\{isAr \? يومياً: س \| الخميس: س : Daily: h \| Thu: h\}/g, '{isAr ? يومياً: س | الخميس: س : Daily: h | Thu: h}');

fs.writeFileSync(path, c);
