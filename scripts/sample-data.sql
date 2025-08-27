-- بيانات تجريبية لتطبيق EstateCare
-- يمكن استخدامها لاختبار النظام قبل النسخ من Firestore

-- إدراج مستخدمين تجريبيين
INSERT OR IGNORE INTO users (id, name, email, phone, role, password_hash, is_active, created_at, updated_at) VALUES
('admin-001', 'مدير النظام', 'admin@estatecare.com', '+966501234567', 'admin', '$2b$10$example.hash.for.admin.user', true, datetime('now'), datetime('now')),
('manager-001', 'مدير العقارات', 'manager@estatecare.com', '+966501234568', 'manager', '$2b$10$example.hash.for.manager.user', true, datetime('now'), datetime('now')),
('maintenance-001', 'فني الصيانة', 'maintenance@estatecare.com', '+966501234569', 'maintenance', '$2b$10$example.hash.for.maintenance.user', true, datetime('now'), datetime('now')),
('tenant-001', 'أحمد محمد', 'ahmed@example.com', '+966501234570', 'user', '$2b$10$example.hash.for.tenant.user', true, datetime('now'), datetime('now')),
('tenant-002', 'فاطمة علي', 'fatima@example.com', '+966501234571', 'user', '$2b$10$example.hash.for.tenant.user', true, datetime('now'), datetime('now'));

-- إدراج عقارات تجريبية
INSERT OR IGNORE INTO residences (id, address, unit_number, building_name, floor_number, property_type, area_sqm, bedrooms, bathrooms, rent_amount, deposit_amount, utilities_included, tenant_id, status, description, created_at, updated_at) VALUES
('res-001', 'شارع الملك فهد، الرياض', 'A101', 'برج النخيل', 1, 'apartment', 120.5, 2, 2, 2500.00, 5000.00, true, 'tenant-001', 'occupied', 'شقة فاخرة مفروشة بالكامل', datetime('now'), datetime('now')),
('res-002', 'شارع العليا، الرياض', 'B205', 'مجمع الواحة', 2, 'apartment', 95.0, 2, 1, 2000.00, 4000.00, false, 'tenant-002', 'occupied', 'شقة عائلية مريحة', datetime('now'), datetime('now')),
('res-003', 'حي النرجس، الرياض', '15', null, 0, 'villa', 300.0, 4, 3, 5000.00, 10000.00, true, null, 'available', 'فيلا واسعة مع حديقة', datetime('now'), datetime('now')),
('res-004', 'شارع التحلية، الرياض', 'Office 12', 'مركز التجارة', 3, 'office', 80.0, null, 1, 3000.00, 6000.00, true, null, 'available', 'مكتب في موقع استراتيجي', datetime('now'), datetime('now')),
('res-005', 'شارع الأمير محمد بن سلمان، الرياض', 'Shop 5', 'مول الرياض', 0, 'shop', 50.0, null, 1, 4000.00, 8000.00, false, null, 'maintenance', 'محل تجاري يحتاج صيانة', datetime('now'), datetime('now'));

-- إدراج عناصر المخزون
INSERT OR IGNORE INTO inventory (id, name, description, category, subcategory, sku, quantity, unit_of_measure, unit_price, minimum_stock, supplier_name, condition_status, is_active, created_at, updated_at) VALUES
('inv-001', 'مكيف هواء سبليت', 'مكيف 18000 وحدة حرارية', 'electronics', 'air_conditioning', 'AC-18K-001', 15, 'piece', 1200.00, 5, 'شركة التبريد المتقدم', 'new', true, datetime('now'), datetime('now')),
('inv-002', 'أنابيب السباكة PVC', 'أنابيب بلاستيكية 4 بوصة', 'plumbing', 'pipes', 'PVC-4IN-001', 50, 'meter', 25.00, 20, 'مؤسسة السباكة الحديثة', 'new', true, datetime('now'), datetime('now')),
('inv-003', 'طلاء أبيض للجدران', 'طلاء داخلي عالي الجودة', 'maintenance', 'paint', 'PAINT-WHT-001', 30, 'liter', 45.00, 10, 'شركة الألوان الذهبية', 'new', true, datetime('now'), datetime('now')),
('inv-004', 'مفاتيح كهرباء', 'مفاتيح إضاءة حديثة', 'electrical', 'switches', 'SW-MOD-001', 100, 'piece', 15.00, 25, 'مؤسسة الكهرباء الممتازة', 'new', true, datetime('now'), datetime('now')),
('inv-005', 'منظف أرضيات', 'منظف عام للأرضيات', 'cleaning', 'floor_cleaner', 'CLN-FLR-001', 25, 'liter', 18.00, 10, 'شركة النظافة المثالية', 'new', true, datetime('now'), datetime('now')),
('inv-006', 'مقاعد مكتبية', 'كرسي مكتبي مريح', 'furniture', 'chairs', 'CHR-OFF-001', 8, 'piece', 350.00, 3, 'معرض الأثاث الفاخر', 'good', true, datetime('now'), datetime('now')),
('inv-007', 'لمبات LED', 'لمبات موفرة للطاقة', 'electrical', 'lighting', 'LED-BLB-001', 200, 'piece', 12.00, 50, 'مؤسسة الكهرباء الممتازة', 'new', true, datetime('now'), datetime('now'));

-- إدراج طلبات تجريبية
INSERT OR IGNORE INTO orders (id, order_number, customer_name, customer_email, customer_phone, order_type, status, priority, total_amount, discount_amount, tax_amount, payment_status, currency, assigned_to, notes, created_at, updated_at) VALUES
('ord-001', 'ORD-2025-001', 'أحمد محمد', 'ahmed@example.com', '+966501234570', 'maintenance', 'pending', 'high', 850.00, 0.00, 127.50, 'pending', 'SAR', 'maintenance-001', 'إصلاح تكييف الشقة A101', datetime('now'), datetime('now')),
('ord-002', 'ORD-2025-002', 'إدارة المبنى', 'manager@estatecare.com', '+966501234568', 'purchase', 'confirmed', 'normal', 1500.00, 150.00, 202.50, 'paid', 'SAR', 'admin-001', 'شراء مواد صيانة شهرية', datetime('now'), datetime('now')),
('ord-003', 'ORD-2025-003', 'فاطمة علي', 'fatima@example.com', '+966501234571', 'service', 'processing', 'normal', 200.00, 0.00, 30.00, 'paid', 'SAR', 'maintenance-001', 'تنظيف عام للشقة', datetime('now'), datetime('now'));

-- إدراج عناصر الطلبات
INSERT OR IGNORE INTO order_items (id, order_id, inventory_id, item_name, item_description, quantity, unit_price, notes, created_at) VALUES
('oi-001', 'ord-001', 'inv-001', 'مكيف هواء سبليت', 'استبدال مكيف معطل', 1, 1200.00, 'يشمل التركيب', datetime('now')),
('oi-002', 'ord-002', 'inv-002', 'أنابيب السباكة PVC', 'لإصلاحات السباكة', 10, 25.00, 'أنابيب احتياطية', datetime('now')),
('oi-003', 'ord-002', 'inv-003', 'طلاء أبيض للجدران', 'لطلاء الوحدات الفارغة', 5, 45.00, 'اللون الأبيض المعتاد', datetime('now')),
('oi-004', 'ord-003', 'inv-005', 'منظف أرضيات', 'تنظيف عام', 2, 18.00, 'تنظيف شامل', datetime('now'));

-- إدراج طلبات صيانة
INSERT OR IGNORE INTO maintenance_requests (id, request_number, residence_id, tenant_id, title, description, category, priority, status, assigned_to, estimated_cost, created_at, updated_at) VALUES
('mnt-001', 'REQ-2025-001', 'res-001', 'tenant-001', 'تسريب في الحمام', 'يوجد تسريب مياه من الصنبور الرئيسي في الحمام - يحتاج إصلاح فوري', 'plumbing', 'high', 'assigned', 'maintenance-001', 150.00, datetime('now'), datetime('now')),
('mnt-002', 'REQ-2025-002', 'res-002', 'tenant-002', 'انقطاع الكهرباء', 'انقطاع متكرر في الكهرباء بالمطبخ - فحص الأسلاك مطلوب', 'electrical', 'urgent', 'in_progress', 'maintenance-001', 300.00, datetime('now'), datetime('now')),
('mnt-003', 'REQ-2025-003', 'res-003', null, 'تنظيف الحديقة', 'تحتاج الحديقة إلى تنظيف وتهذيب الأشجار - صيانة دورية', 'general', 'low', 'pending', null, 200.00, datetime('now'), datetime('now')),
('mnt-004', 'REQ-2025-004', 'res-005', null, 'إصلاح نظام التكييف', 'المكيف المركزي لا يعمل بكفاءة - فحص شامل مطلوب', 'hvac', 'high', 'assigned', 'maintenance-001', 800.00, datetime('now'), datetime('now'));

-- إدراج حركات المخزون
INSERT OR IGNORE INTO inventory_movements (id, inventory_id, movement_type, quantity, reference_type, reference_id, reason, created_by, created_at) VALUES
('im-001', 'inv-001', 'out', 1, 'order', 'ord-001', 'استخدام في طلب صيانة', 'maintenance-001', datetime('now')),
('im-002', 'inv-002', 'in', 20, 'purchase', 'ord-002', 'شراء مخزون جديد', 'admin-001', datetime('now')),
('im-003', 'inv-003', 'out', 2, 'maintenance', 'mnt-001', 'استخدام في صيانة', 'maintenance-001', datetime('now')),
('im-004', 'inv-005', 'out', 3, 'order', 'ord-003', 'استخدام في تنظيف', 'maintenance-001', datetime('now'));

-- إدراج إشعارات تجريبية
INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, category, is_read, created_at) VALUES
('not-001', 'admin-001', 'طلب صيانة جديد', 'تم إنشاء طلب صيانة جديد REQ-2025-001', 'info', 'maintenance', false, datetime('now')),
('not-002', 'maintenance-001', 'مهمة مُعينة لك', 'تم تعيين طلب الصيانة REQ-2025-002 إليك', 'warning', 'maintenance', false, datetime('now')),
('not-003', 'admin-001', 'مخزون منخفض', 'مخزون أنابيب السباكة أصبح أقل من الحد الأدنى', 'warning', 'inventory', false, datetime('now')),
('not-004', 'tenant-001', 'تأكيد طلب الصيانة', 'تم استلام طلب الصيانة وسيتم التواصل معك قريباً', 'success', 'maintenance', true, datetime('now'));