import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Local development database connection
let localDb: Database.Database | null = null;

function findDatabaseFile(): string | null {
  const wranglerPath = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1');

  if (!fs.existsSync(wranglerPath)) {
    return null;
  }

  // Look for directories that contain sqlite files
  const items = fs.readdirSync(wranglerPath);
  for (const item of items) {
    const itemPath = path.join(wranglerPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      // Look for .sqlite files in this directory
      const files = fs.readdirSync(itemPath);
      for (const file of files) {
        if (file.endsWith('.sqlite')) {
          return path.join(itemPath, file);
        }
      }
    }
  }

  return null;
}

export function getLocalDb() {
  if (!localDb) {
    const dbPath = findDatabaseFile();
    if (!dbPath) {
      throw new Error('Could not find local D1 database file');
    }
    localDb = new Database(dbPath);
  }
  return localDb;
}

// Simple wrapper to mimic CloudflareDB interface for local development
export class LocalCloudflareDB {
  private db: Database.Database;

  constructor() {
    this.db = getLocalDb();
  }

  async getInventory(limit: number = 50, offset: number = 0): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM inventory
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as any[];
  }

  async getInventoryById(id: string): Promise<any | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM inventory
      WHERE id = ? AND is_active = 1
    `);
    return stmt.get(id) as any | null;
  }

  async getInventoryByCategory(category: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM inventory
      WHERE category = ? AND is_active = 1
      ORDER BY name
    `);
    return stmt.all(category) as any[];
  }

  async searchInventory(query: string, category?: string): Promise<any[]> {
    let sql = `
      SELECT * FROM inventory
      WHERE is_active = 1
      AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)
    `;
    let params = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY name`;

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as any[];
  }

  async createInventoryItem(itemData: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO inventory (
        id, name, description, category, subcategory, sku, barcode, quantity,
        unit_of_measure, unit_price, minimum_stock, maximum_stock, supplier_name,
        supplier_contact, purchase_date, expiry_date, location, condition_status,
        image_url, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      itemData.id,
      itemData.name,
      itemData.description || null,
      itemData.category,
      itemData.subcategory || null,
      itemData.sku || null,
      itemData.barcode || null,
      itemData.quantity,
      itemData.unit_of_measure,
      itemData.unit_price || null,
      itemData.minimum_stock,
      itemData.maximum_stock || null,
      itemData.supplier_name || null,
      itemData.supplier_contact || null,
      itemData.purchase_date || null,
      itemData.expiry_date || null,
      itemData.location || null,
      itemData.condition_status,
      itemData.image_url || null,
      itemData.notes || null,
      itemData.is_active,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  async updateInventoryItem(id: string, itemData: any): Promise<void> {
    const setClause = Object.keys(itemData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'total_value')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(itemData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'total_value')
      .map(key => itemData[key]);

    const sql = `UPDATE inventory SET ${setClause}, updated_at = ? WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values, new Date().toISOString(), id);
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE inventory SET is_active = 0 WHERE id = ?
    `);
    stmt.run(id);
  }
}