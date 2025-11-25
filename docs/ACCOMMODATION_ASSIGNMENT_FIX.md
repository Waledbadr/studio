# إصلاح نظام تسكين العمال - Accommodation Assignment System Fix

## المشكلة
كانت صفحة التسكين (`/accommodation/assign`) لا تعمل بشكل صحيح لأن:
1. API endpoint كان يحاول استخدام `localStorage` في بيئة الخادم (server-side)
2. لم تكن هناك قواعد Firestore للمجموعة `occupants`
3. لم يكن هناك مستمع (listener) في accommodation-context لمجموعة `occupants`

## الحلول المطبقة

### 1. إعادة كتابة API Route
**الملف:** `src/app/api/accommodation/assign/route.ts`

تم إعادة كتابة الـ endpoint بالكامل ليستخدم Firestore بدلاً من localStorage:

#### الميزات الجديدة:
- ✅ التحقق من وجود العامل في قاعدة البيانات
- ✅ التحقق من سعة الغرفة قبل التسكين
- ✅ تطبيق قاعدة الجنسية (جميع العمال في الغرفة يجب أن يكونوا من نفس الجنسية)
- ✅ منع تسكين نفس العامل في أكثر من غرفة
- ✅ دعم التسكين الفردي والجماعي (bulk assign)

#### التحققات التي يقوم بها النظام:
```typescript
1. التحقق من المعاملات المطلوبة (workerId/workerIds, residenceId, roomId)
2. التحقق من وجود العامل/العمال
3. التحقق من وجود المسكن والغرفة
4. التحقق من سعة الغرفة
5. التحقق من عدم تسكين العامل مسبقاً
6. التحقق من توافق الجنسية مع العمال الموجودين
```

### 2. إضافة قواعد Firestore
**الملف:** `firestore.rules`

تمت إضافة قواعد الأمان لمجموعة `occupants`:

```javascript
// Accommodation Occupants (worker assignments to rooms)
match /occupants/{occupantId} {
  allow read: if isSignedIn();
  // Admins and authorized roles can manage occupancy
  allow create, update: if isAdmin() || isSupervisor();
  allow delete: if isAdmin();
}
```

**الصلاحيات:**
- القراءة: جميع المستخدمين المسجلين
- الإنشاء/التعديل: Admin و Supervisor
- الحذف: Admin فقط

### 3. إضافة Firestore Listener
**الملف:** `src/context/accommodation-context.tsx`

تمت إضافة مستمع لمجموعة `occupants` لمزامنة البيانات في الوقت الفعلي:

```typescript
// Occupants listener
const occupantsCol = collection(db, 'occupants');
const occupantsUnsub = onSnapshot(occupantsCol, (snap) => {
  const list: Occupant[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  setOccupants(list);
  try { localStorage.setItem('ac_occupants', JSON.stringify(list)); } catch {}
}, (err) => { console.error('Occupants snapshot error:', err); });
```

## هيكل البيانات

### مستند Occupant في Firestore
```typescript
{
  workerId: string;        // معرف العامل
  residenceId: string;     // معرف المسكن
  roomId: string;          // معرف الغرفة
  since: string;           // تاريخ التسكين (ISO)
  createdAt: string;       // تاريخ الإنشاء
}
```

## كيفية الاستخدام

### 1. التسكين الفردي
```typescript
POST /api/accommodation/assign
{
  "workerId": "worker-123",
  "residenceId": "residence-456",
  "roomId": "room-789"
}
```

### 2. التسكين الجماعي
```typescript
POST /api/accommodation/assign
{
  "workerIds": ["worker-1", "worker-2", "worker-3"],
  "residenceId": "residence-456",
  "roomId": "room-789"
}
```

### 3. الاستجابة الناجحة
```json
{
  "ok": true,
  "assigned": ["worker-1", "worker-2"],
  "count": 2
}
```

### 4. رسائل الخطأ المحتملة
```typescript
"missing-params"              // معاملات ناقصة
"Residence not found"         // المسكن غير موجود
"Room not found"              // الغرفة غير موجودة
"Room capacity exceeded"      // تجاوز سعة الغرفة
"Worker not found"            // العامل غير موجود
"Worker already assigned"     // العامل مسكن مسبقاً
"Nationality mismatch"        // عدم توافق الجنسية
```

## اختبار النظام

### الخطوات:
1. افتح المتصفح وانتقل إلى: `http://localhost:9002/accommodation/assign`
2. اختر المسكن من القائمة المنسدلة
3. ستظهر الغرف المتاحة في العمود الأيسر
4. ابحث عن العمال في مربع البحث
5. اختر العمال (يمكن اختيار أكثر من عامل)
6. انقر على "Bulk assign" لتسكين المجموعة
7. أو اسحب وأفلت عامل واحد على الغرفة المطلوبة

### التحقق من النجاح:
- ستظهر رسالة نجاح
- سيتم تحديث عداد الساكنين في بطاقة الغرفة
- سيظهر العامل في قائمة الساكنين

## ملاحظات مهمة

### قاعدة الجنسية
النظام يمنع تسكين عمال من جنسيات مختلفة في نفس الغرفة. هذا مطبق في:
- API endpoint (server-side validation)
- `assignWorkerToRoom` في accommodation-context (client-side validation)

### سعة الغرفة
يتم حساب السعة بناءً على:
- الحقل `capacity` الموجود في الغرفة مباشرة
- أو حساب تلقائي من `spaceSqm` حسب نوع الغرفة:
  - Worker: 4m² لكل عامل
  - Supervisor: 8m² لكل مشرف
  - Engineer: 16m² لكل مهندس

## الملفات المعدلة

1. ✅ `src/app/api/accommodation/assign/route.ts` - إعادة كتابة كاملة
2. ✅ `firestore.rules` - إضافة قواعد occupants
3. ✅ `src/context/accommodation-context.tsx` - إضافة Firestore listener
4. ✅ نشر القواعد إلى Firebase

## التحقق من النشر

```bash
firebase deploy --only firestore:rules
```

**الحالة:** ✅ تم النشر بنجاح
**المشروع:** sample-firebase-ai-app-55f54

## استكشاف الأخطاء

### إذا ظهرت أخطاء الصلاحيات:
1. تحقق من أن المستخدم مسجل دخول
2. تحقق من أن دور المستخدم Admin أو Supervisor
3. تحقق من نشر قواعد Firestore

### إذا لم تظهر الغرف:
1. تحقق من أن المسكن يحتوي على مباني وطوابق وغرف
2. تحقق من هيكل البيانات في Firestore

### إذا لم يظهر العمال في البحث:
1. تحقق من وجود عمال في مجموعة `workers`
2. تحقق من صلاحيات القراءة

## الخطوات التالية (اختياري)

يمكن تحسين النظام بإضافة:
- [ ] إشعارات عند تسكين/نقل العمال
- [ ] سجل تاريخي للتسكين (audit log)
- [ ] تقارير الإشغال
- [ ] إدارة طلبات النقل بين الغرف
- [ ] لوحة معلومات لمتابعة معدلات الإشغال

## الدعم

في حالة وجود مشاكل:
1. افحص console.log في المتصفح
2. افحص logs في terminal (npm run dev)
3. تحقق من Firestore Console لرؤية البيانات مباشرة
