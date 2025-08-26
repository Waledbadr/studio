#!/usr/bin/env node

/**
 * سكريبت إعداد بيئة التطوير المحلية لـ EstateCare (Node.js)
 * يقوم بتكوين قاعدة البيانات المحلية والبيئة للتطوير
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🛠️ إعداد بيئة التطوير المحلية لـ EstateCare\n');

// التحقق من وجود wrangler
function checkWrangler() {
    try {
        execSync('wrangler --version', { stdio: 'ignore' });
        console.log('✅ Wrangler CLI موجود');
        return true;
    } catch (error) {
        console.log('❌ Wrangler CLI غير مثبت. يرجى تثبيته أولاً:');
        console.log('npm install -g wrangler@latest');
        process.exit(1);
    }
}

// تثبيت التبعيات
function installDependencies() {
    console.log('📦 تثبيت التبعيات...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ تم تثبيت التبعيات بنجاح');
    } catch (error) {
        console.log('❌ فشل في تثبيت التبعيات');
        process.exit(1);
    }
}

// إنشاء قاعدة بيانات محلية
function setupLocalDatabase() {
    console.log('🗄️ إنشاء قاعدة بيانات محلية...');
    
    const dbPath = '.wrangler/state/v3/d1';
    const fullDbPath = path.join(process.cwd(), dbPath);
    
    if (fs.existsSync(fullDbPath)) {
        console.log('📊 قاعدة البيانات المحلية موجودة بالفعل');
        
        // السؤال عن إعادة الإنشاء في Node.js البسيط
        console.log('⚠️ قاعدة البيانات موجودة. سيتم إعادة إنشائها...');
        
        try {
            // حذف قاعدة البيانات الموجودة
            if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${fullDbPath}"`, { stdio: 'ignore' });
            } else {
                execSync(`rm -rf "${fullDbPath}"`, { stdio: 'ignore' });
            }
        } catch (error) {
            // تجاهل أخطاء الحذف
        }
    }
    
    try {
        execSync('wrangler d1 execute estatecare-db --local --file=schema.sql', { stdio: 'inherit' });
        console.log('✅ تم إنشاء قاعدة البيانات المحلية');
    } catch (error) {
        console.log('❌ فشل في إنشاء قاعدة البيانات المحلية');
        console.log('تأكد من وجود ملف schema.sql');
        process.exit(1);
    }
}

// إنشاء بيانات تجريبية
function createTestData() {
    console.log('📝 إنشاء بيانات تجريبية...');
    
    const testDataSql = `
-- إنشاء مستخدم إداري للتطوير
INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, created_at, updated_at) 
VALUES (
    'dev-admin-123',
    'مدير التطوير',
    'dev@estatecare.com',
    'admin',
    '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
    true,
    datetime('now'),
    datetime('now')
);

-- إنشاء مستخدمين عاديين للاختبار
INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, created_at, updated_at) 
VALUES 
    ('user-001', 'أحمد محمد', 'ahmed@test.com', 'user', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')),
    ('user-002', 'فاطمة علي', 'fatima@test.com', 'manager', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')),
    ('tech-001', 'محمد التقني', 'tech@test.com', 'maintenance', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now'));

-- إنشاء عقارات تجريبية (باستخدام الهيكل الصحيح)
INSERT OR IGNORE INTO residences (id, address, unit_number, building_name, property_type, area_sqm, bedrooms, bathrooms, rent_amount, deposit_amount, status, description, created_at, updated_at)
VALUES 
    ('res-001', 'الرياض، حي الملقا، مجمع الياسمين السكني', '101', 'برج أ', 'apartment', 120.5, 3, 2, 2500.00, 5000.00, 'available', 'شقة عائلية فاخرة مع إطلالة جميلة', datetime('now'), datetime('now')),
    ('res-002', 'جدة، حي الروضة، برج المستقبل التجاري', '205', 'برج المستقبل', 'office', 85.0, 0, 1, 3500.00, 7000.00, 'available', 'مكتب تجاري في موقع مميز', datetime('now'), datetime('now')),
    ('res-003', 'الدمام، حي الفيصلية', 'فيلا 15', 'فيلات الورود', 'villa', 350.0, 5, 4, 4500.00, 9000.00, 'available', 'فيلا واسعة مع حديقة خاصة', datetime('now'), datetime('now'));

-- إنشاء أصناف مخزون تجريبية
INSERT OR IGNORE INTO inventory (id, name, description, category, quantity, unit_price, minimum_stock, maximum_stock, supplier_name, supplier_contact, location, condition_status, created_at, updated_at)
VALUES 
    ('inv-001', 'مصابيح LED', 'مصابيح LED موفرة للطاقة', 'electrical', 100, 25.50, 20, 200, 'شركة الإضاءة المتقدمة', '0501234567', 'مخزن الكهرباء', 'new', datetime('now'), datetime('now')),
    ('inv-002', 'أنابيب PVC', 'أنابيب PVC للسباكة مقاس 2 بوصة', 'plumbing', 50, 15.75, 10, 100, 'مؤسسة السباكة الحديثة', '0501234568', 'مخزن السباكة', 'new', datetime('now'), datetime('now')),
    ('inv-003', 'طلاء خارجي', 'طلاء خارجي مقاوم للعوامل الجوية', 'maintenance', 30, 85.00, 5, 50, 'معمل الألوان', '0501234569', 'مخزن الدهانات', 'new', datetime('now'), datetime('now')),
    ('inv-004', 'أقفال أمنية', 'أقفال أمنية إلكترونية ذكية', 'security', 25, 120.00, 5, 40, 'شركة الأمان المتطور', '0501234570', 'مخزن الأمان', 'new', datetime('now'), datetime('now'));

-- إنشاء طلبات صيانة تجريبية (بدون Foreign Keys مؤقتاً)
INSERT OR IGNORE INTO maintenance_requests (id, request_number, title, description, category, priority, status, residence_id, estimated_cost, created_at, updated_at)
VALUES 
    ('maint-001', 'REQ-001', 'إصلاح تسريب مياه', 'يوجد تسريب في حمام الشقة رقم 101', 'plumbing', 'high', 'pending', 'res-001', 150.00, datetime('now'), datetime('now')),
    ('maint-002', 'REQ-002', 'استبدال مصباح معطل', 'مصباح الممر الرئيسي لا يعمل', 'electrical', 'medium', 'in_progress', 'res-002', 50.00, datetime('now'), datetime('now')),
    ('maint-003', 'REQ-003', 'صيانة نظام التكييف', 'نظام التكييف لا يبرد بشكل جيد', 'hvac', 'high', 'completed', 'res-003', 300.00, datetime('now'), datetime('now'));
`;

    // كتابة SQL إلى ملف مؤقت
    const tempSqlFile = 'dev_data_temp.sql';
    fs.writeFileSync(tempSqlFile, testDataSql);
    
    try {
        execSync(`wrangler d1 execute estatecare-db --local --file=${tempSqlFile}`, { stdio: 'inherit' });
        console.log('✅ تم إنشاء البيانات التجريبية');
    } catch (error) {
        console.log('❌ فشل في إنشاء البيانات التجريبية');
    } finally {
        // حذف الملف المؤقت
        if (fs.existsSync(tempSqlFile)) {
            fs.unlinkSync(tempSqlFile);
        }
    }
}

// إنشاء ملف متغيرات البيئة
function createEnvFile() {
    console.log('🔧 إنشاء ملف متغيرات البيئة...');
    
    const envContent = `# متغيرات البيئة للتطوير المحلي
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=EstateCare
NEXT_PUBLIC_APP_VERSION=2.0.0

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
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('✅ تم إنشاء ملف .env.local');
}

// الدالة الرئيسية
async function main() {
    try {
        checkWrangler();
        installDependencies();
        setupLocalDatabase();
        createTestData();
        createEnvFile();
        
        console.log('\n✅ تم إعداد بيئة التطوير بنجاح!\n');
        
        console.log('📋 معلومات الحسابات التجريبية:');
        console.log('   👨‍💼 مدير النظام:');
        console.log('      البريد: dev@estatecare.com');
        console.log('      المرور: admin123\n');
        
        console.log('   👤 مستخدمين:');
        console.log('      ahmed@test.com / admin123 (مستخدم عادي)');
        console.log('      fatima@test.com / admin123 (مدير)');
        console.log('      tech@test.com / admin123 (فني)\n');
        
        console.log('🚀 بدء التطوير:');
        console.log('   npm run dev          - تشغيل خادم التطوير العادي');
        console.log('   npm run dev:local     - تشغيل مع Cloudflare المحلي\n');
        
        console.log('🌐 لبدء التطوير، قم بتشغيل:');
        console.log('   npm run dev:local\n');
        
    } catch (error) {
        console.error('❌ حدث خطأ أثناء الإعداد:', error.message);
        process.exit(1);
    }
}

// تشغيل السكريبت
if (require.main === module) {
    main();
}

module.exports = { main };
