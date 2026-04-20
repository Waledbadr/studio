import { createD1Client } from '@/lib/d1-client';

declare global {
  var D1: any;
}

let d1Client: any | null = null;

type D1Doc = Record<string, unknown>;

type WhereFilter = {
  field: string;
  op: string;
  value: unknown;
};

function getRawD1Db(): any | null {
  const rawDbCandidate =
    (typeof D1 !== 'undefined' && D1) ? D1 :
    (globalThis as any).D1 ??
    (typeof process !== 'undefined' ? (process.env as any).D1 : undefined) ??
    null;

  if (!rawDbCandidate || typeof rawDbCandidate === 'string') {
    return null;
  }

  return rawDbCandidate;
}

function normalizeOp(op: string) {
  if (op === '==') return '=';
  return op;
}

function createDocRef(collection: string, id: string, client: ReturnType<typeof createD1Client>) {
  const ref = {
    collection,
    id,
    async get() {
      const row = await client.get(collection, id);
      return {
        id,
        exists: Boolean(row),
        data: () => row ?? {},
        ref,
      };
    },
    async set(data: D1Doc, options: { merge?: boolean } = {}) {
      return client.set(collection, id, data, { merge: options.merge });
    },
    async update(updates: D1Doc) {
      return client.update(collection, id, updates);
    },
    async delete() {
      return client.delete(collection, id);
    },
  };

  return ref;
}

function createDocumentSnapshot(collection: string, row: D1Doc, client: ReturnType<typeof createD1Client>) {
  return {
    id: String(row.id || ''),
    exists: Boolean(row),
    data() {
      return row ?? {};
    },
    ref: createDocRef(collection, String(row.id || ''), client),
  };
}

function createQuery(
  collection: string,
  client: ReturnType<typeof createD1Client>,
  filters: WhereFilter[] = []
) {
  return {
    where(field: string, op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'NOT IN', value: unknown) {
      return createQuery(collection, client, [...filters, { field, op: normalizeOp(op), value }]);
    },
    async get() {
      const rows = await client.query(collection, { where: filters });
      return {
        docs: rows.map((row: any) => createDocumentSnapshot(collection, row, client)),
      };
    },
  };
}

function createCollectionRef(collection: string, client: ReturnType<typeof createD1Client>) {
  return {
    doc(id: string) {
      return createDocRef(collection, id, client);
    },
    async get() {
      const rows = await client.query(collection);
      return {
        docs: rows.map((row: any) => createDocumentSnapshot(collection, row, client)),
      };
    },
    async add(data: D1Doc) {
      const id =
        typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return client.set(collection, id, data, { merge: false });
    },
    where(field: string, op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'NOT IN', value: unknown) {
      return createQuery(collection, client, [{ field, op: normalizeOp(op), value }]);
    },
  };
}

function createFirestoreCompat(rawDb: any) {
  const client = createD1Client(rawDb);
  return {
    collection(collection: string) {
      return createCollectionRef(collection, client);
    },
    doc(path: string) {
      const [collection, id] = path.split('/');
      if (!collection || !id) {
        throw new Error(`Invalid document path: ${path}`);
      }
      return createDocRef(collection, id, client);
    },
  };
}

export function getD1Db(): any | null {
  if (d1Client) return d1Client;
  const rawDb = getRawD1Db();
  if (!rawDb) return null;
  d1Client = createFirestoreCompat(rawDb);
  return d1Client;
}

export function getAdminDb(): any | null {
  return getD1Db();
}


