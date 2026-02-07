import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'local-d1.db');

const db = new Database(dbPath);

// Check existing schema
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

if (tables.some(t => t.name === 'inventory')) {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='inventory'").get();
  console.log('\nCurrent schema:\n', schema.sql);
  
  const columns = db.prepare("PRAGMA table_info(inventory)").all();
  console.log('\nColumns:', columns.map(c => c.name));
}

db.close();
