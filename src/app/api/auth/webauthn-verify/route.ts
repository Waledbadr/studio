export const runtime = 'nodejs';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server';

function getSafeRpID(hostname: string) {
  const envRp = process.env.NEXT_PUBLIC_WEBAUTHN_RPID || process.env.WEBAUTHN_RPID;
  if (envRp) return envRp;
  // Avoid IP addresses and 0.0.0.0 which are not valid RPID in most browsers; prefer localhost in dev
  if (/^(\d+\.){3}\d+$/.test(hostname) || hostname === '0.0.0.0') return 'localhost';
  return hostname;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body as { type: 'register' | 'authenticate' };
    const credential = (body.credential || body.response) as any;

    const cookieStore = await cookies();
    const challenge = cookieStore.get('webauthn_chal')?.value;
    const userID = cookieStore.get('webauthn_uid')?.value;

    if (!challenge || !userID) {
      return NextResponse.json({ error: 'Missing challenge or user' }, { status: 400 });
    }

    const hostname = req.nextUrl.hostname;
    const expectedRPID = getSafeRpID(hostname);
    const expectedOrigin = `${req.nextUrl.protocol}//${hostname}${req.nextUrl.port ? `:${req.nextUrl.port}` : ''}`;

    if (type === 'register') {
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID,
      });
      const res = NextResponse.json({ ok: verification.verified, verified: verification.verified, registrationInfo: verification.registrationInfo });
      // Clear cookies after use
      res.cookies.set('webauthn_chal', '', { httpOnly: true, sameSite: 'lax', secure: expectedOrigin.startsWith('https'), path: '/', maxAge: 0 });
      res.cookies.set('webauthn_uid', '', { httpOnly: true, sameSite: 'lax', secure: expectedOrigin.startsWith('https'), path: '/', maxAge: 0 });
      return res;
    }

    // Basic authentication verification (note: in a full implementation you must
    // look up the stored credential publicKey & counter by userID from a DB).
    try {
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID,
        // Without a DB, we can't check counter/publicKey. This returns structure only.
      } as any);
      const res = NextResponse.json({ ok: verification.verified, verified: verification.verified, authenticationInfo: verification.authenticationInfo });
      res.cookies.set('webauthn_chal', '', { httpOnly: true, sameSite: 'lax', secure: expectedOrigin.startsWith('https'), path: '/', maxAge: 0 });
      res.cookies.set('webauthn_uid', '', { httpOnly: true, sameSite: 'lax', secure: expectedOrigin.startsWith('https'), path: '/', maxAge: 0 });
      return res;
    } catch (e: any) {
      const res = NextResponse.json({ ok: false, verified: false, error: e?.message || 'Verification failed' }, { status: 400 });
      res.cookies.set('webauthn_chal', '', { httpOnly: true, sameSite: 'lax', secure: expectedOrigin.startsWith('https'), path: '/', maxAge: 0 });
      res.cookies.set('webauthn_uid', '', { httpOnly: true, sameSite: 'lax', secure: expectedOrigin.startsWith('https'), path: '/', maxAge: 0 });
      return res;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export { }
