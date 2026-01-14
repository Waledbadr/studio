export const dynamic = 'force-dynamic';

import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  const base = { ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() } as any;
  try {
    const { env } = getRequestContext();
    const d1 = (env as any)?.DB;
    if (!d1) {
      return Response.json({ ...base, d1: 'missing' }, { status: 200 });
    }
    try {
      await d1.prepare('SELECT 1 as ok').all();
      return Response.json({ ...base, d1: 'connected' }, { status: 200 });
    } catch (e: any) {
      return Response.json({ ...base, d1: 'error', error: String(e?.message || e) }, { status: 500 });
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
