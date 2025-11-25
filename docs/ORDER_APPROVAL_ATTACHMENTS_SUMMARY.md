# ملخص التحديث: إضافة مرفقات الموافقة على طلبات المواد

## التاريخ
2025-11-18

## نظرة عامة
تم إضافة ميزة احترافية لرفع مرفقات موقعة من المدير العام عند الموافقة على طلبات المواد (Material Requests).

## الملفات المضافة/المعدلة

### 1. الملفات الجديدة
✅ `src/app/api/uploads/order-approval/route.ts`
   - Endpoint لرفع المرفقات إلى Vercel Blob Storage
   - يدعم ملفات حتى 15MB
   - التحقق من نوع الملف

✅ `src/components/inventory/approval-attachment-dialog.tsx`
   - Dialog احترافي لرفع المرفقات
   - Drag-and-drop support
   - معاينة الملف
   - خياران: رفع مع مرفق أو بدون مرفق

✅ `docs/ORDER_APPROVAL_ATTACHMENTS.md`
   - توثيق تقني شامل (إنجليزي)

✅ `docs/ORDER_APPROVAL_ATTACHMENTS_AR.md`
   - دليل المستخدم (عربي)

### 2. الملفات المعدلة
✅ `src/context/orders-context.tsx`
   - تحديث `updateOrderStatus` لدعم `attachmentData` parameter
   - حفظ بيانات المرفق في Firestore

✅ `src/app/inventory/orders/[id]/page.tsx`
   - استيراد `ApprovalAttachmentDialog`
   - استيراد icons: `FileText`, `Download`
   - إضافة state: `showApprovalDialog`
   - تحديث `handleApprove` لفتح Dialog
   - إضافة `handleApproveWithAttachment`
   - إضافة section لعرض المرفقات المرفوعة

## المميزات الرئيسية

### 1. واجهة مستخدم احترافية
- Dialog منسق بالكامل بالعربية (RTL)
- Drag-and-drop للملفات
- معاينة الملف المختار مع الحجم
- خياران واضحان: مع مرفق أو بدون
- رسائل خطأ وتوضيحية

### 2. أمان وتحقق
- التحقق من نوع الملف
- التحقق من حجم الملف (15MB max)
- دعم التنسيقات: PDF, JPG, PNG, WEBP, DOC, DOCX

### 3. عرض المرفقات
- قسم خاص في صفحة التفاصيل للطلبات المعتمدة
- عرض اسم الملف وتاريخ الرفع
- زر تحميل احترافي

### 4. مرونة كاملة
- رفع المرفق **اختياري**
- لا يعطل سير العمل الحالي
- متوافق مع الأنماط الموجودة

## البيانات المحفوظة في Firestore

```javascript
orders/{orderId} {
  // ... الحقول الموجودة
  approvalAttachmentUrl: "https://...",
  approvalAttachmentPath: "orders/approvals/...",
  approvalAttachmentName: "document.pdf",
  approvalAttachmentUploadedAt: Timestamp,
  approvalAttachmentUploadedById: "userId"
}
```

## سير العمل

1. **المدير يفتح طلب مواد معلق**
   - يضغط على زر "Approve"

2. **يفتح Dialog احترافي**
   - يوضح أن المرفق اختياري
   - يوفر خيارين واضحين

3. **اختيار أحد الخيارات**:
   - **مع مرفق**: رفع ملف + موافقة
   - **بدون مرفق**: موافقة مباشرة

4. **حفظ البيانات**
   - إذا تم رفع مرفق: يُحفظ في Vercel Blob
   - تُحدث حالة الطلب إلى "Approved"
   - تُحفظ معلومات المرفق في Firestore

5. **عرض المرفق**
   - يظهر قسم المرفق في صفحة التفاصيل
   - يمكن تحميل المرفق في أي وقت

## الاختبار المطلوب

### اختبار أساسي
- [ ] رفع مرفق PDF والموافقة
- [ ] رفع صورة JPG والموافقة
- [ ] الموافقة بدون مرفق
- [ ] عرض المرفق بعد الموافقة
- [ ] تحميل المرفق

### اختبار الأخطاء
- [ ] محاولة رفع ملف أكبر من 15MB
- [ ] محاولة رفع ملف بتنسيق غير مدعوم
- [ ] إلغاء Dialog
- [ ] حذف ملف واختيار آخر

### اختبار المتصفحات
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## ملاحظات تقنية

- ✅ لا توجد breaking changes
- ✅ متوافق مع البنية الحالية
- ✅ يتبع نفس أنماط الكود الموجودة
- ✅ يستخدم نفس Blob token للـ MRV invoices
- ✅ جميع الـ interfaces موجودة مسبقاً
- ✅ لا حاجة لتعديل Firestore rules (الحقول optional)

## المتطلبات البيئية
- يحتاج `BLOB_READ_WRITE_TOKEN` في `.env` (موجود بالفعل)

## الخطوات التالية (اختياري)
1. دعم مرفقات متعددة
2. معاينة المرفقات داخل التطبيق
3. إمكانية استبدال المرفق
4. سجل تاريخي للمرفقات

## الحالة
✅ **مكتمل وجاهز للاختبار**

جميع الملفات تم إنشاؤها/تعديلها بنجاح
لا توجد أخطاء في TypeScript
الميزة جاهزة للاستخدام
