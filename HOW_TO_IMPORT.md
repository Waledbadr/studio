# 📥 كيف أستورد بياناتي؟

## ✨ طريقة واحدة - أمر واحد:

```bash
npm run parse:text && npm run validate:workers workers-converted.json && npm run import:workers
```

**انتهى! 🎉**

### أو بخطوات منفصلة:

```bash
# 1. حوّل text إلى JSON
npm run parse:text

# 2. تحقق من صحة JSON
npm run validate:workers workers-converted.json

# 3. استورد
npm run import:workers
```

---

## 📋 ما يجب أن يحتويه ملفك:

ضع في ملف `workers.txt` على Desktop:

```
40097  أحمد محمد  2059537999  سعودي  شركة المقاولات  Worker
50123  محمد علي   1234567890  مصري   شركة الصيانة     Supervisor
60789  خالد أحمد  5555555555  سوري   شركة الكهرباء     Engineer
```

### الترتيب:
1. رقم الموظف (مثل: 40097)
2. الاسم
3. رقم الهوية (مثل: 2059537999)
4. الجنسية
5. الشركة
6. الدور (Worker / Supervisor / Engineer)

---

## ⚠️ ملاحظات مهمة:

- ✅ يمكن استخدام **فواصل** (`,`) أو **مسافات** أو **tabs** بين الأعمدة
- ✅ يمكن تكرار رقم الموظف لأشخاص مختلفين في شركات مختلفة
- ✅ رقم الهوية يجب أن يكون فريداً لكل شخص
- ✅ الاسم فقط إجباري، باقي الحقول اختيارية

---

## ✅ التحقق من صحة JSON:

قبل الاستيراد، يمكنك التحقق من صحة الملف:

```bash
npm run validate:workers data/workers-sample.json
```

ستحصل على تقرير مفصل يتضمن:
- ✅ صحة تنسيق JSON
- ✅ وجود الحقول المطلوبة
- ✅ إحصائيات عن البيانات
- ✅ معاينة السجلات
- ✅ تحذيرات عن التكرارات

---

## 🔧 إذا حدثت مشكلة:

### مشكلة 1: ملف غير موجود

ضع الملف في:
```
C:\Users\MohammedAlabdali\Desktop\workers.txt
```

أو حدد المسار:
```bash
node scripts/parse-text-workers.mjs "المسار\الكامل\للملف.txt"
```

### مشكلة 2: تنسيق غير صحيح

جرّب إضافة headers في أول سطر:
```
employeeId,name,idNumber,nationality,company,role
40097,أحمد محمد,2059537999,سعودي,شركة المقاولات,Worker
```

---

## 🎯 خطوات مفصلة (للمبتدئين):

### الخطوة 1: افتح PowerShell

اضغط `Win + X` واختر `Windows PowerShell`

### الخطوة 2: اذهب لمجلد المشروع

```bash
cd D:\EstateCare\studio
```

### الخطوة 3: حوّل الملف

```bash
npm run parse:text
```

سيُنشئ ملف `workers-converted.json`

### الخطوة 4: استورد

```bash
npm run import:workers
```

### الخطوة 5: تحقق

```bash
npm run dev
```

ثم افتح: http://localhost:9002/accommodation/workers

---

## 📞 للمساعدة:

راجع:
- `WORKERS_IMPORT_README.md` - دليل سريع
- `WORKERS_IMPORT_UPDATE.md` - التحديثات الجديدة
- `docs/WORKERS_IMPORT_GUIDE.md` - الدليل الكامل
