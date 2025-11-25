# 🎉 استيراد بيانات العمال - دليل سريع محدّث

## ✨ التحديثات الجديدة:

تم إضافة دعم:
- ✅ **رقم الموظف** (`employeeId`): مثل `40097` - يمكن تكراره
- ✅ **رقم الهوية** (`idNumber`): مثل `2059537999` - فريد
- ✅ **الشركة** (`company`): لتمييز نفس الموظف في شركات مختلفة
- ✅ **محلل ذكي** لملفات text العادية

---

## 🚀 استيراد سريع (3 خطوات):

### إذا كان ملفك JSON:

```bash
npm run import:workers
```

### إذا كان ملفك text عادي:

```bash
# 1. حوّل text إلى JSON
npm run parse:text

# 2. استورد
npm run import:workers
```

**تم! 🎉**

---

## 📋 تنسيق ملف text المدعوم:

يمكنك استخدام أي من هذه التنسيقات:

### تنسيق 1: فواصل
```
40097,أحمد محمد,2059537999,سعودي,شركة المقاولات,Worker
50123,محمد علي,1234567890,مصري,شركة الصيانة,Supervisor
```

### تنسيق 2: مسافات أو tabs
```
40097    أحمد محمد    2059537999    سعودي    شركة المقاولات    Worker
50123    محمد علي    1234567890    مصري     شركة الصيانة      Supervisor
```

### تنسيق 3: مع headers
```
employeeId  name        idNumber    nationality  company           role
40097       أحمد محمد   2059537999  سعودي       شركة المقاولات   Worker
50123       محمد علي    1234567890  مصري        شركة الصيانة     Supervisor
```

**المحلل الذكي سيكتشف التنسيق تلقائياً!** 🤖

---

## 📊 مثال JSON كامل:

```json
[
  {
    "name": "أحمد محمد",
    "employeeId": "40097",
    "idNumber": "2059537999",
    "nationaliy": "سعودي",
    "company": "شركة المقاولات",
    "role": "Worker"
  },
  {
    "name": "محمد علي",
    "employeeId": "50123",
    "idNumber": "1234567890",
    "nationaliy": "مصري",
    "company": "شركة الصيانة",
    "role": "Supervisor"
  }
]
```

---

## 🎯 حالات خاصة:

### ✅ تكرار الرقم الوظيفي (مسموح):

```json
[
  {
    "name": "أحمد محمد",
    "employeeId": "40097",
    "idNumber": "2059537999",
    "company": "شركة المقاولات"
  },
  {
    "name": "سعيد علي",
    "employeeId": "40097",
    "idNumber": "3333333333",
    "company": "شركة الصيانة"
  }
]
```

نفس `employeeId` لكن أشخاص مختلفون (`idNumber` مختلف) وشركات مختلفة ✅

---

## 🛠️ الأوامر المتاحة:

```bash
# محلل ذكي لملفات text
npm run parse:text

# تحويل CSV/TSV
npm run convert:workers input.csv output.json

# استيراد مباشر
npm run import:workers

# الواجهة الإدارية
npm run dev
# ثم: http://localhost:9002/admin/import-workers
```

---

## 📚 الحقول:

| الحقل | إجباري؟ | مثال | الوصف |
|------|---------|------|-------|
| `name` | ✅ | "أحمد محمد" | الاسم |
| `employeeId` | ❌ | "40097" | رقم الموظف |
| `idNumber` | ❌ | "2059537999" | رقم الهوية |
| `nationaliy` | ❌ | "سعودي" | الجنسية |
| `company` | ❌ | "شركة المقاولات" | الشركة |
| `role` | ❌ | "Worker" | الدور |

---

## ⚡ أسرع طريقة:

ضع ملفك في:
```
C:\Users\MohammedAlabdali\Desktop\workers.txt
```

ثم:
```bash
npm run parse:text && npm run import:workers
```

**انتهى! 🚀**

---

## 📖 المزيد من التفاصيل:

- **الدليل الشامل:** `docs/WORKERS_IMPORT_GUIDE.md`
- **التحديثات:** `WORKERS_IMPORT_UPDATE.md`
- **أمثلة:** `docs/workers-data-examples.json`

---

**الإصدار:** 2.0.0  
**آخر تحديث:** 9 أكتوبر 2025
