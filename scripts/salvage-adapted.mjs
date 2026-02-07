import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';

const inPath = path.join(process.cwd(), 'inventory_sample_adapted.json');
const outPath = path.join(process.cwd(), 'inventory_ready_for_upload.json');

if (!fs.existsSync(inPath)) {
  console.error('inventory_sample_adapted.json not found');
  process.exit(1);
}
const raw = fs.readFileSync(inPath, 'utf8');
const lines = raw.split(/\r?\n/);
const objs = [];
let cur = null;
let braceDepth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('originalName') || line.includes('itemName')) {
    // start a new object capture backwards to find opening brace
    // find previous line that has '{'
    let start = i;
    while (start >= 0 && !lines[start].includes('{')) start--;
    if (start < 0) start = i;
    // find end by scanning forward to next '}' at same or lower depth
    let end = i;
    let d = 0;
    for (let j = start; j < lines.length; j++) {
      const l = lines[j];
      for (const ch of l) {
        if (ch === '{') d++;
        else if (ch === '}') d--;
      }
      if (d <= 0) { end = j; break; }
    }
    const block = lines.slice(start, end + 1).join('\n');
    try {
      const o = JSON5.parse(block);
      objs.push(o);
    } catch (e) {
      // try to clean common mistakes: add commas between fields and wrap missing commas
      let cleaned = block.replace(/\n\s*(["\w\u0600-\u06FF]+)/g, '\n  "$1');
      // fallback: attempt to extract key: value pairs
      try {
        const kv = {};
        const kvRe = /(["']?([\w\u0600-\u06FF]+)["']?)\s*:\s*([\[\{].*|".*?"|[^,\n]+)/g;
        let m;
        while ((m = kvRe.exec(block)) !== null) {
          const key = m[2];
          let val = m[3].trim();
          if (val.endsWith(',')) val = val.slice(0, -1);
          // try to parse JSON5 value or treat as string
          try { kv[key] = JSON5.parse(val); } catch { kv[key] = val.replace(/^['"]|['"]$/g, '').trim(); }
        }
        objs.push(kv);
      } catch (e2) {
        // ignore
      }
    }
    i = end;
  }
}

if (objs.length === 0) {
  console.error('No objects salvaged');
  process.exit(1);
}

// Normalize and transform
function parseLifespanDays(lifespan) {
  if (!lifespan) return undefined;
  const s = String(lifespan).trim();
  const m = s.match(/(\d+)\s*سنة|(?:(\d+)\s*years?)/i);
  if (m) return Number(m[1] || m[2]) * 365;
  const m2 = s.match(/(\d+)\s*يوم/);
  if (m2) return Number(m2[1]);
  return undefined;
}

const transformed = objs.map((it, idx) => {
  const nameAr = it.itemName || it.nameAr || it.originalName || it.name || '';
  const nameEn = it.itemNameEn || it.nameEn || it.itemName || '';
  const category = it.category || '';
  const unit = it.unit || 'قطعة';
  const lifespanDays = parseLifespanDays(it.lifespan) || it.lifespanDays || undefined;
  const keywordsAr = it.synonyms || it.keywordsAr || [];
  const keywordsEn = it.synonymsEn || it.keywordsEn || [];
  const variants = it.variables || it.variants || undefined;
  return { nameAr, nameEn, category, unit, lifespanDays, keywordsAr, keywordsEn, variants };
});

fs.writeFileSync(outPath, JSON.stringify(transformed, null, 2), 'utf8');
console.log(`Salvaged ${transformed.length} items and wrote to ${outPath}`);
