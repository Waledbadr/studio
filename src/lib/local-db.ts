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
  private db: Database.Database | null = null;

  private getDb(): Database.Database {
    if (!this.db) {
      const dbPath = findDatabaseFile();
      if (!dbPath) {
        throw new Error('Could not find local D1 database file');
      }
      this.db = new Database(dbPath);
    }
    return this.db;
  }

  async getInventory(limit: number = 50, offset: number = 0): Promise<any[]> {
    const stmt = this.getDb().prepare(`
      SELECT * FROM inventory
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as any[];
  }

  async getInventoryById(id: string): Promise<any | null> {
    const stmt = this.getDb().prepare(`
      SELECT * FROM inventory
      WHERE id = ? AND is_active = 1
    `);
    return stmt.get(id) as any | null;
  }

  async getInventoryByCategory(category: string): Promise<any[]> {
    const stmt = this.getDb().prepare(`
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

    const stmt = this.getDb().prepare(sql);
    return stmt.all(...params) as any[];
  }

  async createInventoryItem(itemData: any): Promise<void> {
    const stmt = this.getDb().prepare(`
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
    const stmt = this.getDb().prepare(sql);
    stmt.run(...values, new Date().toISOString(), id);
  }

  async getUsers(limit: number = 50, offset: number = 0): Promise<any[]> {
    const stmt = this.getDb().prepare(`
      SELECT * FROM users
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as any[];
  }

  async getUserById(id: string): Promise<any | null> {
    const stmt = this.getDb().prepare(`
      SELECT * FROM users
      WHERE id = ? AND is_active = 1
    `);
    return stmt.get(id) as any | null;
  }

  async createUser(userData: any): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO users (
        id, name, email, phone, role, password_hash, avatar_url, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run(
      userData.id,
      userData.name,
      userData.email,
      userData.phone || null,
      userData.role,
      userData.password_hash,
      userData.avatar_url || null,
      userData.is_active,
      now,
      now
    );
  }

  async updateUser(id: string, userData: any): Promise<void> {
    const setClause = Object.keys(userData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(userData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => userData[key]);

    const sql = `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`;
    const stmt = this.getDb().prepare(sql);
    stmt.run(...values, new Date().toISOString(), id);
  }

  async deleteUser(id: string): Promise<void> {
    const stmt = this.getDb().prepare(`
      UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  }

  async saveFileMetadata(metadata: any): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO files (
        id, filename, original_name, mime_type, size_bytes, r2_key, 
        public_url, entity_type, entity_id, uploaded_by, is_public, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metadata.id,
      metadata.filename,
      metadata.original_name,
      metadata.mime_type,
      metadata.size_bytes,
      metadata.r2_key,
      metadata.public_url,
      metadata.entity_type || null,
      metadata.entity_id || null,
      metadata.uploaded_by || null,
      metadata.is_public,
      metadata.created_at
    );
  }

  // Transaction methods
  async getInventoryTransactions(limit: number = 50, offset: number = 0): Promise<any[]> {
    const stmt = this.getDb().prepare(`
      SELECT * FROM inventory_transactions
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as any[];
  }

  async getInventoryTransactionsByReference(referenceDocId: string): Promise<any[]> {
    const stmt = this.getDb().prepare(`
      SELECT * FROM inventory_transactions
      WHERE reference_doc_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(referenceDocId) as any[];
  }

  async createInventoryTransaction(transactionData: any): Promise<void> {
    const stmt = this.getDb().prepare(`
      INSERT INTO inventory_transactions (
        id, item_id, item_name_en, item_name_ar, residence_id, date, type, quantity,
        reference_doc_id, related_residence_id, location_name, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run(
      transactionData.id,
      transactionData.itemId,
      transactionData.itemNameEn,
      transactionData.itemNameAr || null,
      transactionData.residenceId,
      transactionData.date,
      transactionData.type,
      transactionData.quantity,
      transactionData.referenceDocId || null,
      transactionData.relatedResidenceId || null,
      transactionData.locationName || null,
      transactionData.notes || null,
      now,
      now
    );
  }
}