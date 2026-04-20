import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { devUpsert } from '@/lib/dev-d1-memory';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, context: { params: Promise<{ collection: string }> }) {
  const { collection } = await context.params;
  const d1 = getD1Db();

  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an array of documents' }, { status: 400 });
    }

    const collectionName = collection;
    const savedDocs: any[] = [];

    if (d1) {
      for (const item of body) {
        const rawId = item?.id;
        const id = typeof rawId === 'string' && rawId.trim().length > 0
          ? rawId
          : typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
            ? (crypto as any).randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        const docRef = d1.collection(collectionName).doc(id);
        await docRef.set({ ...item, id }, { merge: true });
        const created = await docRef.get();
        savedDocs.push({ id, ...created.data() });
      }
    } else if (process.env.NODE_ENV !== 'production') {
      for (const item of body) {
        const rawId = item?.id;
        const id = typeof rawId === 'string' && rawId.trim().length > 0
          ? rawId
          : typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
            ? (crypto as any).randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        savedDocs.push(devUpsert(collectionName, id, { ...item, id }));
      }
    } else {
      return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
    }

    return NextResponse.json(savedDocs);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
