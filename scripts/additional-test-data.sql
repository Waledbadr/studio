-- بيانات إضافية لاختبار النظام
-- إضافة مستخدمين إضافيين
INSERT OR IGNORE INTO users (id, name, email, phone, role, password_hash, is_active, created_at, updated_at) VALUES
('user-003', 'محمد أحمد', 'mohamed@test.com', '+966501234572', 'user', '$2b$10$example.hash.for.user', true, datetime('now'), datetime('now')),
('user-004', 'سارة خالد', 'sara@test.com', '+966501234573', 'manager', '$2b$10$example.hash.for.manager', true, datetime('now'), datetime('now')),
('user-005', 'علي حسن', 'ali@test.com', '+966501234574', 'maintenance', '$2b$10$example.hash.for.maintenance', true, datetime('now'), datetime('now'));

-- إضافة عقارات إضافية
INSERT OR IGNORE INTO residences (id, address, unit_number, building_name, floor_number, property_type, area_sqm, bedrooms, bathrooms, rent_amount, deposit_amount, utilities_included, status, description, created_at, updated_at) VALUES
('res-006', 'حي الملقا، الرياض', '202', 'برج الرياض', 2, 'apartment', 110.0, 2, 2, 2200.00, 4400.00, true, 'available', 'شقة عصرية مع إطلالة جميلة', datetime('now'), datetime('now')),
('res-007', 'شارع التحلية، جدة', '15', 'مجمع النخيل', 1, 'villa', 250.0, 3, 3, 4000.00, 8000.00, false, 'available', 'فيلا مستقلة مع حديقة خاصة', datetime('now'), datetime('now')),
('res-008', 'حي الروضة، الدمام', 'Office 8', 'مركز الأعمال', 4, 'office', 90.0, 0, 1, 2800.00, 5600.00, true, 'available', 'مكتب تجاري في موقع حيوي', datetime('now'), datetime('now'));

-- إضافة عناصر مخزون إضافية بالعربية والإنجليزية
INSERT OR IGNORE INTO inventory (id, name, description, category, subcategory, sku, quantity, unit_of_measure, unit_price, minimum_stock, supplier_name, condition_status, is_active, created_at, updated_at) VALUES
('inv-008', 'مفتاح كهربائي', 'مفتاح إضاءة كهربائي حديث', 'electrical', 'switches', 'SW-ELEC-002', 75, 'piece', 8.50, 15, 'شركة الكهرباء المتقدمة', 'new', true, datetime('now'), datetime('now')),
('inv-009', 'أسلاك كهربائية', 'أسلاك كهربائية معزولة 2.5 مم', 'electrical', 'wires', 'WIRE-2.5MM-001', 200, 'meter', 3.25, 50, 'مؤسسة الأسلاك الكهربائية', 'new', true, datetime('now'), datetime('now')),
('inv-010', 'مكنسة كهربائية', 'مكنسة كهربائية صناعية', 'cleaning', 'equipment', 'VAC-IND-001', 12, 'piece', 450.00, 3, 'شركة الأجهزة المنزلية', 'new', true, datetime('now'), datetime('now')),
('inv-011', 'فرشاة طلاء', 'فرشاة طلاء احترافية 4 بوصة', 'maintenance', 'tools', 'BRUSH-4IN-001', 40, 'piece', 12.00, 10, 'متجر أدوات البناء', 'new', true, datetime('now'), datetime('now')),
('inv-012', 'مصباح طوارئ', 'مصباح طوارئ LED', 'electrical', 'lighting', 'EMERGENCY-LIGHT-001', 25, 'piece', 85.00, 5, 'مؤسسة الإضاءة الآمنة', 'new', true, datetime('now'), datetime('now')),
('inv-013', 'فلتر مكيف', 'فلتر هواء للمكيفات', 'maintenance', 'filters', 'FILTER-AC-001', 60, 'piece', 15.00, 20, 'شركة قطع الغيار', 'new', true, datetime('now'), datetime('now')),
('inv-014', 'كرسي مكتبي', 'كرسي مكتبي مريح قابل للتعديل', 'furniture', 'chairs', 'CHAIR-OFFICE-002', 15, 'piece', 280.00, 4, 'معرض الأثاث المكتبي', 'good', true, datetime('now'), datetime('now')),
('inv-015', 'ورق طابعة', 'ورق طابعة A4 80 جرام', 'office', 'supplies', 'PAPER-A4-80G', 500, 'ream', 45.00, 50, 'مؤسسة القرطاسية', 'new', true, datetime('now'), datetime('now'));

-- إضافة طلبات صيانة إضافية
INSERT OR IGNORE INTO maintenance_requests (id, request_number, residence_id, tenant_id, title, description, category, priority, status, assigned_to, estimated_cost, created_at, updated_at) VALUES
('mnt-005', 'REQ-2025-005', 'res-006', 'user-003', 'مشكلة في السباكة', 'تسريب مياه في المطبخ يحتاج إصلاح سريع', 'plumbing', 'high', 'pending', null, 120.00, datetime('now'), datetime('now')),
('mnt-006', 'REQ-2025-006', 'res-007', 'user-004', 'صيانة كهربائية', 'تحتاج الأسلاك الكهربائية في غرفة المعيشة لفحص', 'electrical', 'medium', 'pending', null, 200.00, datetime('now'), datetime('now')),
('mnt-007', 'REQ-2025-007', 'res-008', null, 'تنظيف المكتب', 'تنظيف شامل للمكتب التجاري', 'cleaning', 'low', 'pending', null, 150.00, datetime('now'), datetime('now'));

-- إضافة حركات مخزون إضافية
INSERT OR IGNORE INTO inventory_movements (id, inventory_id, movement_type, quantity, reference_type, reference_id, reason, created_by, created_at) VALUES
('im-005', 'inv-008', 'in', 50, 'purchase', 'purchase-001', 'شراء مخزون إضافي', 'admin-001', datetime('now')),
('im-006', 'inv-009', 'out', 25, 'maintenance', 'mnt-006', 'استخدام في صيانة كهربائية', 'maintenance-001', datetime('now')),
('im-007', 'inv-010', 'in', 5, 'purchase', 'purchase-002', 'تجديد المخزون', 'admin-001', datetime('now'));

-- إضافة إشعارات إضافية
INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, category, is_read, created_at) VALUES
('not-005', 'user-003', 'طلب صيانة جديد', 'تم إنشاء طلب صيانة جديد برقم REQ-2025-005', 'info', 'maintenance', false, datetime('now')),
('not-006', 'user-004', 'تحديث حالة الطلب', 'تم تحديث حالة طلب الصيانة الخاص بك', 'success', 'maintenance', false, datetime('now')),
('not-007', 'admin-001', 'مخزون جديد متاح', 'تم إضافة عناصر مخزون جديدة للنظام', 'info', 'inventory', false, datetime('now'));