/**
 * طبقة قاعدة البيانات Cloudflare D1
 * تحتوي على جميع العمليات CRUD للتطبيق
 */

/// <reference types="@cloudflare/workers-types" />

export interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  BUCKET: R2Bucket;
}

// أنواع البيانات الأساسية
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
  assignedResidences?: string[];
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
  nameEn?: string;
  nameAr?: string;
  // persisted fields
  lifespan_days?: number;
  variants?: string;
  keywords_ar?: string;
  keywords_en?: string;
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
  // Request tracking properties for inventory orders
  requestedById?: string;
  requestedByName?: string;
  requestedByEmail?: string;
  approvedById?: string;
  approvedByName?: string;
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
    return result as unknown as User | null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = true"
    ).bind(email).first();
    return result as unknown as User | null;
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
    const rows = results as unknown as any[];
    return rows.map(r => ({
      ...r,
      nameAr: r.name_ar ?? r.nameAr,
      nameEn: r.name_en ?? r.nameEn,
      lifespanDays: r.lifespan_days ?? r.lifespanDays,
      variants: r.variants ? JSON.parse(r.variants) : undefined,
      keywordsAr: r.keywords_ar ? JSON.parse(r.keywords_ar) : undefined,
      keywordsEn: r.keywords_en ? JSON.parse(r.keywords_en) : undefined,
    })) as unknown as InventoryItem[];
  }

  async getInventoryById(id: string): Promise<InventoryItem | null> {
    const result = await this.env.DB.prepare(
      "SELECT * FROM inventory WHERE id = ? AND is_active = true"
    ).bind(id).first();
    if (!result) return null;
    const r: any = result;
    return {
      ...r,
      nameAr: r.name_ar ?? r.nameAr,
      nameEn: r.name_en ?? r.nameEn,
      lifespanDays: r.lifespan_days ?? r.lifespanDays,
      variants: r.variants ? JSON.parse(r.variants) : undefined,
      keywordsAr: r.keywords_ar ? JSON.parse(r.keywords_ar) : undefined,
      keywordsEn: r.keywords_en ? JSON.parse(r.keywords_en) : undefined,
    } as InventoryItem;
  }

  async getInventoryByCategory(category: string): Promise<InventoryItem[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT * FROM inventory WHERE category = ? AND is_active = true ORDER BY name"
    ).bind(category).all();
    const rows = results as unknown as any[];
    return rows.map(r => ({
      ...r,
      nameAr: r.name_ar ?? r.nameAr,
      nameEn: r.name_en ?? r.nameEn,
      lifespanDays: r.lifespan_days ?? r.lifespanDays,
      variants: r.variants ? JSON.parse(r.variants) : undefined,
      keywordsAr: r.keywords_ar ? JSON.parse(r.keywords_ar) : undefined,
      keywordsEn: r.keywords_en ? JSON.parse(r.keywords_en) : undefined,
    })) as unknown as InventoryItem[];
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
        id, name, name_ar, name_en, description, category, subcategory, sku, barcode, quantity,
        unit_of_measure, unit_price, minimum_stock, maximum_stock, supplier_name,
        supplier_contact, purchase_date, expiry_date, location, condition_status,
        image_url, notes, is_active, lifespan_days, variants, keywords_ar, keywords_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      itemData.id,
      itemData.name,
      (itemData as any).nameAr ?? null,
      (itemData as any).nameEn ?? null,
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
      (itemData as any).lifespanDays ?? null,
      (itemData as any).variants ? JSON.stringify((itemData as any).variants) : null,
      (itemData as any).keywordsAr ? JSON.stringify((itemData as any).keywordsAr) : null,
      (itemData as any).keywordsEn ? JSON.stringify((itemData as any).keywordsEn) : null
    ).run();
  }

  async updateInventoryItem(id: string, itemData: Partial<InventoryItem>): Promise<void> {
    const setClause = Object.keys(itemData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'total_value')
      .map(key => {
        if (key === 'nameAr') return 'name_ar = ?';
        if (key === 'nameEn') return 'name_en = ?';
        if (key === 'lifespanDays') return 'lifespan_days = ?';
        if (key === 'keywordsAr') return 'keywords_ar = ?';
        if (key === 'keywordsEn') return 'keywords_en = ?';
        if (key === 'variants') return 'variants = ?';
        return `${key} = ?`;
      })
      .join(', ');
    
    const values = Object.keys(itemData)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'total_value')
      .map(key => {
        const v = (itemData as any)[key];
        if (key === 'variants' || key === 'keywordsAr' || key === 'keywordsEn') {
          return v ? JSON.stringify(v) : null;
        }
        return v;
      });

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
    return result as unknown as Order | null;
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
    return result as unknown as MaintenanceRequest | null;
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
      users: totalUsers?.count || 0,
      residences: {
        total: totalResidences?.count || 0,
        occupied: occupiedResidences?.count || 0,
        vacant: (Number(totalResidences?.count) || 0) - (Number(occupiedResidences?.count) || 0)
      },
      inventory: {
        total: totalInventoryItems?.count || 0,
        lowStock: lowStockItems?.count || 0
      },
      orders: {
        pending: pendingOrders?.count || 0
      },
      maintenance: {
        pending: pendingMaintenance?.count || 0
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
