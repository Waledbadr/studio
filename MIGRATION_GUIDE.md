# Firestore → D1 Migration Guide

This guide explains how to migrate data from Firestore to a Drizzle-compatible SQLite database (which can then be imported or adapted for Cloudflare D1).

Overview
- The project includes two helper scripts in `scripts/`:
  - `migrate-firestore-to-d1.ts` — Reads Firestore via the Admin SDK and writes rows into a SQLite DB using Drizzle. The script tries to validate basic fields and write per-collection batches.
  - `verify-migration.ts` — Compares document counts between Firestore collections and the SQLite tables to highlight mismatches.

Prerequisites
- Ensure Firestore Admin SDK can be initialized in this environment. Set `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_B64` in env as used elsewhere in the repo.
- Install dependencies for running the scripts (dev environment):
  - `npm install` (project dependencies should already include `better-sqlite3` and `drizzle-orm`.)
  - To run TypeScript scripts directly: `npx ts-node` or use a compiled JS target.

Recommended Steps
1. Dry-run locally
  - Run the verification script first to see current counts:
    npx ts-node scripts/verify-migration.ts --file=./migration.sqlite
    or (via npm script):
    npm run verify:migration -- --file=./migration.sqlite
  - If you want to migrate only a subset of collections (recommended for first runs):
    npx ts-node scripts/migrate-firestore-to-d1.ts --file=./migration.sqlite --collections=users,residences
    or (via npm script):
    npm run migrate:firestore-to-d1 -- --file=./migration.sqlite --collections=users,residences

Note: If you do not have ts-node installed globally, `npx ts-node` will fetch it temporarily, or you can `npm i -D ts-node` to add it to the project for convenience.
2. Inspect the generated SQLite file
  - Use `sqlite3 migration.sqlite` or a GUI (DB Browser for SQLite) to inspect data and ensure critical fields are present and correctly typed.

3. Full migration
  - Once the subset looks good, migrate additional collections or all default candidate collections (users, residences, workers, inventory, mrvs, orders, invoices, notifications, feedback, ...):
    npx ts-node scripts/migrate-firestore-to-d1.ts --file=./migration.sqlite

4. Verify counts
  - Run the verifier and confirm counts match for each collection:
    npx ts-node scripts/verify-migration.ts --file=./migration.sqlite

5. Resolve mismatches
  - Use the logs to identify skipped documents or validation errors. The scripts provide warnings for skipped docs and per-row insert failures.

6. Import into D1 / Cloudflare
  - The scripts produce a SQLite DB that can be imported or used as a staging area. You may need to adapt types and column names to match the D1 schema exactly.

Notes & Tips
- Idempotence: The scripts write rows keyed by Firestore document IDs where possible. Re-running will attempt to insert the same IDs; adjust as needed to skip or upsert.
- Batch size: `--batchSize` is available on the migrate script to tune memory vs. performance.
- Extend validation: The `validateForCollection` function in `scripts/migrate-firestore-to-d1.ts` contains minimal per-collection checks. Add stricter validation for critical collections.
- Backups: Always take a Firestore export/backup before mass migration.

If you'd like, I can:
- Add per-collection mapping logic for more tables (e.g., normalize arrays to junction tables where D1 schema demands it), or
- Add an `--upsert` mode that uses Drizzle's `onConflictDoUpdate` pattern (if you prefer idempotent runs), or
- Wire a `--dry-run` flag that validates and logs changes without writing to SQLite.

---
