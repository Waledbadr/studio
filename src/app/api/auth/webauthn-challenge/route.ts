export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';

function getSafeRpID(hostname: string) {
  const envRp = process.env.NEXT_PUBLIC_WEBAUTHN_RPID || process.env.WEBAUTHN_RPID;
  if (envRp) return envRp;
  if (/^(\d+\.){3}\d+$/.test(hostname) || hostname === '0.0.0.0') return 'localhost';
  return hostname;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, user } = body as { type: 'register' | 'authenticate'; user: { id: string; name: string; email: string } };

    if (!user?.id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    const rpID = getSafeRpID(req.nextUrl.hostname);
    const secure = req.nextUrl.protocol === 'https:';

  if (type === 'register') {
      const options = await generateRegistrationOptions({
        rpName: 'EstateCare',
        rpID,
        userID: user.id,
        userName: user.email || user.name,
        attestationType: 'none',
    // Prefer platform authenticator (e.g., Windows Hello) in UX
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred', authenticatorAttachment: 'platform' },
      });
      const res = NextResponse.json(options);
      res.cookies.set('webauthn_chal', options.challenge, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
      res.cookies.set('webauthn_uid', user.id, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
      return res;
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });
    const res = NextResponse.json(options);
    res.cookies.set('webauthn_chal', options.challenge, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
    res.cookies.set('webauthn_uid', user.id, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export { }
