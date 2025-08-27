# دليل نسخ البيانات من Firestore إلى Cloudflare D1

هذا الدليل يوضح كيفية نسخ البيانات من قاعدة بيانات Firebase Firestore إلى قاعدة بيانات Cloudflare D1 دون التأثير على بيانات Firestore الأصلية.

## 📋 المتطلبات الأساسية

### 1. أدوات النظام
- Node.js (v16 أو أحدث)
- npm أو yarn
- Wrangler CLI

### 2. إعدادات Firebase
- مشروع Firebase مُفعل
- خدمة Firestore مُفعلة
- مفاتيح API صحيحة في `.env.local`

### 3. إعدادات Cloudflare
- حساب Cloudflare Workers/Pages
- قاعدة بيانات D1 مُنشأة
- Wrangler CLI مُصدق

## 🛠️ الإعداد

### 1. تثبيت المتطلبات

```bash
# تثبيت firebase-admin للوصول لـ Firestore
npm install firebase-admin

# تثبيت wrangler CLI (إذا لم يكن مثبتاً)
npm install -g wrangler

# تسجيل الدخول في Cloudflare
wrangler auth login
```

### 2. التحقق من إعدادات Firebase

تأكد من وجود هذه المتغيرات في `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. إنشاء/التحقق من قاعدة بيانات D1

```bash
# إنشاء قاعدة بيانات جديدة (إذا لم تكن موجودة)
wrangler d1 create estate-care-db

# عرض قواعد البيانات الموجودة
wrangler d1 list
```

## 🚀 تشغيل عملية النسخ

### الطريقة 1: تشغيل شامل (موصى به)

```bash
node scripts/complete-migration.js
```

هذا الأمر سيقوم بـ:
1. التحقق من جميع المتطلبات
2. نسخ البيانات من Firestore
3. إنشاء ملفات SQL و JSON
4. تطبيق schema قاعدة البيانات
5. نقل البيانات إلى D1

### الطريقة 2: تشغيل مرحلي

```bash
# 1. نسخ البيانات من Firestore فقط
node scripts/run-migration.js

# 2. تطبيق البيانات على D1 فقط
node scripts/apply-migration.js
```

## 📁 الملفات المُنتجة

بعد تشغيل النسخ، ستجد:

### `firestore-to-cloudflare-migration.sql`
- ملف SQL يحتوي على جميع البيانات
- جاهز للتطبيق على D1
- يستخدم `INSERT OR IGNORE` لتجنب التكرار

### `firestore-backup.json`
- نسخة احتياطية بصيغة JSON
- تحتوي على البيانات المهيكلة
- مفيدة للمراجعة والتحقق

## 📊 البيانات المنسوخة

يتم نسخ هذه المجموعات:

1. **المستخدمون** (`users`)
   - معلومات المستخدمين والأدوار
   - كلمات المرور المُشفرة

2. **العقارات** (`residences`)
   - بيانات العقارات والوحدات
   - معلومات الإيجار والمستأجرين

3. **المخزون** (`inventory`)
   - عناصر المخزون والمواد
   - معلومات الكميات والأسعار

4. **الطلبات** (`orders`)
   - طلبات الشراء والخدمات
   - معلومات العملاء والدفع

5. **طلبات الصيانة** (`maintenance_requests`)
   - طلبات الصيانة والإصلاح
   - حالة التنفيذ والتقييمات

## 🔍 التحقق من النجاح

### 1. فحص البيانات في D1

```bash
# فحص عدد السجلات في كل جدول
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM users;"
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM residences;"
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM inventory;"
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM orders;"
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM maintenance_requests;"
```

### 2. فحص عينة من البيانات

```bash
# عرض أول 5 مستخدمين
wrangler d1 execute estate-care-db --command="SELECT id, name, email, role FROM users LIMIT 5;"

# عرض أول 5 عقارات
wrangler d1 execute estate-care-db --command="SELECT id, address, property_type, status FROM residences LIMIT 5;"
```

## ⚠️ احتياطات الأمان

### 1. عدم التأثير على Firestore
- النسخ يقرأ البيانات فقط
- لا يتم تعديل أو حذف أي شيء من Firestore
- Firestore يبقى كما هو

### 2. حماية البيانات الحساسة
- كلمات المرور منسوخة مُشفرة
- معلومات الدفع محمية
- لا يتم نسخ مفاتيح API

### 3. النسخ الاحتياطي
- يتم إنشاء ملف JSON كنسخة احتياطية
- يمكن إعادة التطبيق في أي وقت
- البيانات محفوظة محلياً

## 🐛 حل المشاكل الشائعة

### خطأ: "firebase-admin not found"

```bash
npm install firebase-admin
```

### خطأ: "wrangler not found"

```bash
npm install -g wrangler
wrangler auth login
```

### خطأ: "Firebase credentials missing"

تأكد من وجود جميع متغيرات البيئة في `.env.local`

### خطأ: "Database not found"

```bash
# أنشئ قاعدة البيانات أولاً
wrangler d1 create estate-care-db

# تحقق من وجودها
wrangler d1 list
```

### خطأ: "Permission denied"

تأكد من صلاحيات Firebase والتسجيل في Cloudflare

## 📈 الأداء والحدود

### حدود Firestore
- 1MB حد أقصى لحجم المستند
- 500 استعلام/ثانية للقراءة
- لا توجد حدود على عدد المستندات المقروءة

### حدود Cloudflare D1
- 5GB حد أقصى لحجم قاعدة البيانات
- 1000 عملية/دقيقة في الخطة المجانية
- 25MB حد أقصى لحجم المعاملة

### تحسين الأداء
- النسخ يتم بشكل متوازي
- استخدام `INSERT OR IGNORE` لتجنب التكرار
- معاملات SQL لضمان تماسك البيانات

## 🔄 النسخ المجدول

لتشغيل النسخ بشكل دوري:

### 1. إنشاء مهمة cron

```bash
# تشغيل كل يوم في الساعة 2 صباحاً
0 2 * * * cd /path/to/project && node scripts/complete-migration.js
```

### 2. استخدام GitHub Actions

```yaml
name: Sync Firestore to D1
on:
  schedule:
    - cron: '0 2 * * *'  # يومياً في الساعة 2 صباحاً
  workflow_dispatch:     # تشغيل يدوي

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/complete-migration.js
        env:
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 📞 الدعم

إذا واجهت أي مشاكل:

1. تحقق من الـ logs في الـ console
2. تأكد من صحة الإعدادات
3. راجع ملف `firestore-backup.json` للتأكد من البيانات
4. جرب النسخ مرحلياً بدلاً من الشامل

## 🔐 أمان إضافي

### تشفير البيانات الحساسة

```javascript
// يمكن إضافة تشفير إضافي للبيانات الحساسة
const crypto = require('crypto');

function encryptSensitiveData(data) {
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}
```

### مراقبة النسخ

```javascript
// إضافة مراقبة ولوج مفصل
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'migration.log' })
  ]
});
```