import { authService, getCookie, json } from './_utils';

export const onRequestGet = async (context: any) => {
  try {
    const session = getCookie(context.request, 'session');
    if (!session) {
      return json({ error: 'غير مصادق عليه' }, { status: 401 });
    }

    const service = authService(context.env);
    const user = await service.verifyToken(session);
    if (!user) {
      return json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    return json({ user });
  } catch (err) {
    console.error('CF me error:', err);
    return json({ error: 'خطأ في التحقق من الهوية' }, { status: 500 });
  }
};
