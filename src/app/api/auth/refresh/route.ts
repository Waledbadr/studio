import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { isHttpsRequest } from '@/lib/runtime-env';
import { getCookieFromRequest } from '@/lib/http-cookies';

export async function POST(req: Request) {
  try {
    let token = '';
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('refresh_token')?.value || '';
    } catch {
      // ignore
    }
    if (!token) {
      token = getCookieFromRequest(req, 'refresh_token') || '';
    }
    if (!token) return NextResponse.json({ ok: false, error: 'No refresh token' }, { status: 401 });
    const payload: any = await verifyRefreshToken(token);
    const access = await signAccessToken({ sub: payload.sub, email: payload.email, role: payload.role });
    const refresh = await signRefreshToken({ sub: payload.sub, email: payload.email, role: payload.role });
    const res = NextResponse.json({ ok: true });
    const secure = isHttpsRequest(req);
    res.cookies.set('access_token', access, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 15 * 60 });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Refresh failed' }, { status: 401 });
  }
}

export const runtime = 'edge';
