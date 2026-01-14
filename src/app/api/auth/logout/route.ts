import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production';
  res.cookies.set('access_token', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
  return res;
}