# خطة تحسين صفحة المساكن في نظام الإشغال

## المشكلة
صفحة `/accommodation/residences` لا تحتوي على جميع المميزات الموجودة في `/residences`:
- ❌ وضع "Board" مفقود
- ❌ إحصائيات في الأعلى مفقودة  
- ❌ فلاتر متقدمة (المدن، المديرين) مفقودة
- ❌ أزرار Move, Edit, Delete مفقودة
- ❌ عرض المرافق (Facilities) مفقود

## الحل المقترح

### الخيار 1: إعادة استخدام ResidencesView مع تخصيصات (موصى به)

بدلاً من نسخ الكود بالكامل، نقوم بتمرير props إضافية لـ ResidencesView:

```tsx
// في src/app/accommodation/residences/page.tsx
import ResidencesView from '@/components/residences/ResidencesView';
import { useAccommodation } from '@/context/accommodation-context';

export default function AccommodationResidencesPage() {
  const { occupants } = useAccommodation();
  
  // دالة لحساب الساكنين لكل غرفة
  const getOccupantsPerRoom = (roomId: string) => {
    return occupants.filter(occ => occ.roomId === roomId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">المساكن</h1>
        <p className="text-muted-foreground">
          عرض وإدارة جميع المساكن والغرف مع معلومات الإشغال
        </p>
      </div>
      
      <ResidencesView 
        showFacilities={true} 
        showCapacity={true}
        showOccupancy={true}
        getOccupantsPerRoom={getOccupantsPerRoom}
      />
    </div>
  );
}
```

**المميزات:**
- ✅ كود أقل وصيانة أسهل
- ✅ تحديثات ResidencesView تنعكس تلقائياً
- ✅ لا حاجة لنسخ 2300 سطر من الكود

**العيوب:**
- ⚠️ يتطلب تعديل ResidencesView لقبول props جديدة

### الخيار 2: Wrapper Component (بديل)

إنشاء مكون wrapper صغير:

```tsx
// src/components/accommodation/AccommodationResidencesWrapper.tsx
import ResidencesView from '@/components/residences/ResidencesView';
import { useAccommodation } from '@/context/accommodation-context';

export default function AccommodationResidencesWrapper() {
  const { occupants } = useAccommodation();
  
  return (
    <ResidencesView 
      showFacilities={true} 
      showCapacity={true}
      enhanceRoomDisplay={(room) => {
        const count = occupants.filter(o => o.roomId === room.id).length;
        return {
          ...room,
          occupantsCount: count,
          isFull: room.capacity ? count >= room.capacity : false,
        };
      }}
    />
  );
}
```

### الخيار 3: نسخ وتخصيص كامل (غير موصى به)

نسخ ResidencesView بالكامل وتعديله - هذا يعني:
- 2318 سطر من الكود
- صيانة مزدوجة
- احتمال حدوث تضارب في التحديثات

## التعديلات المطلوبة على ResidencesView

لتطبيق الخيار 1، نحتاج لإضافة props اختيارية:

```tsx
interface ResidencesViewProps {
  showFacilities?: boolean;
  showCapacity?: boolean;
  showOccupancy?: boolean;  // جديد
  getOccupantsPerRoom?: (roomId: string) => number;  // جديد
  enhanceRoomDisplay?: (room: Room) => Room & { occupantsCount?: number; isFull?: boolean };  // جديد
}
```

ثم في RoomItem component، إضافة عرض الساكنين:

```tsx
{showOccupancy && getOccupantsPerRoom && (
  <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
    room.isFull ? 'bg-red-100 dark:bg-red-900/30' :
    room.occupantsCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30' :
    'bg-muted'
  }`}>
    <Users className="h-3 w-3" />
    <span className="font-medium">
      {getOccupantsPerRoom(room.id)} / {room.capacity || '-'}
    </span>
  </div>
)}
```

## الخطوات التالية

1. ✅ اتخاذ قرار بشأن الخيار المفضل
2. ⏳ تعديل ResidencesView لقبول props الإشغال (إذا اخترنا الخيار 1 أو 2)
3. ⏳ تحديث صفحة accommodation/residences
4. ⏳ اختبار جميع الوظائف
5. ⏳ التأكد من أن عرض الساكنين يعمل بشكل صحيح

## التوصية

**أوصي بشدة بالخيار 1 أو 2** لأنهما:
- يحافظان على مبدأ DRY (Don't Repeat Yourself)
- يسهلان الصيانة المستقبلية
- يقللان من احتمالية الأخطاء
- يوفران الوقت والجهد

هل تريد المتابعة بأحد هذه الخيارات؟
