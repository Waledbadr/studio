import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('refresh_token')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'No refresh token' }, { status: 401 });
    const payload: any = verifyRefreshToken(token);
    const access = signAccessToken({ sub: payload.sub, email: payload.email, role: payload.role });
    const refresh = signRefreshToken({ sub: payload.sub, email: payload.email, role: payload.role });
    const res = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === 'production';
    res.cookies.set('access_token', access, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 15 * 60 });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Refresh failed' }, { status: 401 });
  }
}