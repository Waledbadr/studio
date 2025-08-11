import { NextRequest, NextResponse } from "next/server";

// Protect app routes by redirecting unauthenticated users to /login on the edge when possible.
// Note: Firebase Auth session is client-side. For full SSR/edge protection use cookies-based auth.
export function middleware(req: NextRequest) {
  // Allow public paths
  const publicPaths = ["/login", "/favicon.ico", "/api/health", "/_next", "/assets", "/public"];
  if (publicPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }
  // We cannot check Firebase client auth here; rely on client guard.
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
