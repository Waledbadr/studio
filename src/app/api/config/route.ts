export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const keys = [
    'NEXT_PUBLIC_USE_D1',
    'NODE_ENV',
  ] as const;

  const safeEnv = typeof process !== 'undefined' && (process as any)?.env ? (process as any).env : {};
  const env: Record<string, string | undefined> = {};
  for (const k of keys) {
    const v = safeEnv[k];
    if (!v) env[k] = undefined;
    else env[k] = v;
  }

  const isConfigured = String(safeEnv.NEXT_PUBLIC_USE_D1 || '').toLowerCase() === 'true';
  return NextResponse.json({ ok: true, isConfigured, env });
}

export const runtime = 'edge';
