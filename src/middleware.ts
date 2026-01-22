import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

import { getRuntimeEnv } from '@/lib/runtime-env';

// NOTE: Cloudflare Pages (Edge) can run without Node's `process`.
// Always access env vars via a safe helper.
const DEFAULT_SECRET = 'development_secret_key_must_be_long';

// Public paths should include auth routes and pages needed to bootstrap the first user.
// Note: /api/d1 is intentionally NOT public; it must be protected.
const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/seed-local-user', '/_next', '/static', '/favicon.ico', '/robots.txt'];

async function verifyToken(token: string) {
  const TEAM = await getRuntimeEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', '');
  const AUD = await getRuntimeEnv('CLOUDFLARE_ACCESS_AUD', '');
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

  const secret = await getRuntimeEnv('JWT_PRIVATE_KEY', DEFAULT_SECRET);
  const SECRET_KEY = new TextEncoder().encode(secret);
  const ISSUER = await getRuntimeEnv('JWT_ISSUER', 'estatecare.local');
  const APP_AUD = await getRuntimeEnv('JWT_AUD', 'estatecare-client');

  // Fall back to app JWT verification using HS256 and Secret Key
  const { jwtVerify: joseVerify } = await import('jose');
  // jwtVerify handles Uint8Array secret for symmetric algorithms (HS256)
  const { payload } = await joseVerify(token, SECRET_KEY, {
    issuer: ISSUER,
    audience: APP_AUD
  });
  return payload;
}

function hasAppJwtConfigInProcessEnv(): boolean {
  try {
    // Cloudflare Pages middleware may not have access to request-scoped env bindings.
    // If process.env doesn't have JWT config at runtime, strict verification here will fail.
    // In that case we fall back to a presence check and rely on API routes to enforce auth.
    // eslint-disable-next-line no-undef
    const env = typeof process !== 'undefined' ? (process as any).env : undefined;
    return Boolean(env?.JWT_PRIVATE_KEY || env?.CLOUDFLARE_ACCESS_TEAM_DOMAIN);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Redirect root to login if not authenticated
  if (pathname === '/') {
    const token = req.headers.get('cf-access-jwt-assertion') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '') || '';
    let cookieToken = '';
    try {
      cookieToken = req.cookies.get?.('access_token')?.value || '';
    } catch {
      // Ignore cookie access errors
    }
    if (!token && !cookieToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  let token = req.headers.get('cf-access-jwt-assertion') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '') || '';
  if (!token) {
    // Try cookie with defensive access
    try {
      const cookieToken = req.cookies.get?.('access_token')?.value || '';
      token = cookieToken || token;
    } catch (e) {
      console.warn('[Middleware] Cookie access failed:', e);
    }
  }
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  try {
    // If we have runtime access to JWT/Access env vars, verify token strictly.
    // Otherwise, avoid blocking valid sessions due to missing env in middleware runtime.
    if (hasAppJwtConfigInProcessEnv()) {
      const payload: any = await verifyToken(token);
      // attach user info as headers for origin handling
      const headers = new Headers(req.headers);
      if (payload.email) headers.set('x-access-user-email', String(payload.email));
      if (payload.sub) headers.set('x-access-user-sub', String(payload.sub));
      return NextResponse.next({ request: { headers } as any });
    }

    // Presence-only gate (API routes should enforce auth).
    return NextResponse.next();
  } catch (e) {
    console.warn('Access JWT verify failed', e);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export const config = {
  matcher: ['/', '/((?!_next/|static/|favicon.ico).*)']
};