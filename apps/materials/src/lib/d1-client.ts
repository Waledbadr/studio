type D1Database = any;
type D1Statement = any;

type D1WhereClause = {
  field: string;
  op: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IN' | 'NOT IN' | 'LIKE';
  value: unknown;
};

type D1OrderBy = {
  field: string;
  direction?: 'ASC' | 'DESC';
};

type D1QueryOptions = {
  where?: D1WhereClause[];
  orderBy?: D1OrderBy;
  limit?: number;
  offset?: number;
};

type D1Doc = Record<string, unknown>;

type D1Client = ReturnType<typeof createD1Client>;

function serializeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function deserializeValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('{') && !value.startsWith('[')) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function deserializeRow(row: D1Doc): D1Doc {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, deserializeValue(value)])
  );
}

async function execute(db: D1Database, sql: string, params: unknown[] = []) {
  const stmt: D1Statement = db.prepare(sql);
  return await stmt.bind(...params).run();
}

async function all(db: D1Database, sql: string, params: unknown[] = []) {
  const stmt: D1Statement = db.prepare(sql);
  return await stmt.bind(...params).all();
}

function normalizeField(field: string) {
  return `"${field.replace(/"/g, '""')}"`;
}

function buildWhereClause(where: D1WhereClause[]): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  where.forEach(({ field, op, value }) => {
    const safeField = normalizeField(field);
    if (op === 'IN' || op === 'NOT IN') {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error(`D1 query ${op} requires a non-empty array value for field ${field}`);
      }
      const placeholders = value.map(() => '?').join(', ');
      conditions.push(`${safeField} ${op} (${placeholders})`);
      params.push(...value.map(serializeValue));
      return;
    }

    if (value === null) {
      if (op === '=') {
        conditions.push(`${safeField} IS NULL`);
      } else if (op === '!=') {
        conditions.push(`${safeField} IS NOT NULL`);
      } else {
        throw new Error(`D1 query does not support operator ${op} with null value for field ${field}`);
      }
      return;
    }

    conditions.push(`${safeField} ${op} ?`);
    params.push(serializeValue(value));
  });

  return { clause: conditions.join(' AND '), params };
}

async function getDoc(db: D1Database, collection: string, id: string): Promise<D1Doc | null> {
  const sql = `SELECT * FROM "${collection}" WHERE id = ? LIMIT 1`;
  const result = await all(db, sql, [id]);
  if (!result?.results?.length) return null;
  return deserializeRow(result.results[0]);
}

async function setDoc(
  db: D1Database,
  collection: string,
  id: string,
  data: D1Doc,
  options: { merge?: boolean } = {}
): Promise<D1Doc> {
  const mergedData: D1Doc = options.merge ? { ...(await getDoc(db, collection, id)) ?? {}, ...data } : { ...data };
  const columns = Object.keys(mergedData).map(normalizeField).join(', ');
  const placeholders = Object.keys(mergedData).map(() => '?').join(', ');
  const values = Object.values(mergedData).map(serializeValue);
  const updateAssignments = Object.keys(mergedData)
    .map((field) => `${normalizeField(field)} = excluded.${normalizeField(field)}`)
    .join(', ');

  const sql = `INSERT INTO "${collection}" (id, ${columns}) VALUES (?, ${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateAssignments}`;
  await execute(db, sql, [id, ...values]);
  return await getDoc(db, collection, id) as D1Doc;
}

async function updateDoc(db: D1Database, collection: string, id: string, updates: D1Doc): Promise<D1Doc> {
  const existing = await getDoc(db, collection, id);
  if (!existing) {
    throw new Error(`Document ${id} does not exist in collection ${collection}`);
  }
  return setDoc(db, collection, id, { ...existing, ...updates }, { merge: true });
}

async function deleteDoc(db: D1Database, collection: string, id: string): Promise<void> {
  const sql = `DELETE FROM "${collection}" WHERE id = ?`;
  await execute(db, sql, [id]);
}

async function queryCollection(
  db: D1Database,
  collection: string,
  options: D1QueryOptions = {}
): Promise<D1Doc[]> {
  const sqlParts = [`SELECT * FROM "${collection}"`];
  const params: unknown[] = [];

  if (options.where?.length) {
    const where = buildWhereClause(options.where);
    sqlParts.push(`WHERE ${where.clause}`);
    params.push(...where.params);
  }

  if (options.orderBy) {
    const field = normalizeField(options.orderBy.field);
    const direction = options.orderBy.direction ?? 'ASC';
    sqlParts.push(`ORDER BY ${field} ${direction}`);
  }

  if (typeof options.limit === 'number') {
    sqlParts.push(`LIMIT ${options.limit}`);
  }

  if (typeof options.offset === 'number') {
    sqlParts.push(`OFFSET ${options.offset}`);
  }

  const result = await all(db, sqlParts.join(' '), params);
  return (result?.results ?? []).map(deserializeRow);
}

function createD1Client(db: D1Database) {
  return {
    async get(collection: string, id: string) {
      return getDoc(db, collection, id);
    },
    async set(collection: string, id: string, data: D1Doc, options: { merge?: boolean } = {}) {
      return setDoc(db, collection, id, data, options);
    },
    async update(collection: string, id: string, updates: D1Doc) {
      return updateDoc(db, collection, id, updates);
    },
    async delete(collection: string, id: string) {
      return deleteDoc(db, collection, id);
    },
    async query(collection: string, options: D1QueryOptions = {}) {
      return queryCollection(db, collection, options);
    },
    collection(collection: string) {
      return {
        async get(id: string) {
          return getDoc(db, collection, id);
        },
        async set(id: string, data: D1Doc, options: { merge?: boolean } = {}) {
          return setDoc(db, collection, id, data, options);
        },
        async update(id: string, updates: D1Doc) {
          return updateDoc(db, collection, id, updates);
        },
        async delete(id: string) {
          return deleteDoc(db, collection, id);
        },
        async query(options: D1QueryOptions = {}) {
          return queryCollection(db, collection, options);
        },
        async add(data: D1Doc) {
          const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          return setDoc(db, collection, id, data, { merge: false });
        },
      };
    },
  };
}

export { createD1Client, getDoc, setDoc, updateDoc, deleteDoc, queryCollection };
export type { D1Client, D1QueryOptions, D1WhereClause, D1OrderBy, D1Doc };
