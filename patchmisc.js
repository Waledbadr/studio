const fs = require('fs');

let c = fs.readFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', 'utf8');
c = c.replace('swaps: 0,\n      swaps: 0,', 'swaps: 0,');
if (!c.includes('useState')) {
  c = c.replace('import { useEffect, useMemo }', 'import { useEffect, useMemo, useState }');
  c = c.replace('import { useMemo }', 'import { useEffect, useMemo, useState }');
}
fs.writeFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', c);

let c2 = fs.readFileSync('src/app/accommodation/timeline-reports/page.tsx', 'utf8');
if (!c2.includes('useEffect')) {
  c2 = c2.replace('import { useState, useMemo }', 'import { useState, useMemo, useEffect }');
  fs.writeFileSync('src/app/accommodation/timeline-reports/page.tsx', c2);
}

// accommodation-context line 906, 924 errors
let c3 = fs.readFileSync('src/context/accommodation-context.tsx', 'utf8');
c3 = c3.replace(/if \(historyUnsub\) historyUnsub\(\);/g, 'if (historyUnsub) (historyUnsub as any)();');
fs.writeFileSync('src/context/accommodation-context.tsx', c3);