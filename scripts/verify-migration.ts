#!/usr/bin/env node
/*
  Verification script: Compares Firestore collection counts to SQLite (drizzle) table counts

  Usage:
    npx ts-node scripts/verify-migration.ts --file=./migration.sqlite --collections=users,residences
*/

const { getAdminDb: _getAdminDb } = require('../src/lib/firebase-admin');
const _Database: any = require('better-sqlite3');
const { drizzle: _drizzle } = require('drizzle-orm/sqlite3');
const _schema: any = require('../src/db/schema');
const _yargs: any = require('yargs/yargs');
const { hideBin: _hideBin } = require('yargs/helpers');

const _argv: any = _yargs(_hideBin(process.argv)).options({ file: { type: 'string', default: './migration.sqlite' }, collections: { type: 'string', default: '' }, }).parseSync();
(async function main() {
  const FILE = _argv.file;
  const SPECIFIED = _argv.collections ? _argv.collections.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  function log(...args: any[]) { console.log('[verify]', ...args); }
  function err(...args: any[]) { console.error('[verify][error]', ...args); }

  async function run() {
      const admin = _getAdminDb();
    if (!admin) { err('Firebase Admin not initialized.'); process.exit(1); }

    log('Opening sqlite file:', FILE);
    const dbConn = new _Database(FILE);
    const db = _drizzle(dbConn as any, { schema: (_schema as any).default || (_schema as any) });

    const candidates = [ 'users','residences','workers','occupants','accommodation_history','companies','contracts','invoices','mrvs','mrv_requests','orders','service_orders','inventory','inventory_categories','inventory_transactions','notifications','feedback' ];
    const collections = SPECIFIED.length ? SPECIFIED : candidates;

    for (const col of collections) {
      try {
        await compareCounts(admin, db, col);
      } catch (e: any) { err('Compare failed for', col, e?.message || e); }
    }

    dbConn.close();
  }

  async function compareCounts(admin: any, db: any, collectionName: string) {
    const snapshot = await admin.collection(collectionName).get();
    const fsCount = snapshot.size;

    const table = (_schema as any)[collectionName] || (_schema as any)[toCamel(collectionName)];
    let sqlCount = null;
    if (!table) {
      log(`${collectionName}: No table mapped in schema; skipping SQL count.`);
    } else {
      const r = await db.select({ c: db.raw('count(*)') }).from(table).execute();
      // Drizzle returns [{ c: 123 }]
      sqlCount = Number(r?.[0]?.c ?? r?.[0]?.count ?? 0);
    }

    log(`${collectionName}: Firestore=${fsCount} SQLite=${sqlCount === null ? 'N/A' : sqlCount} ${sqlCount === null ? '' : (fsCount === sqlCount ? '✅' : '⚠️ MISMATCH')}`);
  }

  function toCamel(s: string) { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }

  try { await run(); } catch (e: any) { err('Fatal error', e?.message || e); process.exit(1); }
})();
