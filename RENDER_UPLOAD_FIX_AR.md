# 🔧 حل مشكلة رفع المرفقات على Render

## ❌ المشكلة
رفع المرفقات لا يعمل في بيئة الإنتاج على Render، بينما يعمل بشكل ممتاز في localhost.

## 🔍 السبب
التطبيق المنشور على Render يحتاج إلى متغير بيئة `BLOB_READ_WRITE_TOKEN` محدد في لوحة تحكم Render، وليس فقط في ملفات `.env` المحلية.

## ✅ الحل الفوري

### الخطوة 1: تسجيل الدخول إلى Vercel وإنشاء Token
1. اذهب إلى https://vercel.com/dashboard
2. من القائمة الجانبية، اختر **Storage**
3. اختر **Blob** (أو أنشئ Blob Store جديد إذا لم يكن موجود)
4. اذهب إلى تبويب **Tokens**
5. انقر على **Create Token**
6. اختر نوع Token: **Read-Write Token**
7. انسخ الـ Token (يبدأ بـ `vercel_blob_rw_...`)

### الخطوة 2: إضافة المتغير في Render
1. اذهب إلى https://dashboard.render.com
2. اختر مشروعك (EstateCare Studio)
3. اذهب إلى **Environment**
4. انقر على **Add Environment Variable**
5. أضف:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: الصق الـ Token الذي نسخته من Vercel
6. انقر على **Save Changes**

### الخطوة 3: إعادة النشر (Redeploy)
1. في لوحة تحكم Render، انقر على **Manual Deploy**
2. اختر **Clear build cache & deploy**
3. انتظر حتى تكتمل عملية النشر

## 🧪 الاختبار
بعد إعادة النشر:
1. اذهب إلى صفحة طلبات الموافقة (Order Approval)
2. حاول رفع مرفق جديد
3. يجب أن يعمل الرفع بنجاح ✅

## 📝 ملاحظات مهمة

### Endpoints الرفع الموجودة
التطبيق يحتوي على 4 endpoints لرفع الملفات:

1. **`/api/uploads/order-approval`** - رفع مرفقات طلبات الموافقة
2. **`/api/uploads/mrv-invoice`** - رفع فواتير استلام المواد (MRV)
3. **`/api/uploads/mrv`** - رفع وثائق MRV
4. **`/api/uploads/feedback`** - رفع صور الملاحظات

كل هذه الـ endpoints تحتاج إلى `BLOB_READ_WRITE_TOKEN`.

### كيف يعمل النظام؟
```
Client (Browser)
    ↓
    | يرسل الملف
    ↓
Next.js API Route (/api/uploads/*)
    ↓
    | يستخدم @vercel/blob
    | مع BLOB_READ_WRITE_TOKEN
    ↓
Vercel Blob Storage
    ↓
    | يحفظ الملف ويُرجع URL
    ↓
Client يحصل على URL للملف
```

### المتغيرات البيئية المطلوبة على Render
تأكد من وجود جميع هذه المتغيرات في Render:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB69bOq4eC_oBH1pGyq9roQRldNP-WVJ2g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sample-firebase-ai-app-55f54.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sample-firebase-ai-app-55f54
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sample-firebase-ai-app-55f54.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1040876414631
NEXT_PUBLIC_FIREBASE_APP_ID=1:1040876414631:web:635e2082a3cea9333add82

# Vercel Blob Storage Token (الأهم!)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx

# Gemini API (للذكاء الاصطناعي)
GEMINI_API_KEY=AIzaSyBLt7IjHKlA4orEjyLcXg4vyjU9PQPorcQ
```

## ⚠️ إذا استمرت المشكلة

### التحقق من Logs
1. في Render Dashboard، اذهب إلى **Logs**
2. ابحث عن رسائل الخطأ عند محاولة رفع ملف
3. إذا رأيت `BLOB_READ_WRITE_TOKEN is not configured`، المتغير غير موجود
4. إذا رأيت `401 Unauthorized`، الـ Token غير صحيح أو انتهت صلاحيته

### إنشاء Token جديد
إذا كان Token القديم لا يعمل:
1. في Vercel → Storage → Blob → Tokens
2. احذف Token القديم
3. أنشئ Token جديد
4. حدّث القيمة في Render
5. أعد النشر

### التحقق من Runtime
كود API Routes يستخدم:
- `runtime = 'nodejs'` لـ order-approval, mrv-invoice, mrv
- `runtime = 'edge'` لـ feedback

كلاهما يعملان مع Vercel Blob، لكن تأكد من:
- Render يدعم Node.js runtime
- إصدار Node.js 18+ (موصى به)

## 🎯 الخلاصة

المشكلة الأساسية: **متغير البيئة غير موجود في Render**

الحل: **أضف `BLOB_READ_WRITE_TOKEN` في لوحة تحكم Render**

بعد إضافة المتغير وإعادة النشر، ستعمل جميع عمليات رفع المرفقات بنجاح! 🎉

---

## 📞 الدعم
إذا واجهت أي مشاكل إضافية:
1. تحقق من Logs في Render
2. تحقق من Vercel Blob quota (الحد المجاني 500MB)
3. تأكد من صحة Token وصلاحيته
