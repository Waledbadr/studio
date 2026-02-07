import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'inventory_ready_for_upload.json');
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}
const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const dbPath = path.join(process.cwd(), 'local-d1.db');
const db = new Database(dbPath);

// Create table if missing
db.exec(`
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  category TEXT,
  unit TEXT,
  lifespan_days INTEGER,
  keywords_en TEXT,
  keywords_ar TEXT,
  variants TEXT,
  stock_by_residence TEXT,
  stock INTEGER DEFAULT 0
);
`);

const insert = db.prepare(`INSERT OR REPLACE INTO inventory (id, name, name_ar, name_en, category, unit, lifespan_days, keywords_en, keywords_ar, variants, stock_by_residence, stock) VALUES (@id,@name,@name_ar,@name_en,@category,@unit,@lifespan_days,@keywords_en,@keywords_ar,@variants,@stock_by_residence,@stock)`);

const insertMany = db.transaction((rows) => {
  for (const [idx, item] of rows.entries()) {
    const id = item.id || `it_local_${Date.now()}_${idx}`;
    const variantsJson = item.variants ? JSON.stringify(item.variants) : JSON.stringify([]);
    const keywordsEn = item.keywordsEn ? JSON.stringify(item.keywordsEn) : JSON.stringify([]);
    const keywordsAr = item.keywordsAr ? JSON.stringify(item.keywordsAr) : JSON.stringify([]);
    const stockByResidence = item.stockByResidence ? JSON.stringify(item.stockByResidence) : JSON.stringify({});
    insert.run({
      id,
      name: item.nameEn || item.nameAr || id,
      name_ar: item.nameAr || '',
      name_en: item.nameEn || '',
      category: item.category || '',
      unit: item.unit || '',
      lifespan_days: item.lifespanDays || null,
      keywords_en: keywordsEn,
      keywords_ar: keywordsAr,
      variants: variantsJson,
      stock_by_residence: stockByResidence,
      stock: 0
    });
    console.log('Inserted', id, item.nameEn || item.nameAr || id);
  }
});

insertMany(items || []);
db.close();
console.log('Import complete.');