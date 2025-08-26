@echo off
setlocal enabledelayedexpansion

REM سكريبت إعداد بيئة التطوير المحلية لـ EstateCare (Windows)
REM يقوم بتكوين قاعدة البيانات المحلية والبيئة للتطوير

echo.
echo 🛠️ إعداد بيئة التطوير المحلية لـ EstateCare
echo.

REM التحقق من وجود wrangler
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Wrangler غير مثبت. يرجى تثبيته أولاً:
    echo npm install -g wrangler
    pause
    exit /b 1
)

REM تثبيت التبعيات
echo 📦 تثبيت التبعيات...
npm install
if %errorlevel% neq 0 (
    echo ❌ فشل في تثبيت التبعيات
    pause
    exit /b 1
)

REM إنشاء قاعدة بيانات محلية للتطوير
echo 🗄️ إنشاء قاعدة بيانات محلية...
if not exist ".wrangler\state\v3\d1\miniflare-D1DatabaseObject" (
    wrangler d1 execute estatecare-db --local --file=schema.sql
    echo ✅ تم إنشاء قاعدة البيانات المحلية
) else (
    echo 📊 قاعدة البيانات المحلية موجودة بالفعل
    set /p "choice=هل تريد إعادة إنشائها؟ (y/N): "
    if /i "!choice!"=="y" (
        rmdir /s /q .wrangler\state\v3\d1\ 2>nul
        wrangler d1 execute estatecare-db --local --file=schema.sql
        echo ✅ تم إعادة إنشاء قاعدة البيانات المحلية
    )
)

REM إنشاء بيانات تجريبية
echo 📝 إنشاء بيانات تجريبية...
echo -- إنشاء مستخدم إداري للتطوير > dev_data.sql
echo INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, created_at, updated_at) >> dev_data.sql
echo VALUES ( >> dev_data.sql
echo     'dev-admin-123', >> dev_data.sql
echo     'مدير التطوير', >> dev_data.sql
echo     'dev@estatecare.com', >> dev_data.sql
echo     'admin', >> dev_data.sql
echo     '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', >> dev_data.sql
echo     true, >> dev_data.sql
echo     datetime('now'), >> dev_data.sql
echo     datetime('now') >> dev_data.sql
echo ); >> dev_data.sql
echo. >> dev_data.sql
echo -- إنشاء مستخدمين عاديين للاختبار >> dev_data.sql
echo INSERT OR IGNORE INTO users (id, name, email, role, password_hash, is_active, created_at, updated_at) >> dev_data.sql
echo VALUES >> dev_data.sql
echo     ('user-001', 'أحمد محمد', 'ahmed@test.com', 'user', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')), >> dev_data.sql
echo     ('user-002', 'فاطمة علي', 'fatima@test.com', 'manager', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')), >> dev_data.sql
echo     ('tech-001', 'محمد التقني', 'tech@test.com', 'technician', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', true, datetime('now'), datetime('now')); >> dev_data.sql

wrangler d1 execute estatecare-db --local --file=dev_data.sql
del dev_data.sql

echo ✅ تم إنشاء البيانات التجريبية

REM إنشاء ملف متغيرات البيئة للتطوير
echo 🔧 إنشاء ملف متغيرات البيئة...
echo # متغيرات البيئة للتطوير المحلي > .env.local
echo NEXT_PUBLIC_APP_ENV=development >> .env.local
echo NEXT_PUBLIC_APP_NAME=EstateCare >> .env.local
echo NEXT_PUBLIC_APP_VERSION=2.0.0 >> .env.local
echo. >> .env.local
echo # سر التوقيع للـ JWT (للتطوير فقط) >> .env.local
echo JWT_SECRET=dev-secret-key-change-in-production >> .env.local
echo. >> .env.local
echo # إعدادات التطبيق >> .env.local
echo NEXT_PUBLIC_DEFAULT_LANGUAGE=ar >> .env.local
echo NEXT_PUBLIC_MAX_FILE_SIZE=10485760 >> .env.local
echo NEXT_PUBLIC_SUPPORTED_FILE_TYPES=image/*,application/pdf,text/* >> .env.local
echo. >> .env.local
echo # رابط API الأساسي (للتطوير المحلي) >> .env.local
echo NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 >> .env.local

echo ✅ تم إنشاء ملف .env.local

echo.
echo ✅ تم إعداد بيئة التطوير بنجاح!
echo.
echo 📋 معلومات الحسابات التجريبية:
echo    👨‍💼 مدير النظام:
echo       البريد: dev@estatecare.com
echo       المرور: admin123
echo.
echo    👤 مستخدمين:
echo       ahmed@test.com / admin123 (مستخدم عادي)
echo       fatima@test.com / admin123 (مدير)
echo       tech@test.com / admin123 (فني)
echo.
echo 🚀 بدء التطوير:
echo    npm run dev          - تشغيل خادم التطوير العادي
echo    npm run dev:local     - تشغيل مع Cloudflare المحلي
echo.
echo 🌐 لبدء التطوير، قم بتشغيل:
echo    npm run dev
echo.
pause
