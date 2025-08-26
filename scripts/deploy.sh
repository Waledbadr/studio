#!/bin/bash

# سكريبت نشر تطبيق EstateCare على Cloudflare Pages
# يقوم بإعداد وتكوين ونشر التطبيق بالكامل

set -e  # إيقاف التنفيذ عند حدوث خطأ

echo "🚀 بدء عملية نشر EstateCare على Cloudflare Pages"

# التحقق من وجود wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler غير مثبت. يرجى تثبيته أولاً:"
    echo "npm install -g wrangler"
    exit 1
fi

# التحقق من تسجيل الدخول
echo "🔐 التحقق من تسجيل الدخول إلى Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "📝 يرجى تسجيل الدخول إلى Cloudflare:"
    wrangler login
fi

# إنشاء قاعدة البيانات D1
echo "🗄️ إنشاء قاعدة بيانات D1..."
DB_ID=$(wrangler d1 create estatecare-db --json | jq -r '.database_id' 2>/dev/null || echo "")

if [ -z "$DB_ID" ]; then
    echo "⚠️ قاعدة البيانات موجودة بالفعل أو حدث خطأ. محاولة الحصول على المعرف..."
    DB_ID=$(wrangler d1 list --json | jq -r '.[] | select(.name=="estatecare-db") | .uuid' 2>/dev/null || echo "manual-setup-required")
fi

if [ "$DB_ID" != "manual-setup-required" ]; then
    echo "✅ معرف قاعدة البيانات: $DB_ID"
    
    # تحديث wrangler.toml بمعرف قاعدة البيانات الصحيح
    sed -i "s/database_id = \"your-d1-database-id\"/database_id = \"$DB_ID\"/g" wrangler.toml
    echo "📝 تم تحديث wrangler.toml بمعرف قاعدة البيانات"
else
    echo "⚠️ يرجى تحديث معرف قاعدة البيانات يدوياً في wrangler.toml"
fi

# تطبيق Schema قاعدة البيانات
echo "📋 تطبيق schema قاعدة البيانات..."
if [ -f "schema.sql" ]; then
    wrangler d1 execute estatecare-db --file=schema.sql
    echo "✅ تم تطبيق schema بنجاح"
else
    echo "❌ ملف schema.sql غير موجود"
    exit 1
fi

# إنشاء KV namespace
echo "🗂️ إنشاء KV namespace..."
KV_ID=$(wrangler kv:namespace create "ESTATECARE_KV" --json | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$KV_ID" ]; then
    echo "✅ معرف KV namespace: $KV_ID"
    sed -i "s/id = \"your-kv-namespace-id\"/id = \"$KV_ID\"/g" wrangler.toml
else
    echo "⚠️ يرجى إنشاء KV namespace يدوياً وتحديث wrangler.toml"
fi

# إنشاء KV namespace للمعاينة
KV_PREVIEW_ID=$(wrangler kv:namespace create "ESTATECARE_KV" --preview --json | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$KV_PREVIEW_ID" ]; then
    echo "✅ معرف KV preview namespace: $KV_PREVIEW_ID"
    sed -i "s/preview_id = \"your-kv-preview-id\"/preview_id = \"$KV_PREVIEW_ID\"/g" wrangler.toml
fi

# إنشاء R2 bucket
echo "🪣 إنشاء R2 bucket..."
wrangler r2 bucket create estatecare-files || echo "⚠️ R2 bucket قد يكون موجوداً بالفعل"

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install

# بناء التطبيق للإنتاج
echo "🏗️ بناء التطبيق..."
npm run build:cloudflare

# نشر التطبيق
echo "🚀 نشر التطبيق على Cloudflare Pages..."
wrangler pages deploy out --project-name=estatecare-cloudflare

# إنشاء مستخدم إداري افتراضي
echo "👤 إنشاء مستخدم إداري افتراضي..."
cat > create_admin.sql << EOF
INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active) 
VALUES (
    'admin-' || hex(randomblob(8)),
    'مدير النظام',
    'admin@estatecare.com',
    'admin',
    '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',  -- admin123 hashed
    true
);
EOF

wrangler d1 execute estatecare-db --file=create_admin.sql
rm create_admin.sql

echo "✅ تم إنشاء المستخدم الإداري:"
echo "   البريد الإلكتروني: admin@estatecare.com"
echo "   كلمة المرور: admin123"
echo "   ⚠️ يرجى تغيير كلمة المرور فور تسجيل الدخول"

# عرض معلومات النشر
echo ""
echo "🎉 تم نشر التطبيق بنجاح!"
echo "🌐 رابط التطبيق: https://estatecare-cloudflare.pages.dev"
echo ""
echo "📋 الخطوات التالية:"
echo "1. قم بزيارة التطبيق وتسجيل الدخول بالمستخدم الإداري"
echo "2. غير كلمة مرور المدير"
echo "3. أضف المستخدمين والعقارات والمخزون"
echo "4. اختبر جميع الوظائف"
echo ""
echo "🔧 إعدادات إضافية:"
echo "- تأكد من تحديث متغيرات البيئة في Cloudflare Pages"
echo "- راجع إعدادات الأمان والنسخ الاحتياطية"
echo ""
echo "✨ استمتع باستخدام EstateCare على Cloudflare!"
