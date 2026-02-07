import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read the adapted file
const adaptedPath = path.join(rootDir, 'inventory_sample_adapted.json');
const rawContent = fs.readFileSync(adaptedPath, 'utf-8');

// Extract all valid objects manually
const items = [];
const lines = rawContent.split('\n');
let currentObject = null;
let currentObjectStr = '';
let braceDepth = 0;
let inObject = false;

for (const line of lines) {
  for (const char of line) {
    if (char === '{') {
      braceDepth++;
      if (braceDepth === 1) {
        inObject = true;
        currentObjectStr = '{';
      } else if (inObject) {
        currentObjectStr += char;
      }
    } else if (char === '}') {
      if (inObject) {
        currentObjectStr += char;
      }
      braceDepth--;
      if (braceDepth === 0 && inObject) {
        // Try to parse this object
        try {
          // Clean up common issues
          let cleaned = currentObjectStr
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']')   // Remove trailing commas in arrays
            .replace(/"\s*"/g, '""')  // Fix empty strings
            .replace(/,\s*,/g, ',');  // Remove double commas
          
          const obj = JSON.parse(cleaned);
          
          // Check if it has required fields
          if (obj.itemName || obj.originalName) {
            items.push(obj);
          }
        } catch (e) {
          // Skip invalid objects
        }
        inObject = false;
        currentObjectStr = '';
      }
    } else if (inObject) {
      currentObjectStr += char;
    }
  }
  if (inObject) {
    currentObjectStr += '\n';
  }
}

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

// Save to JSON file
const outputPath = path.join(rootDir, 'inventory_imported.json');
fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
console.log(`Saved to ${outputPath}`);

// Insert into SQLite
const dbPath = path.join(rootDir, 'local-d1.db');
const db = new Database(dbPath);

// Table already exists with columns: id, name, name_ar, name_en, category, unit, lifespan_days, keywords_en, keywords_ar, variants, stock_by_residence, stock

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
    console.log(`Inserted ${item.id} - ${item.nameAr}`);
  }
});

insertMany(transformed);
db.close();

console.log(`\n✅ Import complete! ${transformed.length} items imported.`);
console.log('\nNext steps:');
console.log('1. Open: http://localhost:3000/import-local.html');
console.log('2. Or visit: http://localhost:3000/admin/import-inventory');
