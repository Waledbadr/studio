import { NextResponse } from 'next/server';
import { authenticateUser, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    const user = await authenticateUser({ email: email.toLowerCase(), password });
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access = signAccessToken(payload);
    const refresh = signRefreshToken(payload);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    const secure = process.env.NODE_ENV === 'production';
    res.cookies.set('access_token', access, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 15 * 60 });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    const msg = e?.message || 'Login failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}