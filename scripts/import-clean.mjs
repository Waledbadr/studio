import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read the clean file
const cleanPath = path.join(rootDir, 'inventory_clean.json');
const items = JSON.parse(fs.readFileSync(cleanPath, 'utf-8'));

console.log(`Found ${items.length} items`);

// Transform to schema format
function parseLifespanDays(lifespan) {
  if (!lifespan) return null;
  const match = lifespan.match(/(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1]);
  if (lifespan.includes('سنة') || lifespan.includes('سنوات')) {
    return num * 365;
  } else if (lifespan.includes('شهر') || lifespan.includes('أشهر')) {
    return num * 30;
  }
  return num;
}

const transformed = items.map((item, idx) => {
  const nameAr = item.itemName || item.originalName || 'بدون اسم';
  const nameEn = item.itemNameEn || nameAr;
  
  // Build variants object from variables
  const variants = {};
  if (item.variables && typeof item.variables === 'object') {
    for (const [key, value] of Object.entries(item.variables)) {
      variants[key] = Array.isArray(value) ? value : [value];
    }
  }
  
  return {
    id: `it_import_${Date.now()}_${idx}`,
    nameAr,
    nameEn,
    descriptionAr: item.originalName !== nameAr ? item.originalName : null,
    descriptionEn: null,
    category: item.category || 'عام',
    subcategory: item.subcategory || null,
    unit: item.unit || 'قطعة',
    stock: 0,
    stockByResidence: {},
    minStock: 0,
    keywordsAr: item.synonyms || [],
    keywordsEn: item.synonymsEn || [],
    variants,
    lifespanDays: parseLifespanDays(item.lifespan),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

console.log(`Transformed ${transformed.length} items`);

// Save to JSON file for /api/import-inventory/local
const outputPath = path.join(rootDir, 'public', 'inventory_local_db.json');
fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
console.log(`Saved to ${outputPath}`);

// Insert into SQLite
const dbPath = path.join(rootDir, 'local-d1.db');
const db = new Database(dbPath);

// Insert items
const insert = db.prepare(`
  INSERT OR REPLACE INTO inventory (
    id, name, name_ar, name_en, category, unit, stock, stock_by_residence,
    keywords_ar, keywords_en, variants, lifespan_days
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    insert.run(
      item.id,
      item.nameAr,  // name column
      item.nameAr,  // name_ar
      item.nameEn,  // name_en
      item.category,
      item.unit,
      item.stock,
      JSON.stringify(item.stockByResidence),
      JSON.stringify(item.keywordsAr),
      JSON.stringify(item.keywordsEn),
      JSON.stringify(item.variants),
      item.lifespanDays
    );
    console.log(`✓ ${item.nameAr} (${item.nameEn})`);
  }
});

insertMany(transformed);
db.close();

console.log(`\n✅ استيراد كامل! تم إدراج ${transformed.length} صنف في القاعدة المحلية`);
console.log('\n📋 الأصناف المستوردة:');
transformed.forEach((item, i) => {
  console.log(`  ${i + 1}. ${item.nameAr} - ${item.category}`);
});
console.log('\n🔄 الخطوة التالية:');
console.log('افتح المتصفح على: http://localhost:3000/import-local.html');
console.log('أو: http://localhost:3000/admin/import-inventory');
