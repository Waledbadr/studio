import { authService, json } from './_utils';

export const onRequestPost = async (context: any) => {
  try {
    const body = await context.request.json().catch(() => null) as { name?: string; email?: string; password?: string } | null;
    const name = body?.name?.trim();
    const email = body?.email?.trim();
    const password = body?.password ?? '';

    if (!name || !email || !password) {
      return json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' }, { status: 400 });
    }

    const service = authService(context.env);
    const result = await service.register({ name, email, password });
    if (!result) {
      return json({ error: 'فشل في إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً بالفعل' }, { status: 400 });
    }

    return json({ message: 'تم إنشاء الحساب بنجاح', data: result });
  } catch (err) {
    console.error('CF register error:', err);
    return json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
};
