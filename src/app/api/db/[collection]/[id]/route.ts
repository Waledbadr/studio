import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { devGetById, devUpsert, devDelete } from '@/lib/dev-d1-memory';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await context.params;
  const d1 = getD1Db();

  try {
    if (d1) {
      const docRef = d1.collection(collection).doc(id);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ id: snapshot.id, ...snapshot.data() });
    }

    if (process.env.NODE_ENV !== 'production') {
      const doc = devGetById(collection, id);
      if (!doc) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(doc);
    }

    return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await context.params;
  const d1 = getD1Db();

  try {
    const body = await req.json();
    if (d1) {
      const docRef = d1.collection(collection).doc(id);
      await docRef.set(body, { merge: true });
      const updated = await docRef.get();
      return NextResponse.json({ id, ...updated.data() });
    }

    if (process.env.NODE_ENV !== 'production') {
      const updated = devUpsert(collection, id, body);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await context.params;
  const d1 = getD1Db();

  try {
    if (d1) {
      await d1.collection(collection).doc(id).delete();
      return NextResponse.json({ ok: true });
    }

    if (process.env.NODE_ENV !== 'production') {
      devDelete(collection, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
