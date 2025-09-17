#!/usr/bin/env node
/*
  Usage:
    # Provide service account via env var (preferred):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"; node scripts/migrate-local-workers-to-firestore.mjs data/ac_workers.json

    # Or pass --serviceAccount=path
    node scripts/migrate-local-workers-to-firestore.mjs data/ac_workers.json --serviceAccount=./serviceAccountKey.json

  The script reads a JSON array from the provided file (default: data/ac_workers.json)
  and writes each worker into Firestore collection `workers` using the worker.id if present.
*/

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

const argv = process.argv.slice(2);
const jsonArg = argv.find(a => !a.startsWith('--')) || 'data/ac_workers.json';
const svcArg = argv.find(a => a.startsWith('--serviceAccount='));
const svcPath = svcArg ? svcArg.split('=')[1] : null;

const jsonPath = path.resolve(process.cwd(), jsonArg);
if (svcPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), svcPath);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('ERROR: Provide service account via GOOGLE_APPLICATION_CREDENTIALS env var or --serviceAccount=path');
  process.exitCode = 2;
  process.exit();
}

if (!fs.existsSync(jsonPath)) {
  console.error('ERROR: JSON file not found:', jsonPath);
  process.exitCode = 3;
  process.exit();
}

try {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
} catch (e) {
  // if already initialized, ignore
}

const db = admin.firestore();

async function main() {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  let list;
  try {
    list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error('Expected array');
  } catch (e) {
    console.error('ERROR: Failed to parse JSON file:', e.message);
    process.exitCode = 4;
    return;
  }

  console.log(`Migrating ${list.length} workers from ${jsonPath} → Firestore collection 'workers'`);
  let migrated = 0; let errors = 0; let skipped = 0;

  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    const id = w.id || `w_${Date.now()}_${i}`;
    const payload = { name: w.name || '', nationaliy: w.nationaliy || '', role: w.role || 'Worker' };
    try {
      await db.collection('workers').doc(id).set(payload, { merge: true });
      migrated++;
      if (migrated % 50 === 0) process.stdout.write(`.
`);
    } catch (e) {
      console.error('Failed to write worker', id, e.message || e);
      errors++;
    }
  }

  console.log('\nMigration complete.');
  console.log({ migrated, skipped, errors });
}

main().catch((e) => { console.error('Migration failed:', e); process.exitCode = 5; });
