#!/usr/bin/env node

/**
 * Script تشغيل نسخ البيانات من Firestore إلى Cloudflare D1
 * يقوم بقراءة إعدادات Firebase من متغيرات البيئة
 */

const path = require('path');
const fs = require('fs');

// تحميل متغيرات البيئة
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// التحقق من وجود إعدادات Firebase
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY'
];

console.log('🔍 التحقق من إعدادات Firebase...');

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ متغيرات البيئة المطلوبة غير موجودة:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nتأكد من وجود إعدادات Firebase في ملف .env.local');
  process.exit(1);
}

// إنشاء كائن Firebase للـ migration script
process.env.FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
process.env.FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
process.env.FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
process.env.FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
process.env.FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
process.env.FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

console.log('✅ إعدادات Firebase موجودة');
console.log(`📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);

// التحقق من تثبيت firebase-admin
try {
  require('firebase-admin');
  console.log('✅ firebase-admin مثبت');
} catch (error) {
  console.error('❌ firebase-admin غير مثبت. يجب تثبيته أولاً:');
  console.error('npm install firebase-admin');
  process.exit(1);
}

// تشغيل script النسخ
console.log('\n🚀 بدء عملية نسخ البيانات...\n');

try {
  const migrationScript = require('./migrate-firestore-to-cloudflare.js');
  migrationScript.migrateAllData();
} catch (error) {
  console.error('❌ خطأ في تشغيل script النسخ:', error);
  
  if (error.message.includes('firebase-admin')) {
    console.error('\n💡 حل مقترح: قم بتثبيت firebase-admin:');
    console.error('npm install firebase-admin');
  }
  
  if (error.message.includes('credential')) {
    console.error('\n💡 حل مقترح: تأكد من صحة إعدادات Firebase');
    console.error('أو قم بتنزيل ملف مفتاح الخدمة وحفظه كـ firebase-service-account.json');
  }
  
  process.exit(1);
}