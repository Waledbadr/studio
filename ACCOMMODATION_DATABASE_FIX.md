# إصلاح مشاكل قاعدة البيانات في نظام التسكين

## التاريخ: 2025-10-18

## المشكلة
كانت هناك مشكلة متكررة تظهر عند محاولة التسكين أو الإخراج حيث يعرض النظام رسالة "العامل غير موجود" أو "الغرفة غير موجودة" رغم وجودها في قاعدة البيانات.

## الأسباب الجذرية

### 1. **مشكلة الفهرسة (Firestore Indexes)**
- ملف `firestore.indexes.json` كان يفتقد الفهارس الضرورية للمجموعات الجديدة
- المجموعات التالية لم يكن لها فهارس:
  - `workers`
  - `occupants`
  - `accommodationHistory`
  - `companies`
  - `contracts`
  - `invoices`

### 2. **مشكلة تحميل البيانات**
- اعتماد النظام على `onSnapshot` للاستماع للتغييرات في Firestore
- في حالة فشل الاتصال أو عدم تحميل البيانات بشكل كامل، يبقى الـ state فارغاً
- عدم وجود آلية لإعادة تحميل البيانات عند الحاجة

### 3. **عدم وجود رسائل خطأ واضحة**
- الرسائل السابقة كانت غير واضحة للمستخدم
- عدم وجود logging كافٍ لتتبع المشكلة

## الحلول المطبقة

### 1. تحديث الفهارس (firestore.indexes.json)

تم إضافة الفهارس التالية:

#### فهارس Workers:
```json
{
  "collectionGroup": "workers",
  "fields": [
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "workers",
  "fields": [
    { "fieldPath": "employeeId", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "workers",
  "fields": [
    { "fieldPath": "nationaliy", "order": "ASCENDING" },
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
}
```

#### فهارس Occupants:
```json
{
  "collectionGroup": "occupants",
  "fields": [
    { "fieldPath": "workerId", "order": "ASCENDING" },
    { "fieldPath": "since", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "occupants",
  "fields": [
    { "fieldPath": "residenceId", "order": "ASCENDING" },
    { "fieldPath": "roomId", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "occupants",
  "fields": [
    { "fieldPath": "residenceId", "order": "ASCENDING" },
    { "fieldPath": "roomId", "order": "ASCENDING" },
    { "fieldPath": "until", "order": "ASCENDING" }
  ]
}
```

#### فهارس Accommodation History:
```json
{
  "collectionGroup": "accommodationHistory",
  "fields": [
    { "fieldPath": "workerId", "order": "ASCENDING" },
    { "fieldPath": "actionDate", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "accommodationHistory",
  "fields": [
    { "fieldPath": "residenceId", "order": "ASCENDING" },
    { "fieldPath": "actionDate", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "accommodationHistory",
  "fields": [
    { "fieldPath": "actionType", "order": "ASCENDING" },
    { "fieldPath": "actionDate", "order": "DESCENDING" }
  ]
}
```

#### فهارس Companies, Contracts, Invoices:
```json
{
  "collectionGroup": "companies",
  "fields": [
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "contracts",
  "fields": [
    { "fieldPath": "companyId", "order": "ASCENDING" },
    { "fieldPath": "startDate", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "contracts",
  "fields": [
    { "fieldPath": "residenceId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "contractId", "order": "ASCENDING" },
    { "fieldPath": "month", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "generatedAt", "order": "DESCENDING" }
  ]
}
```

### 2. تحسين دالة checkInWorker

تم إضافة:
- **Logging شامل**: تتبع كل خطوة في عملية التسكين
- **إعادة تحميل تلقائية**: إذا كانت قائمة العمال فارغة، يتم إعادة تحميلها من Firestore
- **إعادة تحميل المباني**: إذا كانت قائمة المباني فارغة، يتم إعادة تحميلها من localStorage
- **رسائل خطأ واضحة بالعربية**: توضح بالضبط ما هي المشكلة
- **معلومات تشخيصية**: عرض الـ IDs المتاحة عند حدوث خطأ

```typescript
// Re-validate workers list from Firestore if empty or not found
if (workers.length === 0 && db) {
  console.warn('⚠️ [checkInWorker] Workers list is empty, attempting to reload from Firestore...');
  try {
    const workersSnapshot = await getDocs(collection(db, 'workers'));
    const freshWorkers = workersSnapshot.docs.map((d) => {
      // ... mapping logic
    });
    setWorkers(freshWorkers);
    console.log('✅ [checkInWorker] Reloaded workers from Firestore:', freshWorkers.length);
  } catch (reloadErr) {
    console.error('❌ [checkInWorker] Failed to reload workers:', reloadErr);
  }
}
```

### 3. تحسين دالة checkOutWorkerEnhanced

نفس التحسينات المطبقة على checkInWorker:
- إعادة تحميل قائمة العمال عند الحاجة
- إعادة تحميل قائمة المسكّنين (occupants) عند الحاجة
- رسائل خطأ واضحة
- logging شامل

## خطوات النشر

### 1. رفع الفهارس إلى Firebase

```bash
firebase deploy --only firestore:indexes
```

**ملاحظة**: قد يستغرق بناء الفهارس بضع دقائق حسب حجم البيانات.

### 2. التحقق من الفهارس

1. افتح Firebase Console
2. انتقل إلى Firestore Database → Indexes
3. تأكد من أن جميع الفهارس في حالة "Building" أو "Enabled"

### 3. اختبار النظام

1. جرّب تسكين عامل جديد
2. جرّب إخراج عامل
3. راقب رسائل console للتأكد من تحميل البيانات بشكل صحيح

## رسائل Logging الجديدة

عند التسكين:
```
🔵 [checkInWorker] Starting with params: {...}
📊 [checkInWorker] Current state: { workersCount, residencesCount, ... }
⚠️ [checkInWorker] Workers list is empty, attempting to reload...
✅ [checkInWorker] Reloaded workers from Firestore: X
✅ [checkInWorker] Room found: {...}
👥 [checkInWorker] Current room occupants: X
📊 [checkInWorker] Capacity check: {...}
💾 [checkInWorker] Creating occupant record: {...}
📤 [checkInWorker] Saving to Firestore...
✅ [checkInWorker] Saved to Firestore
✅ [checkInWorker] Updated local state
✅ [checkInWorker] History record created: ID
🎉 [checkInWorker] Check-in completed successfully
```

عند حدوث خطأ:
```
❌ [checkInWorker] Worker not found: ID
Available workers: [...]
❌ [checkInWorker] Room not found: {...}
Available residences: [...]
```

## الرسائل للمستخدم

### رسائل النجاح:
- ✅ "تم التسكين بنجاح" + اسم العامل والغرفة
- ✅ "تم الإخراج بنجاح" + اسم العامل ومدة الإقامة

### رسائل الخطأ:
- ❌ "خطأ: العامل غير موجود - لم يتم العثور على العامل (ID: XXX). الرجاء التحقق من قاعدة البيانات والمحاولة مرة أخرى."
- ❌ "خطأ: الغرفة غير موجودة - لم يتم العثور على الغرفة (ID: XXX) في المبنى (ID: YYY). الرجاء التحقق من البيانات."
- ❌ "خطأ: العامل مسكّن بالفعل - العامل XXX مسكّن حالياً في غرفة أخرى. يجب إخراجه أولاً."
- ❌ "خطأ: العامل غير مسكّن - العامل XXX غير مسكّن حالياً في أي غرفة."

## الملفات المعدلة

1. `firestore.indexes.json` - إضافة فهارس جديدة
2. `src/context/accommodation-context.tsx` - تحسين checkInWorker و checkOutWorkerEnhanced

## التحسينات المستقبلية المقترحة

1. **إضافة Health Check**:
   - دالة للتحقق من اتصال Firestore
   - عرض مؤشر للمستخدم عن حالة الاتصال

2. **Cache Management**:
   - آلية أفضل لإدارة التزامن بين Firestore و localStorage
   - تحديث تلقائي عند استعادة الاتصال

3. **Retry Logic**:
   - إعادة محاولة العمليات الفاشلة تلقائياً
   - Exponential backoff للعمليات المتكررة

4. **Offline Support**:
   - تحسين الدعم للوضع غير المتصل
   - قائمة انتظار للعمليات المؤجلة

5. **Real-time Sync Indicator**:
   - مؤشر بصري لحالة المزامنة مع Firestore
   - تنبيهات عند وجود مشاكل في الاتصال

## الاستكشاف والإصلاح

### إذا استمرت المشكلة:

1. **تحقق من Console Logs**:
   ```javascript
   // ابحث عن هذه الرسائل في console
   [checkInWorker] Current state
   [checkInWorker] Reloaded workers from Firestore
   ```

2. **تحقق من Firestore**:
   - افتح Firebase Console
   - تأكد من وجود بيانات في مجموعة `workers`
   - تحقق من Firestore Rules

3. **تحقق من localStorage**:
   ```javascript
   // في console المتصفح
   console.log(JSON.parse(localStorage.getItem('ac_workers')))
   console.log(JSON.parse(localStorage.getItem('estatecare_residences')))
   ```

4. **امسح Cache**:
   ```javascript
   // في console المتصفح
   localStorage.removeItem('ac_workers')
   localStorage.removeItem('ac_occupants')
   // ثم أعد تحميل الصفحة
   ```

## الخلاصة

تم إصلاح المشكلة من خلال:
1. ✅ إضافة الفهارس المطلوبة لجميع المجموعات
2. ✅ تحسين آلية تحميل البيانات مع إعادة محاولة تلقائية
3. ✅ إضافة رسائل خطأ واضحة بالعربية
4. ✅ إضافة logging شامل لتتبع المشاكل

النظام الآن أكثر موثوقية وأسهل في التشخيص عند حدوث مشاكل.
