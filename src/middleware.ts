import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

import { getRuntimeEnv } from '@/lib/runtime-env';

// NOTE: Cloudflare Pages (Edge) can run without Node's `process`.
// Always access env vars via a safe helper.
const DEFAULT_SECRET = 'development_secret_key_must_be_long';

// Public paths should include auth routes and pages needed to bootstrap the first user.
// NOTE: `/api/d1` must return JSON errors for RPC callers; auth is enforced inside the route.
const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/d1', '/api/seed-local-user', '/_next', '/static', '/favicon.ico', '/robots.txt']
  // Allow import route in development for ad-hoc data seeding
  .concat(process.env.NODE_ENV !== 'production' ? ['/api/import-inventory'] : []);

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

  const rawSecret = await getRuntimeEnv('JWT_PRIVATE_KEY');
  if (!rawSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_PRIVATE_KEY is not configured. Set it as a Secret in Cloudflare Pages > Settings > Environment Variables.');
  }
  const SECRET_KEY = new TextEncoder().encode(rawSecret || DEFAULT_SECRET);
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

  // Fast local UI iteration mode: keep API on Cloudflare backend (remote D1) while
  // serving frontend via Next dev with HMR.
  const devApiProxyOrigin = process.env.DEV_API_PROXY_ORIGIN;
  if (
    process.env.NODE_ENV === 'development' &&
    devApiProxyOrigin &&
    pathname.startsWith('/api/')
  ) {
    const target = new URL(pathname + req.nextUrl.search, devApiProxyOrigin);
    return NextResponse.rewrite(target);
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  // NOTE: We avoid redirecting page routes from middleware because cookie access can be flaky
  // in some edge runtimes and causes a visible /login flash. Pages are guarded client-side by
  // `RequireAuth`, while API routes still enforce auth here and/or in route handlers.
  const isApiRoute = pathname.startsWith('/api/');

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
  if (!token) {
    return isApiRoute ? new NextResponse('Unauthorized', { status: 401 }) : NextResponse.next();
  }

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
    return isApiRoute ? new NextResponse('Unauthorized', { status: 401 }) : NextResponse.next();
  }
}

export const config = {
  matcher: ['/', '/((?!_next/|static/|favicon.ico).*)']
};