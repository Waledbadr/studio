import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { isHttpsRequest } from '@/lib/runtime-env';

export const runtime = 'edge';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json({ ok: false, error: 'Missing token or password' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: 'Password too short' }, { status: 400 });
    }

    let db;
    try {
      db = getDb();
    } catch {
      return NextResponse.json({ ok: false, error: 'Backend not configured (D1 unavailable)' }, { status: 503 });
    }

    const tokenHash = await sha256Hex(token);
    const nowIso = new Date().toISOString();

    const prt: any = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
      .get();

    if (!prt?.id) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    if (typeof prt.expiresAt === 'string' && prt.expiresAt < nowIso) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    const user: any = await db.select().from(users).where(eq(users.id, prt.userId)).get();
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await db.update(users).set({ passwordHash, lastSeen: nowIso }).where(eq(users.id, user.id)).run();
    await db.update(passwordResetTokens).set({ usedAt: nowIso }).where(eq(passwordResetTokens.id, prt.id)).run();

    // Auto sign-in after reset
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access = await signAccessToken(payload);
    const refresh = await signRefreshToken(payload);

    const res = NextResponse.json({ ok: true });
    const secure = isHttpsRequest(req);
    res.cookies.set('access_token', access, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 15 * 60 });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
