import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isHttpsRequest } from '@/lib/runtime-env';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const secure = isHttpsRequest(req);
  res.cookies.set('access_token', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
  return res;
}

export const runtime = 'edge';
