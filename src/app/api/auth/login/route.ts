import { NextRequest, NextResponse } from 'next/server';
import { LocalAuthService } from '@/lib/auth-local';
import { LocalCloudflareAuthService } from '@/lib/auth-cloudflare-local';

// Force Node.js runtime for better crypto support
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    // Proxy to Cloudflare Functions if configured
    const CF_API_BASE = process.env.CF_API_BASE;
    if (CF_API_BASE) {
      try {
        const resp = await fetch(`${CF_API_BASE.replace(/\/$/, '')}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const text = await resp.text();
        let data: any;
        try { data = JSON.parse(text); } catch { data = { message: text }; }
        const nextResp = NextResponse.json(data, { status: resp.status });
        const setCookie = resp.headers.get('set-cookie');
        if (setCookie) {
          nextResp.headers.set('set-cookie', setCookie);
        }
        return nextResp;
      } catch (cfError) {
        console.log('CF_API_BASE configured but unreachable, falling back to local Cloudflare auth');
        
        // Try local Cloudflare auth if CF server is not available
        const authService = new LocalCloudflareAuthService();
        const result = await authService.login({ email, password });

        if (!result) {
          return NextResponse.json(
            { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
            { status: 401 }
          );
        }

        // Create response with Cloudflare-style authentication
        const response = NextResponse.json({
          message: 'تم تسجيل الدخول بنجاح (Cloudflare Auth)',
          user: result.user,
          authType: 'cloudflare-local'
        });

        // Set session cookie
        response.cookies.set('session', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60, // 24 hours
          path: '/'
        });

        return response;
      }
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Fall back to simple local auth
    const authService = new LocalAuthService();
    const result = await authService.login({ email, password });

    if (!result) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Create response with local auth
    const response = NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح (Local Auth)',
      user: result.user,
      authType: 'local'
    });

    // Set session cookie
    response.cookies.set('session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
