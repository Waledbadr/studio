import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const CF_API_BASE = process.env.CF_API_BASE;
    if (CF_API_BASE) {
      const resp = await fetch(`${CF_API_BASE.replace(/\/$/, '')}/api/auth/logout`, { method: 'POST' });
      const text = await resp.text();
      let data: any; try { data = JSON.parse(text); } catch { data = { message: text }; }
      const nextResp = NextResponse.json(data, { status: resp.status });
      const setCookie = resp.headers.get('set-cookie');
      if (setCookie) nextResp.headers.set('set-cookie', setCookie);
      return nextResp;
    }
    // إنشاء response لحذف session cookie
    const response = NextResponse.json({
      message: 'تم تسجيل الخروج بنجاح'
    });

    // حذف session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // انتهاء فوري
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الخروج' },
      { status: 500 }
    );
  }
}
