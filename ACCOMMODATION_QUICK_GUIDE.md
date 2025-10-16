# دليل الاستخدام السريع - نظام التسكين المحسّن

## 🚀 البدء السريع

### 1. تسكين عامل واحد مع تاريخ

```typescript
import { useAccommodation } from '@/context/accommodation-context';
import { auth } from '@/lib/firebase';

function MyComponent() {
  const { checkInWorker } = useAccommodation();

  const handleCheckIn = async () => {
    const result = await checkInWorker({
      workerId: 'w_123',
      residenceId: 'res_1',
      roomId: 'room_101',
      checkInDate: '2024-01-15T00:00:00.000Z', // اختياري
      notes: 'تسكين جديد',
      performedBy: auth?.currentUser?.uid || 'system'
    });

    if (result.ok) {
      console.log('تم التسكين!', result.historyId);
    } else {
      console.error('فشل:', result.error);
    }
  };
}
```

### 2. إخراج عامل

```typescript
const { checkOutWorkerEnhanced } = useAccommodation();

const handleCheckOut = async (workerId: string) => {
  const result = await checkOutWorkerEnhanced({
    workerId,
    checkOutDate: '2024-02-15T00:00:00.000Z',
    reason: 'انتهاء العقد',
    notes: 'تم بنجاح',
    performedBy: auth?.currentUser?.uid || 'system'
  });

  if (result.ok) {
    console.log('تم الإخراج!', result.historyId);
  }
};
```

### 3. نقل عامل

```typescript
const { transferWorker } = useAccommodation();

const handleTransfer = async () => {
  const result = await transferWorker({
    workerId: 'w_123',
    toResidenceId: 'res_2',
    toRoomId: 'room_202',
    transferDate: new Date().toISOString(),
    reason: 'نقل لموقع جديد',
    performedBy: auth?.currentUser?.uid || 'system'
  });
};
```

### 4. استخدام الحوار الجماعي

```tsx
import { BatchOperationsDialog } from '@/components/accommodation/batch-operations-dialog';

function MyPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  return (
    <div>
      <Button onClick={() => setDialogOpen(true)}>
        تسكين جماعي
      </Button>

      <BatchOperationsDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        operationType="CHECK_IN" // أو CHECK_OUT أو TRANSFER
        preSelectedWorkers={selectedWorkers}
        targetResidenceId="res_1"
        targetRoomId="room_101"
      />
    </div>
  );
}
```

### 5. عرض تاريخ العامل

```tsx
import Link from 'next/link';

function WorkerCard({ workerId }: { workerId: string }) {
  return (
    <Link href={`/accommodation/worker-timeline/${workerId}`}>
      <Button>عرض التاريخ</Button>
    </Link>
  );
}
```

### 6. الاستعلام عن التاريخ

```typescript
const { 
  getWorkerHistory, 
  getRoomHistory, 
  getHistoryByDateRange 
} = useAccommodation();

// تاريخ عامل
const workerHistory = getWorkerHistory('w_123');

// تاريخ غرفة
const roomHistory = getRoomHistory('res_1', 'room_101');

// تاريخ فترة
const monthHistory = getHistoryByDateRange(
  '2024-01-01T00:00:00.000Z',
  '2024-01-31T23:59:59.999Z'
);
```

## 📝 معالجة الأخطاء

```typescript
const result = await checkInWorker({ ... });

if (!result.ok) {
  switch (result.error) {
    case 'worker-not-found':
      alert('العامل غير موجود');
      break;
    case 'worker-already-assigned':
      alert('العامل مسكّن بالفعل');
      break;
    case 'room-full':
      alert('الغرفة ممتلئة');
      break;
    case 'nationality-mismatch':
      alert('تعارض في الجنسية');
      break;
    default:
      alert('حدث خطأ: ' + result.error);
  }
}
```

## 🎨 إضافة رابط في القائمة

في ملف التنقل الجانبي:

```tsx
const accommodationLinks = [
  { href: '/accommodation/assign', label: 'التسكين' },
  { href: '/accommodation/timeline-reports', label: 'التقارير الزمنية' },
  { href: '/accommodation/workers', label: 'العمال' },
  // ... باقي الروابط
];
```

## 🔗 الروابط المهمة

- صفحة التسكين: `/accommodation/assign`
- تاريخ العامل: `/accommodation/worker-timeline/[id]`
- التقارير الزمنية: `/accommodation/timeline-reports`
- نظرة عامة: `/accommodation/overview`

## ⚙️ التهيئة

لا تحتاج لتهيئة خاصة! النظام يعمل تلقائياً مع:
- `AccommodationProvider` موجود في layout
- Firestore متصل
- المجموعة `accommodationHistory` تُنشأ تلقائياً

## 📚 مثال كامل

```tsx
'use client';

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { BatchOperationsDialog } from '@/components/accommodation/batch-operations-dialog';

export default function EnhancedAssignPage() {
  const { 
    workers, 
    residences, 
    occupants,
    checkInWorker,
    checkOutWorkerEnhanced,
    getWorkerHistory 
  } = useAccommodation();

  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER'>('CHECK_IN');

  const handleSingleCheckIn = async (workerId: string, residenceId: string, roomId: string) => {
    const result = await checkInWorker({
      workerId,
      residenceId,
      roomId,
      checkInDate: new Date().toISOString(),
      notes: 'تسكين عبر الواجهة',
      performedBy: auth?.currentUser?.uid || 'system'
    });

    if (result.ok) {
      alert('تم التسكين بنجاح!');
    } else {
      alert('فشل التسكين: ' + result.error);
    }
  };

  const openBatchDialog = (type: 'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER') => {
    setOperationType(type);
    setBatchDialogOpen(true);
  };

  return (
    <div className="p-6">
      <h1>التسكين المحسّن</h1>

      {/* أزرار العمليات الجماعية */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => openBatchDialog('CHECK_IN')}>
          تسكين جماعي
        </Button>
        <Button onClick={() => openBatchDialog('CHECK_OUT')} variant="destructive">
          إخراج جماعي
        </Button>
        <Button onClick={() => openBatchDialog('TRANSFER')} variant="secondary">
          نقل جماعي
        </Button>
      </div>

      {/* قائمة العمال */}
      <div className="space-y-2">
        {workers.map(worker => {
          const isAssigned = occupants.some(o => o.workerId === worker.id && !o.until);
          const history = getWorkerHistory(worker.id);

          return (
            <div key={worker.id} className="border p-4 rounded">
              <h3>{worker.name}</h3>
              <p>الحالة: {isAssigned ? 'مسكّن' : 'غير مسكّن'}</p>
              <p>عدد الحركات: {history.length}</p>
              
              <div className="flex gap-2 mt-2">
                {!isAssigned && (
                  <Button size="sm" onClick={() => handleSingleCheckIn(worker.id, 'res_1', 'room_101')}>
                    تسكين
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.href = `/accommodation/worker-timeline/${worker.id}`}
                >
                  عرض التاريخ
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* الحوار الجماعي */}
      <BatchOperationsDialog
        isOpen={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        operationType={operationType}
        preSelectedWorkers={selectedWorkers}
      />
    </div>
  );
}
```

---

للمزيد من التفاصيل، راجع: `ACCOMMODATION_ENHANCED_SYSTEM.md`
