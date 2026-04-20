module.exports = [
"[project]/apps/accommodation/.next-internal/server/app/api/db/[collection]/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/accommodation/src/lib/d1-client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createD1Client",
    ()=>createD1Client,
    "deleteDoc",
    ()=>deleteDoc,
    "getDoc",
    ()=>getDoc,
    "queryCollection",
    ()=>queryCollection,
    "setDoc",
    ()=>setDoc,
    "updateDoc",
    ()=>updateDoc
]);
function serializeValue(value) {
    if (value === undefined) return null;
    if (value === null) return null;
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return value;
}
function deserializeValue(value) {
    if (typeof value !== 'string') return value;
    if (!value.startsWith('{') && !value.startsWith('[')) return value;
    try {
        return JSON.parse(value);
    } catch  {
        return value;
    }
}
function deserializeRow(row) {
    return Object.fromEntries(Object.entries(row).map(([key, value])=>[
            key,
            deserializeValue(value)
        ]));
}
async function execute(db, sql, params = []) {
    const stmt = db.prepare(sql);
    return await stmt.bind(...params).run();
}
async function all(db, sql, params = []) {
    const stmt = db.prepare(sql);
    return await stmt.bind(...params).all();
}
function normalizeField(field) {
    return `"${field.replace(/"/g, '""')}"`;
}
function buildWhereClause(where) {
    const conditions = [];
    const params = [];
    where.forEach(({ field, op, value })=>{
        const safeField = normalizeField(field);
        if (op === 'IN' || op === 'NOT IN') {
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error(`D1 query ${op} requires a non-empty array value for field ${field}`);
            }
            const placeholders = value.map(()=>'?').join(', ');
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
    return {
        clause: conditions.join(' AND '),
        params
    };
}
async function getDoc(db, collection, id) {
    const sql = `SELECT * FROM "${collection}" WHERE id = ? LIMIT 1`;
    const result = await all(db, sql, [
        id
    ]);
    if (!result?.results?.length) return null;
    return deserializeRow(result.results[0]);
}
async function setDoc(db, collection, id, data, options = {}) {
    const mergedData = options.merge ? {
        ...await getDoc(db, collection, id) ?? {},
        ...data
    } : {
        ...data
    };
    const columns = Object.keys(mergedData).map(normalizeField).join(', ');
    const placeholders = Object.keys(mergedData).map(()=>'?').join(', ');
    const values = Object.values(mergedData).map(serializeValue);
    const updateAssignments = Object.keys(mergedData).map((field)=>`${normalizeField(field)} = excluded.${normalizeField(field)}`).join(', ');
    const sql = `INSERT INTO "${collection}" (id, ${columns}) VALUES (?, ${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateAssignments}`;
    await execute(db, sql, [
        id,
        ...values
    ]);
    return await getDoc(db, collection, id);
}
async function updateDoc(db, collection, id, updates) {
    const existing = await getDoc(db, collection, id);
    if (!existing) {
        throw new Error(`Document ${id} does not exist in collection ${collection}`);
    }
    return setDoc(db, collection, id, {
        ...existing,
        ...updates
    }, {
        merge: true
    });
}
async function deleteDoc(db, collection, id) {
    const sql = `DELETE FROM "${collection}" WHERE id = ?`;
    await execute(db, sql, [
        id
    ]);
}
async function queryCollection(db, collection, options = {}) {
    const sqlParts = [
        `SELECT * FROM "${collection}"`
    ];
    const params = [];
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
function createD1Client(db) {
    return {
        async get (collection, id) {
            return getDoc(db, collection, id);
        },
        async set (collection, id, data, options = {}) {
            return setDoc(db, collection, id, data, options);
        },
        async update (collection, id, updates) {
            return updateDoc(db, collection, id, updates);
        },
        async delete (collection, id) {
            return deleteDoc(db, collection, id);
        },
        async query (collection, options = {}) {
            return queryCollection(db, collection, options);
        },
        collection (collection) {
            return {
                async get (id) {
                    return getDoc(db, collection, id);
                },
                async set (id, data, options = {}) {
                    return setDoc(db, collection, id, data, options);
                },
                async update (id, updates) {
                    return updateDoc(db, collection, id, updates);
                },
                async delete (id) {
                    return deleteDoc(db, collection, id);
                },
                async query (options = {}) {
                    return queryCollection(db, collection, options);
                },
                async add (data) {
                    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    return setDoc(db, collection, id, data, {
                        merge: false
                    });
                }
            };
        }
    };
}
;
}),
"[project]/apps/accommodation/src/lib/firebase-admin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAdminDb",
    ()=>getAdminDb,
    "getD1Db",
    ()=>getD1Db
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$d1$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/d1-client.ts [app-route] (ecmascript)");
;
let d1Client = null;
function getRawD1Db() {
    const rawDbCandidate = typeof D1 !== 'undefined' && D1 ? D1 : globalThis.D1 ?? (typeof process !== 'undefined' ? process.env.D1 : undefined) ?? null;
    if (!rawDbCandidate || typeof rawDbCandidate === 'string') {
        return null;
    }
    return rawDbCandidate;
}
function normalizeOp(op) {
    if (op === '==') return '=';
    return op;
}
function createDocRef(collection, id, client) {
    const ref = {
        collection,
        id,
        async get () {
            const row = await client.get(collection, id);
            return {
                id,
                exists: Boolean(row),
                data: ()=>row ?? {},
                ref
            };
        },
        async set (data, options = {}) {
            return client.set(collection, id, data, {
                merge: options.merge
            });
        },
        async update (updates) {
            return client.update(collection, id, updates);
        },
        async delete () {
            return client.delete(collection, id);
        }
    };
    return ref;
}
function createDocumentSnapshot(collection, row, client) {
    return {
        id: String(row.id || ''),
        exists: Boolean(row),
        data () {
            return row ?? {};
        },
        ref: createDocRef(collection, String(row.id || ''), client)
    };
}
function createQuery(collection, client, filters = []) {
    return {
        where (field, op, value) {
            return createQuery(collection, client, [
                ...filters,
                {
                    field,
                    op: normalizeOp(op),
                    value
                }
            ]);
        },
        async get () {
            const rows = await client.query(collection, {
                where: filters
            });
            return {
                docs: rows.map((row)=>createDocumentSnapshot(collection, row, client))
            };
        }
    };
}
function createCollectionRef(collection, client) {
    return {
        doc (id) {
            return createDocRef(collection, id, client);
        },
        async get () {
            const rows = await client.query(collection);
            return {
                docs: rows.map((row)=>createDocumentSnapshot(collection, row, client))
            };
        },
        async add (data) {
            const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            return client.set(collection, id, data, {
                merge: false
            });
        },
        where (field, op, value) {
            return createQuery(collection, client, [
                {
                    field,
                    op: normalizeOp(op),
                    value
                }
            ]);
        }
    };
}
function createFirestoreCompat(rawDb) {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$d1$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createD1Client"])(rawDb);
    return {
        collection (collection) {
            return createCollectionRef(collection, client);
        },
        doc (path) {
            const [collection, id] = path.split('/');
            if (!collection || !id) {
                throw new Error(`Invalid document path: ${path}`);
            }
            return createDocRef(collection, id, client);
        }
    };
}
function getD1Db() {
    if (d1Client) return d1Client;
    const rawDb = getRawD1Db();
    if (!rawDb) return null;
    d1Client = createFirestoreCompat(rawDb);
    return d1Client;
}
function getAdminDb() {
    return getD1Db();
}
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/apps/accommodation/src/lib/dev-d1-memory.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Simple dev store to emulate D1 for local Next.js dev (cloudflare branch).
// In `next dev` we don't have real D1 bindings, so we keep a small
// JSON store on disk (and in-memory cache) so data survives server restarts.
__turbopack_context__.s([
    "devDelete",
    ()=>devDelete,
    "devFindByField",
    ()=>devFindByField,
    "devGetById",
    ()=>devGetById,
    "devList",
    ()=>devList,
    "devUpsert",
    ()=>devUpsert
]);
const STORE_FILE = process.env.DEV_D1_STORE_FILE || '.dev-d1-store.json';
let memoryStore = null;
function loadStoreFromDisk() {
    try {
        if (typeof process === 'undefined') return {};
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
        const filePath = path.join(process.cwd(), STORE_FILE);
        if (!fs.existsSync(filePath)) return {};
        const raw = fs.readFileSync(filePath, 'utf8');
        if (!raw.trim()) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch  {
        return {};
    }
}
function saveStoreToDisk(store) {
    try {
        if (typeof process === 'undefined') return;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
        const filePath = path.join(process.cwd(), STORE_FILE);
        fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
    } catch  {
    // Ignore disk errors in dev; fall back to in-memory only.
    }
}
function getStore() {
    if (!memoryStore) {
        memoryStore = loadStoreFromDisk();
        const g = globalThis;
        g.__DEV_D1_STORE__ = memoryStore;
    }
    return memoryStore;
}
function devList(collection) {
    const store = getStore();
    return store[collection] || [];
}
function devUpsert(collection, id, data) {
    const store = getStore();
    const list = store[collection] || [];
    const idx = list.findIndex((d)=>d.id === id);
    const next = {
        ...idx >= 0 ? list[idx] : {},
        ...data,
        id
    };
    if (idx >= 0) {
        list[idx] = next;
    } else {
        list.push(next);
    }
    store[collection] = list;
    // Persist to disk so data survives `npm run dev` restarts.
    saveStoreToDisk(store);
    return next;
}
function devFindByField(collection, field, value) {
    const list = devList(collection);
    return list.find((d)=>d[field] === value) || null;
}
function devGetById(collection, id) {
    const list = devList(collection);
    return list.find((d)=>d.id === id) || null;
}
function devDelete(collection, id) {
    const store = getStore();
    const list = store[collection] || [];
    const next = list.filter((d)=>d.id !== id);
    store[collection] = next;
    saveStoreToDisk(store);
}
}),
"[project]/apps/accommodation/src/app/api/db/[collection]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/firebase-admin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dev$2d$d1$2d$memory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/accommodation/src/lib/dev-d1-memory.ts [app-route] (ecmascript)");
;
;
;
const dynamic = 'force-dynamic';
function parseJsonParam(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch  {
        return null;
    }
}
async function GET(req, context) {
    const { collection } = await context.params;
    const d1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getD1Db"])();
    const url = new URL(req.url);
    const where = parseJsonParam(url.searchParams.get('where'));
    const orderBy = parseJsonParam(url.searchParams.get('orderBy'));
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    try {
        const collectionName = collection;
        let docs;
        if (d1) {
            const collectionRef = d1.collection(collectionName);
            if (where || orderBy || limit || offset) {
                docs = await collectionRef.query({
                    where: where ?? [],
                    orderBy: orderBy ?? undefined,
                    limit: limit ? Number(limit) : undefined,
                    offset: offset ? Number(offset) : undefined
                });
            } else {
                const snap = await collectionRef.get();
                docs = snap.docs.map((doc)=>({
                        id: doc.id,
                        ...doc.data()
                    }));
            }
        } else if ("TURBOPACK compile-time truthy", 1) {
            // Dev fallback: simple in-memory list without advanced querying
            docs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dev$2d$d1$2d$memory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["devList"])(collectionName);
            if (orderBy && orderBy.field) {
                const dir = (orderBy.direction || 'ASC').toUpperCase();
                docs = [
                    ...docs
                ].sort((a, b)=>{
                    const av = a[orderBy.field] ?? '';
                    const bv = b[orderBy.field] ?? '';
                    const cmp = String(av).localeCompare(String(bv));
                    return dir === 'DESC' ? -cmp : cmp;
                });
            }
        } else //TURBOPACK unreachable
        ;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(docs);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error?.message || String(error)
        }, {
            status: 500
        });
    }
}
async function POST(req, context) {
    const { collection } = await context.params;
    const d1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getD1Db"])();
    try {
        const collectionName = collection;
        const body = await req.json();
        const data = typeof body === 'object' && body !== null ? body : {};
        const id = typeof data.id === 'string' && data.id.trim().length > 0 ? data.id : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        if (d1) {
            const docRef = d1.collection(collectionName).doc(id);
            await docRef.set({
                ...data,
                id
            });
            const created = await docRef.get();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                id,
                ...created.data() || {}
            });
        }
        if ("TURBOPACK compile-time truthy", 1) {
            const created = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$accommodation$2f$src$2f$lib$2f$dev$2d$d1$2d$memory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["devUpsert"])(collectionName, id, {
                ...data,
                id
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(created);
        }
        //TURBOPACK unreachable
        ;
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error?.message || String(error)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f61d88b1._.js.map