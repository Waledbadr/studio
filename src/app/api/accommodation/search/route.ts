import { NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    const { q } = body || {};
    console.log('🔍 Search API called with query:', q);

    const env = await getCloudflareEnvRecord();
    if (!env || !(env as any).DB) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'D1 binding not available. If running locally, start the app with `npm run dev:d1` (Cloudflare Pages dev) so `getRequestContext().env.DB` is present.'
        },
        { status: 503 }
      );
    }

    try {
      // Get all workers from D1
      console.log('📡 Fetching workers from D1...');
      const workers = (await D1Actions.getWorkers(env)) as any[];
      console.log('📦 D1 returned', workers.length, 'rows');

      console.log('👥 Processed workers:', workers.length, workers);

      // If no search query, return all workers
      if (!q || !q.trim()) {
        console.log('✅ Returning all', workers.length, 'workers');
        return NextResponse.json({ ok: true, results: workers });
      }

      // Filter workers based on search query
      const norm = q.trim().toLowerCase();
      const results = workers.filter((w: any) =>
        (w.name || '').toLowerCase().includes(norm) ||
        (w.id || '').toLowerCase().includes(norm) ||
        (w.nationality || '').toLowerCase().includes(norm) ||
        (w.role || '').toLowerCase().includes(norm)
      );

      console.log('✅ Filtered results:', results.length, 'workers match query');
      return NextResponse.json({ ok: true, results });
    } catch (e) {
      console.error('❌ Search route error:', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error('❌ Search API error:', e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
