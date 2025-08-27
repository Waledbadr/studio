#!/usr/bin/env node

/**
 * Script للتحقق من البيانات الموجودة في Firestore
 * يعرض إحصائيات سريعة عن المجموعات والمستندات
 */

const admin = require('firebase-admin');
const path = require('path');

// تحميل إعدادات البيئة
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 فحص بيانات Firestore الموجودة');
console.log('='.repeat(40));

// تكوين Firebase Admin
let serviceAccount;

try {
  // محاولة قراءة ملف مفتاح الخدمة
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  if (require('fs').existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
    console.log('✅ استخدام ملف مفتاح الخدمة');
  } else {
    // استخدام متغيرات البيئة
    serviceAccount = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };
    console.log('⚠️ استخدام متغيرات البيئة (يتطلب مفتاح خدمة كامل)');
  }

  if (!serviceAccount.project_id) {
    throw new Error('Project ID غير موجود');
  }

} catch (error) {
  console.error('❌ خطأ في تكوين Firebase Admin:', error.message);
  console.error('\nالحلول الممكنة:');
  console.error('1. تحميل ملف مفتاح الخدمة من Firebase Console');
  console.error('2. حفظه كـ firebase-service-account.json في مجلد المشروع');
  console.error('3. أو إعداد متغيرات البيئة الكاملة للخدمة');
  process.exit(1);
}

// تهيئة Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log(`✅ تم الاتصال بمشروع: ${serviceAccount.project_id}`);
  } catch (error) {
    console.error('❌ فشل في تهيئة Firebase:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// وظائف فحص المجموعات
async function checkCollection(collectionName) {
  try {
    console.log(`\n📂 فحص مجموعة: ${collectionName}`);
    
    const snapshot = await db.collection(collectionName).limit(1).get();
    
    if (snapshot.empty) {
      console.log(`   📊 العدد: 0 (مجموعة فارغة)`);
      return { name: collectionName, count: 0, sample: null };
    }

    // حساب العدد الإجمالي
    const countSnapshot = await db.collection(collectionName).count().get();
    const totalCount = countSnapshot.data().count;
    
    console.log(`   📊 العدد: ${totalCount}`);

    // عينة من البيانات
    const sampleSnapshot = await db.collection(collectionName).limit(1).get();
    let sample = null;
    
    if (!sampleSnapshot.empty) {
      const doc = sampleSnapshot.docs[0];
      sample = {
        id: doc.id,
        data: doc.data()
      };
      
      console.log(`   📄 عينة ID: ${doc.id}`);
      console.log(`   🔍 الحقول: ${Object.keys(sample.data).join(', ')}`);
    }

    return { name: collectionName, count: totalCount, sample };

  } catch (error) {
    console.error(`   ❌ خطأ في فحص ${collectionName}:`, error.message);
    return { name: collectionName, count: 0, error: error.message };
  }
}

async function listAllCollections() {
  try {
    console.log('\n🗂️ البحث عن جميع المجموعات...');
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('📭 لم يتم العثور على أي مجموعات');
      return [];
    }

    console.log(`✅ تم العثور على ${collections.length} مجموعة:`);
    collections.forEach(col => {
      console.log(`   - ${col.id}`);
    });

    return collections.map(col => col.id);
  } catch (error) {
    console.error('❌ خطأ في عرض المجموعات:', error.message);
    return [];
  }
}

async function main() {
  try {
    // المجموعات المتوقعة في التطبيق
    const expectedCollections = [
      'users',
      'residences', 
      'inventory',
      'orders',
      'maintenance_requests',
      'notifications',
      'files',
      'sessions'
    ];

    // عرض جميع المجموعات الموجودة
    const existingCollections = await listAllCollections();

    if (existingCollections.length === 0) {
      console.log('\n🤷 قاعدة البيانات فارغة تماماً');
      console.log('💡 لا توجد بيانات للنسخ');
      return;
    }

    // فحص المجموعات المتوقعة
    console.log('\n' + '='.repeat(40));
    console.log('📊 تفاصيل المجموعات');
    console.log('='.repeat(40));

    const results = [];
    
    for (const collectionName of expectedCollections) {
      if (existingCollections.includes(collectionName)) {
        const result = await checkCollection(collectionName);
        results.push(result);
      } else {
        console.log(`\n📂 ${collectionName}: غير موجودة`);
        results.push({ name: collectionName, count: 0 });
      }
    }

    // فحص المجموعات الإضافية
    const additionalCollections = existingCollections.filter(
      name => !expectedCollections.includes(name)
    );

    if (additionalCollections.length > 0) {
      console.log('\n📁 مجموعات إضافية:');
      for (const collectionName of additionalCollections) {
        const result = await checkCollection(collectionName);
        results.push(result);
      }
    }

    // تلخيص النتائج
    console.log('\n' + '='.repeat(40));
    console.log('📈 ملخص النتائج');
    console.log('='.repeat(40));

    let totalDocuments = 0;
    let nonEmptyCollections = 0;

    results.forEach(result => {
      if (result.count > 0) {
        console.log(`✅ ${result.name}: ${result.count} مستند`);
        totalDocuments += result.count;
        nonEmptyCollections++;
      } else {
        console.log(`📭 ${result.name}: فارغة`);
      }
    });

    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   📚 مجموعات تحتوي على بيانات: ${nonEmptyCollections}`);
    console.log(`   📄 إجمالي المستندات: ${totalDocuments}`);
    console.log(`   💾 حجم البيانات المتوقع للنسخ: متوسط`);

    if (totalDocuments > 0) {
      console.log('\n🚀 يمكنك الآن تشغيل عملية النسخ:');
      console.log('   node scripts/complete-migration.js');
    } else {
      console.log('\n🤷 لا توجد بيانات للنسخ');
    }

  } catch (error) {
    console.error('\n💥 خطأ عام:', error);
  }
}

// تشغيل الفحص
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ انتهى الفحص');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل الفحص:', error);
      process.exit(1);
    });
}

module.exports = { main };