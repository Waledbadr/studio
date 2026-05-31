import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { devList, devUpsert } from '@/lib/dev-d1-memory';
import { fromD1UserRecord, toD1UserRecord } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function parseJsonParam<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeDocForRead(collection: string, doc: any) {
  if (collection !== 'users' || !doc || typeof doc !== 'object') return doc;
  return fromD1UserRecord(doc);
}

function normalizeDocForWrite(collection: string, doc: any) {
  if (collection !== 'users' || !doc || typeof doc !== 'object') return doc;
  return toD1UserRecord(doc);
}

export async function GET(req: Request, context: { params: Promise<{ collection: string }> }) {
  const { collection } = await context.params;
  const d1 = getD1Db();

  const url = new URL(req.url);
  const where = parseJsonParam<any[]>(url.searchParams.get('where'));
  const orderBy = parseJsonParam<{ field: string; direction?: 'ASC' | 'DESC' }>(url.searchParams.get('orderBy'));
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');

  try {
    const collectionName = collection;
    let docs: any[];

    if (d1) {
      const collectionRef = d1.collection(collectionName);
      if (where || orderBy || limit || offset) {
        docs = await collectionRef.query({
          where: where ?? [],
          orderBy: orderBy ?? undefined,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
        });
      } else {
        const snap = await collectionRef.get();
        docs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev fallback: simple in-memory list without advanced querying
      docs = devList(collectionName);
      if (orderBy && orderBy.field) {
        const dir = (orderBy.direction || 'ASC').toUpperCase();
        docs = [...docs].sort((a, b) => {
          const av = (a as any)[orderBy.field] ?? '';
          const bv = (b as any)[orderBy.field] ?? '';
          const cmp = String(av).localeCompare(String(bv));
          return dir === 'DESC' ? -cmp : cmp;
        });
      }
    } else {
      return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
    }

    return NextResponse.json((docs || []).map((doc) => normalizeDocForRead(collectionName, doc)));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ collection: string }> }) {
  const { collection } = await context.params;
  const d1 = getD1Db();

  try {
    const collectionName = collection;
    const body = await req.json();
    const data = typeof body === 'object' && body !== null ? body : {};
    const id = typeof (data as any).id === 'string' && (data as any).id.trim().length > 0
      ? (data as any).id
      : typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (d1) {
      const docRef = d1.collection(collectionName).doc(id);
      await docRef.set(normalizeDocForWrite(collectionName, { ...data, id }));
      const created = await docRef.get();
      return NextResponse.json(normalizeDocForRead(collectionName, { id, ...(created.data() || {}) }));
    }

    if (process.env.NODE_ENV !== 'production') {
      const created = devUpsert(collectionName, id, { ...data, id });
      return NextResponse.json(created);
    }

    return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
