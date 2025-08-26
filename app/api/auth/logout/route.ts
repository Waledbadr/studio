/**
 * API للمصادقة - تسجيل الخروج
 */

import { AuthService } from '@/lib/auth';
import { CloudflareEnv } from '@/lib/cloudflare-db';

export const runtime = 'edge';

export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return Response.json(
        { error: 'لم يتم توفير رمز المصادقة' },
        { status: 401 }
      );
    }

    // إنشاء خدمة المصادقة
    const authService = new AuthService(env);
    
    // تسجيل الخروج
    const success = await authService.logout(token);
    
    if (success) {
      return Response.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      });
    } else {
      return Response.json(
        { error: 'فشل في تسجيل الخروج' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('خطأ في API تسجيل الخروج:', error);
    return Response.json(
      { error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
