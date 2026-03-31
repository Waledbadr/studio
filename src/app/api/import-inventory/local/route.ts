import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // This endpoint reads from the local filesystem and is only usable in Node.js dev mode.
  // It is not available in Cloudflare Pages (Edge runtime).
  return NextResponse.json(
    { ok: false, error: 'This dev-only endpoint requires Node.js runtime and is not available in Cloudflare Pages.' },
    { status: 503 }
  );
}