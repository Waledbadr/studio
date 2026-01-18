# 🧪 دليل اختبار تسجيل الدخول - بعد الإصلاح

## ✅ المشاكل التي تم إصلاحها

### 1. Type Safety في seed-local-user ✅
- **المشكلة:** `await req.json()` يُرجع `unknown` type
- **الحل:** `const body = await req.json() as any;`
- **الملف:** `src/app/api/seed-local-user/route.ts`

### 2. دوال مفقودة في d1-client.ts ✅
- **المشكلة:** الدوال موجودة في `d1-actions.ts` لكن لم تُصدّر في `d1-client.ts`
- **الحل:** تم إضافة:
  - `getUser(id)`
  - `getUserByEmail(email)`
  - `createUser(id, data)`
  - `updateUser(id, data)`
  - `setUserPasswordHash(id, hash)`
- **الملف:** `src/lib/d1-client.ts`

---

## 🚀 خطوات الاختبار العملية

### **المرحلة 1: إعداد البيئة**

```bash
# 1. التأكد من تثبيت الحزم
npm install

# 2. التحقق من ملف .env.local
# تأكد من وجود:
# - JWT_PRIVATE_KEY
# - JWT_PUBLIC_KEY
# - D1_DATABASE_ID
# - NEXT_PUBLIC_USE_D1=true

# 3. تشغيل الخادم
npm run dev

# في نافذة منفصلة (اختياري للحصول على D1 كامل):
npm run dev:d1
```

### **المرحلة 2: إنشاء مستخدم اختبار**

#### الطريقة الأولى: استخدام API (للتطوير المحلي)

```bash
# إنشاء مستخدم من خلال seed endpoint
curl -X POST http://localhost:9002/api/seed-local-user \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@estatecare.com",
    "password":"password123",
    "name":"Test User",
    "role":"Admin"
  }' | jq .

# الرد المتوقع:
# {
#   "ok": true,
#   "message": "User seeded (in-memory for local dev)...",
#   "user": {
#     "id": "user_1737250000_abc123",
#     "email": "test@estatecare.com",
#     "name": "Test User",
#     "role": "Admin"
#   }
# }
```

#### الطريقة الثانية: استخدام المستخدمين المعرّفين مسبقاً

من `.env.local`:
```
admin@estatecare.com / admin123
manager@estatecare.com / manager123
maintenance@estatecare.com / tech123
```

### **المرحلة 3: اختبار API تسجيل الدخول**

```bash
# حفظ cookies في ملف
curl -X POST http://localhost:9002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@estatecare.com",
    "password":"password123"
  }' \
  -c cookies.txt | jq .

# الرد المتوقع:
# {
#   "ok": true,
#   "user": {
#     "id": "user_1737250000_abc123",
#     "email": "test@estatecare.com",
#     "name": "Test User"
#   }
# }

# ملاحظة: تم تعيين cookies تلقائياً:
# - access_token (15 دقيقة)
# - refresh_token (30 يوم)
```

### **المرحلة 4: اختبار endpoint التحقق من الجلسة**

```bash
# قراءة بيانات المستخدم من الجلسة الحالية
curl -X GET http://localhost:9002/api/auth/me \
  -b cookies.txt | jq .

# الرد المتوقع:
# {
#   "ok": true,
#   "user": {
#     "id": "user_1737250000_abc123",
#     "email": "test@estatecare.com",
#     "name": "Test User",
#     "role": "Admin"
#   }
# }
```

### **المرحلة 5: اختبار الواجهة الأمامية**

```bash
# 1. افتح المتصفح
http://localhost:9002

# 2. انقر على صفحة تسجيل الدخول

# 3. أدخل بيانات الاعتماد
Email: test@estatecare.com
Password: password123

# 4. انقر "Sign in"

# ✅ النتيجة المتوقعة:
# - يجب أن يُعاد التوجيه إلى /accommodation أو /inventory
# - يجب أن تظهر بيانات المستخدم
```

---

## 🔍 خطوات التحقق من التشخيص

### التحقق 1: هل الخادم يعمل؟

```bash
curl http://localhost:9002/api/health
# يجب أن ترى: { "ok": true }
```

### التحقق 2: هل D1 متصل؟

```bash
curl -X POST http://localhost:9002/api/d1 \
  -H "Content-Type: application/json" \
  -d '{"action":"getResidences","args":[]}'

# إذا كان D1 متصلاً:
# { "ok": true, "result": [...] }

# إذا كان D1 غير متصل (expected في pure Next dev):
# { "ok": false, "error": "D1 binding missing" }
```

### التحقق 3: هل JWT يعمل؟

```bash
# جرّب توقيع واختبار JWT
# (تحتاج إلى token من /api/auth/login أولاً)

curl -X GET http://localhost:9002/api/auth/me \
  -H "Cookie: access_token=YOUR_TOKEN_HERE" | jq .
```

### التحقق 4: هل in-memory store يعمل؟

```bash
# أنشئ مستخدم من خلال seed endpoint
curl -X POST http://localhost:9002/api/seed-local-user \
  -H "Content-Type: application/json" \
  -d '{"email":"local@test.com","password":"pass","name":"Local","role":"User"}'

# يجب أن تحصل على استجابة نجاح حتى بدون D1
```

---

## 🚨 استكشاف الأخطاء

### ❌ الخطأ: "Cannot POST /api/auth/login"

```
السبب: المسار غير موجود أو خادم لم يبدأ
الحل:
1. تأكد من npm run dev يعمل
2. تأكد من الملف: src/app/api/auth/login/route.ts موجود
```

### ❌ الخطأ: "JWT private key missing"

```
السبب: متغير البيئة JWT_PRIVATE_KEY غير محدد
الحل:
1. تحقق من .env.local
2. تأكد من وجود JWT_PRIVATE_KEY و JWT_PUBLIC_KEY
3. أعد تشغيل الخادم بعد التعديل
```

### ❌ الخطأ: "User not found"

```
السبب: المستخدم لم ينشأ بعد
الحل:
1. استخدم /api/seed-local-user لإنشاء مستخدم
2. أو استخدم المستخدمين المعرّفين في .env.local
```

### ❌ الخطأ: "Invalid password"

```
السبب: كلمة المرور خاطئة أو المستخدم لم ينشأ صحيحاً
الحل:
1. تحقق من كلمة المرور
2. أعد إنشاء المستخدم بـ /api/seed-local-user
```

### ❌ الخطأ: "Cannot read property 'getUser' of undefined"

```
السبب: D1Client غير محدد (كان هذا الخطأ الرئيسي)
الحل: ✅ تم إصلاحه! الدالة أضيفت إلى d1-client.ts
```

### ❌ الخطأ: "D1 binding missing"

```
السبب: D1 غير متوفر، لكن fallback يجب أن يعمل
الحل:
1. استخدم /api/seed-local-user لإنشاء مستخدمين محليين
2. أو شغّل npm run dev:d1 لـ D1 كامل
```

---

## 📋 قائمة اختبار شاملة

```
[ ] 1. الخادم يعمل على localhost:9002
[ ] 2. /api/health يرد بنجاح
[ ] 3. تم إنشاء مستخدم اختبار بـ /api/seed-local-user
[ ] 4. تسجيل دخول عبر /api/auth/login نجح
[ ] 5. cookies تم تعيينها (access_token, refresh_token)
[ ] 6. /api/auth/me يرد ببيانات المستخدم
[ ] 7. الواجهة الأمامية تحمل بدون أخطاء
[ ] 8. نموذج تسجيل الدخول يعمل
[ ] 9. تسجيل الدخول يعيد التوجيه إلى /accommodation
[ ] 10. معلومات المستخدم تظهر في الشريط العلوي
```

---

## 🎯 النتائج المتوقعة

### ✅ تسجيل دخول ناجح

```
1. المستخدم يدخل email و password
2. يضغط Sign In
3. /api/auth/login يعالج الطلب
4. Cookies يتم تعيينها
5. auth-shim يحدث currentUser
6. onAuthStateChanged يُطلق
7. redirectAfterLogin() يعمل
8. يعود التوجيه إلى /accommodation
9. التطبيق يحمل بيانات المستخدم
```

### ✅ API Responses

```
POST /api/seed-local-user
├─ 200 ✓ User created
├─ 400 ✗ Missing email/password
└─ 500 ✗ Server error

POST /api/auth/login
├─ 200 ✓ Logged in (cookies set)
├─ 400 ✗ Invalid credentials
└─ 500 ✗ Server error

GET /api/auth/me
├─ 200 ✓ User data (with auth)
└─ 200 ✓ user: null (no auth)
```

---

## 📝 ملاحظات التطوير

### In-Memory Store
- يُستخدم كـ fallback عندما يكون D1 غير متاح
- يُحفظ فقط أثناء جلسة التطوير الحالية
- يُفقد عند إعادة تشغيل الخادم

### JWT Tokens
- Private Key: للتوقيع
- Public Key: للتحقق
- كلاهما موجود في .env.local

### D1 Connection
- الأفضل: `npm run dev:d1` (D1 كامل)
- البديل: `npm run dev` + `/api/seed-local-user` (in-memory)

---

## 🔄 سير العملية الكامل

```
┌─────────────────────────────────────────────────────────────────┐
│                     المستخدم يفتح /login                        │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              يملأ Email و Password و يضغط Sign In               │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│         handleEmailPassword() → POST /api/auth/login             │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│    /api/auth/login/route.ts                                      │
│    1. استخراج email + password                                 │
│    2. استدعاء authenticateUser()                               │
│       ├─ البحث في D1 (getUser/getUserByEmail)                │
│       └─ fallback لـ in-memory                                 │
│    3. التحقق من bcrypt.compare(password, hash)               │
│    4. توقيع JWT tokens                                        │
│    5. حفظ cookies                                              │
│    6. إرجاع بيانات المستخدم                                   │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│    auth-shim يحدّث currentUser                                  │
│    listeners.forEach(cb => cb(currentUser))                    │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│    login-form.tsx onAuthStateChanged listener يُطلق             │
│    if (u) redirectAfterLogin()                                 │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│    التوجيه إلى /accommodation أو /inventory                    │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│    ✅ نجاح تسجيل الدخول                                        │
│    المستخدم الآن مسجل دخول                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎉 ملخص

**تم إصلاح المشاكل التالية:**
1. ✅ Type Safety في seed-local-user
2. ✅ دوال مفقودة في d1-client.ts

**يجب أن يعمل تسجيل الدخول الآن!** 🚀

جرّب اختبار الخطوات المذكورة أعلاه والتحقق من أن كل شيء يعمل كما هو متوقع.
