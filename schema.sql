-- ===================================================
-- Schema قاعدة بيانات D1 لتطبيق EstateCare
-- ===================================================

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- admin, manager, user, maintenance
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- جدول العقارات
CREATE TABLE IF NOT EXISTS residences (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    unit_number TEXT,
    building_name TEXT,
    floor_number INTEGER,
    property_type TEXT NOT NULL, -- apartment, villa, office, shop
    area_sqm REAL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    rent_amount REAL NOT NULL,
    deposit_amount REAL,
    utilities_included BOOLEAN DEFAULT false,
    tenant_id TEXT,
    lease_start_date DATE,
    lease_end_date DATE,
    status TEXT NOT NULL DEFAULT 'available', -- available, occupied, maintenance, reserved
    description TEXT,
    amenities TEXT, -- JSON string
    images TEXT, -- JSON array of image URLs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(id)
);

-- جدول المخزون
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- furniture, electronics, maintenance, cleaning, office
    subcategory TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_of_measure TEXT NOT NULL DEFAULT 'piece', -- piece, kg, liter, meter, etc.
    unit_price REAL,
    total_value REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER,
    supplier_name TEXT,
    supplier_contact TEXT,
    purchase_date DATE,
    expiry_date DATE,
    location TEXT, -- storage location
    condition_status TEXT DEFAULT 'new', -- new, good, fair, poor, damaged
    image_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    order_type TEXT NOT NULL, -- purchase, rental, service, maintenance
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, processing, completed, cancelled, refunded
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    total_amount REAL NOT NULL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    final_amount REAL GENERATED ALWAYS AS (total_amount - discount_amount + tax_amount) STORED,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, partial, refunded
    payment_method TEXT, -- cash, card, bank_transfer, check
    currency TEXT DEFAULT 'SAR',
    delivery_date DATE,
    delivery_address TEXT,
    assigned_to TEXT, -- user_id
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- جدول عناصر الطلبات
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    inventory_id TEXT,
    item_name TEXT NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

-- جدول طلبات الصيانة
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    residence_id TEXT NOT NULL,
    tenant_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- plumbing, electrical, hvac, carpentry, cleaning, general
    priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent, emergency
    status TEXT NOT NULL DEFAULT 'pending', -- pending, assigned, in_progress, completed, cancelled, on_hold
    assigned_to TEXT, -- maintenance staff user_id
    estimated_cost REAL,
    actual_cost REAL,
    estimated_completion DATE,
    completion_date DATETIME,
    tenant_rating INTEGER, -- 1-5 stars
    tenant_feedback TEXT,
    images TEXT, -- JSON array of image URLs
    before_images TEXT, -- JSON array
    after_images TEXT, -- JSON array
    required_materials TEXT, -- JSON array of materials needed
    work_log TEXT, -- JSON array of work progress updates
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (residence_id) REFERENCES residences(id),
    FOREIGN KEY (tenant_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- جدول حركات المخزون
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    inventory_id TEXT NOT NULL,
    movement_type TEXT NOT NULL, -- in, out, adjustment, transfer
    quantity INTEGER NOT NULL,
    unit_price REAL,
    reference_type TEXT, -- order, maintenance, adjustment, transfer
    reference_id TEXT,
    reason TEXT,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- جدول معاملات المخزون (للتقارير)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    item_name_en TEXT NOT NULL,
    item_name_ar TEXT,
    residence_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- IN, OUT, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT, RETURN, DEPRECIATION, AUDIT, SCRAP
    quantity INTEGER NOT NULL,
    reference_doc_id TEXT, -- ID of related document (MRV, MIV, etc.)
    related_residence_id TEXT, -- for transfers
    location_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory(id),
    FOREIGN KEY (residence_id) REFERENCES residences(id),
    FOREIGN KEY (related_residence_id) REFERENCES residences(id)
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- info, warning, error, success
    category TEXT, -- maintenance, order, inventory, system, payment
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    data TEXT, -- JSON data for additional context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول الملفات
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    r2_key TEXT NOT NULL, -- المفتاح في R2 Storage
    public_url TEXT,
    entity_type TEXT, -- residence, maintenance, inventory, order, user
    entity_id TEXT,
    uploaded_by TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- جدول الجلسات (للمصادقة)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================================================
-- الفهارس لتحسين الأداء
-- ===================================================

-- فهارس الاستعلامات الشائعة
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_residences_status ON residences(status);
CREATE INDEX IF NOT EXISTS idx_residences_tenant ON residences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_residences_type ON residences(property_type);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assigned_to);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory ON order_items(inventory_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_residence ON maintenance_requests(residence_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned ON maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_category ON maintenance_requests(category);

CREATE INDEX IF NOT EXISTS idx_movements_inventory ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active, expires_at);

-- ===================================================
-- Triggers لتحديث updated_at تلقائياً
-- ===================================================

-- Trigger لجدول المستخدمين
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger لجدول العقارات
CREATE TRIGGER IF NOT EXISTS update_residences_timestamp 
    AFTER UPDATE ON residences
    BEGIN
        UPDATE residences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger لجدول المخزون
CREATE TRIGGER IF NOT EXISTS update_inventory_timestamp 
    AFTER UPDATE ON inventory
    BEGIN
        UPDATE inventory SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger لجدول الطلبات
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
    AFTER UPDATE ON orders
    BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger لجدول طلبات الصيانة
CREATE TRIGGER IF NOT EXISTS update_maintenance_timestamp 
    AFTER UPDATE ON maintenance_requests
    BEGIN
        UPDATE maintenance_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
