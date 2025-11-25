# 📥 استيراد بيانات العمال - الدليل الكامل

## 🎯 نظرة سريعة

نظام متكامل لاستيراد بيانات العمال من ملفات text أو JSON إلى قاعدة بيانات Firestore مع دعم:
- رقم الموظف (`employeeId`): مثل 40097
- رقم الهوية (`idNumber`): مثل 2059537999
- الشركة (`company`)
- التحقق التلقائي من صحة البيانات

---

## ⚡ البدء السريع

### الطريقة الأسهل (3 أوامر):

```bash
npm run parse:text                              # حوّل text إلى JSON
npm run validate:workers workers-converted.json  # تحقق من صحة JSON
npm run import:workers                          # استورد إلى قاعدة البيانات
```

### أو كل شيء في أمر واحد:

```bash
npm run parse:text && npm run validate:workers workers-converted.json && npm run import:workers
```

---

## 📋 تنسيق ملف text

ضع ملفك في: `C:\Users\MohammedAlabdali\Desktop\workers.txt`

### التنسيقات المدعومة:

#### 1. بفواصل (CSV):
```
40097,أحمد محمد,2059537999,سعودي,شركة المقاولات,Worker
50123,محمد علي,1234567890,مصري,شركة الصيانة,Supervisor
```

#### 2. بمسافات:
```
40097    أحمد محمد    2059537999    سعودي    شركة المقاولات    Worker
50123    محمد علي    1234567890    مصري     شركة الصيانة      Supervisor
```

#### 3. بـ tabs:
```
40097	أحمد محمد	2059537999	سعودي	شركة المقاولات	Worker
50123	محمد علي	1234567890	مصري	شركة الصيانة	Supervisor
```

#### 4. مع headers:
```
employeeId,name,idNumber,nationality,company,role
40097,أحمد محمد,2059537999,سعودي,شركة المقاولات,Worker
50123,محمد علي,1234567890,مصري,شركة الصيانة,Supervisor
```

**المحلل الذكي سيكتشف التنسيق تلقائياً!** 🤖

---

## 📊 تنسيق JSON

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

## 🛠️ الأدوات المتوفرة

| الأمر | الوصف | متى تستخدمه |
|------|-------|-------------|
| `npm run parse:text` | محلل ذكي لملفات text | لديك ملف text بأي تنسيق |
| `npm run validate:workers file.json` | تحقق من صحة JSON | قبل الاستيراد دائماً |
| `npm run convert:workers in.csv out.json` | محوّل متقدم | ملفات CSV/TSV معقدة |
| `npm run import:workers` | استيراد إلى Firestore | بعد التحقق من الصحة |

---

## ✅ أداة التحقق

### لماذا تستخدمها؟

- ✅ تتأكد من صحة تنسيق JSON
- ✅ تفحص وجود الحقول المطلوبة
- ✅ تعطيك إحصائيات مفصلة
- ✅ تكتشف التكرارات
- ✅ تعرض معاينة للبيانات

### مثال على الاستخدام:

```bash
npm run validate:workers data/workers-sample.json
```

### مثال على التقرير:

```
🔍 Workers JSON Validator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Valid JSON format
📊 Found 5 workers

✅ All workers are valid!

📊 Statistics:
   Total workers:        5
   Valid:                5
   With Employee ID:     5 (100%)
   With National ID:     5 (100%)
   With Company:         5 (100%)

⚠️  Duplicate Employee IDs found:
   Employee ID 40097 appears in workers #1, 5
      - أحمد محمد (شركة المقاولات)
      - سعيد علي (شركة الصيانة)
      ✅ Different people (different National IDs) - This is OK!

✅ File is ready for import!
```

---

## 📦 الحقول المدعومة

| الحقل | إجباري؟ | مثال | الوصف |
|------|---------|------|-------|
| `name` | ✅ نعم | "أحمد محمد" | اسم العامل |
| `employeeId` | ❌ لا | "40097" | رقم الموظف - يمكن تكراره في شركات مختلفة |
| `idNumber` | ❌ لا | "2059537999" | رقم الهوية الوطنية - فريد لكل شخص |
| `nationaliy` | ❌ لا | "سعودي" | الجنسية |
| `company` | ❌ لا | "شركة المقاولات" | الشركة |
| `role` | ❌ لا | "Worker" | Worker / Supervisor / Engineer |
| `id` | ❌ لا | "w001" | معرّف النظام - يُولّد تلقائياً |

---

## 🎯 أمثلة عملية

### مثال 1: استيراد من text

```bash
# 1. لديك: workers.txt
# 2. حوّل:
npm run parse:text

# 3. تحقق:
npm run validate:workers workers-converted.json

# 4. استورد:
npm run import:workers
```

### مثال 2: استيراد من JSON جاهز

```bash
# 1. لديك: mydata.json
# 2. تحقق:
npm run validate:workers mydata.json

# 3. استورد:
npm run import:workers
```

### مثال 3: تكرار الرقم الوظيفي

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

✅ **مسموح!** نفس `employeeId` لكن أشخاص مختلفون

---

## 🔧 استكشاف الأخطاء

### خطأ: "Invalid JSON format"

**السبب:** تنسيق JSON غير صحيح

**الحل:**
```bash
# استخدم أداة التحقق لمعرفة الخطأ
npm run validate:workers file.json

# أو تحقق على الإنترنت
# https://jsonlint.com/
```

### خطأ: "File not found"

**الحل:**
```bash
# حدد المسار الكامل
node scripts/parse-text-workers.mjs "C:\المسار\الكامل\workers.txt"
```

### خطأ: "Missing 'name' field"

**السبب:** عامل بدون اسم

**الحل:** تأكد من أن كل سطر يحتوي على اسم

---

## 💡 نصائح للنجاح

1. **ابدأ صغيراً:** اختبر بـ 5-10 عمال أولاً
2. **استخدم التحقق:** دائماً قبل الاستيراد
3. **احفظ نسخة احتياطية:** من ملفك الأصلي
4. **راجع التقرير:** تأكد من عدم وجود أخطاء
5. **استخدم IDs فريدة:** لتسهيل التحديثات

---

## 📚 ملفات إضافية

- `HOW_TO_IMPORT.md` - دليل سريع للمستخدم
- `WORKERS_IMPORT_UPDATE.md` - التحديثات الجديدة
- `WORKERS_IMPORT_FINAL.md` - الملخص الشامل
- `data/workers-sample.json` - عينة جاهزة للاختبار

---

## 🎉 الخلاصة

**النظام يوفر لك:**
- ✅ محلل ذكي لأي تنسيق
- ✅ محقق JSON شامل
- ✅ معالجة تكرارات ذكية
- ✅ تقارير مفصلة
- ✅ استيراد آمن

**جاهز للاستخدام الآن!** 🚀

---

**الإصدار:** 2.1.0  
**آخر تحديث:** 9 أكتوبر 2025
