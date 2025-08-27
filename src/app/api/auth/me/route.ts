import { NextRequest, NextResponse } from 'next/server';
import { LocalAuthService } from '@/lib/auth-local';

export async function GET(request: NextRequest) {
  try {
    // الحصول على session token من cookies
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'غير مصادق عليه' },
        { status: 401 }
      );
    }

    // If Cloudflare Functions are configured, verify via CF (D1 sessions)
    const CF_API_BASE = process.env.CF_API_BASE;
    if (CF_API_BASE) {
      const resp = await fetch(`${CF_API_BASE.replace(/\/$/, '')}/api/auth/me`, {
        headers: { Cookie: `session=${encodeURIComponent(sessionToken)}` }
      });
      const text = await resp.text();
      let data: any; try { data = JSON.parse(text); } catch { data = { message: text }; }
      return NextResponse.json(data, { status: resp.status });
    }

    const authService = new LocalAuthService();
    const user = await authService.verifyToken(sessionToken);

    if (!user) {
      return NextResponse.json(
        { error: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'خطأ في التحقق من الهوية' },
      { status: 500 }
    );
  }
}
