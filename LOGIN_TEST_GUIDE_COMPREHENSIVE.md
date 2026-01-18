# اختبار تدفق التسجيل والدخول - دليل عملي

## المتطلبات قبل الاختبار
- ✅ خادم التطوير يعمل على `http://localhost:9002`
- ✅ متغيرات البيئة `.env.local` محملة
- ✅ D1 متصل ويعمل
- ✅ لا توجد أخطاء في browser console

## المختبرات

### اختبار 1: تسجيل دخول بيانات اعتماد موجودة

**الخطوات:**
1. انتقل إلى `http://localhost:9002`
2. ستكون صفحة تسجيل الدخول مفتوحة بـ "Sign In" نشط
3. ادخل:
   - Email: `admin@estatecare.com`
   - Password: `admin123`
4. اضغط "Sign In" أو اضغط Ctrl/Cmd+Enter

**النتائج المتوقعة:**
- ✅ زر "Sign In" يصبح معطل (disabled) مع رمز تحميل
- ✅ لا توجد رسائل خطأ
- ✅ بعد 1-2 ثانية: توجيه إلى صفحة التطبيق الرئيسية
- ✅ URL يصبح `/accommodation` أو `/materials` حسب الاختيار السابق
- ✅ المستخدم مرئي في الزاوية العلوية اليمنى

**عند الفشل:**
- ❌ خطأ "Firebase not configured"
  - **الحل:** تحقق من `.env.local` وتأكد من وجود `NEXT_PUBLIC_FIREBASE_API_KEY=`
- ❌ خطأ "Invalid email or password"
  - **الحل:** تحقق من بيانات المستخدم في D1 (استخدم admin panel)
- ❌ بقاء الزر في حالة التحميل بدون توجيه
  - **الحل:** افتح browser console وتحقق من أي أخطاء

---

### اختبار 2: إنشاء مستخدم جديد (الحالة الحرجة)

**الخطوات:**
1. انتقل إلى `http://localhost:9002`
2. اضغط "Create new account" (أو بدل إلى Sign Up mode)
3. ادخل:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
4. اضغط "Sign Up" أو اضغط Ctrl/Cmd+Enter

**النتائج المتوقعة:**
- ✅ زر "Sign Up" يصبح معطل مع تحميل
- ✅ **أهم شيء:** لا يعلق على رسالة "Redirecting to login…"
- ✅ بعد 2-3 ثواني: توجيه إلى صفحة التطبيق
- ✅ المستخدم الجديد ينسجل في D1
- ✅ يمكن تسجيل الدخول بنفس البيانات لاحقاً

**علامات التعليق السابق (التي يجب أن تختفي):**
- ❌ ~~رسالة "Redirecting to login…" لم تختفِ أبداً~~
- ❌ ~~الزر لا يزال معطل بعد 10+ ثواني~~
- ❌ ~~لا يوجد توجيه أو redirect~~

**عند الفشل:**
- ❌ يعلق على "Redirecting to login…" بعد 5+ ثواني
  - **التشخيص:** افتح F12 وتحقق من:
    - هل `/api/auth/register` يعود بـ 200?
    - هل `/api/auth/me` يعود بـ user بعد التسجيل?
    - هل هناك timeout error من D1?
  - **الحل:** تحقق من سجلات D1 والأخطاء
  
- ❌ خطأ "User already exists"
  - **الحل:** استخدم بريد إلكتروني مختلف (لم يتم استخدامه من قبل)

- ❌ خطأ "Email already registered"
  - **الحل:** نفس الحل أعلاه

---

### اختبار 3: محاولة تسجيل دخول بدون إنترنت (D1 غير متوفر)

**الخطوات:**
1. عطل اتصال الإنترنت (أو أوقف D1)
2. حاول تسجيل دخول جديد
3. راقب الـ console والسلوك

**النتائج المتوقعة:**
- ✅ يظهر timeout بعد 5 ثواني (من `ensureUserProfile`)
- ✅ في وضع التطوير: الخطأ يتم تسجيله لكن لا يحجب المستخدم
- ✅ التوجيه يحدث بشكل طبيعي (fallback mode)
- ✅ في F12 console: رسالة `D1 ensureUserProfile failed: ...`

**الملاحظة:**
- في الإنتاج، قد يكون السلوك مختلفاً (أكثر تقيداً)
- التركيز هنا على عدم التعليق/المجمد

---

### اختبار 4: سرعة Polling (يجب أن يكون سريعاً)

**الخطوات:**
1. فتح صفحتين من التطبيق في علامات تبويب مختلفة
2. سجل الدخول في علامة تبويب واحدة
3. انتظر قليلاً ثم راقب علامة التبويب الأخرى

**النتائج المتوقعة:**
- ✅ يجب أن ترى تحديث المستخدم في علامة التبويب الأخرى خلال 5 ثواني
- ✅ في browser console: رسائل `[AUTH ME] token verified` متكررة

**قبل الإصلاح (30 ثانية polling):**
- ❌ انتظار طويل (30 ثانية) لرؤية التحديث

**بعد الإصلاح (5 ثواني polling):**
- ✅ تحديث سريع جداً

---

### اختبار 5: عدم وجود رسالة "Firebase not configured"

**الخطوات:**
1. انتقل إلى `http://localhost:9002`
2. افتح F12 واذهب إلى console
3. ابحث عن أي dialog حمراء (error dialog) تقول "Firebase not configured"

**النتائج المتوقعة:**
- ✅ لا توجد رسالة خطأ حمراء عند التحميل الأولي
- ✅ قد تجد رسائل console عادية (logs) لكن لا توجد uncaught errors

**عند الفشل:**
- ❌ يظهر dialog أحمر: "Firebase is not configured. Please configure Firebase..."
  - **السبب:** `.env.local` يفتقد `NEXT_PUBLIC_FIREBASE_*` متغيرات
  - **الحل:** أعد تحديث `.env.local` بالمتغيرات الفارغة:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    ...
    ```

---

## سجل الفحوصات

### الحد الأدنى من الفحوصات المطلوبة:
- [ ] اختبار 1: تسجيل دخول موجود ✅
- [ ] اختبار 2: إنشاء مستخدم جديد بدون تعليق ✅
- [ ] اختبار 3: السلوك مع D1 معطل ✅
- [ ] اختبار 4: سرعة polling < 5 ثواني ✅
- [ ] اختبار 5: لا توجد رسالة Firebase error ✅

### التحقق من Console:
- [ ] افتح F12 → Console
- [ ] لا توجد أخطاء حمراء (Uncaught Error)
- [ ] قد توجد رسائل زرقاء (logs) طبيعية

### التحقق من Network:
- [ ] افتح F12 → Network
- [ ] انقر على "Sign Up"
- [ ] يجب أن ترى:
  1. POST `/api/auth/register` → 200 OK
  2. GET `/api/auth/me` → 200 OK مع user
  3. ربما عدة GET `/api/auth/me` من polling

---

## الأخطاء الشائعة والحلول

### خطأ: "address already in use :::9002"
**السبب:** خادم التطوير قد يكون قيد التشغيل بالفعل
**الحل:**
```bash
# قتل العملية على المنفذ 9002
lsof -ti:9002 | xargs kill -9  # MacOS/Linux
netstat -ano | findstr :9002   # Windows (ابحث عن PID وقتله)
```

### خطأ: ECONNREFUSED على /api/auth/*
**السبب:** خادم التطوير توقف أو لم يبدأ
**الحل:**
```bash
npm run dev
# ستتوقع: "ready - started server on 0.0.0.0:3000, url: http://localhost:3000"
```

### خطأ: "D1 is not configured"
**السبب:** D1_DATABASE_ID أو D1_DATABASE_NAME مفقود
**الحل:**
```env
D1_DATABASE_ID=802520b7-431f-40c7-8399-3ed056744e89
D1_DATABASE_NAME=estatecare-db
```

### خطأ: تسجيل الدخول يعود "Invalid email or password"
**السبب:** بيانات المستخدم غير صحيحة أو لم تُنشأ
**الحل:**
1. استخدم واحداً من المستخدمات المسبقة (انظر `.env.local`)
2. أو أنشئ مستخدماً جديداً أولاً عبر Sign Up

---

## التوثيق المرجعي

### ملفات معدلة:
- `src/components/auth/login-form.tsx` - تحسينات `ensureUserProfile()` و `handleEmailPassword()`
- `src/lib/auth-shim.ts` - تحسينات `fetchMe()` و polling

### ملفات ذات صلة:
- `src/lib/auth.ts` - دوال JWT والتحقق
- `src/app/api/auth/register/route.ts` - نقطة نهاية التسجيل
- `src/app/api/auth/login/route.ts` - نقطة نهاية تسجيل الدخول
- `src/app/api/auth/me/route.ts` - جلب حالة المستخدم الحالي
- `.env.local` - متغيرات البيئة

### المنطق الرئيسي:
1. **الشكل:** يجمع email, password, name
2. **POST /api/auth/register:** ينشئ مستخدماً، يعود بـ JWT tokens
3. **ensureUserProfile():** يضمن وجود ملف المستخدم في D1
4. **redirectAfterLogin():** يوجه بناءً على appChoice
5. **onAuthStateChanged():** يراقب حالة المستخدم كل 5 ثواني

---

## ملاحظات إضافية

### لماذا 5 ثواني polling وليس 1 ثانية؟
- توازن بين السرعة والأداء
- تقليل عدد API requests غير الضرورية
- منع throttling من الخادم

### لماذا 500ms تأخير قبل redirect في signup؟
- يعطي وقت لمعالج الحالة ليتحدث
- يضمن أن `/api/auth/me` سيعود بـ user محدث
- يمنع race condition بين redirect و listener update

### هل يمكن تعطيل بعض هذه الإصلاحات؟
- **لا:** جميع الإصلاحات حرجة للوظائف الأساسية
- لكن يمكن ضبط القيم (5s → 3s، 500ms → 100ms) للاختبار

