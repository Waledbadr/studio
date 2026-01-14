import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const TEAM = process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN;
const AUD = process.env.CLOUDFLARE_ACCESS_AUD;

const PUBLIC_PATHS = [ '/login', '/api/d1' , '/_next', '/static', '/favicon.ico', '/robots.txt' ];

async function verifyToken(token: string) {
  // Try Cloudflare Access first when configured
  if (TEAM && AUD) {
    try {
      const jwksUrl = new URL(`https://${TEAM}/cdn-cgi/access/certs`);
      const JWKS = createRemoteJWKSet(jwksUrl);
      const { payload } = await jwtVerify(token, JWKS, { issuer: `https://${TEAM}`, audience: AUD });
      return payload;
    } catch (e) {
      // fallthrough to app JWT
    }
  }

  // Fall back to app JWT verification using configured public key
  const PUBLIC = process.env.JWT_PUBLIC_KEY;
  if (!PUBLIC) throw new Error('Access config missing and JWT_PUBLIC_KEY not set');
  // importSPKI gives a KeyLike usable by jose
  const { importSPKI, jwtVerify: joseVerify } = await import('jose');
  const key = await importSPKI(PUBLIC, 'RS256');
  const { payload } = await joseVerify(token, key, { issuer: process.env.JWT_ISSUER || 'estatecare.local', audience: process.env.JWT_AUD || 'estatecare-client' });
  return payload;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  let token = req.headers.get('cf-access-jwt-assertion') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '') || '';
  if (!token) {
    // Try cookie
    const cookieToken = req.cookies.get?.('access_token')?.value || '';
    token = cookieToken || token;
  }
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const payload: any = await verifyToken(token);
    // attach user info as headers for origin handling
    const headers = new Headers(req.headers);
    if (payload.email) headers.set('x-access-user-email', String(payload.email));
    if (payload.sub) headers.set('x-access-user-sub', String(payload.sub));
    return NextResponse.next({ request: { headers } as any });
  } catch (e) {
    console.warn('Access JWT verify failed', e);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export const config = {
  matcher: ['/', '/((?!_next/|static/|favicon.ico).*)']
};