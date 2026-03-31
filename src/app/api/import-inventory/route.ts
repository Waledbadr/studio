import { NextRequest, NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Import disabled in production' }, { status: 403 });
    }

    const env = await getCloudflareEnvRecord();
    if (!env || !env.DB) {
      return NextResponse.json({ ok: false, error: 'D1 binding not available. Run with `npm run dev` to enable D1.' }, { status: 503 });
    }

    // In Edge runtime, the JSON payload must be provided in the request body
    // (cannot read from local filesystem)
    let items: any[];
    try {
      const body = await req.json();
      items = Array.isArray(body) ? body : body?.items;
      if (!Array.isArray(items)) throw new Error('Expected JSON array or { items: [...] }');
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body: ' + e.message }, { status: 400 });
    }

    const results: any[] = [];
    for (const item of items) {
      const payload = {
        name: item.nameEn || item.nameAr,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        category: item.category,
        unit: item.unit,
        lifespanDays: item.lifespanDays,
        keywordsAr: item.keywordsAr,
        keywordsEn: item.keywordsEn,
        variants: item.variants,
        stock: 0,
        stockByResidence: {}
      };
      try {
        const res = await D1Actions.createInventoryItem(env, payload as any);
        results.push({ name: payload.nameEn || payload.nameAr, ok: res?.ok, id: res?.id });
      } catch (err) {
        results.push({ name: payload.nameEn || payload.nameAr, error: String(err) });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    console.error('Import inventory error:', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
