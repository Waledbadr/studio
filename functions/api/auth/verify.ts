import { authService, json, getCookie } from './_utils';

export const onRequestGet = async (context: any) => {
  try {
    const authz = context.request.headers.get('Authorization');
    const bearer = authz && authz.startsWith('Bearer ')
      ? authz.substring(7)
      : getCookie(context.request, 'session');

    if (!bearer) {
      return json({ error: 'غير مصادق عليه' }, { status: 401 });
    }

    const service = authService(context.env);
    const user = await service.verifyToken(bearer);
    if (!user) {
      return json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    return json({ data: { user } });
  } catch (err) {
    console.error('CF verify error:', err);
    return json({ error: 'خطأ في التحقق من الهوية' }, { status: 500 });
  }
};
