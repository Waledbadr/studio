# إصلاح جدول العمال - Workers Table Fix

## المشكلة
كان هناك زحف في أعمدة جدول العمال والأسماء لا تظهر بشكل كامل.

## الحل المُطبّق

### 1. تحديث نموذج User
تم إضافة الحقول الجديدة الخاصة بالعمال:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Supervisor" | "Technician" | "Worker"; // ✅ إضافة Worker
  assignedResidences: string[];
  themeSettings?: UserThemeSettings;
  phone?: string;
  language?: 'en' | 'ar';
  // ✅ حقول جديدة خاصة بالعمال
  employeeId?: string;      // رقم الموظف
  idNumber?: string;         // رقم الإقامة/الهوية
  nationality?: string;      // الجنسية
  company?: string;          // الشركة
}
```

### 2. تقسيم الواجهة إلى تبويبات (Tabs)
- **تبويب الموظفين**: يعرض Admin, Supervisor, Technician
- **تبويب العمال**: يعرض Workers فقط مع الحقول الإضافية

### 3. إصلاح عرض الجدول

#### جدول العمال المُحسّن:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-right min-w-[200px]">الاسم</TableHead>
      <TableHead className="text-right min-w-[100px]">رقم الوظيفة</TableHead>
      <TableHead className="text-right min-w-[120px]">رقم الهوية</TableHead>
      <TableHead className="text-right min-w-[100px]">الجنسية</TableHead>
      <TableHead className="text-right min-w-[120px]">الشركة</TableHead>
      <TableHead className="text-right min-w-[80px]">الدور</TableHead>
      <TableHead className="text-right min-w-[100px]">الإجراءات</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {workers.map((worker) => (
      <TableRow key={worker.id}>
        <TableCell className="font-medium text-right">
          <div className="max-w-[200px] truncate" title={worker.name}>
            {worker.name}
          </div>
        </TableCell>
        <TableCell className="text-right">{worker.employeeId || '-'}</TableCell>
        <TableCell className="text-right font-mono text-sm">{worker.idNumber || '-'}</TableCell>
        <TableCell className="text-right">{worker.nationality || '-'}</TableCell>
        <TableCell className="text-right">{worker.company || '-'}</TableCell>
        <TableCell className="text-right">
          <Badge variant="outline">Worker</Badge>
        </TableCell>
        <TableCell className="text-right">
          {/* إجراءات التعديل والحذف */}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 4. التحسينات المُطبّقة

#### أ) منع الزحف في الأعمدة
- ✅ إضافة `min-w-[...]` لكل عمود لضمان عرض ثابت
- ✅ إضافة `overflow-x-auto` للسماح بالتمرير الأفقي عند الحاجة
- ✅ استخدام `max-w-[200px] truncate` للأسماء الطويلة مع `title` لعرض الاسم كاملاً عند الوقوف عليه

#### ب) عرض كامل للأسماء
```tsx
<div className="max-w-[200px] truncate" title={worker.name}>
  {worker.name}
</div>
```
- العرض الأقصى 200 بكسل
- قص النص مع نقاط (...) إذا كان أطول
- عرض الاسم كاملاً عند hover

#### ج) تنسيق رقم الإقامة
```tsx
<TableCell className="text-right font-mono text-sm">
  {worker.idNumber || '-'}
</TableCell>
```
- خط monospace لسهولة قراءة الأرقام
- حجم أصغر قليلاً (text-sm)

#### د) القيم الافتراضية
جميع الحقول الاختيارية تعرض `-` إذا كانت فارغة:
```tsx
{worker.employeeId || '-'}
{worker.idNumber || '-'}
{worker.nationality || '-'}
{worker.company || '-'}
```

### 5. الفلترة التلقائية
```typescript
const staffUsers = useMemo(() => users.filter(u => u.role !== 'Worker'), [users]);
const workers = useMemo(() => users.filter(u => u.role === 'Worker'), [users]);
```
- يتم الفصل تلقائياً بين الموظفين والعمال
- تحديث تلقائي عند تغيير البيانات

## الملفات المُعدّلة

1. **src/context/users-context.tsx**
   - إضافة حقول Worker إلى interface User
   - إضافة "Worker" إلى role types

2. **src/app/users/page.tsx**
   - تقسيم الصفحة إلى تبويبين
   - إضافة جدول العمال مع الحقول الجديدة
   - إصلاح عرض الأعمدة والتنسيق
   - ترجمة الواجهة للعربية

## مثال البيانات المدعومة

```json
{
  "name": "Akram Naimu Deen",
  "employeeId": "37433",
  "idNumber": "2326188378",
  "nationality": "Indian",
  "company": "SACODECO",
  "role": "Worker"
}
```

## الميزات الجديدة

✅ **فصل واضح** بين الموظفين والعمال
✅ **عرض صحيح** لجميع الحقول بدون زحف
✅ **أسماء كاملة** مع إمكانية الوقوف عليها لقراءة الاسم كاملاً
✅ **تنسيق احترافي** للأرقام والبيانات
✅ **تمرير أفقي** عند الحاجة (responsive)
✅ **عداد** لعدد العمال في كل تبويب
✅ **ترجمة عربية** كاملة للواجهة

## كيفية الاستخدام

1. افتح صفحة المستخدمين: `http://localhost:9002/users`
2. اختر تبويب "العمال"
3. سترى جدول منسق بشكل صحيح مع جميع الحقول
4. يمكنك استيراد العمال من: `http://localhost:9002/admin/import-workers`

## التوافق

- ✅ يعمل مع البيانات الموجودة (backward compatible)
- ✅ الحقول الجديدة اختيارية (optional)
- ✅ يعرض `-` للحقول الفارغة
- ✅ متوافق مع نظام الاستيراد الموجود

## الخطوات التالية (اختياري)

إذا أردت تحسينات إضافية:

1. **إضافة فلتر بحث** للعمال (بالاسم، رقم الموظف، الشركة)
2. **تصدير البيانات** إلى Excel/CSV
3. **عرض إحصائيات** (عدد العمال لكل شركة، لكل جنسية)
4. **ربط مع نظام الإقامة** (accommodation) لعرض الغرف المخصصة
5. **تحديث نموذج التعديل** (UserFormDialog) لدعم الحقول الجديدة

---

**تم التنفيذ بنجاح ✅**
