export const dynamic = 'force-dynamic';

import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export async function GET() {
  const base = { ok: true, timestamp: new Date().toISOString() } as any;
  try {
    const env = await getCloudflareEnvRecord();
    const d1 = (env as any)?.DB;
    if (!d1) {
      return Response.json({ ...base, d1: 'missing' }, { status: 200 });
    }
    try {
      await d1.prepare('SELECT 1 as ok').all();
      return Response.json({ ...base, d1: 'connected' }, { status: 200 });
    } catch (e: any) {
      return Response.json({ ...base, ok: false, d1: 'error', error: String(e?.message || e) }, { status: 200 });
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 200 });
  }
}


export const runtime = 'edge';
