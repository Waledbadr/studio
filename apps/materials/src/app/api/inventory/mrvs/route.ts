import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, Timestamp, where, increment, setDoc, updateDoc } from 'firebase/firestore';

// Direct MRV API now uses monthly counters for deterministic IDs and short codes.
async function reserveNewMrvId(): Promise<{ id: string; short: string }> {
  if (!db) throw new Error('Firebase not initialized');
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const mmNoPad = (now.getMonth() + 1).toString();
  const counterId = `mrv-${yy}-${mm}`; // e.g., counters/mrv-25-08
  const ref = doc(db, 'counters', counterId);
  let nextSeq = 0;
  await runTransaction(db, async (trx) => {
    const snap = await trx.get(ref);
    const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
    nextSeq = current + 1;
    trx.set(ref, { seq: nextSeq, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
  });
  const seqPadded = nextSeq.toString().padStart(3, '0');
  return {
    id: `MRV-${yy}-${mm}-${seqPadded}`, // MRV-YY-MM-###,
    short: `MRV-${yy}${mmNoPad}${nextSeq}`, // MRV-YYMSEQ
  };
}

export async function GET() {
  try {
    if (!db) return NextResponse.json({ mrvs: [] });
    const qRef = query(collection(db, 'mrvs'), orderBy('date', 'desc'), limit(20));
    const snap = await getDocs(qRef);
    const mrvs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ mrvs });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list MRVs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!db) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
    const body = await request.json();
    const { residenceId, items, meta } = body || {};
    if (!residenceId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'residenceId and items[] are required' }, { status: 400 });
    }

    const lines = items.filter((i: any) => i?.id && Number(i?.quantity) > 0);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 });
    }

    const reserved = await reserveNewMrvId();

    await runTransaction(db, async (transaction) => {
      // Read items
      const uniqueItemIds = [...new Set(lines.map((i: any) => i.id))];
      const itemRefs = uniqueItemIds.map((id: string) => doc(db!, 'inventory', id));
      const itemSnaps = await Promise.all(itemRefs.map(r => transaction.get(r)));
      for (let i = 0; i < itemSnaps.length; i++) {
        if (!itemSnaps[i].exists()) {
          throw new Error(`Item not found: ${uniqueItemIds[i]}`);
        }
      }
      const now = Timestamp.now();
      let itemCount = 0;
      for (const line of lines) {
        const itemRef = doc(db!, 'inventory', line.id);
        transaction.update(itemRef, {
          [`stockByResidence.${residenceId}`]: increment(line.quantity)
        });
        const txRef = doc(collection(db!, 'inventoryTransactions'));
        transaction.set(txRef, {
          itemId: line.id,
          itemNameEn: line.nameEn,
          itemNameAr: line.nameAr,
          residenceId,
          date: now,
          type: 'IN',
          quantity: line.quantity,
          referenceDocId: reserved.id,
          locationName: 'Receiving'
        });
        itemCount += line.quantity;
      }

      const mrvRef = doc(db!, 'mrvs', reserved.id);
      transaction.set(mrvRef, {
        id: reserved.id,
        date: now,
        residenceId,
        itemCount,
        supplierName: meta?.supplierName || null,
        invoiceNo: meta?.invoiceNo || null,
        notes: meta?.notes || null,
        codeShort: reserved.short,
      });
    });

    return NextResponse.json({ id: reserved.id, short: reserved.short });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create MRV' }, { status: 500 });
  }
}
