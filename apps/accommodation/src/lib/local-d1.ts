import { createRequire } from 'module';

type BetterSqlite3Module = (file: string) => BetterSqlite3Database;

type BetterSqlite3RunResult = {
  changes: number;
  lastInsertRowid?: number | bigint;
};

type BetterSqlite3Statement = {
  run(...params: unknown[]): BetterSqlite3RunResult;
  all(...params: unknown[]): Record<string, unknown>[];
  get(...params: unknown[]): Record<string, unknown> | undefined;
};

type BetterSqlite3Database = {
  pragma(statement: string): unknown;
  exec(sql: string): unknown;
  prepare(sql: string): BetterSqlite3Statement;
};

let cachedLocalD1Binding: any | null = null;
let cachedWorkspaceRoot: string | null = null;

function safeRequire(moduleName: string): any {
  const req = createRequire(import.meta.url);
  return req(moduleName);
}

function shouldUseLocalD1(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env.NODE_ENV === 'production') return false;

  const disableLocalD1 = String(process.env.DISABLE_LOCAL_D1 || '').toLowerCase();
  return disableLocalD1 !== '1' && disableLocalD1 !== 'true';
}

function resolveWorkspaceRoot() {
  if (cachedWorkspaceRoot) return cachedWorkspaceRoot;

  const fs = safeRequire('fs') as typeof import('fs');
  const path = safeRequire('path') as typeof import('path');
  let currentDir = process.cwd();

  while (true) {
    const accommodationPackage = path.join(currentDir, 'apps', 'accommodation', 'package.json');
    const migrationsFile = path.join(currentDir, 'migrations', '001_create_d1_tables.sql');

    if (fs.existsSync(accommodationPackage) && fs.existsSync(migrationsFile)) {
      cachedWorkspaceRoot = currentDir;
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  cachedWorkspaceRoot = process.cwd();
  return cachedWorkspaceRoot;
}

function resolveWorkspaceMigrationsDir(path: any): string | null {
  const fs = safeRequire('fs') as typeof import('fs');
  const workspaceRoot = resolveWorkspaceRoot();
  const candidates = [
    path.resolve(workspaceRoot, 'migrations'),
    path.resolve(workspaceRoot, '..', 'migrations'),
    path.resolve(workspaceRoot, 'apps', 'accommodation', '..', '..', 'migrations'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function applyMigrations(db: BetterSqlite3Database) {
  const fs = safeRequire('fs') as typeof import('fs');
  const path = safeRequire('path') as typeof import('path');

  const migrationsDir = resolveWorkspaceMigrationsDir(path);
  if (!migrationsDir) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS __local_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file: string) => file.endsWith('.sql'))
    .sort((a: string, b: string) => a.localeCompare(b));

  for (const fileName of migrationFiles) {
    const existing = db
      .prepare('SELECT name FROM __local_migrations WHERE name = ? LIMIT 1')
      .get(fileName);
    if (existing) continue;

    const sqlPath = path.join(migrationsDir, fileName);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    if (!sql.trim()) continue;
    db.exec(sql);
    db
      .prepare('INSERT INTO __local_migrations (name, applied_at) VALUES (?, ?)')
      .run(fileName, new Date().toISOString());
  }
}

function applyUsersCompatibilityColumns(db: BetterSqlite3Database) {
  const compatibilityStatements = [
    'ALTER TABLE users ADD COLUMN assigned_residences JSON',
    'ALTER TABLE users ADD COLUMN theme_settings JSON',
    'ALTER TABLE users ADD COLUMN created_at TEXT',
    'ALTER TABLE users ADD COLUMN updated_at TEXT',
    'ALTER TABLE users ADD COLUMN password_hash TEXT',
  ];

  for (const sql of compatibilityStatements) {
    try {
      db.exec(sql);
    } catch {
      // Column likely exists already.
    }
  }
}

function createD1CompatBinding(db: BetterSqlite3Database) {
  return {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        bind(...params: unknown[]) {
          return {
            async run() {
              const result = stmt.run(...params);
              const lastInsertRowid =
                typeof result.lastInsertRowid === 'bigint'
                  ? Number(result.lastInsertRowid)
                  : Number(result.lastInsertRowid || 0);

              return {
                success: true,
                meta: {
                  changes: result.changes || 0,
                  last_row_id: lastInsertRowid,
                },
              };
            },
            async all() {
              return {
                results: stmt.all(...params),
              };
            },
          };
        },
      };
    },
  };
}

function createLocalD1Binding() {
  const fs = safeRequire('fs') as typeof import('fs');
  const path = safeRequire('path') as typeof import('path');
  const BetterSqlite3 = safeRequire('better-sqlite3') as BetterSqlite3Module;
  const workspaceRoot = resolveWorkspaceRoot();

  const dbDir = path.join(workspaceRoot, 'apps', 'accommodation', '.local-d1');
  const dbFilePath = path.join(dbDir, 'estatecare.dev.sqlite');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = BetterSqlite3(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  applyMigrations(db);
  applyUsersCompatibilityColumns(db);

  return createD1CompatBinding(db);
}

export function getLocalD1Binding(): any | null {
  if (!shouldUseLocalD1()) return null;
  if (cachedLocalD1Binding) return cachedLocalD1Binding;

  try {
    cachedLocalD1Binding = createLocalD1Binding();
    return cachedLocalD1Binding;
  } catch (error) {
    console.warn('Local D1 initialization failed, falling back to dev memory store.', error);
    return null;
  }
}
