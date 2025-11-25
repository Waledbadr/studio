# حل مشكلة عدم ظهور العمال في صفحة التسكين

## المشكلة
العمال لا يظهرون في صفحة التسكين `/accommodation/assign` عند البحث

## السبب
API endpoint للبحث (`/api/accommodation/search`) كان يحاول استخدام `localStorage` في بيئة الخادم (server-side)، مما يجعله يعيد مصفوفة فارغة دائماً.

## الحل المطبق

### 1. ✅ إصلاح API Search Endpoint
**الملف:** `src/app/api/accommodation/search/route.ts`

تم إعادة كتابة الكود ليستخدم Firestore بدلاً من localStorage:

```typescript
// بدلاً من localStorage:
const wRaw = localStorage.getItem('ac_workers');

// أصبح:
const workersSnapshot = await getDocs(collection(db, 'workers'));
const workers = workersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

#### الميزات:
- ✅ البحث في Firestore مباشرة
- ✅ إرجاع جميع العمال إذا لم يكن هناك استعلام بحث
- ✅ البحث حسب: الاسم، المعرف، الجنسية، الدور
- ✅ غير حساس لحالة الأحرف (case-insensitive)

### 2. ✅ إنشاء صفحة إضافة عمال سريعة
**الملف:** `src/app/accommodation/quick-add-workers/page.tsx`

صفحة جديدة لإضافة عمال تجريبيين بسرعة للاختبار.

**الرابط:** `http://localhost:9002/accommodation/quick-add-workers`

تحتوي على:
- عرض العمال الحاليين
- قائمة بـ 8 عمال تجريبيين جاهزين
- زر لإضافة جميع العمال دفعة واحدة
- جنسيات متنوعة (مصري، باكستاني، هندي، بنغلاديشي)

## كيفية الاستخدام

### الطريقة 1: إضافة عمال تجريبيين (الأسرع)

1. افتح: `http://localhost:9002/accommodation/quick-add-workers`
2. اضغط على "إضافة جميع العمال التجريبيين"
3. انتظر حتى يتم الإضافة (بضع ثوان)
4. ✅ تم! الآن لديك 8 عمال جاهزين

### الطريقة 2: إضافة عمال يدوياً

1. افتح: `http://localhost:9002/accommodation/workers`
2. اضغط "Add worker"
3. املأ البيانات:
   - **ID**: سيتم توليده تلقائياً
   - **Name**: اسم العامل
   - **Nationality**: الجنسية
   - **Role**: الدور (Worker, Supervisor, Engineer)
4. اضغط "Save"

### الطريقة 3: استخدام Console (للمطورين)

افتح Developer Console في المتصفح واكتب:

```javascript
// إضافة عامل واحد
await fetch('/api/accommodation/workers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'w_' + Date.now(),
    name: 'أحمد محمد',
    nationaliy: 'Egyptian',
    role: 'Worker'
  })
});
```

## التحقق من عمل النظام

### 1. تحقق من وجود عمال
```
http://localhost:9002/accommodation/workers
```
يجب أن ترى قائمة بالعمال

### 2. جرب البحث في صفحة التسكين
```
http://localhost:9002/accommodation/assign
```
- اكتب في مربع البحث
- يجب أن يظهر العمال فوراً

### 3. جرب التسكين
- اختر مسكن
- اختر عامل
- اسحب وأفلت العامل على الغرفة
- أو اختر عدة عمال واضغط "Bulk assign"

## استكشاف الأخطاء

### إذا لم يظهر العمال رغم إضافتهم:

1. **تحقق من Browser Console:**
   ```
   F12 → Console → ابحث عن أخطاء
   ```

2. **تحقق من Firestore:**
   - افتح Firebase Console
   - انتقل إلى Firestore Database
   - ابحث عن مجموعة `workers`
   - يجب أن ترى العمال المضافين

3. **تحقق من الصلاحيات:**
   - تأكد أنك مسجل دخول
   - تأكد من أن دورك Admin أو Supervisor

4. **أعد تحميل الصفحة:**
   ```
   Ctrl + Shift + R (تحديث وحذف الـ cache)
   ```

### إذا ظهرت أخطاء صلاحيات:
```
FirebaseError: Missing or insufficient permissions
```

تأكد من نشر قواعد Firestore:
```bash
firebase deploy --only firestore:rules
```

## الملفات المعدلة

1. ✅ `src/app/api/accommodation/search/route.ts` - إصلاح البحث
2. ✅ `src/app/accommodation/quick-add-workers/page.tsx` - صفحة جديدة لإضافة عمال سريعة

## الخطوات التالية

بعد إضافة العمال، يمكنك:
1. ✅ تسكين العمال في الغرف
2. ✅ عرض تقارير الإشغال
3. ✅ إنشاء طلبات نقل
4. ✅ إدارة العقود والفواتير

## ملاحظات مهمة

### البيانات التجريبية تشمل:
- 3 عمال مصريين (واحد مشرف)
- 2 عمال باكستانيين
- 2 عمال هنود
- 1 عامل بنغلاديشي

### قاعدة الجنسية:
تذكر أن النظام يمنع تسكين عمال من جنسيات مختلفة في نفس الغرفة، لذلك البيانات التجريبية تحتوي على جنسيات متنوعة لاختبار هذه القاعدة.

## للدعم

إذا استمرت المشكلة:
1. تحقق من logs في Terminal
2. افحص Browser Console للأخطاء
3. تحقق من Firebase Console
4. تأكد من أن dev server يعمل: `npm run dev`
