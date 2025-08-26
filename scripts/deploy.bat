@echo off
setlocal enabledelayedexpansion

REM سكريبت نشر تطبيق EstateCare على Cloudflare Pages للويندوز
REM يقوم بإعداد وتكوين ونشر التطبيق بالكامل

echo.
echo 🚀 بدء عملية نشر EstateCare على Cloudflare Pages
echo.

REM التحقق من وجود wrangler
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Wrangler غير مثبت. يرجى تثبيته أولاً:
    echo npm install -g wrangler
    pause
    exit /b 1
)

REM التحقق من تسجيل الدخول
echo 🔐 التحقق من تسجيل الدخول إلى Cloudflare...
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 📝 يرجى تسجيل الدخول إلى Cloudflare:
    wrangler login
    if %errorlevel% neq 0 (
        echo ❌ فشل في تسجيل الدخول
        pause
        exit /b 1
    )
)

REM إنشاء قاعدة البيانات D1
echo 🗄️ إنشاء قاعدة بيانات D1...
wrangler d1 create estatecare-db >nul 2>&1
echo ✅ تم إنشاء قاعدة البيانات أو هي موجودة بالفعل

REM تطبيق Schema قاعدة البيانات
echo 📋 تطبيق schema قاعدة البيانات...
if exist "schema.sql" (
    wrangler d1 execute estatecare-db --file=schema.sql
    if %errorlevel% equ 0 (
        echo ✅ تم تطبيق schema بنجاح
    ) else (
        echo ❌ فشل في تطبيق schema
        pause
        exit /b 1
    )
) else (
    echo ❌ ملف schema.sql غير موجود
    pause
    exit /b 1
)

REM إنشاء KV namespace
echo 🗂️ إنشاء KV namespace...
wrangler kv:namespace create "ESTATECARE_KV" >nul 2>&1
echo ✅ تم إنشاء KV namespace أو هو موجود بالفعل

REM إنشاء KV namespace للمعاينة
wrangler kv:namespace create "ESTATECARE_KV" --preview >nul 2>&1
echo ✅ تم إنشاء KV preview namespace أو هو موجود بالفعل

REM إنشاء R2 bucket
echo 🪣 إنشاء R2 bucket...
wrangler r2 bucket create estatecare-files >nul 2>&1
echo ✅ تم إنشاء R2 bucket أو هو موجود بالفعل

REM تثبيت التبعيات
echo 📦 تثبيت التبعيات...
npm install
if %errorlevel% neq 0 (
    echo ❌ فشل في تثبيت التبعيات
    pause
    exit /b 1
)

REM بناء التطبيق للإنتاج
echo 🏗️ بناء التطبيق...
npm run build
if %errorlevel% neq 0 (
    echo ❌ فشل في بناء التطبيق
    pause
    exit /b 1
)

REM نشر التطبيق
echo 🚀 نشر التطبيق على Cloudflare Pages...
wrangler pages deploy out --project-name=estatecare-cloudflare
if %errorlevel% neq 0 (
    echo ❌ فشل في نشر التطبيق
    pause
    exit /b 1
)

REM إنشاء مستخدم إداري افتراضي
echo 👤 إنشاء مستخدم إداري افتراضي...
echo INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active) > create_admin.sql
echo VALUES ( >> create_admin.sql
echo     'admin-' ^|^| hex(randomblob(8)), >> create_admin.sql
echo     'مدير النظام', >> create_admin.sql
echo     'admin@estatecare.com', >> create_admin.sql
echo     'admin', >> create_admin.sql
echo     '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', >> create_admin.sql
echo     true >> create_admin.sql
echo ); >> create_admin.sql

wrangler d1 execute estatecare-db --file=create_admin.sql
del create_admin.sql

echo.
echo ✅ تم إنشاء المستخدم الإداري:
echo    البريد الإلكتروني: admin@estatecare.com
echo    كلمة المرور: admin123
echo    ⚠️ يرجى تغيير كلمة المرور فور تسجيل الدخول
echo.

echo 🎉 تم نشر التطبيق بنجاح!
echo 🌐 رابط التطبيق: https://estatecare-cloudflare.pages.dev
echo.
echo 📋 الخطوات التالية:
echo 1. قم بزيارة التطبيق وتسجيل الدخول بالمستخدم الإداري
echo 2. غير كلمة مرور المدير
echo 3. أضف المستخدمين والعقارات والمخزون
echo 4. اختبر جميع الوظائف
echo.
echo 🔧 إعدادات إضافية:
echo - تأكد من تحديث متغيرات البيئة في Cloudflare Pages
echo - راجع إعدادات الأمان والنسخ الاحتياطية
echo.
echo ✨ استمتع باستخدام EstateCare على Cloudflare!
echo.
pause
