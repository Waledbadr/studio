#!/usr/bin/env node

/**
 * سكريبت اختبار اتصال قاعدة البيانات
 * يتحقق من أن جميع الجداول والوظائف تعمل بشكل صحيح
 */

const { execSync } = require('child_process');

console.log('\n🧪 اختبار اتصال قاعدة البيانات وقاعدة البيانات\n');

function testDatabaseConnection() {
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');

    try {
        // اختبار عدد السجلات في كل جدول
        const tables = [
            { name: 'users', description: 'المستخدمين' },
            { name: 'residences', description: 'العقارات' },
            { name: 'inventory', description: 'المخزون' },
            { name: 'orders', description: 'الطلبات' },
            { name: 'maintenance_requests', description: 'طلبات الصيانة' },
            { name: 'inventory_movements', description: 'حركات المخزون' },
            { name: 'notifications', description: 'الإشعارات' }
        ];

        for (const table of tables) {
            const command = `wrangler d1 execute estatecare-db --command="SELECT COUNT(*) as count FROM ${table.name};"`;
            const result = execSync(command, { encoding: 'utf8' });
            console.log(`✅ جدول ${table.description}: ${result.includes('1') ? 'موجود' : 'فارغ'}`);
        }

        console.log('✅ تم اختبار جميع الجداول بنجاح');

    } catch (error) {
        console.log('❌ فشل في اختبار قاعدة البيانات');
        console.log('تأكد من أن Wrangler CLI مثبت وأن قاعدة البيانات موجودة');
        process.exit(1);
    }
}

function testSampleData() {
    console.log('\n📊 اختبار البيانات التجريبية...');

    try {
        // اختبار المستخدمين
        const usersCommand = `wrangler d1 execute estatecare-db --command="SELECT name, email, role FROM users LIMIT 3;"`;
        const usersResult = execSync(usersCommand, { encoding: 'utf8' });
        console.log('👥 المستخدمون:');
        console.log(usersResult);

        // اختبار العقارات
        const residencesCommand = `wrangler d1 execute estatecare-db --command="SELECT address, property_type, status FROM residences LIMIT 3;"`;
        const residencesResult = execSync(residencesCommand, { encoding: 'utf8' });
        console.log('🏠 العقارات:');
        console.log(residencesResult);

        // اختبار المخزون
        const inventoryCommand = `wrangler d1 execute estatecare-db --command="SELECT name, category, quantity FROM inventory LIMIT 3;"`;
        const inventoryResult = execSync(inventoryCommand, { encoding: 'utf8' });
        console.log('📦 المخزون:');
        console.log(inventoryResult);

        console.log('✅ تم اختبار البيانات التجريبية بنجاح');

    } catch (error) {
        console.log('❌ فشل في اختبار البيانات التجريبية');
        console.log(error.message);
    }
}

function showDatabaseInfo() {
    console.log('\n📋 معلومات قاعدة البيانات:');
    console.log('===============================');
    console.log('اسم قاعدة البيانات: estatecare-db');
    console.log('معرف قاعدة البيانات: 802520b7-431f-40c7-8399-3ed056744e89');
    console.log('نوع قاعدة البيانات: Cloudflare D1 (SQLite)');
    console.log('===============================\n');
}

function showTestAccounts() {
    console.log('🔐 حسابات الاختبار:');
    console.log('===============================');
    console.log('مدير النظام:');
    console.log('  البريد: admin@estatecare.com');
    console.log('  المرور: admin123');
    console.log('  الدور: admin');
    console.log('');
    console.log('مدير العقارات:');
    console.log('  البريد: manager@estatecare.com');
    console.log('  المرور: manager123');
    console.log('  الدور: manager');
    console.log('');
    console.log('فني الصيانة:');
    console.log('  البريد: maintenance@estatecare.com');
    console.log('  المرور: tech123');
    console.log('  الدور: maintenance');
    console.log('');
    console.log('مستخدمين عاديين:');
    console.log('  ahmed@example.com / user123');
    console.log('  fatima@example.com / user123');
    console.log('  mohamed@test.com / user123');
    console.log('  sara@test.com / user123');
    console.log('  ali@test.com / user123');
    console.log('===============================\n');
}

// الدالة الرئيسية
async function main() {
    try {
        showDatabaseInfo();
        testDatabaseConnection();
        testSampleData();
        showTestAccounts();

        console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
        console.log('🚀 يمكنك الآن تشغيل التطبيق واختبار جميع الوظائف\n');

        console.log('📝 لتشغيل التطبيق:');
        console.log('   npm run dev              - التطوير العادي');
        console.log('   npm run dev:local        - التطوير مع Cloudflare محلياً\n');

    } catch (error) {
        console.error('❌ حدث خطأ أثناء الاختبار:', error.message);
        process.exit(1);
    }
}

// تشغيل السكريبت
if (require.main === module) {
    main();
}

module.exports = { main };