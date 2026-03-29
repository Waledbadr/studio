const fs = require('fs');

let c = fs.readFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', 'utf8');
if (!c.includes('import { useState, useEffect, useMemo }')) {
  c = c.replace(/import\s+\{\s*([A-Za-z0-9_,\s]+)\s*\}\s+from\s+'react';/, (match, group) => {
    let imports = group.split(',').map(s => s.trim());
    if (!imports.includes('useState')) imports.push('useState');
    if (!imports.includes('useEffect')) imports.push('useEffect');
    if (!imports.includes('useMemo')) imports.push('useMemo');
    return `import { ${imports.join(', ')} } from 'react';`;
  });
  fs.writeFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', c);
}

let c2 = fs.readFileSync('src/app/accommodation/timeline-reports/page.tsx', 'utf8');
if (!c2.includes('import { useState, useMemo, useEffect }')) {
  c2 = c2.replace(/import\s+\{\s*([A-Za-z0-9_,\s]+)\s*\}\s+from\s+'react';/, (match, group) => {
    let imports = group.split(',').map(s => s.trim());
    if (!imports.includes('useState')) imports.push('useState');
    if (!imports.includes('useEffect')) imports.push('useEffect');
    if (!imports.includes('useMemo')) imports.push('useMemo');
    return `import { ${imports.join(', ')} } from 'react';`;
  });
  fs.writeFileSync('src/app/accommodation/timeline-reports/page.tsx', c2);
}