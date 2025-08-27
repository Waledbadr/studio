import { authService, json, setCookie } from './_utils';

export const onRequestPost = async (context: any) => {
  try {
    const body = await context.request.json().catch(() => null) as { email?: string; password?: string } | null;
    const email = body?.email?.trim();
    const password = body?.password ?? '';

    if (!email || !password) {
      return json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const service = authService(context.env);
    const result = await service.login({ email, password });
    if (!result) {
      return json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Create response and set HttpOnly session cookie
    const res = json({ message: 'تم تسجيل الدخول بنجاح', data: result });
    const isProd = (context.env as any).NODE_ENV === 'production';
    return setCookie(res, 'session', result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60, // 24h in seconds
      path: '/',
    });
  } catch (err) {
    console.error('CF login error:', err);
    return json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
};
