import { clearCookie, json } from './_utils';

export const onRequestPost = async () => {
  try {
    const res = json({ message: 'تم تسجيل الخروج بنجاح' });
    return clearCookie(res, 'session');
  } catch (err) {
    console.error('CF logout error:', err);
    return json({ error: 'حدث خطأ في تسجيل الخروج' }, { status: 500 });
  }
};
