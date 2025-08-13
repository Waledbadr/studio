import { NextRequest, NextResponse } from "next/server";

// Protect app routes by redirecting unauthenticated users to /login on the edge when possible.
// Note: Firebase Auth session is client-side. For full SSR/edge protection use cookies-based auth.
export function middleware(req: NextRequest) {
  // Skip all RSC/Flight and prefetch requests to avoid interfering with Next's client navigation
  const isRSC = req.headers.get('rsc') !== null
    || req.headers.get('next-router-prefetch') === '1'
    || req.nextUrl.searchParams.has('__flight__')
    || req.headers.get('next-action') !== null;
  if (isRSC) {
    return NextResponse.next();
  }

  // Simple rate limit for feedback endpoints (anti-spam)
  const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
  const RATE_LIMIT_MAX = 10; // per IP per window
  // @ts-ignore ephemeral global for edge runtime
  const g: any = globalThis as any;
  g.__rateBucket = g.__rateBucket || new Map<string, { count: number; resetAt: number }>();
  const isFeedbackApi = req.nextUrl.pathname.startsWith('/api/feedback') || req.nextUrl.pathname.startsWith('/api/uploads/feedback');
  if (isFeedbackApi) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    const key = `fb:${ip}`;
    const entry = g.__rateBucket.get(key);
    if (!entry || now > entry.resetAt) {
      g.__rateBucket.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else if (entry.count >= RATE_LIMIT_MAX) {
      return new NextResponse('Too Many Requests', { status: 429 });
    } else {
      entry.count += 1;
      g.__rateBucket.set(key, entry);
    }
  }

  // Allow public paths
  const publicPaths = ["/login", "/favicon.ico", "/api/health", "/_next", "/__nextjs_font", "/assets", "/public"];
  if (publicPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }
  // We cannot check Firebase client auth here; rely on client guard.
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
