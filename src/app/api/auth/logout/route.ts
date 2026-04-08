import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const secure = req.url.startsWith('https') || process.env.NODE_ENV === 'production';
  res.cookies.set('__session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0,
  });
  return res;
}
