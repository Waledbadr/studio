# EstateCare - نظام إدارة العقارات المتقدم

![EstateCare Logo](public/logo.png)

## 🏗️ نظرة عامة

EstateCare هو نظام إدارة عقارات متقدم مبني باستخدام Next.js 15 و TypeScript، مصمم خصيصاً لإدارة المجمعات السكنية والعقارات التجارية. تم تطوير النظام ليعمل على منصة Cloudflare بالكامل لضمان الأداء العالي والموثوقية.

## ✨ المميزات الرئيسية

### 🏠 إدارة العقارات
- إدارة شاملة للمجمعات السكنية والأبراج التجارية
- تتبع الوحدات المتاحة والمؤجرة
- إدارة معلومات المستأجرين والعقود
- نظام تقارير مفصل للإشغال والإيرادات

### 📦 إدارة المخزون
- تتبع المواد والأدوات اللازمة للصيانة
- تنبيهات المخزون المنخفض
- إدارة الموردين والمشتريات
- تقارير التكلفة والاستهلاك

### 🔧 إدارة الصيانة
- نظام طلبات الصيانة المتكامل
- تعيين الفنيين وتتبع المهام
- جدولة الصيانة الدورية
- تقييم الخدمات وقياس الأداء

### 👥 إدارة المستخدمين
- نظام صلاحيات متدرج (مدير، مشرف، مستخدم، فني)
- مصادقة آمنة باستخدام JWT
- ملفات شخصية مخصصة
- سجل أنشطة المستخدمين

### 📊 التقارير والتحليلات
- تقارير مالية شاملة
- تحليل أداء الصيانة
- إحصائيات الإشغال
- تصدير البيانات بصيغ متعددة

## 🛠️ التقنيات المستخدمة

### Frontend
- **Next.js 15** - إطار العمل الأساسي
- **TypeScript** - للتطوير الآمن والمنظم
- **Tailwind CSS** - للتصميم الحديث والمتجاوب
- **Radix UI** - مكونات واجهة المستخدم
- **React Hook Form** - إدارة النماذج
- **Zustand** - إدارة الحالة

### Backend & Infrastructure
- **Cloudflare Pages** - الاستضافة والنشر
- **Cloudflare Workers** - API والمعالجة
- **Cloudflare D1** - قاعدة البيانات (SQLite)
- **Cloudflare R2** - تخزين الملفات
- **Cloudflare KV** - التخزين المؤقت

### Security & Authentication
- **JWT** - المصادقة والترخيص
- **bcrypt** - تشفير كلمات المرور
- **Middleware** - حماية المسارات

## 🚀 البدء السريع

### متطلبات النظام
- Node.js 18+ 
- npm أو yarn
- Wrangler CLI
- حساب Cloudflare

### التثبيت والإعداد

#### 1. استنساخ المشروع
```bash
git clone https://github.com/your-org/estatecare-cloudflare.git
cd estatecare-cloudflare
```

#### 2. تثبيت التبعيات
```bash
npm install
```

#### 3. إعداد بيئة التطوير
```bash
# Linux/macOS
npm run setup:dev

# Windows
npm run setup:dev
# أو تشغيل scripts/setup-dev.bat مباشرة
```

#### 4. تشغيل التطبيق محلياً
```bash
# التطوير العادي
npm run dev

# التطوير مع Cloudflare المحلي
npm run dev:local
```

### النشر على الإنتاج

#### 1. إعداد Cloudflare
```bash
# تسجيل الدخول إلى Cloudflare
wrangler login

# إعداد الموارد
npm run cloudflare:setup
```

#### 2. النشر التلقائي
```bash
# Linux/macOS
npm run deploy:full

# Windows
scripts/deploy.bat
```

#### 3. النشر اليدوي
```bash
# بناء التطبيق
npm run build:cloudflare

# نشر على Cloudflare Pages
npm run wrangler:deploy
```

## 📁 هيكل المشروع

```
estatecare-cloudflare/
├── src/
│   ├── app/                    # صفحات Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── accommodation/     # إدارة السكن
│   │   ├── inventory/         # إدارة المخزون
│   │   ├── maintenance/       # إدارة الصيانة
│   │   ├── residences/        # إدارة العقارات
│   │   └── users/             # إدارة المستخدمين
│   ├── components/            # مكونات React
│   ├── hooks/                 # Custom Hooks
│   ├── lib/                   # مكتبات ووظائف مساعدة
│   │   ├── auth.ts           # نظام المصادقة
│   │   ├── cloudflare-db.ts  # طبقة قاعدة البيانات
│   │   └── storage.ts        # إدارة التخزين
│   └── types/                 # تعريفات TypeScript
├── scripts/                   # سكريبتات الأتمتة
├── docs/                      # التوثيق
├── public/                    # الملفات العامة
├── wrangler.toml             # تكوين Cloudflare
├── schema.sql                # هيكل قاعدة البيانات
└── package.json              # تبعيات المشروع
```

## 🔧 التكوين

### متغيرات البيئة
```env
# .env.local
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=EstateCare
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### إعدادات قاعدة البيانات
قاعدة البيانات تستخدم SQLite مع Cloudflare D1. الهيكل محدد في `schema.sql`:

- **users** - المستخدمين والصلاحيات
- **residences** - العقارات والمجمعات
- **inventory** - المخزون والمواد
- **orders** - طلبات المشتريات
- **maintenance_requests** - طلبات الصيانة
- **files** - إدارة الملفات
- **notifications** - الإشعارات
- **sessions** - جلسات المستخدمين

## 📚 واجهات برمجة التطبيقات (API)

### المصادقة
```typescript
POST /api/auth/login     # تسجيل الدخول
POST /api/auth/logout    # تسجيل الخروج
GET  /api/auth/me        # معلومات المستخدم الحالي
```

### إدارة المستخدمين
```typescript
GET    /api/users        # قائمة المستخدمين
POST   /api/users        # إضافة مستخدم جديد
PUT    /api/users/:id    # تحديث مستخدم
DELETE /api/users/:id    # حذف مستخدم
```

### إدارة العقارات
```typescript
GET    /api/residences        # قائمة العقارات
POST   /api/residences        # إضافة عقار جديد
PUT    /api/residences/:id    # تحديث عقار
DELETE /api/residences/:id    # حذف عقار
```

### إدارة المخزون
```typescript
GET    /api/inventory         # قائمة المخزون
POST   /api/inventory         # إضافة صنف جديد
PUT    /api/inventory/:id     # تحديث صنف
DELETE /api/inventory/:id     # حذف صنف
```

### إدارة الصيانة
```typescript
GET    /api/maintenance       # قائمة طلبات الصيانة
POST   /api/maintenance       # إضافة طلب جديد
PUT    /api/maintenance/:id   # تحديث طلب
DELETE /api/maintenance/:id   # حذف طلب
```

## 🎨 واجهة المستخدم

### نظام الثيمات
- **الفاتح** - للاستخدام النهاري
- **الداكن** - للاستخدام الليلي  
- **النظام** - يتبع إعدادات الجهاز

### اللغات المدعومة
- **العربية** - اللغة الأساسية
- **الإنجليزية** - لغة ثانوية
- دعم RTL/LTR تلقائي

### التصميم المتجاوب
- **Desktop** - شاشات كبيرة (1200px+)
- **Tablet** - شاشات متوسطة (768px-1199px)
- **Mobile** - شاشات صغيرة (أقل من 768px)

## 🔐 الأمان

### المصادقة
- JWT tokens مع انتهاء صلاحية
- تشفير كلمات المرور باستخدام bcrypt
- حماية CSRF
- معدل محدود للطلبات

### الصلاحيات
- **admin** - صلاحيات كاملة
- **manager** - إدارة العقارات والمستخدمين
- **user** - الوظائف الأساسية
- **technician** - إدارة الصيانة

### حماية البيانات
- HTTPS إجباري
- تشفير البيانات الحساسة
- نسخ احتياطية منتظمة
- سجلات الأنشطة

## 📊 الأداء والمراقبة

### مؤشرات الأداء
- **Core Web Vitals** - مؤشرات Google
- **Database Performance** - أداء قاعدة البيانات
- **API Response Times** - أزمنة استجابة API
- **Error Rates** - معدلات الأخطاء

### التخزين المؤقت
- **Cloudflare KV** - تخزين مؤقت للبيانات
- **Browser Cache** - تخزين مؤقت للمتصفح
- **CDN Cache** - شبكة توزيع المحتوى

## 🧪 الاختبار

### أنواع الاختبارات
```bash
# اختبارات الوحدة
npm run test:unit

# اختبارات التكامل
npm run test:integration

# اختبارات E2E
npm run test:e2e

# تغطية الكود
npm run test:coverage
```

### بيانات الاختبار
```bash
# إنشاء بيانات تجريبية
npm run seed:dev

# إعادة تعيين قاعدة البيانات
npm run db:reset
```

## 🚀 النشر والإنتاج

### بيئات النشر
- **Development** - التطوير المحلي
- **Staging** - بيئة الاختبار
- **Production** - بيئة الإنتاج

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build:cloudflare
      - run: npm run wrangler:deploy
```

### المراقبة
- **Cloudflare Analytics** - إحصائيات الزوار
- **Error Tracking** - تتبع الأخطاء
- **Performance Monitoring** - مراقبة الأداء
- **Uptime Monitoring** - مراقبة التوفر

## 🔄 الترحيل من Firebase

### أدوات الترحيل
```bash
# ترحيل البيانات من Firebase
npm run migrate:firebase

# تصدير البيانات الحالية
npm run export:data

# استيراد البيانات
npm run import:data
```

### خطوات الترحيل
1. **التحضير** - نسخ احتياطية من البيانات
2. **التصدير** - تصدير من Firestore
3. **التحويل** - تحويل التنسيق
4. **الاستيراد** - استيراد إلى D1
5. **التحقق** - اختبار البيانات المرحلة

## 📖 التوثيق الإضافي

- [دليل الاستخدام](docs/user-guide.md)
- [دليل المطور](docs/developer-guide.md)
- [دليل النشر](docs/deployment-guide.md)
- [حل المشاكل](docs/troubleshooting.md)
- [API Documentation](docs/api.md)

## 🤝 المساهمة

### كيفية المساهمة
1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/new-feature`)
3. Commit التغييرات (`git commit -m 'Add new feature'`)
4. Push للفرع (`git push origin feature/new-feature`)
5. فتح Pull Request

### معايير الكود
- استخدام TypeScript للأمان
- اتباع ESLint rules
- كتابة tests للميزات الجديدة
- توثيق التغييرات

## 🐛 الإبلاغ عن المشاكل

استخدم [GitHub Issues](https://github.com/your-org/estatecare-cloudflare/issues) للإبلاغ عن:
- الأخطاء والمشاكل
- طلبات الميزات الجديدة
- تحسينات الأداء
- مشاكل التوثيق

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

## 👨‍💻 الفريق

- **Team Lead** - إدارة المشروع والهندسة
- **Frontend Developers** - تطوير الواجهات
- **Backend Developers** - تطوير API والخوادم
- **DevOps Engineers** - النشر والبنية التحتية
- **QA Engineers** - ضمان الجودة والاختبار

## 📞 الدعم

للحصول على الدعم:
- 📧 البريد الإلكتروني: support@estatecare.com
- 💬 Discord: [EstateCare Community](https://discord.gg/estatecare)
- 📚 التوثيق: [docs.estatecare.com](https://docs.estatecare.com)
- 🎥 الفيديوهات التعليمية: [YouTube Channel](https://youtube.com/estatecare)

---

## 🎯 الخطوات التالية

### المرحلة القادمة
- [ ] تطبيق الهاتف المحمول (React Native)
- [ ] نظام التقارير المتقدم
- [ ] ذكاء اصطناعي للتنبؤات
- [ ] تكامل أنظمة المحاسبة
- [ ] API للشركاء الخارجيين

### التحسينات المستمرة
- [ ] تحسين الأداء
- [ ] إضافة لغات جديدة
- [ ] تطوير واجهة المستخدم
- [ ] أمان معزز
- [ ] مراقبة محسنة

---

<div align="center">

**🏗️ بُني بحب للمجتمع العقاري 🏠**

[الموقع الرسمي](https://estatecare.com) • [التوثيق](https://docs.estatecare.com) • [المجتمع](https://community.estatecare.com)

</div>
