# نظام دعم اللغات (i18n)

## كيفية العمل

النظام يكتشف لغة المستخدم تلقائياً بناءً على:
1. **تفضيلات المستخدم المحفوظة** في localStorage (إذا وجدت)
2. **لغة المتصفح** (navigator.language)
   - إذا كانت اللغة تبدأ بـ `ar` → العربية
   - أي لغة أخرى → الإنجليزية

## كيفية تغيير اللغة يدوياً

```typescript
import { setUserLanguage } from '@/lib/i18n-helpers';

// للتبديل إلى العربية
setUserLanguage('ar');

// للتبديل إلى الإنجليزية
setUserLanguage('en');

// يتم حفظ التفضيل في localStorage تلقائياً
```

## استخدام في الكود

```typescript
import { getUserLanguage, getLocalizedMessage, ERROR_MESSAGES, UI_TEXT } from '@/lib/i18n-helpers';

// الحصول على اللغة الحالية
const lang = getUserLanguage(); // 'ar' أو 'en'

// استخدام رسالة محلية
const message = getLocalizedMessage({
  ar: 'مرحبا',
  en: 'Hello'
});

// استخدام رسائل خطأ مُعرّفة مسبقاً
const errorMsg = getLocalizedMessage(ERROR_MESSAGES.CHECKIN_IN_FUTURE);

// استخدام عناوين واجهة المستخدم
const title = getLocalizedMessage(UI_TEXT.titles.error);
```

## رسائل الأخطاء المدعومة

- `CHECKIN_IN_FUTURE` - تاريخ الدخول في المستقبل
- `CHECKOUT_IN_FUTURE` - تاريخ الخروج في المستقبل
- `DATE_CONFLICT_WITH_HISTORY` - تعارض في التواريخ
- `CHECKIN_BEFORE_LAST_CHECKOUT` - الدخول قبل آخر خروج
- `CHECKOUT_BEFORE_CHECKIN` - الخروج قبل الدخول
- `MONTH_ALREADY_INVOICED` - شهر مفوتر
- `nationality-mismatch` - تعارض في الجنسية
- `role-mismatch` - تعارض في الدور
- `room-full` - غرفة ممتلئة
- `room-not-found` - غرفة غير موجودة
- `worker-not-found` - عامل غير موجود
- `worker-already-assigned` - عامل مسكّن بالفعل
- `worker-not-assigned` - عامل غير مسكّن

## الأمثلة

### مثال 1: تبديل اللغة في إعدادات المستخدم

```typescript
<Button onClick={() => setUserLanguage('en')}>
  English
</Button>
<Button onClick={() => setUserLanguage('ar')}>
  العربية
</Button>
```

### مثال 2: استخدام في Toast

```typescript
import { toast } from '@/hooks/use-toast';
import { getLocalizedMessage, UI_TEXT } from '@/lib/i18n-helpers';

toast({
  title: getLocalizedMessage(UI_TEXT.titles.success),
  description: getLocalizedMessage({
    ar: 'تم حفظ البيانات بنجاح',
    en: 'Data saved successfully'
  })
});
```

## الاختبار

لاختبار اللغة:
1. افتح Developer Console
2. نفذ: `localStorage.setItem('userLanguage', 'en')`
3. أعد تحميل الصفحة
4. ستظهر جميع الرسائل بالإنجليزية

للعودة للعربية:
```javascript
localStorage.setItem('userLanguage', 'ar')
location.reload()
```
