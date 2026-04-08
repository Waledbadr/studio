// Simple dev store to emulate D1 for local Next.js dev (cloudflare branch).
// In `next dev` we don't have real D1 bindings, so we keep a small
// JSON store on disk (and in-memory cache) so data survives server restarts.

type DevDoc = Record<string, any>;

type DevStore = Record<string, DevDoc[]>;

const STORE_FILE = process.env.DEV_D1_STORE_FILE || '.dev-d1-store.json';

let memoryStore: DevStore | null = null;

function loadStoreFromDisk(): DevStore {
  try {
    if (typeof process === 'undefined') return {};
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const filePath = path.join(process.cwd(), STORE_FILE);
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as DevStore : {};
  } catch {
    return {};
  }
}

function saveStoreToDisk(store: DevStore) {
  try {
    if (typeof process === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const filePath = path.join(process.cwd(), STORE_FILE);
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Ignore disk errors in dev; fall back to in-memory only.
  }
}

function getStore(): DevStore {
  if (!memoryStore) {
    memoryStore = loadStoreFromDisk();
    const g = globalThis as any;
    g.__DEV_D1_STORE__ = memoryStore;
  }
  return memoryStore!;
}

export function devList(collection: string): DevDoc[] {
  const store = getStore();
  return store[collection] || [];
}

export function devUpsert(collection: string, id: string, data: DevDoc) {
  const store = getStore();
  const list = store[collection] || [];
  const idx = list.findIndex((d) => d.id === id);
  const next = { ...(idx >= 0 ? list[idx] : {}), ...data, id };
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

export function devFindByField(collection: string, field: string, value: any): DevDoc | null {
  const list = devList(collection);
  return list.find((d) => (d as any)[field] === value) || null;
}

export function devGetById(collection: string, id: string): DevDoc | null {
  const list = devList(collection);
  return list.find((d) => d.id === id) || null;
}

export function devDelete(collection: string, id: string) {
  const store = getStore();
  const list = store[collection] || [];
  const next = list.filter((d) => d.id !== id);
  store[collection] = next;
  saveStoreToDisk(store);
}
