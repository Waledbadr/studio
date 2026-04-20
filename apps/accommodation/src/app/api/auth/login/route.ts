import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { hashPassword, generateSession, getUserByEmail } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const validPassword = await hashPassword(password).then((hash) => hash === user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await generateSession(user);
    const res = NextResponse.json({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'Technician',
    });
    res.cookies.set('__session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: req.url.startsWith('https') || process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 500 });
  }
}
