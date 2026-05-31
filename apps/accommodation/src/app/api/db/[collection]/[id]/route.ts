import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { devGetById, devUpsert, devDelete } from '@/lib/dev-d1-memory';
import { fromD1UserRecord, toD1UserRecord } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function normalizeDocForRead(collection: string, doc: any) {
  if (collection !== 'users' || !doc || typeof doc !== 'object') return doc;
  return fromD1UserRecord(doc);
}

function normalizeDocForWrite(collection: string, doc: any) {
  if (collection !== 'users' || !doc || typeof doc !== 'object') return doc;
  return toD1UserRecord(doc);
}

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
      return NextResponse.json(normalizeDocForRead(collection, { id: snapshot.id, ...snapshot.data() }));
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
      await docRef.set(normalizeDocForWrite(collection, body), { merge: true });
      const updated = await docRef.get();
      return NextResponse.json(normalizeDocForRead(collection, { id, ...updated.data() }));
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
