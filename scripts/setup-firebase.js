#!/usr/bin/env node

/**
 * Script تحضيري لإعداد Firebase قبل النسخ
 * يساعد في تفعيل وتكوين Firebase للنسخ إلى Cloudflare D1
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envLocalPath = path.join(__dirname, '..', '.env.local');

console.log('🔧 إعداد Firebase للنسخ إلى Cloudflare D1');
console.log('='.repeat(50));

// إنشاء واجهة للإدخال
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateEnvFile(firebaseConfig) {
  console.log('\n📝 تحديث ملف .env.local...');

  // قراءة الملف الحالي
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }

  // تحديث/إضافة إعدادات Firebase
  const firebaseVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': firebaseConfig.apiKey,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': firebaseConfig.authDomain,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': firebaseConfig.projectId,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': firebaseConfig.storageBucket,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': firebaseConfig.messagingSenderId,
    'NEXT_PUBLIC_FIREBASE_APP_ID': firebaseConfig.appId
  };

  // تحديث أو إضافة كل متغير
  for (const [key, value] of Object.entries(firebaseVars)) {
    const regex = new RegExp(`^#?${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  }

  // حفظ الملف المحدث
  fs.writeFileSync(envLocalPath, envContent, 'utf8');
  console.log('✅ تم تحديث ملف .env.local');
}

function validateFirebaseConfig(config) {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !config[key] || config[key].trim() === '');
  
  if (missing.length > 0) {
    console.error('❌ الحقول المطلوبة مفقودة:', missing);
    return false;
  }
  
  return true;
}

async function setupFirebase() {
  console.log('\n🔥 إعداد Firebase Configuration');
  console.log('\nيمكنك الحصول على هذه المعلومات من:');
  console.log('Firebase Console > Project Settings > General > Your apps > Web app\n');

  const firebaseConfig = {};

  // جمع معلومات Firebase
  firebaseConfig.apiKey = await askQuestion('🔑 Firebase API Key: ');
  firebaseConfig.authDomain = await askQuestion('🌐 Auth Domain (e.g., project-id.firebaseapp.com): ');
  firebaseConfig.projectId = await askQuestion('📋 Project ID: ');
  firebaseConfig.storageBucket = await askQuestion('🗃️ Storage Bucket (e.g., project-id.appspot.com): ');
  firebaseConfig.messagingSenderId = await askQuestion('📱 Messaging Sender ID: ');
  firebaseConfig.appId = await askQuestion('📱 App ID: ');

  // التحقق من صحة البيانات
  if (!validateFirebaseConfig(firebaseConfig)) {
    console.error('\n❌ البيانات غير مكتملة أو غير صحيحة');
    return false;
  }

  // تحديث ملف البيئة
  await updateEnvFile(firebaseConfig);

  console.log('\n✅ تم إعداد Firebase بنجاح!');
  console.log(`📋 Project ID: ${firebaseConfig.projectId}`);
  
  return true;
}

async function checkExistingFirebase() {
  console.log('\n🔍 التحقق من إعدادات Firebase الحالية...');

  if (!fs.existsSync(envLocalPath)) {
    console.log('⚠️ ملف .env.local غير موجود');
    return false;
  }

  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // البحث عن إعدادات Firebase مُفعلة
  const firebasePattern = /^NEXT_PUBLIC_FIREBASE_PROJECT_ID=(.+)$/m;
  const match = envContent.match(firebasePattern);
  
  if (match && match[1] && !match[1].includes('#')) {
    console.log(`✅ Firebase مُفعل للمشروع: ${match[1]}`);
    return true;
  }

  console.log('⚠️ Firebase غير مُفعل أو غير مُكون');
  return false;
}

async function setupCloudflareD1() {
  console.log('\n☁️ التحقق من إعداد Cloudflare D1...');

  try {
    const { execSync } = require('child_process');
    
    // التحقق من wrangler
    const wranglerVersion = execSync('wrangler --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Wrangler CLI: ${wranglerVersion}`);

    // عرض قواعد البيانات الموجودة
    console.log('\n📋 قواعد البيانات D1 الموجودة:');
    try {
      const databases = execSync('wrangler d1 list', { encoding: 'utf8' });
      console.log(databases);
    } catch (error) {
      console.log('⚠️ لا توجد قواعد بيانات أو خطأ في الوصول');
    }

    // سؤال عن إنشاء قاعدة بيانات جديدة
    const createNew = await askQuestion('\n❓ هل تريد إنشاء قاعدة بيانات D1 جديدة؟ (y/n): ');
    
    if (createNew.toLowerCase() === 'y' || createNew.toLowerCase() === 'yes') {
      const dbName = await askQuestion('📛 اسم قاعدة البيانات: ') || 'estate-care-db';
      
      try {
        console.log(`\n🔄 إنشاء قاعدة البيانات: ${dbName}...`);
        const createOutput = execSync(`wrangler d1 create ${dbName}`, { encoding: 'utf8' });
        console.log(createOutput);
        console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
      } catch (error) {
        console.error('❌ فشل في إنشاء قاعدة البيانات:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Wrangler CLI غير مثبت أو غير مُصدق');
    console.error('قم بتثبيته وتسجيل الدخول:');
    console.error('npm install -g wrangler');
    console.error('wrangler auth login');
    return false;
  }

  return true;
}

async function main() {
  try {
    console.log('هذا Script سيساعدك في إعداد Firebase للنسخ إلى Cloudflare D1');
    console.log('تأكد من أن لديك:');
    console.log('- مشروع Firebase مُفعل مع Firestore');
    console.log('- حساب Cloudflare Workers مُفعل');
    console.log('- صلاحيات الوصول لكلا الخدمتين\n');

    const proceed = await askQuestion('❓ هل تريد المتابعة؟ (y/n): ');
    
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log('🚪 تم الإلغاء');
      rl.close();
      return;
    }

    // 1. التحقق من Firebase الحالي
    const firebaseExists = await checkExistingFirebase();
    
    if (!firebaseExists) {
      const setup = await askQuestion('\n❓ هل تريد إعداد Firebase الآن؟ (y/n): ');
      if (setup.toLowerCase() === 'y' || setup.toLowerCase() === 'yes') {
        const success = await setupFirebase();
        if (!success) {
          console.log('❌ فشل في إعداد Firebase');
          rl.close();
          return;
        }
      } else {
        console.log('⚠️ يجب إعداد Firebase أولاً للمتابعة');
        rl.close();
        return;
      }
    }

    // 2. إعداد Cloudflare D1
    await setupCloudflareD1();

    // 3. عرض الخطوات التالية
    console.log('\n' + '='.repeat(50));
    console.log('🎉 الإعداد مكتمل!');
    console.log('='.repeat(50));
    console.log('\n📝 الخطوات التالية:');
    console.log('1. تشغيل عملية النسخ الشاملة:');
    console.log('   node scripts/complete-migration.js');
    console.log('\n2. أو تشغيل النسخ مرحلياً:');
    console.log('   node scripts/run-migration.js');
    console.log('   node scripts/apply-migration.js');
    console.log('\n3. مراجعة الدليل الكامل:');
    console.log('   docs/MIGRATION_GUIDE.md');

    rl.close();

  } catch (error) {
    console.error('\n💥 حدث خطأ:', error);
    rl.close();
    process.exit(1);
  }
}

// تشغيل الإعداد
if (require.main === module) {
  main();
}

module.exports = { main };