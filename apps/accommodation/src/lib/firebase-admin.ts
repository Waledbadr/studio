import { createD1Client } from '@/lib/d1-client';
import { getLocalD1Binding } from '@/lib/local-d1';
import { devDelete, devGetById, devList, devUpsert } from '@/lib/dev-d1-memory';

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
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const localBinding = getLocalD1Binding();
    if (localBinding) return localBinding;
  }

  const cloudflareContext = (globalThis as any)[Symbol.for('__cloudflare-context__')];
  const cloudflareBoundDb = cloudflareContext?.env?.D1 ?? null;

  const rawDbCandidate =
    cloudflareBoundDb ??
    ((typeof D1 !== 'undefined' && D1) ? D1 : undefined) ??
    (globalThis as any).D1 ??
    (typeof process !== 'undefined' ? (process.env as any).D1 : undefined) ??
    null;

  if (!rawDbCandidate || typeof rawDbCandidate === 'string') {
    return getLocalD1Binding();
  }

  return rawDbCandidate;
}

function normalizeOp(op: string) {
  if (op === '==') return '=';
  return op;
}

function compareValues(a: unknown, b: unknown, direction: 'ASC' | 'DESC' = 'ASC') {
  const left = a == null ? '' : String(a);
  const right = b == null ? '' : String(b);
  const comparison = left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'DESC' ? -comparison : comparison;
}

function matchesWhere(doc: Record<string, unknown>, filters: WhereFilter[] = []) {
  return filters.every(({ field, op, value }) => {
    const docValue = (doc as any)[field];
    if (op === '=') return docValue === value;
    if (op === '!=') return docValue !== value;
    if (op === '<') return docValue < value;
    if (op === '<=') return docValue <= value;
    if (op === '>') return docValue > value;
    if (op === '>=') return docValue >= value;
    if (op === 'IN') return Array.isArray(value) && value.includes(docValue);
    if (op === 'NOT IN') return Array.isArray(value) && !value.includes(docValue);
    return true;
  });
}

function createDevFirestoreCompat() {
  function buildDocSnapshot(collection: string, doc: Record<string, unknown> | null) {
    const id = String(doc?.id || '');
    return {
      id,
      exists: Boolean(doc),
      data() {
        return doc ?? {};
      },
      ref: buildDocRef(collection, id),
    };
  }

  function buildDocRef(collection: string, id: string) {
    return {
      collection,
      id,
      async get() {
        return buildDocSnapshot(collection, devGetById(collection, id));
      },
      async set(data: D1Doc, options: { merge?: boolean } = {}) {
        const current = options.merge ? (devGetById(collection, id) || {}) : {};
        return devUpsert(collection, id, { ...current, ...data, id });
      },
      async update(updates: D1Doc) {
        const current = devGetById(collection, id);
        if (!current) throw new Error(`Document ${id} does not exist in collection ${collection}`);
        return devUpsert(collection, id, { ...current, ...updates, id });
      },
      async delete() {
        devDelete(collection, id);
      },
    };
  }

  function queryDocs(collection: string, options: { where?: WhereFilter[]; orderBy?: { field: string; direction?: 'ASC' | 'DESC' }; limit?: number; offset?: number } = {}) {
    let docs = devList(collection).map((doc) => ({ ...doc }));
    if (options.where?.length) {
      docs = docs.filter((doc) => matchesWhere(doc, options.where));
    }
    if (options.orderBy?.field) {
      const direction = options.orderBy.direction ?? 'ASC';
      docs.sort((left, right) => compareValues((left as any)[options.orderBy!.field], (right as any)[options.orderBy!.field], direction));
    }
    const offset = options.offset ?? 0;
    const limit = typeof options.limit === 'number' ? options.limit : undefined;
    docs = docs.slice(offset, limit === undefined ? undefined : offset + limit);
    return docs;
  }

  function buildCollectionRef(collection: string) {
    return {
      doc(id: string) {
        return buildDocRef(collection, id);
      },
      async get() {
        return {
          docs: queryDocs(collection).map((doc) => buildDocSnapshot(collection, doc)),
        };
      },
      async query(options: { where?: WhereFilter[]; orderBy?: { field: string; direction?: 'ASC' | 'DESC' }; limit?: number; offset?: number } = {}) {
        return queryDocs(collection, options);
      },
      async add(data: D1Doc) {
        const id =
          typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
            ? (crypto as any).randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return devUpsert(collection, id, { ...data, id });
      },
      where(field: string, op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'NOT IN', value: unknown) {
        return {
          async get() {
            return {
              docs: queryDocs(collection, { where: [{ field, op: normalizeOp(op), value }] }).map((doc) => buildDocSnapshot(collection, doc)),
            };
          },
        };
      },
    };
  }

  return {
    collection(collection: string) {
      return buildCollectionRef(collection);
    },
    doc(path: string) {
      const [collection, id] = path.split('/');
      if (!collection || !id) {
        throw new Error(`Invalid document path: ${path}`);
      }
      return buildDocRef(collection, id);
    },
  };
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
    async query(options: { where?: WhereFilter[]; orderBy?: { field: string; direction?: 'ASC' | 'DESC' }; limit?: number; offset?: number } = {}) {
      return client.query(collection, options as any);
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

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    d1Client = createDevFirestoreCompat();
    return d1Client;
  }

  const rawDb = getRawD1Db();
  if (!rawDb) return null;
  d1Client = createFirestoreCompat(rawDb);
  return d1Client;
}

export function getAdminDb(): any | null {
  return getD1Db();
}


