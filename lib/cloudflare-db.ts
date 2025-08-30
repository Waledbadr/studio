/**
 * طبقة قاعدة البيانات Cloudflare D1
 * تحتوي على جميع العمليات CRUD للتطبيق
 */

export interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  BUCKET: R2Bucket;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromResidenceId: string;
  toResidenceId: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  date: string;
  items: any[]; // TransferItem[]
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'user' | 'maintenance';
  password_hash: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Residence {
  id: string;
  address: string;
  unit_number?: string;
  building_name?: string;
  floor_number?: number;
  property_type: 'apartment' | 'villa' | 'office' | 'shop';
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  rent_amount: number;
  deposit_amount?: number;
  utilities_included: boolean;
  tenant_id?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description?: string;
  amenities?: string; // JSON
  images?: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unit_of_measure: string;
  unit_price?: number;
  total_value?: number;
  minimum_stock: number;
  maximum_stock?: number;
  supplier_name?: string;
  supplier_contact?: string;
  purchase_date?: string;
  expiry_date?: string;
  location?: string;
  condition_status: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  image_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  order_type: 'purchase' | 'rental' | 'service' | 'maintenance';
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount?: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method?: string;
  currency: string;
  delivery_date?: string;
  delivery_address?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemNameEn: string;
  itemNameAr?: string;
  residenceId: string;
  date: string;
  type: 'PURCHASE' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'USAGE' | 'RETURN';
  quantity: number;
  referenceDocId?: string;
  relatedResidenceId?: string;
  locationName?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: string;
  request_number: string;
  residence_id: string;
  tenant_id?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'carpentry' | 'cleaning' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_completion?: string;
  completion_date?: string;
  tenant_rating?: number;
  tenant_feedback?: string;
  images?: string; // JSON
  before_images?: string; // JSON
  after_images?: string; // JSON
  required_materials?: string; // JSON
  work_log?: string; // JSON
  created_at: string;
  updated_at: string;
}

export class CloudflareDB {
  constructor(private env: CloudflareEnv) {}

  // ===================================================
  // وظائف المستخدمين (Users)
  // ===================================================

  async getUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM users 
       WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
  return results as unknown as User[];
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND is_active = true"
    ).bind(id).first();
    return result as User | null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = true"
    ).bind(email).first();
    return result as User | null;
  }

  async createUser(userData: Omit<User, 'created_at' | 'updated_at'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO users (id, name, email, phone, role, password_hash, avatar_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userData.id,
      userData.name,
      userData.email,
      userData.phone || null,
      userData.role,
      userData.password_hash,
      userData.avatar_url || null,
      userData.is_active
    ).run();
  }

  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    const setClause = Object.keys(userData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(userData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => userData[key as keyof User]);

    await this.env.DB.prepare(
      `UPDATE users SET ${setClause} WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deleteUser(id: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE users SET is_active = false WHERE id = ?"
    ).bind(id).run();
  }

  // ===================================================
  // وظائف العقارات (Residences)
  // ===================================================

  async getResidences(limit: number = 50, offset: number = 0): Promise<Residence[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM residences 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
  return results as unknown as Residence[];
  }

  // Minimal residences projection using a view if available (fallback to base table)
  async getResidencesMin(limit: number = 50, offset: number = 0, q?: string): Promise<Array<{ id: string; name: string; city: string; status?: string; created_at?: string; updated_at?: string }>> {
    // Try querying the view first
    try {
      const bindings: any[] = [];
      let sql = `SELECT id, name, city, status, created_at, updated_at FROM view_residences_min`;
      if (q && q.trim()) {
        sql += ` WHERE name LIKE ?`;
        bindings.push(`%${q}%`);
      }
      sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);
      const { results } = await this.env.DB.prepare(sql).bind(...bindings).all();
  if (results) return results as any[];
    } catch (_) {
      // View might not exist; fall back to base table
    }

    // Fallback: derive minimal fields from residences table
    const bindings2: any[] = [];
    let sql2 = `SELECT id, COALESCE(building_name, address) AS name, 'Unknown' AS city, status, created_at, updated_at FROM residences`;
    if (q && q.trim()) {
      sql2 += ` WHERE (address LIKE ? OR building_name LIKE ?)`;
      bindings2.push(`%${q}%`, `%${q}%`);
    }
    sql2 += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    bindings2.push(limit, offset);
    const { results: results2 } = await this.env.DB.prepare(sql2).bind(...bindings2).all();
    return (results2 as any[]) || [];
  }

  async getResidenceById(id: string): Promise<Residence | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM residences WHERE id = ?"
    ).bind(id).first();
    return result as Residence | null;
  }

  async getResidencesByStatus(status: string): Promise<Residence[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT * FROM residences WHERE status = ? ORDER BY created_at DESC"
    ).bind(status).all();
  return results as unknown as Residence[];
  }

  async createResidence(residenceData: Omit<Residence, 'created_at' | 'updated_at'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO residences (
        id, address, unit_number, building_name, floor_number, property_type,
        area_sqm, bedrooms, bathrooms, rent_amount, deposit_amount, 
        utilities_included, tenant_id, lease_start_date, lease_end_date,
        status, description, amenities, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      residenceData.id,
      residenceData.address,
      residenceData.unit_number || null,
      residenceData.building_name || null,
      residenceData.floor_number || null,
      residenceData.property_type,
      residenceData.area_sqm || null,
      residenceData.bedrooms || null,
      residenceData.bathrooms || null,
      residenceData.rent_amount,
      residenceData.deposit_amount || null,
      residenceData.utilities_included,
      residenceData.tenant_id || null,
      residenceData.lease_start_date || null,
      residenceData.lease_end_date || null,
      residenceData.status,
      residenceData.description || null,
      residenceData.amenities || null,
      residenceData.images || null
    ).run();
  }

  async updateResidence(id: string, residenceData: Partial<Residence>): Promise<void> {
    const setClause = Object.keys(residenceData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(residenceData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => residenceData[key as keyof Residence]);

    await this.env.DB.prepare(
      `UPDATE residences SET ${setClause} WHERE id = ?`
    ).bind(...values, id).run();
  }

  // ===================================================
  // وظائف المخزون (Inventory)
  // ===================================================

  async getInventory(limit: number = 50, offset: number = 0): Promise<InventoryItem[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM inventory 
       WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
  return results as unknown as InventoryItem[];
  }

  async getInventoryById(id: string): Promise<InventoryItem | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM inventory WHERE id = ? AND is_active = true"
    ).bind(id).first();
    return result as InventoryItem | null;
  }

  async getInventoryByCategory(category: string): Promise<InventoryItem[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT * FROM inventory WHERE category = ? AND is_active = true ORDER BY name"
    ).bind(category).all();
  return results as unknown as InventoryItem[];
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM inventory 
       WHERE quantity <= minimum_stock AND is_active = true 
       ORDER BY quantity ASC`
    ).all();
  return results as unknown as InventoryItem[];
  }

  async createInventoryItem(itemData: Omit<InventoryItem, 'created_at' | 'updated_at' | 'total_value'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO inventory (
        id, name, description, category, subcategory, sku, barcode, quantity,
        unit_of_measure, unit_price, minimum_stock, maximum_stock, supplier_name,
        supplier_contact, purchase_date, expiry_date, location, condition_status,
        image_url, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
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
      itemData.is_active
    ).run();
  }

  async updateInventoryItem(id: string, itemData: Partial<InventoryItem>): Promise<void> {
    const setClause = Object.keys(itemData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'total_value')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(itemData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'total_value')
      .map(key => itemData[key as keyof InventoryItem]);

    await this.env.DB.prepare(
      `UPDATE inventory SET ${setClause} WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE inventory SET is_active = false WHERE id = ?"
    ).bind(id).run();
  }

  // ===================================================
  // وظائف التحويلات والمعاملات (Transfers & Transactions)
  // ===================================================

  async getStockTransfers(limit: number = 50, offset: number = 0): Promise<StockTransfer[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM stock_transfers 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
    return results as unknown as StockTransfer[];
  }

  async getStockTransferById(id: string): Promise<StockTransfer | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM stock_transfers WHERE id = ?"
    ).bind(id).first();
    return result as StockTransfer | null;
  }

  async getStockTransfersByStatus(status: string): Promise<StockTransfer[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT * FROM stock_transfers WHERE status = ? ORDER BY created_at DESC"
    ).bind(status).all();
    return results as unknown as StockTransfer[];
  }

  async getInventoryTransactions(limit: number = 50, offset: number = 0): Promise<InventoryTransaction[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM inventory_transactions 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
    return results as unknown as InventoryTransaction[];
  }

  async getInventoryTransactionsByReference(referenceDocId: string): Promise<InventoryTransaction[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT * FROM inventory_transactions WHERE reference_doc_id = ? ORDER BY created_at DESC"
    ).bind(referenceDocId).all();
    return results as unknown as InventoryTransaction[];
  }

  async createInventoryTransaction(transactionData: Omit<InventoryTransaction, 'created_at' | 'updated_at'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO inventory_transactions (
        id, item_id, item_name_en, item_name_ar, residence_id, date, type,
        quantity, reference_doc_id, related_residence_id, location_name, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
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
      transactionData.notes || null
    ).run();
  }

  async createStockTransfer(transferData: Omit<StockTransfer, 'created_at' | 'updated_at'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO stock_transfers (
        id, transfer_number, from_residence_id, to_residence_id, status,
        requested_by, approved_by, approved_at, date, items, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      transferData.id,
      transferData.transferNumber,
      transferData.fromResidenceId,
      transferData.toResidenceId,
      transferData.status,
      transferData.requestedBy,
      transferData.approvedBy || null,
      transferData.approvedAt || null,
      transferData.date,
      JSON.stringify(transferData.items),
      transferData.notes || null
    ).run();
  }

  // ===================================================
  // وظائف الطلبات (Orders)
  // ===================================================

  async getOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM orders 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
  return results as unknown as Order[];
  }

  async getOrderById(id: string): Promise<Order | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM orders WHERE id = ?"
    ).bind(id).first();
    return result as Order | null;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC"
    ).bind(status).all();
  return results as unknown as Order[];
  }

  async createOrder(orderData: Omit<Order, 'created_at' | 'updated_at' | 'final_amount'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO orders (
        id, order_number, customer_name, customer_email, customer_phone,
        customer_address, order_type, status, priority, total_amount,
        discount_amount, tax_amount, payment_status, payment_method,
        currency, delivery_date, delivery_address, assigned_to, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      orderData.id,
      orderData.order_number,
      orderData.customer_name,
      orderData.customer_email || null,
      orderData.customer_phone || null,
      orderData.customer_address || null,
      orderData.order_type,
      orderData.status,
      orderData.priority,
      orderData.total_amount,
      orderData.discount_amount,
      orderData.tax_amount,
      orderData.payment_status,
      orderData.payment_method || null,
      orderData.currency,
      orderData.delivery_date || null,
      orderData.delivery_address || null,
      orderData.assigned_to || null,
      orderData.notes || null
    ).run();
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<void> {
    const setClause = Object.keys(orderData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'final_amount')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(orderData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'final_amount')
      .map(key => orderData[key as keyof Order]);

    await this.env.DB.prepare(
      `UPDATE orders SET ${setClause} WHERE id = ?`
    ).bind(...values, id).run();
  }

  // ===================================================
  // وظائف طلبات الصيانة (Maintenance Requests)
  // ===================================================

  async getMaintenanceRequests(limit: number = 50, offset: number = 0): Promise<MaintenanceRequest[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT mr.*, r.address as residence_address 
       FROM maintenance_requests mr 
       LEFT JOIN residences r ON mr.residence_id = r.id 
       ORDER BY mr.created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
  return results as unknown as MaintenanceRequest[];
  }

  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    const result = await this.env.DB.prepare(
      `SELECT mr.*, r.address as residence_address 
       FROM maintenance_requests mr 
       LEFT JOIN residences r ON mr.residence_id = r.id 
       WHERE mr.id = ?`
    ).bind(id).first();
    return result as MaintenanceRequest | null;
  }

  async getMaintenanceRequestsByStatus(status: string): Promise<MaintenanceRequest[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT mr.*, r.address as residence_address 
       FROM maintenance_requests mr 
       LEFT JOIN residences r ON mr.residence_id = r.id 
       WHERE mr.status = ? 
       ORDER BY mr.created_at DESC`
    ).bind(status).all();
  return results as unknown as MaintenanceRequest[];
  }

  async createMaintenanceRequest(requestData: Omit<MaintenanceRequest, 'created_at' | 'updated_at'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO maintenance_requests (
        id, request_number, residence_id, tenant_id, title, description,
        category, priority, status, assigned_to, estimated_cost, actual_cost,
        estimated_completion, completion_date, tenant_rating, tenant_feedback,
        images, before_images, after_images, required_materials, work_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      requestData.id,
      requestData.request_number,
      requestData.residence_id,
      requestData.tenant_id || null,
      requestData.title,
      requestData.description,
      requestData.category,
      requestData.priority,
      requestData.status,
      requestData.assigned_to || null,
      requestData.estimated_cost || null,
      requestData.actual_cost || null,
      requestData.estimated_completion || null,
      requestData.completion_date || null,
      requestData.tenant_rating || null,
      requestData.tenant_feedback || null,
      requestData.images || null,
      requestData.before_images || null,
      requestData.after_images || null,
      requestData.required_materials || null,
      requestData.work_log || null
    ).run();
  }

  async updateMaintenanceRequest(id: string, requestData: Partial<MaintenanceRequest>): Promise<void> {
    const setClause = Object.keys(requestData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(requestData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => requestData[key as keyof MaintenanceRequest]);

    await this.env.DB.prepare(
      `UPDATE maintenance_requests SET ${setClause} WHERE id = ?`
    ).bind(...values, id).run();
  }

  // ===================================================
  // وظائف البحث والإحصائيات
  // ===================================================

  async searchInventory(query: string, category?: string): Promise<InventoryItem[]> {
    let sql = `SELECT * FROM inventory 
               WHERE is_active = true 
               AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)`;
    let bindings = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND category = ?`;
      bindings.push(category);
    }

    sql += ` ORDER BY name`;

    const { results } = await this.env.DB.prepare(sql).bind(...bindings).all();
  return results as unknown as InventoryItem[];
  }

  async getStatistics(): Promise<any> {
    const [
      totalUsers,
      totalResidences,
      occupiedResidences,
      totalInventoryItems,
      lowStockItems,
      pendingOrders,
      pendingMaintenance
    ] = await Promise.all([
      this.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = true").first(),
      this.env.DB.prepare("SELECT COUNT(*) as count FROM residences").first(),
      this.env.DB.prepare("SELECT COUNT(*) as count FROM residences WHERE status = 'occupied'").first(),
      this.env.DB.prepare("SELECT COUNT(*) as count FROM inventory WHERE is_active = true").first(),
      this.env.DB.prepare("SELECT COUNT(*) as count FROM inventory WHERE quantity <= minimum_stock AND is_active = true").first(),
      this.env.DB.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").first(),
      this.env.DB.prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE status = 'pending'").first()
    ]);

    return {
      users: Number((totalUsers as any)?.count ?? 0),
      residences: {
        total: Number((totalResidences as any)?.count ?? 0),
        occupied: Number((occupiedResidences as any)?.count ?? 0),
        vacant: Number((totalResidences as any)?.count ?? 0) - Number((occupiedResidences as any)?.count ?? 0)
      },
      inventory: {
        total: Number((totalInventoryItems as any)?.count ?? 0),
        lowStock: Number((lowStockItems as any)?.count ?? 0)
      },
      orders: {
        pending: Number((pendingOrders as any)?.count ?? 0)
      },
      maintenance: {
        pending: Number((pendingMaintenance as any)?.count ?? 0)
      }
    };
  }

  // ===================================================
  // وظائف التخزين المؤقت (KV Caching)
  // ===================================================

  async getCachedData(key: string): Promise<any> {
    const cached = await this.env.KV.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedData(key: string, data: any, ttl: number = 300): Promise<void> {
    await this.env.KV.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }

  async deleteCachedData(key: string): Promise<void> {
    await this.env.KV.delete(key);
  }
}
