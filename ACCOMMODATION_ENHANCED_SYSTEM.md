# نظام إدارة التسكين والإخراج المحسّن - دليل شامل

## نظرة عامة

تم تطوير نظام احترافي ومبتكر لإدارة تسكين وإخراج العمال من وإلى السكنات مع نظام تاريخي كامل يحفظ كل حركة بتفاصيلها.

## ✨ المميزات الرئيسية

### 1. **نظام تاريخي كامل (Accommodation History)**
- تسجيل كل عملية تسكين/إخراج/نقل/تبديل في قاعدة بيانات منفصلة
- حفظ كامل التفاصيل: التواريخ، المواقع، الأسباب، الملاحظات، المستخدم الذي قام بالعملية
- لا يتم حذف أي سجل تاريخي أبداً (immutable)
- إمكانية تتبع المسار الكامل لأي عامل عبر الزمن

### 2. **عمليات محسّنة مع التواريخ**

#### ✅ تسكين (Check-In)
```typescript
await checkInWorker({
  workerId: 'w_123',
  residenceId: 'res_1',
  roomId: 'room_101',
  checkInDate: '2024-01-15', // اختياري
  notes: 'تسكين جديد',
  performedBy: 'user_123'
});
```

**المميزات:**
- تحديد تاريخ التسكين (افتراضياً: اليوم)
- التحقق من الجنسية والسعة
- إنشاء سجل تاريخي تلقائياً
- إشعارات عند اقتراب امتلاء الغرفة

#### ❌ إخراج (Check-Out)
```typescript
await checkOutWorkerEnhanced({
  workerId: 'w_123',
  checkOutDate: '2024-02-15', // اختياري
  reason: 'انتهاء العقد',
  notes: 'ملاحظات إضافية',
  performedBy: 'user_123'
});
```

**المميزات:**
- تحديد تاريخ الإخراج
- تسجيل السبب والملاحظات
- حساب تلقائي لمدة الإقامة بالأيام
- حفظ السجل التاريخي الكامل

#### 🔄 نقل (Transfer)
```typescript
await transferWorker({
  workerId: 'w_123',
  toResidenceId: 'res_2',
  toRoomId: 'room_202',
  transferDate: '2024-01-20', // اختياري
  reason: 'نقل لمشروع جديد',
  notes: 'نقل اختياري',
  performedBy: 'user_123'
});
```

**المميزات:**
- نقل من موقع إلى آخر بعملية واحدة
- حفظ معلومات "من" و "إلى" في السجل
- التحقق من السعة والجنسية في الموقع الجديد
- إخراج تلقائي من الموقع القديم وتسكين في الجديد

#### 🔁 تبديل (Swap)
```typescript
await swapWorkers({
  worker1Id: 'w_123',
  worker2Id: 'w_456',
  swapDate: '2024-01-25', // اختياري
  reason: 'تبديل بناءً على الطلب',
  notes: 'تبديل متفق عليه',
  performedBy: 'user_123'
});
```

**المميزات:**
- تبديل عاملين بين غرفتين
- إنشاء سجلين تاريخيين (لكل عامل)
- إغلاق السجلات القديمة وفتح سجلات جديدة
- عملية ذرية (atomic) - إما تنجح كلها أو تفشل كلها

### 3. **عمليات جماعية (Batch Operations)**

#### 📦 تسكين جماعي
```typescript
await bulkCheckIn({
  workerIds: ['w_1', 'w_2', 'w_3'],
  residenceId: 'res_1',
  roomId: 'room_101',
  checkInDate: '2024-01-15',
  notes: 'تسكين مجموعة جديدة',
  performedBy: 'user_123'
});
```

#### 📤 إخراج جماعي
```typescript
await bulkCheckOut({
  workerIds: ['w_1', 'w_2', 'w_3'],
  checkOutDate: '2024-02-15',
  reason: 'انتهاء المشروع',
  performedBy: 'user_123'
});
```

#### 🔄 نقل جماعي
```typescript
await bulkTransfer({
  workerIds: ['w_1', 'w_2', 'w_3'],
  toResidenceId: 'res_2',
  toRoomId: 'room_202',
  transferDate: '2024-01-20',
  reason: 'نقل جماعي',
  performedBy: 'user_123'
});
```

**مميزات العمليات الجماعية:**
- معالجة متعددة بعملية واحدة
- نتائج تفصيلية لكل عامل
- استمرار العملية عند فشل أحد العمال
- إشعار موحد بالنتائج

### 4. **استعلامات التاريخ**

#### تاريخ عامل محدد
```typescript
const history = getWorkerHistory('w_123');
// يعود بجميع حركات العامل مرتبة من الأحدث للأقدم
```

#### تاريخ غرفة محددة
```typescript
const history = getRoomHistory('res_1', 'room_101');
// يعود بجميع من سكن في هذه الغرفة
```

#### تاريخ فترة زمنية
```typescript
const history = getHistoryByDateRange('2024-01-01', '2024-01-31');
// جميع العمليات في شهر يناير
```

### 5. **واجهات مستخدم مبتكرة**

#### 📅 صفحة Timeline للعامل
**المسار:** `/accommodation/worker-timeline/[id]`

**المميزات:**
- عرض بصري جميل لكل حركات العامل
- إحصائيات شاملة (عدد التسكينات، النقلات، المدد)
- Timeline بخط زمني واضح
- تفاصيل كل عملية مع الأيقونات والألوان
- عرض الموقع الحالي إن كان نشطاً

#### 🎯 مربع حوار العمليات الجماعية
**المكون:** `BatchOperationsDialog`

**المميزات:**
- واجهة موحدة لجميع العمليات الجماعية
- اختيار متعدد للعمال
- تحديد التواريخ والأسباب والملاحظات
- نتائج تفصيلية بعد التنفيذ
- رموز خطأ واضحة بالعربية

#### 📊 صفحة التقارير الزمنية
**المسار:** `/accommodation/timeline-reports`

**المميزات:**
- تصفية حسب الفترة، نوع العملية، المسكن
- إحصائيات شاملة:
  - إجمالي العمليات
  - متوسط مدة الإقامة
  - النشاط حسب أيام الأسبوع
  - العمال الأكثر حركة
  - النشاط حسب المسكن
- جدول تفصيلي للعمليات
- رسوم بيانية تفاعلية
- إمكانية التصدير (قادمة)

## 📝 نموذج البيانات

### Occupant (محدّث)
```typescript
{
  workerId: string;
  residenceId: string;
  roomId: string;
  since: string; // تاريخ البداية
  until?: string; // تاريخ النهاية (null = نشط)
  checkInBy?: string; // من قام بالتسكين
  checkOutBy?: string; // من قام بالإخراج
  notes?: string; // ملاحظات
}
```

### AccommodationHistory (جديد)
```typescript
{
  id: string;
  workerId: string;
  workerName?: string; // محفوظ للسرعة
  workerNationality?: string;
  
  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER' | 'SWAP';
  actionDate: string; // تاريخ العملية
  actionBy: string; // من قام بالعملية
  actionByName?: string;
  
  // موقع العملية
  residenceId: string;
  residenceName?: string;
  roomId: string;
  roomName?: string;
  
  // للنقل
  fromResidenceId?: string;
  fromRoomId?: string;
  toResidenceId?: string;
  toRoomId?: string;
  
  // للتبديل
  swappedWithWorkerId?: string;
  swappedWithWorkerName?: string;
  
  // إضافات
  reason?: string;
  notes?: string;
  duration?: number; // للإخراج: عدد الأيام
  relatedTransferRequestId?: string;
  
  createdAt: string;
}
```

## 🔧 التكامل مع Firestore

### المجموعات (Collections)

1. **`accommodationHistory`**
   - سجل كامل غير قابل للحذف
   - مفهرس حسب: workerId, actionDate, actionType, residenceId

2. **`occupants`** (محدّث)
   - السجلات النشطة والمنتهية
   - استعلام النشطين: `where('until', '==', null)`

### الاستماع التلقائي (Listeners)
```typescript
// في accommodation-context.tsx
useEffect(() => {
  if (!db || !auth?.currentUser) return;

  const historyCol = collection(db, 'accommodationHistory');
  const unsubscribe = onSnapshot(historyCol, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAccommodationHistory(list);
  });

  return () => unsubscribe();
}, []);
```

## 🎨 أمثلة الاستخدام

### في صفحة التسكين
```typescript
import { useAccommodation } from '@/context/accommodation-context';

function AssignPage() {
  const { checkInWorker } = useAccommodation();
  const { currentUser } = useAuth();

  const handleCheckIn = async () => {
    const result = await checkInWorker({
      workerId: selectedWorker.id,
      residenceId: selectedResidence.id,
      roomId: selectedRoom.id,
      checkInDate: checkInDate,
      notes: notes,
      performedBy: currentUser.uid,
    });

    if (result.ok) {
      // نجحت العملية
      console.log('History ID:', result.historyId);
    } else {
      // فشلت العملية
      console.error('Error:', result.error);
    }
  };
}
```

### استخدام الحوار الجماعي
```typescript
import { BatchOperationsDialog } from '@/components/accommodation/batch-operations-dialog';

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        تسكين جماعي
      </Button>

      <BatchOperationsDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        operationType="CHECK_IN"
        preSelectedWorkers={selectedWorkers}
        targetResidenceId={residenceId}
        targetRoomId={roomId}
      />
    </>
  );
}
```

## 📋 رموز الأخطاء

| الكود | المعنى |
|------|--------|
| `worker-not-found` | العامل غير موجود |
| `worker-already-assigned` | العامل مسكّن بالفعل |
| `worker-not-assigned` | العامل غير مسكّن |
| `room-not-found` | الغرفة غير موجودة |
| `room-full` | الغرفة ممتلئة |
| `nationality-mismatch` | تعارض في الجنسية |
| `room-metadata-missing` | بيانات الغرفة ناقصة |
| `target-room-full` | الغرفة المستهدفة ممتلئة |

## 🔐 الصلاحيات

جميع العمليات تتطلب مستخدم مسجل دخول (`currentUser`).
يتم تسجيل معرّف المستخدم في:
- `Occupant.checkInBy` / `checkOutBy`
- `AccommodationHistory.actionBy`

## 📊 التقارير المتاحة

1. **تقرير العامل الواحد** (Worker Timeline)
   - كل حركات العامل
   - إحصائيات شخصية
   - Timeline بصري

2. **التقارير الزمنية** (Timeline Reports)
   - حسب الفترة
   - حسب النشاط
   - حسب المسكن
   - إحصائيات متقدمة

3. **تقارير المدد** (Duration Reports)
   - متوسط مدة الإقامة
   - أطول/أقصر إقامة
   - توزيع المدد

## 🚀 الخطوات التالية (مستقبلية)

- [ ] تصدير التقارير إلى Excel/PDF
- [ ] إشعارات ذكية (تذكير قبل انتهاء العقد)
- [ ] تحليلات متقدمة (ML/AI)
- [ ] تنبؤ بالإشغال المستقبلي
- [ ] دمج مع نظام الموارد البشرية
- [ ] لوحة تحكم تفاعلية (Dashboard)

## 🎯 الفوائد الرئيسية

1. **الشفافية الكاملة** - كل حركة موثقة ومحفوظة
2. **المساءلة** - معرفة من قام بكل عملية ومتى
3. **التحليل** - بيانات دقيقة لاتخاذ قرارات أفضل
4. **الامتثال** - سجل كامل للمراجعة والتدقيق
5. **سهولة الاستخدام** - واجهات بديهية وواضحة

---

**تم التطوير بواسطة:** GitHub Copilot  
**التاريخ:** أكتوبر 2025  
**الإصدار:** 1.0
