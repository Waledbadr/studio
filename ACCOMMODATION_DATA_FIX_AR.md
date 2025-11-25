# 🔧 حل مشاكل عرض البيانات والغرف - دليل سريع

## 🎯 ملخص المشاكل المحلولة

### المشكلة 1: عدم ظهور بيانات العمال من قاعدة البيانات ✅
**السبب**: مشاكل في الاتصال بـ Firestore أو صلاحيات المصادقة

**الحلول المطبقة**:
1. ✅ إضافة console.log تفصيلية لتتبع تحميل البيانات
2. ✅ رسالة تحذيرية واضحة عند عدم وجود بيانات
3. ✅ زر تحديث الصفحة مباشر
4. ✅ رابط سريع لإضافة عمال جدد
5. ✅ إنشاء صفحة تشخيص شاملة: `/accommodation/debug-data`

### المشكلة 2: عدم وجود الغرف في نظام التسكين ✅
**السبب**: دالة `findRoom` لا تدعم البنية المسطحة (Flat) للمساكن

**الحلول المطبقة**:
1. ✅ إعادة كتابة دالة `findRoom` لدعم نوعين:
   - **بنية هرمية**: Complex → Building → Floor → Room
   - **بنية مسطحة**: Complex → Rooms مباشرة
2. ✅ إضافة console.log تفصيلية لتتبع البحث عن الغرف
3. ✅ رسائل تحذيرية واضحة عند عدم إيجاد الغرفة

---

## 🚀 الخطوات الفورية للتشخيص

### الخطوة 1: افتح صفحة التشخيص
```
http://localhost:9002/accommodation/debug-data
```

هذه الصفحة تعرض لك:
- ✅ حالة اتصال Firebase
- ✅ حالة المصادقة (تسجيل الدخول)
- ✅ إحصائيات شاملة (عمال، مساكن، غرف، تسكين)
- ⚠️ قائمة المشاكل المحتملة
- 📊 عينات من البيانات
- 🔍 تفاصيل بنية كل مسكن

### الخطوة 2: افتح Console المتصفح
اضغط `F12` ثم تبويب **Console**

ابحث عن هذه الرسائل:

#### ✅ إذا رأيت:
```javascript
🔍 [UnifiedManagement] Data Status: {
  workers: 50,
  occupants: 30,
  residences: 5
}

🏘️ [UnifiedManagement] Residences Structure: [
  { id: "res1", name: "مسكن 1", buildings: 2, totalRooms: 20 },
  { id: "res2", name: "مسكن 2", buildings: 0, totalRooms: 10 }
]

✅ [findRoom] Found in hierarchy: {
  residenceId: "res1",
  buildingId: "b1",
  floorId: "f1",
  roomId: "r1"
}
```
**المعنى**: كل شيء يعمل بشكل صحيح! ✅

#### ⚠️ إذا رأيت:
```javascript
⚠️ [findRoom] Room not found: {
  residenceId: "res1",
  roomId: "r999",
  hasBuildings: true,
  buildingsCount: 2,
  hasRooms: false,
  roomsCount: 0
}
```
**المعنى**: الغرفة غير موجودة في المسكن

#### ❌ إذا رأيت:
```javascript
🔍 [UnifiedManagement] Data Status: {
  workers: 0,
  occupants: 0,
  residences: 0
}
```
**المعنى**: لم يتم تحميل أي بيانات - اتبع خطوات الحل أدناه

---

## 🛠️ حلول المشاكل الشائعة

### 🔴 المشكلة: workers: 0 (لا توجد بيانات عمال)

#### الحل 1: تحقق من تسجيل الدخول
```javascript
// في Console اكتب:
firebase.auth().currentUser
// يجب أن يظهر: {uid: "abc123", email: "..."}
```

**إذا كان null**:
- سجل الدخول من `/auth/login`
- أو أعد تسجيل الدخول

#### الحل 2: تحقق من Firestore Rules
افتح **Firebase Console** → **Firestore Database** → **Rules**

تأكد من وجود:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workers/{workerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /occupants/{occupantId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /residences/{residenceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

#### الحل 3: تحقق من .env.local
تأكد من وجود الملف: `.env.local` في المجلد الرئيسي

يجب أن يحتوي على:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yourproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**إذا كان مفقوداً أو خاطئاً**:
1. أنشئ الملف في المجلد الرئيسي
2. انسخ القيم من Firebase Console → Project Settings
3. احفظ الملف
4. أعد تشغيل السيرفر: `npm run dev`

#### الحل 4: أضف بيانات تجريبية
اذهب إلى: `/accommodation/quick-add-workers`

أو أضف يدوياً في Firestore:
```javascript
// Collection: workers
// Document ID: auto
{
  id: "worker1",
  name: "أحمد محمد",
  nationaliy: "مصري",
  company: "شركة البناء",
  role: "Worker"
}
```

---

### 🟡 المشكلة: residences: 0 (لا توجد مساكن)

#### الحل 1: أضف مسكن تجريبي في Firestore
```javascript
// Collection: residences
// Document ID: auto
{
  id: "res1",
  name: "مسكن العمال 1",
  city: "الرياض",
  managerId: "YOUR_USER_ID",
  buildings: [
    {
      id: "b1",
      name: "المبنى A",
      floors: [
        {
          id: "f1",
          name: "الطابق الأول",
          rooms: [
            {
              id: "r1",
              name: "غرفة 101",
              capacity: 4
            },
            {
              id: "r2",
              name: "غرفة 102",
              capacity: 4
            }
          ]
        }
      ]
    }
  ]
}
```

#### الحل 2: استخدم واجهة الإدارة
اذهب إلى: `/residences/add`

---

### 🟠 المشكلة: totalRooms: 0 (لا توجد غرف)

**السبب**: المساكن موجودة لكن بدون غرف!

#### الحل 1: أضف غرف للمسكن الموجود
في **Firestore** → افتح مستند المسكن → أضف:

**للبنية الهرمية**:
```javascript
{
  buildings: [
    {
      id: "b1",
      name: "المبنى الرئيسي",
      floors: [
        {
          id: "f1",
          name: "الطابق الأرضي",
          rooms: [
            { id: "r1", name: "غرفة 1", capacity: 4 },
            { id: "r2", name: "غرفة 2", capacity: 4 }
          ]
        }
      ]
    }
  ]
}
```

**للبنية المسطحة**:
```javascript
{
  rooms: [
    { id: "r1", name: "غرفة 1", capacity: 4 },
    { id: "r2", name: "غرفة 2", capacity: 4 },
    { id: "r3", name: "غرفة 3", capacity: 6 }
  ]
}
```

---

### 🟢 المشكلة: "Room not found" في Console

#### الحل: تحقق من تطابق الـ IDs

في صفحة التشخيص (`/accommodation/debug-data`):
1. انظر لـ "تفاصيل المساكن"
2. تأكد من أن `roomId` في `occupants` موجود فعلاً في المسكن

**مثال على عدم التطابق**:
```javascript
// في occupants
{
  workerId: "w1",
  residenceId: "res1",
  roomId: "room999"  // ❌ هذا ID غير موجود!
}

// في residences
{
  id: "res1",
  rooms: [
    { id: "r1", name: "غرفة 1" },  // ✅ IDs مختلفة!
    { id: "r2", name: "غرفة 2" }
  ]
}
```

**الحل**: حدّث `roomId` في collection `occupants` ليطابق الـ ID الصحيح

---

## 🎛️ أدوات التشخيص المتقدمة

### في صفحة `/accommodation/debug-data`:

#### 1. طباعة البيانات في Console
- اضغط زر "طباعة البيانات في Console"
- افتح Console (F12)
- سترى جميع البيانات مطبوعة بالكامل

#### 2. تصدير البيانات JSON
- اضغط زر "تصدير البيانات JSON"
- سيتم تنزيل ملف يحتوي على:
  - جميع العمال
  - جميع سجلات التسكين
  - جميع المساكن وبنيتها
  - الإحصائيات
  - حالة المصادقة

#### 3. فحص localStorage
في Console اكتب:
```javascript
// فحص العمال المخزنين محلياً
JSON.parse(localStorage.getItem('ac_workers'))

// فحص التسكين
JSON.parse(localStorage.getItem('ac_occupants'))

// فحص المساكن
JSON.parse(localStorage.getItem('estatecare_residences'))
```

---

## 🔄 أوامر إعادة التشغيل

إذا قمت بتعديل `.env.local` أو Firebase Rules:

```powershell
# أوقف السيرفر (Ctrl+C)
# ثم شغله مرة أخرى:
npm run dev
```

إذا لم تحل المشكلة:
```powershell
# امسح الـ cache
Remove-Item .next -Recurse -Force
npm run dev
```

---

## 📞 Checklist قبل طلب المساعدة

قبل التواصل، تأكد من:

- [ ] تسجيل الدخول بحساب صحيح
- [ ] وجود `.env.local` بإعدادات Firebase صحيحة
- [ ] Firestore Rules تسمح بالقراءة للمستخدم المسجل
- [ ] وجود بيانات في collections (workers, residences, occupants)
- [ ] الغرف موجودة فعلاً في المساكن (buildings/floors/rooms أو rooms مباشرة)
- [ ] فتحت صفحة `/accommodation/debug-data` وراجعت المشاكل
- [ ] فتحت Console (F12) وراجعت الرسائل
- [ ] جربت تحديث الصفحة (Ctrl+R)
- [ ] جربت إعادة تشغيل السيرفر

---

## 📸 ماذا أرسل للدعم؟

إذا استمرت المشكلة، أرسل:

1. **Screenshot** من صفحة `/accommodation/debug-data` كاملة
2. **Screenshot** من Console (F12) يوضح الرسائل
3. **ملف JSON** المصدّر من صفحة التشخيص
4. **وصف المشكلة**: 
   - ماذا كنت تحاول أن تفعل؟
   - ماذا حدث بالفعل؟
   - متى بدأت المشكلة؟

---

## ✅ الملفات المعدلة في هذا الإصلاح

| الملف | التعديل |
|------|---------|
| `src/app/accommodation/unified-management/page.tsx` | تحسين دالة findRoom لدعم البنية المسطحة + console.log تفصيلية |
| `src/app/accommodation/debug-data/page.tsx` | صفحة تشخيص شاملة جديدة |
| `ACCOMMODATION_DATA_FIX_AR.md` | هذا الملف (الدليل) |

---

**آخر تحديث**: 17 أكتوبر 2025  
**الحالة**: ✅ تم إصلاح المشاكل المعروفة  
**الصفحات الجديدة**: `/accommodation/debug-data`
