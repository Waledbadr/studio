import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';

type ScanResult = {
  itemId: string;
  negatives: { residenceId: string; value: number }[];
};

async function scanForNegatives(): Promise<{ countItems: number; totalNegatives: number; details: ScanResult[] }> {
  if (!db) throw new Error('Firestore not configured');
  const snap = await getDocs(collection(db, 'inventory'));
  const details: ScanResult[] = [];
  let totalNegatives = 0;
  for (const d of snap.docs) {
    const data = d.data() as any;
    const sbr = { ...(data.stockByResidence || {}) } as Record<string, number>;
    const negs: { residenceId: string; value: number }[] = [];
    for (const [rid, val] of Object.entries(sbr)) {
      const n = Number(val ?? 0);
      if (!isNaN(n) && n < 0) {
        negs.push({ residenceId: rid, value: n });
        totalNegatives += 1;
      }
    }
    if (negs.length > 0) details.push({ itemId: d.id, negatives: negs });
  }
  return { countItems: details.length, totalNegatives, details };
}

function isDev() {
  return process.env.NODE_ENV !== 'production';
}

function verifySecret(req: Request): boolean {
  const headerKey = req.headers.get('x-maint-key') || '';
  const qs = new URL(req.url).searchParams.get('key') || '';
  const secret = process.env.MAINT_KEY || '';
  if (!secret) return isDev();
  return headerKey === secret || qs === secret;
}

export async function GET(req: Request) {
  try {
    if (!db) return NextResponse.json({ ok: false, error: 'Firestore not configured' }, { status: 500 });
    const url = new URL(req.url);
    const apply = url.searchParams.get('apply');
    if (apply === '1' || apply === 'true') {
      if (!verifySecret(req)) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      // Fall through to same logic as POST to perform fixes
      // Read all inventory docs
      const snap = await getDocs(collection(db, 'inventory'));
      if (snap.empty) return NextResponse.json({ ok: true, fixedCount: 0, affectedItems: [] });
      let fixedCount = 0;
      const affected: string[] = [];
      const now = Timestamp.now();
      for (const d of snap.docs) {
        const item = d.data() as any;
        const sbr = { ...(item.stockByResidence || {}) } as Record<string, number>;
        const original = { ...sbr } as Record<string, number>;
        let changed = false;
        for (const key of Object.keys(sbr)) {
          const val = Number(sbr[key] ?? 0);
          if (!isNaN(val) && val < 0) {
            sbr[key] = 0; // clamp to zero
            changed = true;
          }
        }
        if (!changed) continue;
        const newTotal = Object.values(sbr).reduce((sum, v: any) => {
          const n = Number(v);
          return sum + (isNaN(n) ? 0 : Math.max(0, n));
        }, 0);

        await runTransaction(db, async (trx) => {
          const itemRef = doc(db!, 'inventory', d.id);
          const fresh = await trx.get(itemRef);
          if (!fresh.exists()) return;
          trx.update(itemRef, { stockByResidence: sbr, stock: newTotal });
          for (const rid of Object.keys(original)) {
            const before = Number(original[rid] ?? 0);
            const after = Number(sbr[rid] ?? 0);
            if (before < 0 && after === 0) {
              const diff = Math.abs(before);
              const txRef = doc(collection(db!, 'inventoryTransactions'));
              trx.set(txRef, {
                itemId: d.id,
                itemNameEn: item.nameEn || item.name || d.id,
                itemNameAr: item.nameAr || '',
                residenceId: rid,
                date: now,
                type: 'ADJUSTMENT',
                quantity: diff,
                referenceDocId: 'AUTO-FIX-NEGATIVE',
                locationName: 'System auto-fix',
                adjustmentReason: 'Clamped negative stock to zero',
                adjustmentDirection: 'INCREASE',
              } as any);
            }
          }
        });
        fixedCount++;
        affected.push(d.id);
      }
  return NextResponse.json({ ok: true, fixedCount, affectedItems: affected });
    }
    const res = await scanForNegatives();
    return NextResponse.json({ ok: true, ...res });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to scan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!db) return NextResponse.json({ ok: false, error: 'Firestore not configured' }, { status: 500 });
    if (!verifySecret(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Read all inventory docs
    const snap = await getDocs(collection(db, 'inventory'));
    if (snap.empty) return NextResponse.json({ ok: true, fixedCount: 0, affectedItems: [] });
    let fixedCount = 0;
    const affected: string[] = [];
    const now = Timestamp.now();
    for (const d of snap.docs) {
      const item = d.data() as any;
      const sbr = { ...(item.stockByResidence || {}) } as Record<string, number>;
      const original = { ...sbr } as Record<string, number>;
      let changed = false;
      for (const key of Object.keys(sbr)) {
        const val = Number(sbr[key] ?? 0);
        if (!isNaN(val) && val < 0) {
          sbr[key] = 0; // clamp to zero
          changed = true;
        }
      }
      if (!changed) continue;
      const newTotal = Object.values(sbr).reduce((sum, v: any) => {
        const n = Number(v);
        return sum + (isNaN(n) ? 0 : Math.max(0, n));
      }, 0);

      await runTransaction(db, async (trx) => {
        const itemRef = doc(db!, 'inventory', d.id);
        const fresh = await trx.get(itemRef);
        if (!fresh.exists()) return;
        trx.update(itemRef, { stockByResidence: sbr, stock: newTotal });
        for (const rid of Object.keys(original)) {
          const before = Number(original[rid] ?? 0);
          const after = Number(sbr[rid] ?? 0);
          if (before < 0 && after === 0) {
            const diff = Math.abs(before);
            const txRef = doc(collection(db!, 'inventoryTransactions'));
            trx.set(txRef, {
              itemId: d.id,
              itemNameEn: item.nameEn || item.name || d.id,
              itemNameAr: item.nameAr || '',
              residenceId: rid,
              date: now,
              type: 'ADJUSTMENT',
              quantity: diff,
              referenceDocId: 'AUTO-FIX-NEGATIVE',
              locationName: 'System auto-fix',
              adjustmentReason: 'Clamped negative stock to zero',
              adjustmentDirection: 'INCREASE',
            } as any);
          }
        }
      });
      fixedCount++;
      affected.push(d.id);
    }

    return NextResponse.json({ ok: true, fixedCount, affectedItems: affected });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to fix negatives' }, { status: 500 });
  }
}
