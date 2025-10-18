# 🚀 خطة التنفيذ: تقليل استهلاك Firestore

## المرحلة 1: الإعداد الأساسي ✅ (تم)

### ما تم إنجازه:
- [x] إنشاء `src/lib/server-cache.ts`
- [x] إنشاء `src/lib/smart-cache.ts`
- [x] إنشاء `src/app/api/cache/route.ts`
- [x] تحديث `src/app/api/accommodation/assign/route.ts`
- [x] كتابة التوثيق الكامل

### الوقت: 2 ساعة ✅

---

## المرحلة 2: الاختبار الأولي 🔄 (الآن)

### الخطوات:

#### 1. شغل التطبيق
```bash
cd d:\EstateCare\studio
npm run dev
```

#### 2. اختبر Cache API
```bash
# احصل على إحصائيات
curl http://localhost:9002/api/cache/stats

# النتيجة المتوقعة:
{
  "ok": true,
  "stats": {
    "totalKeys": 0,
    "entries": []
  }
}
```

#### 3. اختبر assign endpoint
```bash
curl -X POST http://localhost:9002/api/accommodation/assign \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "test_worker_id",
    "residenceId": "test_residence_id",
    "roomId": "test_room_id"
  }'
```

#### 4. راقب Logs
ابحث عن:
```
⚠️ [Cache MISS] workers:all - fetching from Firestore...
💾 [Cache SET] workers:all (TTL: 600s)
```

#### 5. اختبر مرة ثانية (بعد 10 ثوانٍ)
```bash
# نفس الـ request
curl -X POST http://localhost:9002/api/accommodation/assign ...

# يجب أن ترى:
✅ [Cache HIT] workers:all (age: 10s)
```

### الوقت: 30 دقيقة

---

## المرحلة 3: تحديث Context 🔄 (التالي)

### الملف: `src/context/accommodation-context.tsx`

#### الخطوة 1: استيراد Smart Cache
```typescript
import { smartCache, createPollingListener } from '@/lib/smart-cache';
```

#### الخطوة 2: استبدال workers listener
```typescript
// قبل:
useEffect(() => {
  if (!db) return;
  const unsub = onSnapshot(collection(db, 'workers'), (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setWorkers(list);
  });
  return () => unsub();
}, [db]);

// بعد:
useEffect(() => {
  if (!db) return;
  
  const cleanup = createPollingListener(
    'workers',
    async () => {
      const snap = await getDocs(collection(db, 'workers'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    (data) => setWorkers(data),
    { immediate: true }
  );
  
  return cleanup;
}, [db]);
```

#### الخطوة 3: كرر لكل collection
- workers ✅
- occupants
- companies
- contracts
- invoices
- accommodationHistory

### الوقت: 1 ساعة

---

## المرحلة 4: تحديث API Endpoints 🔄

### الملفات:

#### 1. `/api/accommodation/search/route.ts`
```typescript
import serverCache from '@/lib/server-cache';

// استبدل
const workersSnapshot = await adminDb.collection('workers').get();

// بـ
const workers = await serverCache.get(
  'workers:all',
  async () => {
    const snap = await adminDb.collection('workers').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  10 * 60 * 1000
);
```

#### 2. `/api/accommodation/assign/csv/route.ts`
```typescript
// استبدل الـ Promise.all
const [workersSnap, occupantsSnap, residencesSnap] = await Promise.all([...]);

// بـ
const [workers, occupants, residences] = await Promise.all([
  serverCache.get('workers:all', fetchWorkers, 10 * 60 * 1000),
  serverCache.get('occupants:all', fetchOccupants, 2 * 60 * 1000),
  serverCache.get('residences:all', fetchResidences, 15 * 60 * 1000),
]);
```

#### 3. `/api/accommodation/transfer/route.ts`
نفس الطريقة

### الوقت: 1 ساعة

---

## المرحلة 5: إضافة Cache Invalidation 🔄

### الهدف: مسح الـ cache عند الكتابة

#### في accommodation-context.tsx:

```typescript
// بعد إضافة عامل
async function addWorker(worker: Worker) {
  // إضافة إلى Firestore
  await setDoc(doc(db, 'workers', worker.id), worker);
  
  // إبطال الـ cache
  await fetch('/api/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'invalidate', pattern: 'workers' })
  });
  
  // تحديث الـ state المحلي
  setWorkers(prev => [...prev, worker]);
}

// نفس الشيء لـ:
// - updateWorker
// - deleteWorker
// - checkInWorker (invalidate 'occupants')
// - checkOutWorker (invalidate 'occupants')
```

### الوقت: 1 ساعة

---

## المرحلة 6: الاختبار الشامل 🔄

### Checklist:

- [ ] تسكين عامل → يجب أن يعمل
- [ ] إخراج عامل → يجب أن يعمل
- [ ] بحث عن عامل → يجب أن يستخدم cache
- [ ] استيراد CSV → يجب أن يعمل
- [ ] التحقق من cache stats
- [ ] التحقق من logs (أغلبها Cache HITs)

### أدوات الاختبار:

```bash
# 1. Cache Stats
curl http://localhost:9002/api/cache/stats

# 2. تسكين
curl -X POST http://localhost:9002/api/accommodation/assign \
  -H "Content-Type: application/json" \
  -d '{"workerId":"...","residenceId":"...","roomId":"..."}'

# 3. بحث
curl -X POST http://localhost:9002/api/accommodation/search \
  -H "Content-Type: application/json" \
  -d '{"q":"محمد"}'

# 4. مسح cache
curl -X POST http://localhost:9002/api/cache \
  -H "Content-Type: application/json" \
  -d '{"action":"clear"}'
```

### الوقت: 2 ساعة

---

## المرحلة 7: المراقبة (24-48 ساعة) 🔄

### Firebase Console:

1. افتح [Firebase Console](https://console.firebase.google.com)
2. اختر المشروع
3. Firestore Database → Usage
4. راقب "Reads" لمدة 24-48 ساعة

### المؤشرات:

| الوقت | Reads المتوقعة | الملاحظات |
|------|---------------|----------|
| **الساعة 1-6** | ~40K-80K | لا يزال يبني الـ cache |
| **الساعة 6-12** | ~20K-40K | الـ cache يعمل |
| **الساعة 12-24** | ~15K-25K | الأداء الكامل |
| **بعد 24 ساعة** | <20K | النتيجة النهائية |

### الإجراءات:

#### إذا كانت Reads > 50K:
1. راجع cache stats
2. تحقق من logs (Cache HITs vs MISSes)
3. قد تحتاج لزيادة TTL
4. تحقق من عدم وجود endpoints تقرأ مباشرة

#### إذا كانت Reads < 20K:
🎉 **نجاح! التوفير أفضل من المتوقع**

---

## المرحلة 8: التحسينات الإضافية (اختياري) 🔄

### إذا كنت تريد المزيد من التوفير:

#### 1. زيادة TTL للبيانات الثابتة
```typescript
// في server-cache.ts
'companies': 60 * 60 * 1000,  // ساعة كاملة
'residences': 30 * 60 * 1000, // 30 دقيقة
```

#### 2. استخدام Service Worker
```typescript
// للـ caching في الخلفية
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncAllData());
  }
});
```

#### 3. Lazy Loading
```typescript
// تحميل البيانات فقط عند الحاجة
const workers = useCallback(async () => {
  if (!workersLoaded) {
    await loadWorkers();
    setWorkersLoaded(true);
  }
}, [workersLoaded]);
```

---

## 📊 جدول زمني كامل

| المرحلة | المدة | الحالة |
|---------|------|--------|
| 1. الإعداد الأساسي | 2 ساعة | ✅ تم |
| 2. الاختبار الأولي | 30 دقيقة | 🔄 الآن |
| 3. تحديث Context | 1 ساعة | ⏳ قادم |
| 4. تحديث APIs | 1 ساعة | ⏳ قادم |
| 5. Cache Invalidation | 1 ساعة | ⏳ قادم |
| 6. الاختبار الشامل | 2 ساعة | ⏳ قادم |
| 7. المراقبة | 24-48 ساعة | ⏳ قادم |
| 8. التحسينات | 2 ساعة | 🔮 اختياري |
| **الإجمالي** | **~30 ساعة** | |

---

## ✅ النتائج المستهدفة

### بعد 48 ساعة:

| المقياس | الهدف |
|---------|-------|
| **Firestore Reads** | < 50,000/day |
| **Cache Hit Ratio** | > 90% |
| **الأداء** | نفسه أو أفضل |
| **التكلفة** | $0/month |
| **Real-time Delay** | 2-30 دقيقة (مقبول) |

---

## 🆘 جهات الاتصال

إذا واجهت مشاكل:

1. **راجع التوثيق:**
   - `CACHE_README.md` - نظرة عامة
   - `CACHE_QUICK_GUIDE_AR.md` - دليل سريع
   - `FIRESTORE_QUOTA_OPTIMIZATION.md` - تفاصيل تقنية

2. **راقب Logs:**
   - Console logs في المتصفح
   - Server logs في Terminal
   - Firebase Console → Firestore → Usage

3. **استخدم Cache API:**
   ```bash
   # إحصائيات
   GET /api/cache/stats
   
   # مسح
   POST /api/cache { "action": "clear" }
   ```

---

## 🎯 الخطوة التالية

**الآن:** ابدأ المرحلة 2 (الاختبار الأولي)

```bash
# شغل التطبيق
npm run dev

# اختبر الـ cache
curl http://localhost:9002/api/cache/stats
```

---

تم بحمد الله! 🎉
