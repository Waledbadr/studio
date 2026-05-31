import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { hashPassword, generateSession, getUserByEmail, toD1UserRecord, fromD1UserRecord } from '@/lib/auth-server';
import { devUpsert } from '@/lib/dev-d1-memory';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const d1Db = getD1Db();

    const existing = await getUserByEmail(email);
    if (existing && existing.passwordHash) {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const id = String(existing?.id || existing?.uid || (
      typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    ));

    const nowIso = new Date().toISOString();

    const payload = {
      id,
      name,
      email,
      role: 'Technician',
      assignedResidences: [],
      themeSettings: { colorTheme: 'blue', mode: 'system' },
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash,
    } as Record<string, unknown>;

    if (d1Db) {
      await d1Db.collection('users').doc(id).set(toD1UserRecord(payload), { merge: true });
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev fallback: store in memory so local next dev can work without D1
      devUpsert('users', id, payload);
    } else {
      return NextResponse.json({ error: 'D1 database is not configured.' }, { status: 500 });
    }

    const token = await generateSession(fromD1UserRecord(payload));
    const res = NextResponse.json({
      id,
      name,
      email,
      role: 'Technician',
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
    return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 500 });
  }
}
