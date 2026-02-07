import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';

const inPath = path.join(process.cwd(), 'inventory_sample_adapted.json');
const outPath = path.join(process.cwd(), 'inventory_ready_for_upload.json');

if (!fs.existsSync(inPath)) {
  console.error('inventory_sample_adapted.json not found at project root');
  process.exit(1);
}

const raw = fs.readFileSync(inPath, 'utf8');
let parsed;
try {
  parsed = JSON5.parse(raw);
} catch (e) {
  console.error('Failed to parse as JSON5:', e.message);
  // Try to extract object array heuristically: find all top-level {...} groups
  const objs = [];
  const re = /\{[^]*?\}/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    try {
      const o = JSON5.parse(m[0]);
      // heuristic: keep objects that have 'itemName' or 'nameEn' or 'nameEn'
      if (o.itemName || o.itemNameEn || o.nameEn || o.nameAr) objs.push(o);
    } catch (e2) {
      // ignore
    }
  }
  if (objs.length === 0) {
    console.error('No objects could be recovered from file');
    process.exit(1);
  }
  parsed = objs;
}

// parsed may be an object or an array; normalize to array
let items = Array.isArray(parsed) ? parsed : [parsed];

function parseLifespanDays(lifespan) {
  if (!lifespan) return undefined;
  const s = String(lifespan).trim();
  // detect years like '8 سنوات' or 'سنة'
  const m = s.match(/(\d+)\s*سنة|سنة\s*(\d+)|(?:(\d+)\s*years?)/i);
  let years = 0;
  if (m) {
    years = Number(m[1] || m[2] || m[3] || 0);
    return years * 365;
  }
  const m2 = s.match(/(\d+)\s*days?|(\d+)\s*يوم/);
  if (m2) return Number(m2[1] || m2[2]);
  return undefined;
}

const transformed = items.map((it, idx) => {
  const nameAr = it.itemName || it.nameAr || it.originalName || '';
  const nameEn = it.itemNameEn || it.nameEn || '';
  const category = (it.category || it.cat || '').toString();
  const unit = it.unit || it.unitName || 'قطعة';
  const lifespanDays = parseLifespanDays(it.lifespan) || it.lifespanDays || undefined;
  const keywordsAr = it.synonyms || it.keywordsAr || [];
  const keywordsEn = it.synonymsEn || it.keywordsEn || [];
  // variables / variants
  let variants = undefined;
  if (it.variables && typeof it.variables === 'object') variants = it.variables;
  else if (it.variants && typeof it.variants === 'object') variants = it.variants;

  return {
    nameAr,
    nameEn,
    category,
    unit,
    lifespanDays,
    keywordsAr,
    keywordsEn,
    variants,
  };
});

fs.writeFileSync(outPath, JSON.stringify(transformed, null, 2), 'utf8');
console.log(`Wrote ${transformed.length} items to ${outPath}`);
