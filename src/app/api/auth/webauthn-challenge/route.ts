export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';
import { getDb } from '@/lib/db';
import { users, webauthnCredentials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isHttpsRequest, getRuntimeEnv } from '@/lib/runtime-env';

function getSafeRpID(hostname: string) {
  // Env override handled in POST; keep helper for safe hostname normalization.
  if (/^(\d+\.){3}\d+$/.test(hostname) || hostname === '0.0.0.0') return 'localhost';
  return hostname;
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { type, user } = body as { type: 'register' | 'authenticate'; user: { id: string; name: string; email: string } };

    if (!user?.id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    const rpIDEnv = await getRuntimeEnv('WEBAUTHN_RPID', '');
    const rpID = rpIDEnv || getSafeRpID(req.nextUrl.hostname);
    const secure = isHttpsRequest(req);

    // Optional D1-backed allow/exclude credentials for better UX.
    let db: ReturnType<typeof getDb> | null = null;
    try {
      db = getDb();
    } catch {
      db = null;
    }

    const email = (user?.email || '').trim().toLowerCase();

    if (type === 'register') {
      let excludeCredentials: any[] | undefined;
      if (db) {
        try {
          const existing = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id));
          if (existing?.length) {
            excludeCredentials = existing.map((c: any) => ({
              id: c.credentialId,
              type: 'public-key',
              transports: c.transports || undefined,
            }));
          }
        } catch {
          // ignore
        }
      }

      const options = await generateRegistrationOptions({
        rpName: 'EstateCare',
        rpID,
        userID: user.id,
        userName: user.email || user.name,
        attestationType: 'none',
        excludeCredentials,
    // Prefer platform authenticator (e.g., Windows Hello) in UX
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred', authenticatorAttachment: 'platform' },
      });
      const res = NextResponse.json(options);
      res.cookies.set('webauthn_chal', options.challenge, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
      res.cookies.set('webauthn_uid', user.id, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
      return res;
    }

    let allowCredentials: any[] | undefined;
    let resolvedUserId: string | undefined;
    if (db && email) {
      try {
        const u: any = await db.select().from(users).where(eq(users.email, email)).get();
        if (u?.id) {
          resolvedUserId = u.id;
          const creds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, u.id));
          if (creds?.length) {
            allowCredentials = creds.map((c: any) => ({
              id: c.credentialId,
              type: 'public-key',
              transports: c.transports || undefined,
            }));
          }
        }
      } catch {
        // ignore
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials,
    });
    const res = NextResponse.json(options);
    res.cookies.set('webauthn_chal', options.challenge, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
    res.cookies.set('webauthn_uid', (resolvedUserId || user.id) as string, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export { }
