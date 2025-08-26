#!/bin/bash

# سكريبت إعداد بيئة التطوير المحلية لـ EstateCare
# يقوم بتكوين قاعدة البيانات المحلية والبيئة للتطوير

set -e

echo "🛠️ إعداد بيئة التطوير المحلية لـ EstateCare"

# التحقق من وجود wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler غير مثبت. يرجى تثبيته أولاً:"
    echo "npm install -g wrangler"
    exit 1
fi

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install

# إنشاء قاعدة بيانات محلية للتطوير
echo "🗄️ إنشاء قاعدة بيانات محلية..."
if [ ! -f ".wrangler/state/v3/d1/miniflare-D1DatabaseObject" ]; then
    wrangler d1 execute estatecare-db --local --file=schema.sql
    echo "✅ تم إنشاء قاعدة البيانات المحلية"
else
    echo "📊 قاعدة البيانات المحلية موجودة بالفعل"
    read -p "هل تريد إعادة إنشائها؟ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .wrangler/state/v3/d1/
        wrangler d1 execute estatecare-db --local --file=schema.sql
        echo "✅ تم إعادة إنشاء قاعدة البيانات المحلية"
    fi
fi

# إنشاء بيانات تجريبية
echo "📝 إنشاء بيانات تجريبية..."
cat > dev_data.sql << 'EOF'
-- إنشاء مستخدم إداري للتطوير
INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, created_at, updated_at) 
VALUES (
    'dev-admin-123',
    'مدير التطوير',
    'dev@estatecare.com',
    'admin',
    '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',  -- admin123
    true,
    datetime('now'),
    datetime('now')
);

-- إنشاء مستخدمين عاديين للاختبار
INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, created_at, updated_at) 
VALUES 
    ('user-001', 'أحمد محمد', 'ahmed@test.com', 'user', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')),
    ('user-002', 'فاطمة علي', 'fatima@test.com', 'manager', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')),
    ('tech-001', 'محمد التقني', 'tech@test.com', 'technician', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now'));

-- إنشاء عقارات تجريبية
INSERT OR IGNORE INTO residences (id, name, type, address, total_units, available_units, created_by, created_at, updated_at)
VALUES 
    ('res-001', 'مجمع الياسمين السكني', 'compound', 'الرياض، حي الملقا', 50, 10, 'dev-admin-123', datetime('now'), datetime('now')),
    ('res-002', 'برج المستقبل التجاري', 'tower', 'جدة، حي الروضة', 30, 5, 'dev-admin-123', datetime('now'), datetime('now')),
    ('res-003', 'فيلات الورود', 'villa', 'الدمام، حي الفيصلية', 20, 8, 'dev-admin-123', datetime('now'), datetime('now'));

-- إنشاء أصناف مخزون تجريبية
INSERT OR IGNORE INTO inventory (id, name, category, current_stock, min_threshold, max_threshold, unit_price, supplier, residence_id, created_by, created_at, updated_at)
VALUES 
    ('inv-001', 'مصابيح LED', 'electrical', 100, 20, 200, 25.50, 'شركة الإضاءة المتقدمة', 'res-001', 'dev-admin-123', datetime('now'), datetime('now')),
    ('inv-002', 'أنابيب PVC', 'plumbing', 50, 10, 100, 15.75, 'مؤسسة السباكة الحديثة', 'res-001', 'dev-admin-123', datetime('now'), datetime('now')),
    ('inv-003', 'طلاء خارجي', 'maintenance', 30, 5, 50, 85.00, 'معمل الألوان', 'res-002', 'dev-admin-123', datetime('now'), datetime('now')),
    ('inv-004', 'أقفال أمنية', 'security', 25, 5, 40, 120.00, 'شركة الأمان المتطور', 'res-003', 'dev-admin-123', datetime('now'), datetime('now'));

-- إنشاء طلبات تجريبية
INSERT OR IGNORE INTO orders (id, items, total_amount, status, requested_by, approved_by, residence_id, created_at, updated_at)
VALUES 
    ('order-001', '[{"item_id":"inv-001","quantity":10,"unit_price":25.50}]', 255.00, 'pending', 'user-001', NULL, 'res-001', datetime('now'), datetime('now')),
    ('order-002', '[{"item_id":"inv-002","quantity":5,"unit_price":15.75}]', 78.75, 'approved', 'user-002', 'dev-admin-123', 'res-001', datetime('now'), datetime('now')),
    ('order-003', '[{"item_id":"inv-003","quantity":2,"unit_price":85.00}]', 170.00, 'delivered', 'user-001', 'dev-admin-123', 'res-002', datetime('now'), datetime('now'));

-- إنشاء طلبات صيانة تجريبية
INSERT OR IGNORE INTO maintenance_requests (id, title, description, priority, status, residence_id, unit_number, requested_by, assigned_to, created_at, updated_at)
VALUES 
    ('maint-001', 'إصلاح تسريب مياه', 'يوجد تسريب في حمام الوحدة رقم 101', 'high', 'pending', 'res-001', '101', 'user-001', NULL, datetime('now'), datetime('now')),
    ('maint-002', 'استبدال مصباح معطل', 'مصباح الممر الرئيسي لا يعمل', 'medium', 'in_progress', 'res-001', 'lobby', 'user-002', 'tech-001', datetime('now'), datetime('now')),
    ('maint-003', 'صيانة مصعد', 'المصعد يصدر أصوات غريبة', 'high', 'completed', 'res-002', 'elevator-1', 'user-001', 'tech-001', datetime('now'), datetime('now'));

-- إنشاء إشعارات تجريبية
INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES 
    ('notif-001', 'user-001', 'تم إنشاء طلب جديد', 'تم إنشاء طلبك رقم order-001 بنجاح', 'order', false, datetime('now')),
    ('notif-002', 'user-002', 'طلب صيانة جديد', 'تم تعيين طلب صيانة جديد لك', 'maintenance', false, datetime('now')),
    ('notif-003', 'dev-admin-123', 'مخزون منخفض', 'مستوى المخزون لصنف "أقفال أمنية" أقل من الحد الأدنى', 'inventory', false, datetime('now'));
EOF

wrangler d1 execute estatecare-db --local --file=dev_data.sql
rm dev_data.sql

echo "✅ تم إنشاء البيانات التجريبية"

# إنشاء ملف متغيرات البيئة للتطوير
echo "🔧 إنشاء ملف متغيرات البيئة..."
cat > .env.local << 'EOF'
# متغيرات البيئة للتطوير المحلي
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=EstateCare
NEXT_PUBLIC_APP_VERSION=2.0.0

# إعدادات قاعدة البيانات (للمرجع فقط - تدار بواسطة wrangler)
# DATABASE_URL=file:./.wrangler/state/v3/d1/miniflare-D1DatabaseObject

# سر التوقيع للـ JWT (للتطوير فقط)
JWT_SECRET=dev-secret-key-change-in-production

# إعدادات التطبيق
NEXT_PUBLIC_DEFAULT_LANGUAGE=ar
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_SUPPORTED_FILE_TYPES=image/*,application/pdf,text/*

# رابط API الأساسي (للتطوير المحلي)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# إعدادات الأمان
BCRYPT_ROUNDS=12
SESSION_DURATION=86400000

# إعدادات التخزين
NEXT_PUBLIC_MAX_UPLOAD_SIZE=10MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,txt
EOF

echo "✅ تم إنشاء ملف .env.local"

# إنشاء ملف package scripts إضافي للتطوير
echo "🚀 إضافة scripts التطوير..."
npm pkg set scripts.dev:local="wrangler pages dev -- npm run dev"
npm pkg set scripts.db:shell="wrangler d1 execute estatecare-db --local --command"
npm pkg set scripts.db:reset="rm -rf .wrangler/state/v3/d1/ && npm run setup:dev"

echo ""
echo "✅ تم إعداد بيئة التطوير بنجاح!"
echo ""
echo "📋 معلومات الحسابات التجريبية:"
echo "   👨‍💼 مدير النظام:"
echo "      البريد: dev@estatecare.com"
echo "      المرور: admin123"
echo ""
echo "   👤 مستخدمين:"
echo "      ahmed@test.com / admin123 (مستخدم عادي)"
echo "      fatima@test.com / admin123 (مدير)"
echo "      tech@test.com / admin123 (فني)"
echo ""
echo "🚀 بدء التطوير:"
echo "   npm run dev          - تشغيل خادم التطوير العادي"
echo "   npm run dev:local     - تشغيل مع Cloudflare المحلي"
echo ""
echo "🗄️ إدارة قاعدة البيانات:"
echo "   npm run db:shell \"SELECT * FROM users;\"  - تنفيذ استعلام"
echo "   npm run db:reset     - إعادة تعيين قاعدة البيانات"
echo ""
echo "🌐 لبدء التطوير، قم بتشغيل:"
echo "   npm run dev:local"
echo ""
