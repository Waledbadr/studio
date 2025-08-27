#!/usr/bin/env node

/**
 * Script تطبيق البيانات المنسوخة على قاعدة بيانات Cloudflare D1
 * يقوم بتشغيل ملف SQL المُولد من النسخ
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// المسارات
const sqlFilePath = path.join(__dirname, 'firestore-to-cloudflare-migration.sql');
const schemaFilePath = path.join(__dirname, '..', 'schema.sql');

console.log('🔧 تطبيق البيانات على قاعدة بيانات Cloudflare D1...\n');

// التحقق من وجود ملف SQL
if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ ملف SQL للنسخ غير موجود');
  console.error(`المسار المتوقع: ${sqlFilePath}`);
  console.error('\nقم بتشغيل script النسخ أولاً:');
  console.error('node scripts/run-migration.js');
  process.exit(1);
}

// التحقق من وجود ملف Schema
if (!fs.existsSync(schemaFilePath)) {
  console.error('❌ ملف schema.sql غير موجود');
  console.error(`المسار المتوقع: ${schemaFilePath}`);
  process.exit(1);
}

// قراءة wrangler.toml للحصول على اسم قاعدة البيانات
let dbName = 'estate-care-db'; // القيمة الافتراضية

try {
  const wranglerConfig = fs.readFileSync(path.join(__dirname, '..', 'wrangler.toml'), 'utf8');
  const dbMatch = wranglerConfig.match(/database_name\s*=\s*"([^"]+)"/);
  if (dbMatch) {
    dbName = dbMatch[1];
  }
  console.log(`📋 اسم قاعدة البيانات: ${dbName}`);
} catch (error) {
  console.warn('⚠️ لم يتم العثور على wrangler.toml، استخدام الاسم الافتراضي');
}

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    console.log(`💻 ${command}\n`);
    
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    console.log(`✅ ${description} - اكتمل\n`);
    return output;
  } catch (error) {
    console.error(`❌ خطأ في ${description}:`);
    console.error(error.message);
    throw error;
  }
}

async function applyMigration() {
  try {
    console.log('📊 إحصائيات الملفات:');
    
    // إحصائيات ملف Schema
    const schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
    const schemaLines = schemaContent.split('\n').length;
    console.log(`   📄 Schema: ${schemaLines} سطر`);
    
    // إحصائيات ملف البيانات
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const sqlLines = sqlContent.split('\n').length;
    const insertCount = (sqlContent.match(/INSERT OR IGNORE INTO/g) || []).length;
    console.log(`   📄 البيانات: ${sqlLines} سطر، ${insertCount} أمر إدراج\n`);

    // 1. إنشاء/تحديث schema قاعدة البيانات
    runCommand(
      `wrangler d1 execute ${dbName} --file="${schemaFilePath}"`,
      'تطبيق schema قاعدة البيانات'
    );

    // 2. تطبيق البيانات المنسوخة
    runCommand(
      `wrangler d1 execute ${dbName} --file="${sqlFilePath}"`,
      'تطبيق البيانات المنسوخة'
    );

    // 3. التحقق من البيانات
    console.log('🔍 التحقق من البيانات المطبقة...\n');
    
    const verificationCommands = [
      `wrangler d1 execute ${dbName} --command="SELECT COUNT(*) as total_users FROM users;"`,
      `wrangler d1 execute ${dbName} --command="SELECT COUNT(*) as total_residences FROM residences;"`,
      `wrangler d1 execute ${dbName} --command="SELECT COUNT(*) as total_inventory FROM inventory;"`,
      `wrangler d1 execute ${dbName} --command="SELECT COUNT(*) as total_orders FROM orders;"`,
      `wrangler d1 execute ${dbName} --command="SELECT COUNT(*) as total_maintenance FROM maintenance_requests;"`
    ];

    for (const cmd of verificationCommands) {
      try {
        runCommand(cmd, 'فحص البيانات');
      } catch (error) {
        console.warn('⚠️ تعذر فحص هذا الجدول، قد يكون فارغاً');
      }
    }

    console.log('\n🎉 تم تطبيق البيانات بنجاح على قاعدة بيانات Cloudflare D1!');
    console.log('\n📝 الخطوات التالية:');
    console.log('1. تحقق من البيانات في لوحة تحكم Cloudflare');
    console.log('2. قم بتحديث إعدادات التطبيق للاتصال بـ D1');
    console.log('3. اختبر وظائف التطبيق مع قاعدة البيانات الجديدة');

  } catch (error) {
    console.error('\n💥 فشل في تطبيق البيانات:', error.message);
    
    if (error.message.includes('wrangler')) {
      console.error('\n💡 تأكد من:');
      console.error('1. تثبيت Wrangler CLI: npm install -g wrangler');
      console.error('2. تسجيل الدخول: wrangler auth login');
      console.error('3. وجود قاعدة البيانات: wrangler d1 list');
    }
    
    if (error.message.includes('database')) {
      console.error('\n💡 قم بإنشاء قاعدة البيانات أولاً:');
      console.error(`wrangler d1 create ${dbName}`);
    }
    
    process.exit(1);
  }
}

// تشغيل العملية
if (require.main === module) {
  applyMigration();
}