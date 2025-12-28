# ✅ قائمة التحقق: إصلاح رفع المرفقات على Render

## قبل البدء
- [ ] لديك حساب Vercel نشط
- [ ] لديك حساب Render نشط
- [ ] التطبيق منشور على Render
- [ ] رفع المرفقات يعمل في localhost

---

## الخطوة 1: الحصول على Token من Vercel

### 1.1 الوصول إلى Vercel Dashboard
- [ ] افتح https://vercel.com/dashboard
- [ ] سجل الدخول إلى حسابك

### 1.2 الانتقال إلى Blob Storage
- [ ] من القائمة الجانبية، اختر **Storage**
- [ ] اختر **Blob** (أو أنشئ Blob Store إذا لم يكن موجود)

### 1.3 إنشاء Token
- [ ] اذهب إلى تبويب **Tokens**
- [ ] انقر على **Create Token**
- [ ] اختر نوع Token: **Read-Write Token**
- [ ] أدخل اسم للتعرف على Token (مثل: "EstateCare Production")

### 1.4 نسخ Token
- [ ] انسخ Token كاملاً (يبدأ بـ `vercel_blob_rw_...`)
- [ ] احفظه في مكان آمن (لن تستطيع رؤيته مرة أخرى)

---

## الخطوة 2: إضافة Token في Render

### 2.1 الوصول إلى Render Dashboard
- [ ] افتح https://dashboard.render.com
- [ ] سجل الدخول إلى حسابك

### 2.2 اختيار المشروع
- [ ] ابحث عن مشروعك (EstateCare Studio)
- [ ] انقر عليه لفتح صفحة التفاصيل

### 2.3 إضافة متغير البيئة
- [ ] اذهب إلى تبويب **Environment**
- [ ] انقر على **Add Environment Variable**
- [ ] أدخل:
  - **Key**: `BLOB_READ_WRITE_TOKEN` (بالضبط كما هو، حساس لحالة الأحرف)
  - **Value**: الصق Token الذي نسخته من Vercel
- [ ] انقر **Save Changes**

---

## الخطوة 3: إعادة النشر

### 3.1 Deploy يدوي
- [ ] في صفحة المشروع في Render، ابحث عن زر **Manual Deploy**
- [ ] انقر عليه

### 3.2 اختيار نوع Deploy
- [ ] اختر **Clear build cache & deploy** (مهم!)
- [ ] أكد العملية

### 3.3 انتظار اكتمال النشر
- [ ] راقب Logs في الوقت الفعلي
- [ ] انتظر حتى ترى "Build successful" و "Deploy live"
- [ ] الوقت المتوقع: 3-5 دقائق

---

## الخطوة 4: التحقق من الحل

### 4.1 اختبار Endpoint التشخيص
- [ ] افتح في المتصفح: `https://[your-app].onrender.com/api/uploads/diagnostics`
- [ ] تحقق من وجود:
  ```json
  {
    "checks": {
      "blobToken": {
        "configured": true,
        "status": "✅"
      }
    }
  }
  ```
- [ ] إذا كان `configured: false`، ارجع للخطوة 2

### 4.2 اختبار رفع ملف فعلي
- [ ] اذهب إلى صفحة Order Approval في التطبيق
- [ ] حاول رفع مرفق جديد
- [ ] تحقق من نجاح الرفع وظهور URL للملف

### 4.3 اختبار جميع endpoints الرفع
- [ ] Order Approval Attachments - `/api/uploads/order-approval`
- [ ] MRV Invoice - `/api/uploads/mrv-invoice`
- [ ] MRV Documents - `/api/uploads/mrv`
- [ ] Feedback Screenshots - `/api/uploads/feedback`

---

## 🐛 استكشاف الأخطاء

### إذا كان `configured: false`

#### تحقق من اسم المتغير
- [ ] تأكد أنه `BLOB_READ_WRITE_TOKEN` بالضبط
- [ ] لا مسافات قبل أو بعد
- [ ] حساس لحالة الأحرف (كبيرة/صغيرة)

#### تحقق من قيمة Token
- [ ] يبدأ بـ `vercel_blob_rw_`
- [ ] منسوخ بالكامل (بدون قطع)
- [ ] لا مسافات إضافية

#### أعد النشر
- [ ] احفظ التغييرات في Render
- [ ] Deploy مرة أخرى (Manual Deploy)
- [ ] انتظر اكتمال النشر

---

### إذا كان Token محدد لكن الرفع لا يعمل

#### تحقق من صلاحية Token
- [ ] افتح Vercel Dashboard → Storage → Blob → Tokens
- [ ] تأكد من وجود Token في القائمة
- [ ] تحقق من تاريخ الإنشاء

#### راجع Logs في Render
- [ ] اذهب إلى Render Dashboard → Logs
- [ ] ابحث عن أخطاء عند رفع الملف
- [ ] ابحث عن `[Upload Error]` أو `BLOB_READ_WRITE_TOKEN`

#### أنشئ Token جديد
- [ ] في Vercel: احذف Token القديم
- [ ] أنشئ Token جديد
- [ ] حدّث القيمة في Render
- [ ] أعد النشر

---

### إذا كانت المشكلة مستمرة

#### تحقق من Vercel Quota
- [ ] افتح Vercel Dashboard → Storage → Blob
- [ ] تحقق من الاستخدام (الحد المجاني: 500MB)
- [ ] إذا تجاوزت الحد، قد تحتاج لترقية الحساب

#### تحقق من إعدادات Render
- [ ] Node.js version: يجب أن يكون 18 أو أحدث
- [ ] Build command صحيح: `npm run build`
- [ ] Start command صحيح: `npm start`

---

## ✅ قائمة التحقق النهائية

بعد إتمام جميع الخطوات:

- [ ] Token محفوظ في Vercel (يظهر في قائمة Tokens)
- [ ] `BLOB_READ_WRITE_TOKEN` موجود في Render Environment Variables
- [ ] التطبيق أعيد نشره بنجاح
- [ ] `/api/uploads/diagnostics` يعرض `configured: true`
- [ ] رفع الملفات يعمل في Order Approval
- [ ] رفع الملفات يعمل في MRV Invoice
- [ ] رفع الملفات يعمل في MRV Documents
- [ ] رفع الملفات يعمل في Feedback

---

## 📚 مراجع سريعة

| المشكلة | الحل السريع | الملف المرجعي |
|---------|-------------|---------------|
| لا أعرف من أين أبدأ | ابدأ بالخطوة 1 | RENDER_UPLOAD_EMERGENCY_FIX_AR.md |
| `configured: false` | راجع الخطوة 2.3 | RENDER_UPLOAD_FIX_AR.md |
| رفع يفشل بخطأ | راجع Logs | RENDER_UPLOAD_FIX_AR.md (قسم التشخيص) |
| أريد فهم عميق | اقرأ الدليل كاملاً | RENDER_UPLOAD_FIX_AR.md |
| ملخص التغييرات | راجع الملفات المعدلة | RENDER_UPLOAD_QUICK_SUMMARY_AR.md |

---

## 🎉 تهانينا!

إذا أتممت جميع الخطوات بنجاح، رفع المرفقات الآن يعمل بكفاءة 100%! 🚀

**الوقت المتوقع**: 5-10 دقائق  
**مستوى الصعوبة**: سهل 🟢  
**التأثير**: حل كامل ودائم ✅

---

**آخر تحديث**: 17 ديسمبر 2025  
**الإصدار**: 1.0
