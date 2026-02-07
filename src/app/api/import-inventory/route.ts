import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Allow only in non-production to avoid accidental mass writes in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Import disabled in production' }, { status: 403 });
    }



    // Get D1 env record (must be available when running with `npm run dev:d1`)
    const env = await getCloudflareEnvRecord();
    if (!env || !env.DB) {
      return NextResponse.json({ ok: false, error: 'D1 binding not available. Run with `npm run dev:d1` to enable D1.' }, { status: 503 });
    }

    // قراءة الملف من المسار المحلي
    const filePath = path.join(process.cwd(), 'inventory_ready_for_upload.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, error: 'inventory_ready_for_upload.json not found at project root' }, { status: 404 });
    }

    // Dev-only local sqlite fallback: allow calling with ?fallback=local-sqlite
    const useLocalSqlite = process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('fallback') === 'local-sqlite';
    if (useLocalSqlite) {
      // Lazy import to avoid adding to edge runtime
      const Database = require('better-sqlite3');
      const dbPath = path.join(process.cwd(), 'local-d1.db');
      const db = new Database(dbPath);
      // Create inventory table if missing (minimal columns)
      db.exec(`
        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          name_ar TEXT,
          name_en TEXT,
          category TEXT,
          unit TEXT,
          lifespan_days INTEGER,
          keywords_en TEXT,
          keywords_ar TEXT,
          variants TEXT,
          stock_by_residence TEXT,
          stock INTEGER DEFAULT 0
        );
      `);

      const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const results: any[] = [];
      const insert = db.prepare(`INSERT OR REPLACE INTO inventory (id, name, name_ar, name_en, category, unit, lifespan_days, keywords_en, keywords_ar, variants, stock_by_residence, stock) VALUES (@id,@name,@name_ar,@name_en,@category,@unit,@lifespan_days,@keywords_en,@keywords_ar,@variants,@stock_by_residence,@stock)`);
      const insertMany = db.transaction((rows: any[]) => {
        for (const [idx, item] of rows.entries()) {
          const id = item.id || `it_local_${Date.now()}_${idx}`;
          const variantsJson = item.variants ? JSON.stringify(item.variants) : JSON.stringify([]);
          const keywordsEn = item.keywordsEn ? JSON.stringify(item.keywordsEn) : JSON.stringify([]);
          const keywordsAr = item.keywordsAr ? JSON.stringify(item.keywordsAr) : JSON.stringify([]);
          const stockByResidence = item.stockByResidence ? JSON.stringify(item.stockByResidence) : JSON.stringify({});
          insert.run({
            id,
            name: item.nameEn || item.nameAr || id,
            name_ar: item.nameAr || '',
            name_en: item.nameEn || '',
            category: item.category || '',
            unit: item.unit || '',
            lifespan_days: item.lifespanDays || null,
            keywords_en: keywordsEn,
            keywords_ar: keywordsAr,
            variants: variantsJson,
            stock_by_residence: stockByResidence,
            stock: 0
          });
          results.push({ name: item.nameEn || item.nameAr || id, ok: true, id });
        }
      });

      insertMany(items || []);
      db.close();
      return NextResponse.json({ ok: true, results });
    }

    const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
