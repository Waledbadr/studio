# 🔄 نسخ البيانات من Firestore إلى Cloudflare D1

دليل سريع لاستنساخ محتويات قاعدة بيانات Firestore إلى Cloudflare D1 دون التأثير على البيانات الأصلية.

## 🚀 البدء السريع

### 1. التحضير والإعداد

```bash
# تأكد من تثبيت المتطلبات
npm install firebase-admin
npm install -g wrangler

# إعداد Firebase (إذا لم يكن مُفعلاً)
npm run firebase:setup
```

### 2. فحص البيانات الموجودة

```bash
# التحقق من البيانات في Firestore
npm run firebase:check
```

### 3. تشغيل النسخ الشامل

```bash
# نسخ شامل من Firestore إلى D1
npm run migrate:firestore-to-d1
```

## 📋 الأوامر المتوفرة

| الأمر | الوصف |
|-------|-------|
| `npm run firebase:setup` | إعداد وتفعيل Firebase |
| `npm run firebase:check` | فحص البيانات الموجودة في Firestore |
| `npm run migrate:firestore-to-d1` | نسخ شامل من Firestore إلى D1 |
| `npm run migrate:firestore-only` | نسخ البيانات من Firestore فقط |
| `npm run migrate:apply-to-d1` | تطبيق البيانات على D1 فقط |

## 📊 ما يتم نسخه

- 👥 **المستخدمون** - جميع بيانات المستخدمين والأدوار
- 🏠 **العقارات** - معلومات العقارات والوحدات
- 📦 **المخزون** - عناصر المخزون والمواد
- 📋 **الطلبات** - طلبات الشراء والخدمات
- 🔧 **طلبات الصيانة** - طلبات الإصلاح والصيانة

## 📁 الملفات المُنتجة

بعد النسخ ستجد:

- `scripts/firestore-to-cloudflare-migration.sql` - ملف SQL للتطبيق على D1
- `scripts/firestore-backup.json` - نسخة احتياطية بصيغة JSON

## ✅ التحقق من النجاح

```bash
# فحص البيانات في D1
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM users;"
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM residences;"
wrangler d1 execute estate-care-db --command="SELECT COUNT(*) FROM inventory;"
```

## 🔒 الأمان

- ✅ **القراءة فقط** - لا يتم تعديل Firestore أبداً
- ✅ **كلمات المرور** - منسوخة مُشفرة
- ✅ **النسخ الاحتياطي** - ملف JSON محفوظ محلياً
- ✅ **التكرار الآمن** - يمكن إعادة التشغيل دون مشاكل

## 🐛 حل المشاكل

### Firebase غير مُكون
```bash
npm run firebase:setup
```

### Wrangler غير مثبت
```bash
npm install -g wrangler
wrangler auth login
```

### قاعدة بيانات D1 غير موجودة
```bash
wrangler d1 create estate-care-db
```

## 📚 دليل مفصل

للحصول على دليل شامل، راجع: [`docs/MIGRATION_GUIDE.md`](../docs/MIGRATION_GUIDE.md)

## 🆘 الدعم

في حالة واجهت مشاكل:

1. تحقق من logs الـ console
2. تأكد من صحة إعدادات Firebase
3. تحقق من اتصال Cloudflare
4. راجع ملف `firestore-backup.json` للتأكد من البيانات

---

💡 **نصيحة**: احتفظ بنسخة من ملفات SQL و JSON المُنتجة كنسخة احتياطية!