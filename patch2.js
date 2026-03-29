const fs = require('fs');
const path = require('path');
const file = path.join('src', 'components', 'accommodation', 'create-transfer-dialog.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('getWorkerHistory, accommodationHistory', 'fetchWorkerHistory');

// find the function checkDateConflictsForWorker
content = content.replace(
  /const checkDateConflictsForWorker = \(workerId: string\) => \{/g,
  'const checkDateConflictsForWorker = async (workerId: string) => {'
);
content = content.replace(
  /const workerHistory = getWorkerHistory\(workerId\);/g,
  'const workerHistory = await fetchWorkerHistory(workerId);'
);

fs.writeFileSync(file, content);
console.log('patched dialog');
