import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This route relied on firebase-admin to bulk-reset auth users.
// On the Cloudflare/D1 deployment we disable it completely to avoid
// bundling firebase-admin and its heavy Node-only dependencies.

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: 'RESET_AUTH_UNAVAILABLE_ON_CLOUDFLARE',
    },
    { status: 501 }
  );
}
