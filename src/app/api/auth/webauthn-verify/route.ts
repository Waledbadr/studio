export const runtime = 'edge';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getDb } from '@/lib/db';
import { users, webauthnCredentials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getRuntimeEnv, isHttpsRequest } from '@/lib/runtime-env';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

function getSafeRpID(hostname: string) {
  // Avoid IP addresses and 0.0.0.0 which are not valid RPID in most browsers; prefer localhost in dev
  if (/^(\d+\.){3}\d+$/.test(hostname) || hostname === '0.0.0.0') return 'localhost';
  return hostname;
}

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getExpectedOrigin(req: NextRequest): string {
  const originEnv = (globalThis as any)?.WEBAUTHN_ORIGIN as string | undefined;
  if (originEnv) return originEnv;
  const proto = req.headers.get('x-forwarded-proto') || (isHttpsRequest(req) ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { type } = body as { type: 'register' | 'authenticate' };
    const credential = (body.credential || body.response) as any;

    const cookieStore = await cookies();
    const challenge = cookieStore.get('webauthn_chal')?.value;
    const userID = cookieStore.get('webauthn_uid')?.value;

    if (!challenge || !userID) {
      return NextResponse.json({ error: 'Missing challenge or user' }, { status: 400 });
    }

    const hostname = req.nextUrl.hostname;
    const rpIDEnv = await getRuntimeEnv('WEBAUTHN_RPID', '');
    const expectedRPID = rpIDEnv || getSafeRpID(hostname);
    const originEnv = await getRuntimeEnv('WEBAUTHN_ORIGIN', '');
    const expectedOrigin = originEnv || getExpectedOrigin(req);

    let db;
    try {
      db = getDb();
    } catch {
      return NextResponse.json({ ok: false, verified: false, error: 'Backend not configured (D1 unavailable)' }, { status: 503 });
    }

    if (type === 'register') {
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID,
      });

      if (verification.verified && verification.registrationInfo) {
        const info: any = verification.registrationInfo;

        // Require existing user row (registration is meant after first sign-in)
        const u: any = await db.select().from(users).where(eq(users.id, userID)).get();
        if (!u?.id) {
          return NextResponse.json({ ok: false, verified: false, error: 'User not found' }, { status: 400 });
        }

        const credentialIdB64Url = typeof info.credentialID === 'string' ? info.credentialID : bytesToBase64Url(info.credentialID);
        const publicKeyB64Url = typeof info.credentialPublicKey === 'string' ? info.credentialPublicKey : bytesToBase64Url(info.credentialPublicKey);

        const now = new Date().toISOString();
        const row = {
          id: `webauthn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          userId: userID,
          credentialId: credentialIdB64Url,
          publicKey: publicKeyB64Url,
          counter: Number(info.counter || 0),
          transports: (credential?.transports || undefined) as any,
          deviceType: info.credentialDeviceType || null,
          backedUp: !!info.credentialBackedUp,
          createdAt: now,
          updatedAt: now,
        };

        try {
          await db.insert(webauthnCredentials).values(row as any).run();
        } catch {
          // If it already exists, update instead.
          await db
            .update(webauthnCredentials)
            .set({ userId: userID, publicKey: publicKeyB64Url, counter: Number(info.counter || 0), updatedAt: now } as any)
            .where(eq(webauthnCredentials.credentialId, credentialIdB64Url))
            .run();
        }
      }

      const res = NextResponse.json({ ok: verification.verified, verified: verification.verified });
      // Clear cookies after use
      const secure = isHttpsRequest(req);
      res.cookies.set('webauthn_chal', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
      res.cookies.set('webauthn_uid', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
      return res;
    }

    const credentialId = typeof credential?.id === 'string' ? credential.id : '';
    if (!credentialId) {
      return NextResponse.json({ ok: false, verified: false, error: 'Missing credential id' }, { status: 400 });
    }

    const stored: any = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId)).get();
    if (!stored?.id) {
      return NextResponse.json({ ok: false, verified: false, error: 'Unknown credential' }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      authenticator: {
        credentialID: base64UrlToBytes(stored.credentialId),
        credentialPublicKey: base64UrlToBytes(stored.publicKey),
        counter: Number(stored.counter || 0),
        transports: stored.transports || undefined,
      },
    } as any);

    const secure = isHttpsRequest(req);
    const resPayload: any = { ok: verification.verified, verified: verification.verified };

    if (verification.verified) {
      const authInfo: any = (verification as any).authenticationInfo;
      const newCounter = Number(authInfo?.newCounter ?? authInfo?.counter ?? stored.counter ?? 0);
      const now = new Date().toISOString();
      await db.update(webauthnCredentials).set({ counter: newCounter, updatedAt: now } as any).where(eq(webauthnCredentials.id, stored.id)).run();

      const u: any = await db.select().from(users).where(eq(users.id, stored.userId)).get();
      if (u?.id) {
        const payload = { sub: u.id, email: u.email, role: u.role };
        const access = await signAccessToken(payload);
        const refresh = await signRefreshToken(payload);
        const res = NextResponse.json({ ...resPayload, user: { id: u.id, email: u.email, name: u.name } });
        res.cookies.set('access_token', access, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 15 * 60 });
        res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
        res.cookies.set('webauthn_chal', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
        res.cookies.set('webauthn_uid', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
        return res;
      }
    }

    const res = NextResponse.json(resPayload, { status: verification.verified ? 200 : 400 });
    res.cookies.set('webauthn_chal', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
    res.cookies.set('webauthn_uid', '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export { }
