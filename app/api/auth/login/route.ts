/**
 * API للمصادقة - تسجيل الدخول
 */

import { AuthService, LoginCredentials } from '@/lib/auth';
import { CloudflareEnv } from '@/lib/cloudflare-db';

export const runtime = 'edge';

interface RequestBody extends LoginCredentials {}

export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    const body: RequestBody = await request.json();
    
    // التحقق من صحة البيانات
    if (!body.email || !body.password) {
      return Response.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // إنشاء خدمة المصادقة
    const authService = new AuthService(env);
    
    // محاولة تسجيل الدخول
    const result = await authService.login(body);
    
    if (!result) {
      return Response.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('خطأ في API تسجيل الدخول:', error);
    return Response.json(
      { error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
