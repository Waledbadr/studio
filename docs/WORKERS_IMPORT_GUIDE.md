# استيراد بيانات العمال - Workers Import Guide

هذا الدليل يشرح كيفية استيراد بيانات العمال من ملف JSON إلى قاعدة بيانات Firestore واستخدامها في التطبيق.

## 📋 المحتويات

1. [تنسيق الملف المطلوب](#تنسيق-الملف-المطلوب)
2. [الطرق المتاحة للاستيراد](#الطرق-المتاحة-للاستيراد)
3. [الطريقة 1: استخدام الواجهة الإدارية](#الطريقة-1-استخدام-الواجهة-الإدارية)
4. [الطريقة 2: استخدام سكريبت Node.js](#الطريقة-2-استخدام-سكريبت-nodejs)
5. [الطريقة 3: استخدام API مباشرة](#الطريقة-3-استخدام-api-مباشرة)
6. [التحقق من نجاح الاستيراد](#التحقق-من-نجاح-الاستيراد)

---

## 📝 تنسيق الملف المطلوب

يجب أن يكون ملف البيانات بصيغة **JSON** ويحتوي على مصفوفة (array) من كائنات (objects) العمال.

### مثال على التنسيق الصحيح:

```json
[
  {
    "id": "w001",
    "name": "أحمد محمد",
    "nationaliy": "سعودي",
    "role": "Worker"
  },
  {
    "id": "w002",
    "name": "محمد علي السيد",
    "nationaliy": "مصري",
    "role": "Supervisor"
  },
  {
    "id": "w003",
    "name": "خالد أحمد",
    "nationaliy": "سوري",
    "role": "Engineer"
  },
  {
    "name": "عبدالله حسن",
    "nationaliy": "يمني"
  }
]
```

### تنسيق بديل (مع wrapper):

```json
{
  "workers": [
    {
      "id": "w001",
      "name": "أحمد محمد",
      "nationaliy": "سعودي",
      "role": "Worker"
    }
  ]
}
```

### الحقول (Fields):

| الحقل | نوعه | إجباري؟ | الوصف | القيم المتاحة |
|------|------|---------|-------|---------------|
| `id` | string | اختياري | معرّف فريد للعامل | أي نص (سيتم توليده تلقائياً إذا لم يُوفَّر) |
| `name` | string | **إجباري** | اسم العامل | أي نص |
| `nationaliy` | string | اختياري | الجنسية | أي نص |
| `role` | string | اختياري | الدور الوظيفي | `Worker` أو `Supervisor` أو `Engineer` (افتراضياً: `Worker`) |

> **ملاحظة:** هناك خطأ إملائي في `nationaliy` (بدلاً من `nationality`) - هذا متعمد لمطابقة النظام الحالي.

---

## 🚀 الطرق المتاحة للاستيراد

لديك **3 طرق** لاستيراد البيانات:

### الطريقة 1: استخدام الواجهة الإدارية ⭐ (الأسهل)

أفضل طريقة للمستخدمين غير التقنيين.

#### الخطوات:

1. **تشغيل الخادم المحلي:**
   ```bash
   npm run dev
   ```

2. **فتح الصفحة الإدارية:**
   افتح المتصفح واذهب إلى:
   ```
   http://localhost:9002/admin/import-workers
   ```

3. **رفع الملف:**
   - اضغط على منطقة الرفع
   - اختر ملف `workers.txt` أو `workers.json`
   - ستظهر معاينة لأول 5 سجلات

4. **بدء الاستيراد:**
   - اضغط على زر "استيراد البيانات"
   - انتظر حتى تكتمل العملية
   - ستظهر النتائج التفصيلية

5. **مراجعة النتائج:**
   - عدد السجلات الجديدة
   - عدد السجلات المحدثة
   - عدد السجلات المتخطاة
   - قائمة بالأخطاء إن وجدت

---

### الطريقة 2: استخدام سكريبت Node.js ⚡ (للمطورين)

أسرع طريقة للاستيراد المباشر من سطر الأوامر.

#### الخطوات:

1. **التأكد من إعداد Firebase Admin:**
   يجب أن يكون لديك أحد هذه المتغيرات البيئية:
   - `FIREBASE_SERVICE_ACCOUNT_B64` (مفضل)
   - `FIREBASE_SERVICE_ACCOUNT`
   - `GOOGLE_APPLICATION_CREDENTIALS`
   - أو: `FIREBASE_ADMIN_PROJECT_ID` + `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY`

2. **تشغيل السكريبت:**
   
   **مع المسار الافتراضي:**
   ```bash
   npm run import:workers
   ```
   
   أو مباشرة:
   ```bash
   node scripts/import-workers-from-desktop.mjs
   ```

   **مع مسار مخصص:**
   ```bash
   node scripts/import-workers-from-desktop.mjs "C:\Users\YourName\Desktop\workers.json"
   ```

3. **مراقبة التقدم:**
   سيعرض السكريبت:
   - شريط التقدم
   - كل عملية استيراد/تحديث
   - الأخطاء فورياً
   - ملخص نهائي مفصل

#### مثال على المخرجات:

```
🔷 EstateCare Workers Import Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Firebase Admin initialized
📂 Reading file: C:\Users\MohammedAlabdali\Desktop\workers.txt
✅ Loaded 150 workers from file

🔄 Starting import process...

✅ Imported: أحمد محمد (w001)
✅ Imported: محمد علي (w002)
🔄 Updated: خالد أحمد (w003)

📊 Progress: 10/150 (7%)

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Import Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Total workers:     150
✅ Newly imported:    145
🔄 Updated:           5
⚠️  Skipped:          0

✨ Success rate: 100.0%
🎉 All workers imported successfully!
```

---

### الطريقة 3: استخدام API مباشرة 🔧 (للتكامل)

مفيدة للتكامل مع أنظمة أخرى.

#### المعلومات التقنية:

**Endpoint:**
```
POST /api/workers/import
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
يمكن إرسال البيانات بطريقتين:

```json
// الطريقة 1: مصفوفة مباشرة
[
  { "id": "w001", "name": "أحمد", "nationaliy": "سعودي", "role": "Worker" },
  { "name": "محمد", "nationaliy": "مصري" }
]

// الطريقة 2: مع wrapper
{
  "workers": [
    { "id": "w001", "name": "أحمد", "nationaliy": "سعودي" }
  ]
}
```

#### مثال باستخدام cURL:

```bash
curl -X POST http://localhost:9002/api/workers/import \
  -H "Content-Type: application/json" \
  -d @workers.json
```

#### مثال باستخدام PowerShell:

```powershell
$workers = Get-Content "C:\Users\MohammedAlabdali\Desktop\workers.txt" -Raw
Invoke-RestMethod -Uri "http://localhost:9002/api/workers/import" `
  -Method POST `
  -ContentType "application/json" `
  -Body $workers
```

#### مثال باستخدام JavaScript (fetch):

```javascript
const response = await fetch('/api/workers/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(workers)
});

const result = await response.json();
console.log(result);
```

#### الاستجابة (Response):

```json
{
  "success": true,
  "message": "Import completed: 145 new, 5 updated, 0 skipped",
  "results": {
    "total": 150,
    "imported": 145,
    "updated": 5,
    "skipped": 0,
    "errors": []
  }
}
```

---

## ✅ التحقق من نجاح الاستيراد

بعد الاستيراد، يمكنك التحقق من البيانات بعدة طرق:

### 1. من خلال صفحة العمال في التطبيق:

```
http://localhost:9002/accommodation/workers
```

ستجد قائمة بجميع العمال مع إمكانية:
- البحث والتصفية
- التعديل
- الحذف

### 2. من خلال Firebase Console:

1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اذهب إلى Firestore Database
3. ابحث عن collection اسمها `workers`
4. ستجد جميع العمال المستوردين

### 3. من خلال Firestore Emulator (إذا كنت تستخدمه):

```
http://localhost:4000/firestore
```

---

## 🔄 الميزات الإضافية

### التعامل مع العمال الموجودين مسبقاً:

- إذا كان العامل موجوداً بنفس الـ `id`، سيتم **تحديث** بياناته
- يمكنك استخدام الاستيراد لتحديث بيانات العمال الحاليين

### توليد IDs تلقائياً:

- إذا لم تقدم `id`، سيتم توليده بالشكل: `w_TIMESTAMP_INDEX`
- مثال: `w_1728518400000_0`

### دعم اللغات:

- الحقول تدعم اللغة العربية والإنجليزية
- يمكن استخدام `nationality` أو `nationaliy` (كلاهما مقبول)

### معالجة الأخطاء:

- السجلات التي تحتوي على أخطاء يتم تخطيها
- يستمر الاستيراد للسجلات الأخرى
- تحصل على تقرير مفصل بكل الأخطاء

---

## 🐛 استكشاف الأخطاء

### خطأ: "Firebase Admin not configured"

**الحل:**
تأكد من إعداد متغيرات Firebase Admin في `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_B64=your_base64_encoded_service_account
# أو
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
```

### خطأ: "File not found"

**الحل:**
تأكد من المسار الصحيح للملف:
```bash
node scripts/import-workers-from-desktop.mjs "C:\Users\MohammedAlabdali\Desktop\workers.txt"
```

### خطأ: "Invalid data format"

**الحل:**
تأكد من أن الملف:
- بصيغة JSON صحيحة
- يحتوي على مصفوفة من objects
- كل object يحتوي على حقل `name` على الأقل

### خطأ: "Permission denied"

**الحل:**
تحقق من Firestore Rules وتأكد من السماح بالكتابة:
```javascript
allow write: if request.auth != null && request.auth.token.admin == true;
```

---

## 📚 ملفات النظام ذات الصلة

- **API Endpoint:** `src/app/api/workers/import/route.ts`
- **صفحة الإدارة:** `src/app/admin/import-workers/page.tsx`
- **سكريبت الاستيراد:** `scripts/import-workers-from-desktop.mjs`
- **Context:** `src/context/accommodation-context.tsx`
- **صفحة العرض:** `src/app/accommodation/workers/page.tsx`

---

## 💡 نصائح إضافية

1. **احفظ نسخة احتياطية** من ملف العمال قبل الاستيراد
2. **ابدأ باختبار صغير** (استورد 5-10 عمال أولاً)
3. **راجع النتائج** قبل استيراد الدفعة الكاملة
4. **استخدم IDs مميزة** لتسهيل التحديثات المستقبلية
5. **تجنب الأسماء المكررة** لمنع الالتباس

---

## 🎯 الخلاصة

الآن لديك 3 طرق قوية لاستيراد بيانات العمال:

| الطريقة | الأفضل لـ | الصعوبة | السرعة |
|---------|----------|---------|--------|
| الواجهة الإدارية | المستخدمين النهائيين | سهل جداً ⭐ | متوسط |
| سكريبت Node.js | المطورين | متوسط | سريع جداً ⚡ |
| API مباشرة | التكامل مع أنظمة أخرى | متقدم | سريع |

اختر الطريقة التي تناسبك وابدأ الاستيراد! 🚀

---

**تم التحديث:** أكتوبر 2025  
**الإصدار:** 1.0.0
