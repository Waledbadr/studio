# صفحة إدارة التسكين الموحدة
# Unified Accommodation Management Page

## 📋 نظرة عامة | Overview

صفحة مبتكرة وشاملة لإدارة تسكين العمالة بطريقة سهلة وفعالة، تجمع جميع العمليات في واجهة واحدة.

An innovative and comprehensive page for managing worker accommodation efficiently, combining all operations in one interface.

## 🎯 المميزات الرئيسية | Key Features

### 1. لوحة معلومات شاملة | Comprehensive Dashboard
- إحصائيات فورية (إجمالي العمال، الغرف المتاحة، السعة، نسبة الإشغال)
- Real-time statistics (total workers, available rooms, capacity, occupancy rate)

### 2. إدارة العمال | Worker Management
- **البحث المتقدم**: بالاسم، الرقم الوظيفي، الجنسية، الشركة
- **فلاتر ذكية**: حسب الجنسية، الحالة (مسكّن/غير مسكّن), المسكن
- **عرض مفصل**: معلومات كاملة عن كل عامل مع حالة التسكين

### 3. عمليات سريعة | Quick Operations
#### أ. التسكين (Check-In)
- اختيار المسكن والغرفة بسهولة
- عرض الغرف المتاحة فقط مع السعة
- التحقق من الجنسية والسعة تلقائياً

#### ب. الإخراج (Check-Out)
- إخراج سريع مع حفظ السبب والملاحظات
- حفظ السجل التاريخي تلقائياً

#### ج. النقل (Transfer)
- نقل العامل من غرفة لأخرى
- اختيار المسكن والغرفة الجديدة
- التحقق من التوافق والسعة

#### د. المبادلة (Swap)
- مبادلة غرف بين عاملين
- عرض قائمة العمال المسكّنين للمبادلة

### 4. التصميم المبتكر | Innovative Design
- **بطاقات عمال متطورة**: 
  - عرض الصورة الرمزية
  - حالة التسكين بألوان مميزة
  - معلومات المسكن الحالي
  - قائمة عمليات سريعة
  
- **اختيار الغرف الذكي**:
  - تسلسل هرمي (مسكن > مبنى > طابق > غرفة)
  - عرض السعة والإشغال لكل غرفة
  - إخفاء الغرف الممتلئة تلقائياً

- **واجهة تفاعلية**:
  - Tabs للتنقل السريع
  - Dialogs منزلقة للعمليات
  - ألوان مميزة لكل حالة

## 🏗️ البنية التقنية | Technical Structure

### الملفات الرئيسية | Main Files
```
src/app/accommodation/unified-management/
├── page.tsx                 # الصفحة الرئيسية
src/components/accommodation/
├── worker-card.tsx          # بطاقة العامل
├── residence-room-selector.tsx  # مختار الغرف
└── quick-action-button.tsx  # أزرار العمليات السريعة
```

### التقنيات المستخدمة | Technologies Used
- **Next.js 14** with App Router
- **React Context** for state management
- **Firestore** for real-time data
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling

## 🚀 الاستخدام | Usage

### الوصول للصفحة | Access
```
http://localhost:9002/accommodation/unified-management
```

### الصلاحيات | Permissions
- يتطلب تسجيل دخول
- الأدمن: وصول كامل لجميع المساكن
- المديرين: وصول للمساكن المخصصة لهم فقط

### خطوات التسكين | Check-In Steps
1. ابحث عن العامل أو استخدم الفلاتر
2. اضغط على زر "تسكين"
3. اختر المسكن والغرفة (يظهر فقط الغرف المتاحة)
4. أدخل التاريخ والملاحظات
5. اضغط "تأكيد التسكين"

### خطوات النقل | Transfer Steps
1. ابحث عن العامل المسكّن
2. اضغط على "نقل" من القائمة المنسدلة
3. اختر المسكن والغرفة الجديدة
4. أدخل سبب النقل والملاحظات
5. اضغط "تأكيد النقل"

### خطوات المبادلة | Swap Steps
1. ابحث عن العامل الأول
2. اضغط على "مبادلة"
3. اختر العامل الثاني من القائمة
4. أدخل السبب والملاحظات
5. اضغط "تأكيد المبادلة"

## 📊 الإحصائيات | Statistics

تعرض الصفحة 4 بطاقات إحصائية رئيسية:

1. **إجمالي العمال**: عدد العمال الكلي (مسكّن + غير مسكّن)
2. **الغرف المتاحة**: عدد الغرف الفارغة من إجمالي الغرف
3. **السعة الكلية**: مجموع السعة لجميع الغرف
4. **نسبة الإشغال**: النسبة المئوية للإشغال

## 🎨 التصميم | Design

### الألوان | Colors
- **أخضر**: عامل مسكّن (Assigned)
- **رمادي**: عامل غير مسكّن (Unassigned)
- **أزرق**: عمليات عادية (Transfer, View)
- **أحمر**: عملية الإخراج (Check-Out)

### الأيقونات | Icons
- `LogIn`: تسكين
- `LogOut`: إخراج
- `ArrowRightLeft`: نقل
- `RefreshCw`: مبادلة
- `Calendar`: السجل الزمني
- `Users`: إحصائيات العمال
- `DoorOpen`: الغرف
- `Building2`: المباني

## 🔐 الأمان | Security

- **المصادقة**: يتطلب Firebase Auth
- **الصلاحيات**: Role-based access control
- **التحقق**: Nationality & capacity checks
- **السجل**: حفظ تاريخ كامل لجميع العمليات

## 🚧 التطوير المستقبلي | Future Development

### قيد التطوير | In Development
1. **عرض المساكن**: خريطة تفاعلية للمساكن والغرف
2. **العمليات الجماعية**: تسكين/إخراج/نقل مجموعة عمال
3. **التقارير**: تقارير مفصلة عن الإشغال والحركة
4. **الإشعارات**: تنبيهات للغرف الممتلئة والتحويلات

### التحسينات المقترحة | Suggested Improvements
- Drag & Drop لتسكين العمال
- Export للبيانات (Excel, PDF)
- تكامل مع نظام الصيانة
- تطبيق موبايل

## 📝 ملاحظات تقنية | Technical Notes

### Context المستخدم | Used Context
```tsx
const {
  workers,           // جميع العمال
  occupants,         // السكن الحالي
  checkInWorker,     // التسكين
  checkOutWorkerEnhanced,  // الإخراج
  transferWorker,    // النقل
  swapWorkers,       // المبادلة
} = useAccommodation();
```

### State Management
- Local state للـ UI (filters, search, dialogs)
- Context state للبيانات (workers, occupants)
- Real-time sync مع Firestore

### Performance
- Memoization للحسابات الثقيلة
- Virtual scrolling للقوائم الطويلة
- Lazy loading للبيانات

## 🐛 المشاكل الشائعة | Common Issues

### لا تظهر البيانات
- تأكد من تسجيل الدخول
- تحقق من اتصال Firebase
- راجع صلاحيات Firestore

### لا تظهر الغرف المتاحة
- تأكد من إضافة غرف للمسكن
- تحقق من بيانات الغرف (capacity, spaceSqm)
- راجع حساب السعة

### خطأ في التسكين
- تأكد من اختيار الغرفة
- تحقق من عدم تسكين العامل مسبقاً
- راجع التوافق بين الجنسيات

## 📞 الدعم | Support

للمساعدة أو الإبلاغ عن مشاكل:
- راجع التوثيق الرئيسي: `/docs`
- سجل الأخطاء في GitHub Issues
- اتصل بفريق الدعم الفني

---

## 🎉 الخلاصة | Summary

صفحة إدارة التسكين الموحدة توفر:
✅ واجهة بسيطة وسهلة الاستخدام
✅ جميع العمليات في مكان واحد
✅ تصميم مبتكر وجذاب
✅ أداء عالي وسرعة استجابة
✅ أمان وحماية للبيانات

The Unified Accommodation Management page provides:
✅ Simple and easy-to-use interface
✅ All operations in one place
✅ Innovative and attractive design
✅ High performance and responsiveness
✅ Security and data protection
