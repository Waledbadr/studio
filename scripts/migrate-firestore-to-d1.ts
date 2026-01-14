#!/usr/bin/env node
/*
  Migration script: Firestore -> Drizzle/SQLite (staging for D1)

  Usage:
    npx ts-node scripts/migrate-firestore-to-d1.ts --file=./migration.sqlite --collections=users,residences

  It reads collections from Firebase Admin and writes into a local SQLite DB using Drizzle.
  Target is a staging SQLite DB that can be inspected or imported into Cloudflare D1.
*/

(async function main() {
  const { getAdminDb: _getAdminDb } = require('../src/lib/firebase-admin');
  const _Database: any = require('better-sqlite3');
  const { drizzle: _drizzle } = require('drizzle-orm/sqlite3');
  const _schema: any = require('../src/db/schema');
  const _yargs: any = require('yargs/yargs');
  const { hideBin: _hideBin } = require('yargs/helpers');

  const argv: any = _yargs(_hideBin(process.argv)).options({
    file: { type: 'string', default: './migration.sqlite' },
    collections: { type: 'string', default: '' },
    batchSize: { type: 'number', default: 200 },
  }).parseSync();

  const FILE = argv.file;
  const BATCH = argv.batchSize;
  const SPECIFIED = argv.collections ? argv.collections.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  function log(...args: any[]) { console.log('[migrate]', ...args); }
  function warn(...args: any[]) { console.warn('[migrate][warn]', ...args); }
  function err(...args: any[]) { console.error('[migrate][error]', ...args); }

  async function run() {
    const admin = _getAdminDb();
    if (!admin) {
      err('Firebase Admin is not initialized. Set FIREBASE_SERVICE_ACCOUNT/_B64 env vars.');
      process.exit(1);
    }

    log('Opening sqlite file:', FILE);
    const dbConn = new _Database(FILE);
    const db = _drizzle(dbConn as any, { schema: (_schema as any).default || (_schema as any) });

    // Collections to migrate (common ones)
    const candidates = [
      'users','residences','workers','occupants','accommodation_history','companies','contracts','invoices','mrvs','mrv_requests','orders','service_orders','inventory','inventory_categories','inventory_transactions','notifications','feedback'
    ];
    const collections = SPECIFIED.length ? SPECIFIED : candidates;

    log('Collections to migrate:', collections.join(', '));

    for (const col of collections) {
      try {
        await migrateCollection(admin, db, col);
      } catch (e: any) {
        err(`Failed to migrate collection ${col}:`, e?.message || e);
      }
    }

    log('Migration completed. Review the SQLite DB at', FILE);
    dbConn.close();
  }

  async function migrateCollection(admin: any, db: any, collectionName: string) {
    log(`Migrating collection: ${collectionName}`);
    const snapshot = await admin.collection(collectionName).get();
    const total = snapshot.size;
    log(`Found ${total} documents in ${collectionName}`);
    if (total === 0) return;

    const rows: any[] = [];
    let i = 0;
    for (const doc of snapshot.docs) {
      i++;
      const data = doc.data();
      // Basic validation / transform
      const validated = validateForCollection(collectionName, doc.id, data);
      if (!validated.ok) {
        warn(`Skipping doc ${doc.id} in ${collectionName}: ${validated.error}`);
        continue;
      }
      const row = { id: doc.id, ...validated.row };
      rows.push(row);

      if (rows.length >= BATCH) {
        await writeBatch(db, collectionName, rows.splice(0, rows.length));
        log(`Inserted ${i}/${total} into ${collectionName}`);
      }
    }
    if (rows.length) {
      await writeBatch(db, collectionName, rows);
      log(`Inserted final ${rows.length} rows into ${collectionName}`);
    }
  }

  async function writeBatch(db: any, collectionName: string, rows: any[]) {
    // Map collection name to schema table if available
      const table = (_schema as any)[collectionName] || (_schema as any)[toCamel(collectionName)];
    if (!table) {
      warn(`No Drizzle table found for ${collectionName}; skipping insert (rows kept in migration sqlite schema might be missing)`);
      return;
    }
    try {
      await db.insert(table).values(rows).run();
    } catch (e: any) {
      err(`DB insert error for ${collectionName}:`, e?.message || e);
      // Try single inserts to surface faulty rows
      for (const r of rows) {
        try { await db.insert(table).values(r).run(); } catch (ee: any) { err('Failed row:', r.id, ee?.message || ee); }
      }
    }
  }

  function toCamel(s: string) {
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  function validateForCollection(collectionName: string, id: string, doc: any): { ok: boolean; error?: string; row?: any } {
    // Minimal validation per collection -- customize for your data
    switch (collectionName) {
      case 'users': {
        if (!doc.email) return { ok: false, error: 'missing email' };
        return { ok: true, row: { name: doc.name || null, email: doc.email || null, role: doc.role || null, themeSettings: JSON.stringify(doc.themeSettings || null), assignedResidences: JSON.stringify(doc.assignedResidences || []), createdAt: doc.createdAt || new Date().toISOString() } };
      }
      case 'residences': {
        return { ok: true, row: { name: doc.name || null, city: doc.city || null, address: doc.address || null, location: JSON.stringify(doc.location || null), managerId: doc.managerId || null, isEmergencyMode: doc.isEmergencyMode ? 1 : 0, buildings: JSON.stringify(doc.buildings || []), facilities: JSON.stringify(doc.facilities || []), disabled: doc.disabled ? 1 : 0, updatedAt: doc.updatedAt || new Date().toISOString() } };
      }
      case 'workers': {
        return { ok: true, row: { name: doc.name, employeeId: doc.employeeId || null, idNumber: doc.idNumber || null, nationality: doc.nationality || null, company: doc.company || null, role: doc.role || 'Worker', status: doc.status || 'Active', transferDestination: doc.transferDestination || null, updatedAt: doc.updatedAt || new Date().toISOString() } };
      }
      // Default: store JSON whole doc in a `data` field if table supports it
      default:
        return { ok: true, row: doc };
    }
  }

  try { await run(); } catch (e: any) { err('Fatal error', e); process.exit(1); }
})();
