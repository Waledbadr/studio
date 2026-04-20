export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const keys = [
    'AUTH_JWT_SECRET',
    'D1',
    'R2_BUCKET',
    'GEMINI_API_KEY',
  ] as const;

  const env: Record<string, string | undefined> = {};
  for (const k of keys) {
    const v = process.env[k];
    env[k] = v?.trim()?.length ? v : undefined;
  }

  const isConfigured = ['AUTH_JWT_SECRET', 'D1', 'R2_BUCKET'].every(
    (k) => (process.env[k]?.trim()?.length || 0) > 0
  );

  return NextResponse.json({ ok: true, isConfigured, env });
}

export {}
