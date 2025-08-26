# دليل النشر الشامل - EstateCare على Cloudflare

## 📋 جدول المحتويات
1. [متطلبات ما قبل النشر](#متطلبات-ما-قبل-النشر)
2. [إعداد الحسابات والموارد](#إعداد-الحسابات-والموارد)
3. [النشر التلقائي](#النشر-التلقائي)
4. [النشر اليدوي](#النشر-اليدوي)
5. [إعداد البيئات المختلفة](#إعداد-البيئات-المختلفة)
6. [حل المشاكل الشائعة](#حل-المشاكل-الشائعة)
7. [الصيانة والمراقبة](#الصيانة-والمراقبة)

---

## متطلبات ما قبل النشر

### 1. الأدوات المطلوبة
```bash
# تثبيت Node.js (18.17.0 أو أحدث)
node --version

# تثبيت Wrangler CLI
npm install -g wrangler@latest

# التحقق من إصدار Wrangler
wrangler --version
```

### 2. الحسابات المطلوبة
- ✅ حساب Cloudflare مع خطة مدفوعة (للـ D1 و R2)
- ✅ حساب GitHub (للـ CI/CD اختياري)
- ✅ نطاق مخصص (اختياري)

### 3. الصلاحيات المطلوبة
- **Cloudflare API Token** مع الصلاحيات:
  - Zone:Read
  - Page:Edit
  - D1:Edit
  - R2:Edit
  - Workers KV Storage:Edit

---

## إعداد الحسابات والموارد

### 1. إعداد Cloudflare API Token

#### إنشاء API Token:
1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. انقر على "Create Token"
3. اختر "Custom token"
4. أضف الصلاحيات التالية:
   ```
   Account - Cloudflare Pages:Edit
   Zone - Zone Settings:Read, Zone:Read
   Account - Account Settings:Read
   User - User Details:Read
   Account - D1:Edit
   Account - Cloudflare R2:Edit
   Account - Workers KV Storage:Edit
   ```

#### إعداد Token محلياً:
```bash
# تسجيل الدخول باستخدام Token
wrangler auth login

# أو تعيين Token مباشرة
export CLOUDFLARE_API_TOKEN=your-api-token
```

### 2. إنشاء الموارد الأساسية

#### إنشاء قاعدة البيانات D1:
```bash
# إنشاء قاعدة البيانات
wrangler d1 create estatecare-db

# الحصول على Database ID
wrangler d1 list
```

#### إنشاء R2 Bucket:
```bash
# إنشاء bucket للملفات
wrangler r2 bucket create estatecare-files

# التحقق من الإنشاء
wrangler r2 bucket list
```

#### إنشاء KV Namespaces:
```bash
# إنشاء KV namespace للإنتاج
wrangler kv:namespace create "ESTATECARE_KV"

# إنشاء KV namespace للمعاينة
wrangler kv:namespace create "ESTATECARE_KV" --preview
```

### 3. تحديث ملف wrangler.toml

```toml
name = "estatecare-cloudflare"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "estatecare-cloudflare-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "estatecare-db"
database_id = "your-production-database-id"

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "estatecare-files-prod"

[[env.production.kv_namespaces]]
binding = "ESTATECARE_KV"
id = "your-production-kv-id"

[env.staging]
name = "estatecare-cloudflare-staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "estatecare-db-staging"
database_id = "your-staging-database-id"

[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "estatecare-files-staging"

[[env.staging.kv_namespaces]]
binding = "ESTATECARE_KV"
id = "your-staging-kv-id"
```

---

## النشر التلقائي

### 1. استخدام سكريبت النشر الجاهز

#### لأنظمة Linux/macOS:
```bash
# إعطاء صلاحية التنفيذ
chmod +x scripts/deploy.sh

# تشغيل سكريبت النشر
./scripts/deploy.sh
```

#### لأنظمة Windows:
```cmd
# تشغيل سكريبت Windows
scripts\deploy.bat
```

### 2. ما يفعله السكريبت:

1. **التحقق من البيئة:**
   - وجود Wrangler CLI
   - تسجيل الدخول إلى Cloudflare
   - صحة ملفات التكوين

2. **إنشاء الموارد:**
   - قاعدة بيانات D1
   - R2 Bucket
   - KV Namespaces

3. **إعداد قاعدة البيانات:**
   - تطبيق schema.sql
   - إنشاء بيانات المدير الافتراضي

4. **بناء ونشر التطبيق:**
   - تثبيت التبعيات
   - بناء التطبيق للإنتاج
   - نشر على Cloudflare Pages

### 3. مراجعة نتائج النشر:

```bash
# التحقق من نجاح النشر
wrangler pages project list

# عرض تفاصيل المشروع
wrangler pages project get estatecare-cloudflare

# عرض آخر عمليات النشر
wrangler pages deployment list
```

---

## النشر اليدوي

### 1. الإعداد المسبق:

```bash
# تثبيت التبعيات
npm install

# إنشاء الموارد المطلوبة
npm run cloudflare:setup

# تطبيق schema قاعدة البيانات
wrangler d1 execute estatecare-db --file=schema.sql
```

### 2. بناء التطبيق:

```bash
# بناء للإنتاج
npm run build:cloudflare

# التحقق من نجاح البناء
ls -la out/
```

### 3. النشر:

```bash
# النشر الأولي (إنشاء مشروع جديد)
wrangler pages deploy out --project-name=estatecare-cloudflare

# النشر للمشروع الموجود
wrangler pages deploy out
```

### 4. ربط النطاق المخصص (اختياري):

```bash
# ربط نطاق مخصص
wrangler pages domain add your-domain.com

# التحقق من الربط
wrangler pages domain list
```

---

## إعداد البيئات المختلفة

### 1. بيئة التطوير (Development)

```bash
# إعداد قاعدة البيانات المحلية
npm run d1:execute:local

# تشغيل الخادم المحلي
npm run dev:local
```

**إعدادات البيئة:**
```env
# .env.local
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
JWT_SECRET=dev-secret-change-in-production
```

### 2. بيئة الاختبار (Staging)

```bash
# نشر على بيئة الاختبار
wrangler pages deploy out --env=staging

# تطبيق Schema على بيئة الاختبار
wrangler d1 execute estatecare-db-staging --file=schema.sql
```

**متغيرات البيئة:**
```bash
# إعداد متغيرات البيئة لـ Staging
wrangler pages secret put JWT_SECRET --env=staging
wrangler pages secret put API_BASE_URL --env=staging
```

### 3. بيئة الإنتاج (Production)

```bash
# نشر على الإنتاج
wrangler pages deploy out --env=production

# تطبيق Schema على الإنتاج
wrangler d1 execute estatecare-db --file=schema.sql
```

**الأمان في الإنتاج:**
```bash
# إعداد أسرار قوية للإنتاج
wrangler pages secret put JWT_SECRET --env=production
wrangler pages secret put ADMIN_PASSWORD --env=production
wrangler pages secret put DATABASE_ENCRYPTION_KEY --env=production
```

---

## حل المشاكل الشائعة

### 1. مشاكل المصادقة

**المشكلة:** `Error: Not authenticated`
```bash
# الحل
wrangler auth login
# أو
wrangler auth logout && wrangler auth login
```

**المشكلة:** `Error: Invalid API token`
```bash
# التحقق من Token
wrangler whoami

# إنشاء token جديد إذا لزم الأمر
echo $CLOUDFLARE_API_TOKEN
```

### 2. مشاكل قاعدة البيانات

**المشكلة:** `Error: Database not found`
```bash
# التحقق من وجود قاعدة البيانات
wrangler d1 list

# إنشاء قاعدة البيانات إذا لم تكن موجودة
wrangler d1 create estatecare-db
```

**المشكلة:** `Error: Table doesn't exist`
```bash
# إعادة تطبيق Schema
wrangler d1 execute estatecare-db --file=schema.sql

# التحقق من الجداول
wrangler d1 execute estatecare-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 3. مشاكل البناء

**المشكلة:** `Build failed - Module not found`
```bash
# مسح cache وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# التحقق من TypeScript
npm run typecheck
```

**المشكلة:** `Out of memory during build`
```bash
# زيادة ذاكرة Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:cloudflare
```

### 4. مشاكل النشر

**المشكلة:** `Deployment failed - Too large`
```bash
# تحسين حجم البناء
npm run build:cloudflare -- --analyze

# حذف الملفات غير الضرورية
rm -rf out/**/*.map
```

**المشكلة:** `Functions build failed`
```bash
# التحقق من compatibility_date
# في wrangler.toml تأكد من:
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```

### 5. مشاكل الأداء

**بطء في الاستجابة:**
```bash
# تفعيل التخزين المؤقت
wrangler kv:namespace create "CACHE_KV"

# مراقبة الأداء
wrangler pages deployment tail
```

**استهلاك عالي للموارد:**
```bash
# مراجعة استخدام D1
wrangler d1 execute estatecare-db --command="PRAGMA table_info(users);"

# تحسين الاستعلامات
wrangler d1 execute estatecare-db --command="EXPLAIN QUERY PLAN SELECT * FROM users LIMIT 10;"
```

---

## الصيانة والمراقبة

### 1. النسخ الاحتياطية

#### نسخ احتياطي من قاعدة البيانات:
```bash
# إنشاء نسخة احتياطية يدوية
wrangler d1 backup create estatecare-db

# قائمة النسخ الاحتياطية
wrangler d1 backup list estatecare-db

# استعادة من نسخة احتياطية
wrangler d1 backup restore estatecare-db --backup-id=backup-id
```

#### نسخ احتياطي من الملفات:
```bash
# تصدير ملفات R2
wrangler r2 object list estatecare-files

# نسخ احتياطي محلي للملفات المهمة
aws s3 sync r2://estatecare-files ./backup/files/
```

### 2. المراقبة

#### مراقبة السجلات:
```bash
# مراقبة سجلات Pages
wrangler pages deployment tail

# مراقبة سجلات قاعدة البيانات
wrangler d1 execute estatecare-db --command="SELECT * FROM user_activity ORDER BY created_at DESC LIMIT 50;"
```

#### مراقبة الأداء:
```bash
# إحصائيات الاستخدام
wrangler pages project get estatecare-cloudflare

# مراقبة استهلاك الموارد
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/analytics/dashboard"
```

### 3. التحديثات

#### تحديث التبعيات:
```bash
# فحص التحديثات المتاحة
npm outdated

# تحديث التبعيات
npm update

# تحديث Wrangler
npm install -g wrangler@latest
```

#### تحديث قاعدة البيانات:
```bash
# إنشاء ملف migration جديد
cat > migration_$(date +%Y%m%d_%H%M%S).sql << 'EOF'
-- إضافة عمود جديد
ALTER TABLE users ADD COLUMN last_login_at DATETIME;

-- إنشاء فهرس جديد
CREATE INDEX idx_users_last_login ON users(last_login_at);
EOF

# تطبيق Migration
wrangler d1 execute estatecare-db --file=migration_*.sql
```

### 4. الأمان

#### تدوير الأسرار:
```bash
# تحديث JWT Secret
wrangler pages secret put JWT_SECRET --env=production

# تحديث كلمات مرور قاعدة البيانات
wrangler d1 execute estatecare-db --command="UPDATE users SET password_hash = 'new-hash' WHERE email = 'admin@estatecare.com';"
```

#### مراجعة الأمان:
```bash
# فحص الصلاحيات
wrangler auth whoami

# مراجعة سجلات تسجيل الدخول
wrangler d1 execute estatecare-db --command="SELECT email, last_login_at, failed_login_attempts FROM users WHERE role = 'admin';"
```

---

## قائمة مراجعة النشر

### قبل النشر:
- [ ] **اختبار شامل للتطبيق محلياً**
- [ ] **فحص التبعيات للثغرات الأمنية** (`npm audit`)
- [ ] **مراجعة متغيرات البيئة**
- [ ] **نسخ احتياطية من البيانات الحالية**
- [ ] **اختبار عملية البناء** (`npm run build:cloudflare`)

### أثناء النشر:
- [ ] **مراقبة سجلات النشر**
- [ ] **التحقق من إتمام رفع الملفات**
- [ ] **التأكد من ربط الموارد بشكل صحيح**
- [ ] **اختبار الاتصال بقاعدة البيانات**

### بعد النشر:
- [ ] **اختبار تسجيل الدخول**
- [ ] **التحقق من عمل جميع الصفحات**
- [ ] **اختبار رفع الملفات**
- [ ] **مراجعة سجلات الأخطاء**
- [ ] **تحديث DNS إذا لزم الأمر**
- [ ] **إشعار الفريق بإتمام النشر**

---

## الدعم والمساعدة

### الموارد المفيدة:
- 📚 [وثائق Cloudflare Pages](https://developers.cloudflare.com/pages/)
- 📚 [وثائق Cloudflare D1](https://developers.cloudflare.com/d1/)
- 📚 [وثائق Cloudflare R2](https://developers.cloudflare.com/r2/)
- 💬 [مجتمع Cloudflare](https://community.cloudflare.com/)

### في حالة المشاكل:
1. **راجع سجلات الأخطاء** (`wrangler pages deployment tail`)
2. **تحقق من حالة Cloudflare** ([status.cloudflare.com](https://status.cloudflare.com))
3. **ابحث في الوثائق** أو المجتمع
4. **اتصل بالدعم التقني** إذا لزم الأمر

---

> **تذكير مهم:** احتفظ دائماً بنسخ احتياطية من البيانات والتكوينات قبل أي تحديث أو تغيير مهم!
