export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const keys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIRESTORE_CACHE',
  ] as const;

  const env: Record<string, string | undefined> = {};
  for (const k of keys) {
    const v = process.env[k];
    if (!v) env[k] = undefined;
    else if (k === 'NEXT_PUBLIC_FIREBASE_API_KEY') env[k] = v.slice(0, 6) + '...' + v.slice(-4);
    else env[k] = v;
  }

  const isConfigured = keys.slice(0, 6).every((k) => (process.env[k]?.trim()?.length || 0) > 0);
  return NextResponse.json({ ok: true, isConfigured, env });
}

export {}
