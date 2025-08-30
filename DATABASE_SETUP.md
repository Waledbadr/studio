# EstateCare - نظام إدارة العقارات والمخزون

## نظرة عامة
نظام شامل لإدارة العقارات، المخزون، والصيانة مع واجهة مستخدم باللغتين العربية والإنجليزية.

## 🚀 البدء السريع

### 1. إعداد قاعدة البيانات
```bash
# تشغيل سكريبت إعداد قاعدة البيانات
node scripts/setup-dev.js

# أو يدوياً:
wrangler d1 create estatecare-db
wrangler d1 execute estatecare-db --file=schema.sql
wrangler d1 execute estatecare-db --file=scripts/sample-data.sql
wrangler d1 execute estatecare-db --file=scripts/additional-test-data.sql
```

### 2. تشغيل التطبيق
```bash
# التطوير العادي
npm run dev

# التطوير مع Cloudflare محلياً
npm run dev:local
```

### 3. اختبار قاعدة البيانات
```bash
# اختبار اتصال قاعدة البيانات
node scripts/test-database.js
```

## 🔐 حسابات الاختبار

### مدير النظام
- **البريد الإلكتروني**: admin@estatecare.com
- **كلمة المرور**: admin123
- **الدور**: مدير النظام

### مدير العقارات
- **البريد الإلكتروني**: manager@estatecare.com
- **كلمة المرور**: manager123
- **الدور**: مدير

### فني الصيانة
- **البريد الإلكتروني**: maintenance@estatecare.com
- **كلمة المرور**: tech123
- **الدور**: فني صيانة

### مستخدمين عاديين
- ahmed@example.com / user123
- fatima@example.com / user123
- mohamed@test.com / user123
- sara@test.com / user123
- ali@test.com / user123

## 📊 البيانات التجريبية

### المستخدمون (8 مستخدم)
- 1 مدير نظام
- 2 مدير عقارات
- 2 فني صيانة
- 3 مستخدمين عاديين

### العقارات (8 عقار)
- 4 شقق
- 2 فلل
- 2 مكاتب

### المخزون (15 عنصر)
- إلكترونيات (مكيفات، مفاتيح، أسلاك)
- سباكة (أنابيب PVC)
- صيانة (طلاء، فرش)
- تنظيف (منظفات، مكانس)
- أثاث (كراسي مكتبية)

### طلبات الصيانة (7 طلب)
- طلبات في مراحل مختلفة (معلق، قيد التنفيذ، مكتمل)

## 🗄️ بنية قاعدة البيانات

### الجداول الرئيسية
- `users` - المستخدمون
- `residences` - العقارات
- `inventory` - المخزون
- `orders` - الطلبات
- `maintenance_requests` - طلبات الصيانة
- `inventory_movements` - حركات المخزون
- `notifications` - الإشعارات

### الفهارس المحسنة
- فهارس على البريد الإلكتروني والدور
- فهارس على حالة العقارات والمخزون
- فهارس على التواريخ والأولويات

## 🔧 الوظائف المتاحة

### إدارة المستخدمين
- ✅ إضافة/تعديل/حذف المستخدمين
- ✅ إدارة الأدوار والصلاحيات
- ✅ تتبع آخر دخول

### إدارة العقارات
- ✅ إضافة/تعديل/حذف العقارات
- ✅ تتبع حالة العقارات (متاح/مشغول/صيانة)
- ✅ إدارة المستأجرين

### إدارة المخزون
- ✅ إضافة/تعديل/حذف المواد
- ✅ تتبع الكميات والحدود الدنيا
- ✅ إدارة الفئات والموردين
- ✅ تتبع حركات المخزون

### إدارة الصيانة
- ✅ إنشاء طلبات الصيانة
- ✅ تتبع حالة الطلبات
- ✅ تعيين الفنيين
- ✅ إدارة التكاليف

## 🌐 التقنيات المستخدمة

- **الواجهة الأمامية**: Next.js 14, React, TypeScript
- **التصميم**: Tailwind CSS, Radix UI
- **قاعدة البيانات**: Cloudflare D1 (SQLite)
- **التخزين**: Cloudflare R2
- **المصادقة**: JWT
- **النشر**: Cloudflare Pages

## 📁 هيكل المشروع

```
estatecare/
├── src/
│   ├── app/                 # صفحات التطبيق
│   ├── components/          # المكونات المشتركة
│   ├── context/            # Context API
│   ├── hooks/              # React Hooks
│   └── lib/                # المكتبات والأدوات
├── functions/              # Cloudflare Functions
├── scripts/                # سكريبتات الإعداد والاختبار
├── public/                 # الملفات الثابتة
└── docs/                   # التوثيق
```

## 🔄 العمليات الشائعة

### إعادة إنشاء قاعدة البيانات
```bash
# حذف قاعدة البيانات القديمة
wrangler d1 delete estatecare-db

# إنشاء قاعدة بيانات جديدة
wrangler d1 create estatecare-db

# إنشاء الجداول
wrangler d1 execute estatecare-db --file=schema.sql

# إضافة البيانات التجريبية
wrangler d1 execute estatecare-db --file=scripts/sample-data.sql
wrangler d1 execute estatecare-db --file=scripts/additional-test-data.sql
```

### نسخ قاعدة البيانات للإنتاج
```bash
# نسخ قاعدة البيانات المحلية للإنتاج
wrangler d1 execute estatecare-db --remote --file=schema.sql
wrangler d1 execute estatecare-db --remote --file=scripts/sample-data.sql
```

## 🐛 استكشاف الأخطاء

### مشاكل شائعة وحلولها

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من وجود ملف `wrangler.toml`
   - تحقق من صحة `database_id`

2. **عدم ظهور البيانات**
   - شغّل `node scripts/test-database.js`
   - تأكد من تنفيذ ملفات البيانات التجريبية

3. **مشاكل في الصلاحيات**
   - تأكد من تسجيل الدخول بحساب صحيح
   - تحقق من دور المستخدم

## 📞 الدعم

للحصول على المساعدة أو الإبلاغ عن مشاكل:
- البريد الإلكتروني: support@estatecare.com
- التوثيق: `/docs` مجلد

---

**تم إنشاء قاعدة البيانات الجديدة بنجاح! 🎉**