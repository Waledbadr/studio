#!/usr/bin/env node

/**
 * Script شامل لنسخ البيانات من Firestore إلى Cloudflare D1
 * يقوم بتنفيذ العملية كاملة: النسخ + التطبيق
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 نسخ شامل من Firestore إلى Cloudflare D1');
console.log('='.repeat(50));

// التحقق من المتطلبات
function checkRequirements() {
  console.log('\n🔍 التحقق من المتطلبات...');
  
  const requirements = [
    {
      name: 'Node.js',
      check: () => process.version,
      error: 'Node.js غير مثبت'
    },
    {
      name: 'npm',
      check: () => execSync('npm --version', { encoding: 'utf8' }).trim(),
      error: 'npm غير متوفر'
    }
  ];

  for (const req of requirements) {
    try {
      const version = req.check();
      console.log(`✅ ${req.name}: ${version}`);
    } catch (error) {
      console.error(`❌ ${req.error}`);
      process.exit(1);
    }
  }

  // التحقق من firebase-admin
  try {
    require.resolve('firebase-admin');
    console.log('✅ firebase-admin: مثبت');
  } catch (error) {
    console.log('⚠️ firebase-admin: غير مثبت، سيتم تثبيته...');
    try {
      execSync('npm install firebase-admin', { stdio: 'inherit' });
      console.log('✅ تم تثبيت firebase-admin');
    } catch (installError) {
      console.error('❌ فشل في تثبيت firebase-admin');
      process.exit(1);
    }
  }

  // التحقق من wrangler
  try {
    const wranglerVersion = execSync('wrangler --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Wrangler CLI: ${wranglerVersion}`);
  } catch (error) {
    console.error('❌ Wrangler CLI غير مثبت');
    console.error('قم بتثبيته: npm install -g wrangler');
    console.error('ثم سجل الدخول: wrangler auth login');
    process.exit(1);
  }
}

// التحقق من إعدادات Firebase
function checkFirebaseConfig() {
  console.log('\n🔥 التحقق من إعدادات Firebase...');
  
  // تحميل متغيرات البيئة
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ متغيرات البيئة المطلوبة غير موجودة:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nتأكد من وجود إعدادات Firebase في ملف .env.local');
    return false;
  }

  console.log(`✅ Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  return true;
}

// نسخ البيانات من Firestore
async function migrateData() {
  console.log('\n📥 نسخ البيانات من Firestore...');
  
  try {
    require('./run-migration.js');
    
    // انتظار إنشاء الملفات
    const maxWait = 30000; // 30 ثانية
    const startTime = Date.now();
    const sqlFilePath = path.join(__dirname, 'firestore-to-cloudflare-migration.sql');
    
    while (!fs.existsSync(sqlFilePath) && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('لم يتم إنشاء ملف SQL في الوقت المحدد');
    }
    
    console.log('✅ تم نسخ البيانات من Firestore');
    return true;
  } catch (error) {
    console.error('❌ فشل في نسخ البيانات من Firestore:', error.message);
    return false;
  }
}

// تطبيق البيانات على Cloudflare D1
async function applyToCloudflare() {
  console.log('\n☁️ تطبيق البيانات على Cloudflare D1...');
  
  try {
    require('./apply-migration.js');
    console.log('✅ تم تطبيق البيانات على Cloudflare D1');
    return true;
  } catch (error) {
    console.error('❌ فشل في تطبيق البيانات على Cloudflare D1:', error.message);
    return false;
  }
}

// الوظيفة الرئيسية
async function main() {
  try {
    // 1. التحقق من المتطلبات
    checkRequirements();

    // 2. التحقق من إعدادات Firebase
    if (!checkFirebaseConfig()) {
      process.exit(1);
    }

    // 3. نسخ البيانات من Firestore
    const migrationSuccess = await migrateData();
    if (!migrationSuccess) {
      console.error('\n💥 فشلت عملية النسخ من Firestore');
      process.exit(1);
    }

    // 4. تطبيق البيانات على Cloudflare D1
    const applySuccess = await applyToCloudflare();
    if (!applySuccess) {
      console.error('\n💥 فشلت عملية التطبيق على Cloudflare D1');
      process.exit(1);
    }

    // 5. تقرير النجاح
    console.log('\n' + '='.repeat(50));
    console.log('🎉 تمت العملية بنجاح!');
    console.log('='.repeat(50));
    
    console.log('\n📊 الملفات المُنشأة:');
    const files = [
      'firestore-to-cloudflare-migration.sql',
      'firestore-backup.json'
    ];
    
    files.forEach(filename => {
      const filepath = path.join(__dirname, filename);
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`   📄 ${filename} (${sizeKB} KB)`);
      }
    });

    console.log('\n📝 ما تم إنجازه:');
    console.log('   ✅ نسخ البيانات من Firestore');
    console.log('   ✅ إنشاء ملف SQL للبيانات');
    console.log('   ✅ إنشاء نسخة احتياطية JSON');
    console.log('   ✅ تطبيق schema قاعدة البيانات');
    console.log('   ✅ تطبيق البيانات على Cloudflare D1');

    console.log('\n🚀 الخطوات التالية:');
    console.log('   1. تحقق من البيانات في لوحة تحكم Cloudflare');
    console.log('   2. اختبر اتصال التطبيق بقاعدة البيانات');
    console.log('   3. قم بتحديث إعدادات production للاستخدام الكامل');

  } catch (error) {
    console.error('\n💥 حدث خطأ غير متوقع:', error);
    process.exit(1);
  }
}

// تشغيل العملية إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  main();
}

module.exports = { main };