import { NextResponse } from 'next/server';
import { authenticateUser, signAccessToken, signRefreshToken } from '@/lib/auth';
import { isHttpsRequest } from '@/lib/runtime-env';

export async function POST(req: Request) {
  try {
    const body: any = await req.json();
    const { email, password } = body;
    console.log('[login] POST request received:', { email });
    
    if (!email || !password) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    const normalizedEmail = String(email).trim().toLowerCase();
    
    console.log('[login] Calling authenticateUser with email:', normalizedEmail);
    const user = await authenticateUser({ email: normalizedEmail, password });
    console.log('[login] User authenticated:', { id: user.id, email: user.email, role: user.role });
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access = await signAccessToken(payload);
    const refresh = await signRefreshToken(payload);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    const secure = isHttpsRequest(req);
    res.cookies.set('access_token', access, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 15 * 60 });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    const msg = e?.message || 'Login failed';
    console.error('[login] Authentication failed:', { error: msg, stack: e?.stack });
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

export const runtime = 'edge';
