const fs = require('fs');
let context = fs.readFileSync('src/context/accommodation-context.tsx', 'utf8');
context = context.replace(/if \(histenersUnsub\) historyUnsub\(\);/g, '');
if (!context.includes('fetchHistoryByDateRange,')) {
  context = context.replace('autoArchiveOccupants, // NEW', 'autoArchiveOccupants, // NEW\n    fetchHistoryByDateRange,');
}
fs.writeFileSync('src/context/accommodation-context.tsx', context);