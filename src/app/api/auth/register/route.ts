import { NextRequest, NextResponse } from 'next/server';
import { LocalAuthService } from '@/lib/auth-local';
import { LocalCloudflareAuthService } from '@/lib/auth-cloudflare-local';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body as { name: string; email: string; password: string };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // If a Cloudflare API base is configured, proxy the request to persist in D1
    const CF_API_BASE = process.env.CF_API_BASE;
    if (CF_API_BASE) {
      try {
        const resp = await fetch(`${CF_API_BASE.replace(/\/$/, '')}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const text = await resp.text();
        let data: any;
        try { data = JSON.parse(text); } catch { data = { message: text }; }
        return NextResponse.json(data, { status: resp.status });
      } catch (cfError) {
        console.log('CF_API_BASE configured but unreachable, falling back to local Cloudflare auth');
        
        // Try local Cloudflare auth if CF server is not available
        const authService = new LocalCloudflareAuthService();
        // Note: LocalCloudflareAuthService may not have register method, fall through to local auth
      }
    }

    // Fallback: local in-memory registration (non-persistent)
    const authService = new LocalAuthService();
    const result = await authService.register({
      name,
      email,
      password,
      role: 'user' // الدور الافتراضي للمستخدمين الجدد
    });

    if (!result) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً بالفعل' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح',
      user: result.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
