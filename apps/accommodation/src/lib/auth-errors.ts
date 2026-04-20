// Map Firebase Auth error codes to user-friendly Arabic messages
// Reference: https://firebase.google.com/docs/auth/admin/errors

export function humanFirebaseError(err: unknown, fallback = "حدث خطأ. حاول مرة أخرى."): string {
  const code = (err as any)?.code as string | undefined;
  if (!code) return (err as any)?.message || fallback;

  const map: Record<string, string> = {
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/invalid-login-credentials": "بيانات الدخول غير صحيحة.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/user-not-found": "لا يوجد مستخدم بهذا البريد الإلكتروني.",
    "auth/invalid-email": "بريد إلكتروني غير صالح.",
    "auth/user-disabled": "تم تعطيل هذا الحساب من قبل المشرف.",
    "auth/too-many-requests": "محاولات كثيرة فاشلة. الرجاء المحاولة لاحقًا أو إعادة تعيين كلمة المرور.",
    "auth/operation-not-allowed": "موفر تسجيل الدخول غير مفعّل في لوحة Firebase.",
    "auth/unauthorized-domain": "النطاق الحالي غير مصرح به في إعدادات المصادقة على Firebase.",
    "auth/popup-closed-by-user": "تم إغلاق النافذة المنبثقة قبل إكمال العملية.",
    "auth/cancelled-popup-request": "تم إلغاء عملية تسجيل الدخول المنبثقة.",
    "auth/account-exists-with-different-credential": "يوجد حساب باستخدام بريد إلكتروني نفسه لكن بموفر مختلف.",
  };

  return map[code] || (err as any)?.message || fallback;
}
