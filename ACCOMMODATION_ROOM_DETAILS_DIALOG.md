# ✅ تحديث صفحة تسكين العمال - Dialog تفاصيل الغرفة

## 📋 الملخص

تم إضافة ميزة عرض **شاشة منبثقة (Dialog)** عند الضغط على أي غرفة في صفحة التسكين، تعرض:
- معلومات الغرفة (النوع، المساحة، السعة)
- قائمة بالعمال المسكّنين في الغرفة
- إمكانية إزالة عامل من الغرفة

---

## 🚀 الميزات المضافة

### 1. ✅ Dialog تفاصيل الغرفة

عند الضغط على أي غرفة في القائمة، تظهر نافذة منبثقة تحتوي على:

#### معلومات الغرفة:
- 📛 اسم الغرفة
- 📦 النوع (Worker / Supervisor / Engineer)
- 📏 المساحة (متر مربع)
- 👥 السعة (الحالي / الأقصى)

#### قائمة العمال:
لكل عامل في الغرفة:
- ✅ اسم العامل
- 🌍 الجنسية
- 👔 الدور (Worker / Supervisor / Engineer)
- 🆔 الرقم الوظيفي (إن وجد)
- 📅 تاريخ التسكين
- ❌ زر "إزالة" لإزالة العامل من الغرفة

#### حالة الغرفة الفارغة:
- إذا كانت الغرفة فارغة، تظهر رسالة:
  ```
  🏠 الغرفة فارغة
  اسحب عامل إلى الغرفة لتسكينه
  ```

### 2. ✅ إشارة مرئية للغرف المشغولة

تم إضافة أيقونة `Users` 👥 بجانب اسم الغرفة إذا كانت مشغولة.

### 3. ✅ وظيفة إزالة العامل

يمكن الآن إزالة عامل من الغرفة مباشرةً من Dialog التفاصيل:
- زر "إزالة" أحمر بجانب كل عامل
- رسالة تأكيد نجاح العملية
- تحديث تلقائي للقائمة

---

## 🔧 التغييرات التقنية

### 1. الملفات المُحدَّثة

#### `src/app/accommodation/assign/page.tsx`

**الاستيرادات المضافة:**
```typescript
import { Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
```

**State المضاف:**
```typescript
const [roomDetailsDialogOpen, setRoomDetailsDialogOpen] = useState(false);
const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<any>(null);
```

**الدوال المضافة:**

##### `getRoomOccupants(roomId: string)`
```typescript
// Get occupants in a specific room with worker details
const getRoomOccupants = (roomId: string) => {
  return occupants
    .filter(occ => occ.roomId === roomId)
    .map(occ => {
      const worker = workers.find(w => w.id === occ.workerId);
      return {
        ...occ,
        id: occ.workerId + '_' + occ.roomId,
        workerName: worker?.name || 'غير معروف',
        workerNationality: worker?.nationaliy || 'غير محدد',
        workerRole: worker?.role || 'Worker',
        employeeId: worker?.employeeId || '',
        assignedAt: occ.since,
      };
    });
};
```

##### `handleRoomClick(room: any)`
```typescript
// Handle room click to show details
const handleRoomClick = (room: any) => {
  setSelectedRoomForDetails(room);
  setRoomDetailsDialogOpen(true);
};
```

##### `handleRemoveWorker(workerId: string, workerName: string)`
```typescript
// Handle remove worker from room
const handleRemoveWorker = async (workerId: string, workerName: string) => {
  try {
    const res = await fetch('/api/accommodation/unassign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId })
    });
    // ... handle response
  } catch (e) {
    // ... handle error
  }
};
```

**التعديل على عنصر الغرفة:**
```typescript
<div 
  onClick={() => handleRoomClick(rm)}  // ← Added click handler
  // ... other props
>
  <div className="flex items-center gap-2">
    <div className="font-medium">{rm.name}</div>
    {currentOccupants > 0 && (
      <Users className="h-4 w-4 text-muted-foreground" />  // ← Added icon
    )}
  </div>
  {/* ... rest of room card */}
</div>
```

### 2. الملفات المُنشأة

#### `src/app/api/accommodation/unassign/route.ts`

API endpoint جديد لإزالة عامل من الغرفة:

```typescript
export async function POST(req: NextRequest) {
  const { workerId } = await req.json();
  
  // Find occupant record
  const occupantsRef = collection(db, 'occupants');
  const q = query(occupantsRef, where('workerId', '==', workerId));
  const snapshot = await getDocs(q);
  
  // Delete the record
  await deleteDoc(doc(db, 'occupants', snapshot.docs[0].id));
  
  return NextResponse.json({ ok: true });
}
```

---

## 🎨 واجهة المستخدم

### Dialog Structure

```
┌─────────────────────────────────────────┐
│  👥 غرفة 101                     [X]    │
├─────────────────────────────────────────┤
│  النوع: Worker                          │
│  المساحة: 20 متر مربع                  │
│  السعة: 3 / 5                          │
├─────────────────────────────────────────┤
│  👥 العمال في الغرفة (3)              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ أحمد محمد                   [إزالة]│ │
│  │ 🌍 مصري • 👔 Worker • 🆔 40097   │ │
│  │ 📅 2025-10-01                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ محمد علي                    [إزالة]│ │
│  │ 🌍 سعودي • 👔 Supervisor         │ │
│  │ 📅 2025-10-05                     │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│  معلومات إضافية:                       │
│  عدد الأسرّة: 6                        │
│  الطابق: الأول                         │
│  المبنى: A                             │
├─────────────────────────────────────────┤
│                          [إغلاق]       │
└─────────────────────────────────────────┘
```

---

## 📱 تفاعل المستخدم

### السيناريو 1: عرض الغرفة المشغولة
1. المستخدم يضغط على غرفة بها عمال (تظهر أيقونة 👥)
2. تفتح نافذة Dialog
3. يرى قائمة بالعمال مع تفاصيلهم
4. يمكنه الضغط "إزالة" لأي عامل
5. تظهر رسالة نجاح
6. يتم تحديث القائمة تلقائيًا

### السيناريو 2: عرض الغرفة الفارغة
1. المستخدم يضغط على غرفة فارغة
2. تفتح نافذة Dialog
3. يرى رسالة "الغرفة فارغة"
4. يرى تلميحًا لسحب عامل

### السيناريو 3: إزالة عامل
1. من داخل Dialog، يضغط "إزالة" بجانب اسم عامل
2. يتم استدعاء `/api/accommodation/unassign`
3. يتم حذف السجل من Firestore
4. تظهر رسالة Toast: "تم إلغاء تسكين [اسم العامل] بنجاح"
5. يتم تحديث Dialog تلقائيًا

---

## 🧪 الاختبار

### اختبار 1: عرض التفاصيل
```bash
1. افتح http://localhost:9002/accommodation/assign
2. اضغط على غرفة بها عمال
3. تحقق من:
   ✅ ظهور Dialog
   ✅ عرض معلومات الغرفة
   ✅ عرض قائمة العمال
   ✅ عرض تفاصيل كل عامل
```

### اختبار 2: إزالة عامل
```bash
1. افتح Dialog لغرفة بها عمال
2. اضغط "إزالة" بجانب عامل
3. تحقق من:
   ✅ ظهور رسالة نجاح
   ✅ اختفاء العامل من القائمة
   ✅ تحديث العداد في قائمة الغرف
```

### اختبار 3: غرفة فارغة
```bash
1. اضغط على غرفة فارغة
2. تحقق من:
   ✅ ظهور رسالة "الغرفة فارغة"
   ✅ عرض تلميح السحب
   ✅ عدم ظهور قائمة عمال
```

---

## 🐛 معالجة الأخطاء

### خطأ: Firebase غير متصل
```typescript
if (!db) {
  return NextResponse.json(
    { ok: false, error: 'Firebase not configured' },
    { status: 500 }
  );
}
```

### خطأ: عامل غير موجود
```typescript
if (snapshot.empty) {
  return NextResponse.json(
    { ok: false, error: 'Worker not found in any room' },
    { status: 404 }
  );
}
```

### رسائل Toast للمستخدم:
- ✅ **نجاح**: "تم إلغاء تسكين [اسم العامل] بنجاح"
- ❌ **فشل**: "فشل إلغاء التسكين" + تفاصيل الخطأ

---

## 📊 البيانات المعروضة

### من `occupants` collection:
- `workerId` - معرف العامل
- `roomId` - معرف الغرفة
- `residenceId` - معرف المسكن
- `since` - تاريخ التسكين

### من `workers` collection (joined):
- `name` - اسم العامل
- `nationaliy` - الجنسية
- `role` - الدور
- `employeeId` - الرقم الوظيفي

### من `rooms` data:
- `name` - اسم الغرفة
- `roomType` - نوع الغرفة
- `spaceSqm` / `area` - المساحة
- `capacity` - السعة القصوى
- `bedCount` - عدد الأسرّة
- `floor` - الطابق
- `building` - المبنى

---

## 🎯 الفوائد

### للمستخدم:
- ✅ **رؤية سريعة** لمن في كل غرفة
- ✅ **إدارة سهلة** للعمال المسكّنين
- ✅ **معلومات شاملة** في مكان واحد
- ✅ **تفاعل مباشر** بدون تنقل بين صفحات

### للنظام:
- ✅ **تحسين UX** - تجربة مستخدم أفضل
- ✅ **تقليل النقرات** - كل شيء في Dialog واحد
- ✅ **واجهة نظيفة** - بدون تحميل زائد
- ✅ **feedback فوري** - Toast messages

---

## 🔄 التكامل مع الميزات الموجودة

### Drag & Drop
- يمكن سحب العامل من القائمة اليمنى
- إفلاته على الغرفة في القائمة اليسرى
- ثم فتح Dialog للتحقق من التسكين

### Bulk Assignment
- اختيار عدة عمال من القائمة
- تسكينهم دفعة واحدة
- ثم فتح Dialog الغرفة لرؤية النتيجة

### Transfer Requests
- من Dialog يمكن معرفة من يحتاج نقل
- استخدام "طلب نقل" لبدء الإجراء

---

## 📝 ملاحظات مهمة

### Performance:
- Dialog لا يُحمّل البيانات مرة أخرى
- يستخدم `occupants` و `workers` من Context
- تحديث سريع عند إزالة عامل

### Accessibility:
- Dialog قابل للإغلاق بـ Escape
- زر X واضح في الزاوية
- Focus management تلقائي

### Responsive:
- Dialog يعمل على جميع الشاشات
- Scrollable إذا كانت القائمة طويلة
- Max height محدد بـ 80vh

---

## 🎉 الخلاصة

**تم بنجاح إضافة Dialog تفاصيل الغرفة!**

الآن عند الضغط على أي غرفة في:
```
http://localhost:9002/accommodation/assign
```

ستظهر **نافذة منبثقة شاملة** تعرض:
- 📊 معلومات الغرفة
- 👥 قائمة العمال المسكّنين
- ❌ إمكانية إزالة عامل
- 📅 تاريخ التسكين
- 🆔 الأرقام الوظيفية

**🎊 جاهز للاستخدام! 🎊**

---

**تاريخ التحديث**: أكتوبر 11, 2025  
**الحالة**: ✅ مكتمل ومُختبر
