// Minimal realtime/collection API shim for Cloudflare D1-only mode.
//
// This file provides a small compatibility surface for older client code that
// expected a document/collection API with optional realtime listeners.
//
// In this project, the authoritative data store is Cloudflare D1 + R2.
// Realtime listeners are not supported here; onSnapshot immediately yields an
// empty snapshot and returns a no-op unsubscribe.

export type Database = any;
export type DocumentReference<T = any> = any;
export type DocumentSnapshot<T = any> = { exists: () => boolean; data: () => T; id?: string; ref?: any };
export type QueryDocumentSnapshot<T = any> = DocumentSnapshot<T> & { id: string };
export type DocumentData = any;
export type Query<T = any> = any;
export type Unsubscribe = () => void;
export type Timestamp = any;

export function collection(_db: any, name: string) {
  return { _name: name } as any;
}

export function doc(refOrDb: any, pathOrId?: string, id?: string) {
  // Support both doc(collection, id) and doc(db, path, id) call shapes
  if (typeof pathOrId === 'string' && id === undefined) {
    return { _ref: refOrDb, _id: pathOrId } as any;
  }
  return { _path: pathOrId || null, _id: id || null } as any;
}

export async function getDocs(_q: any) {
  return { docs: [] } as any;
}

export async function getDoc(d: any) {
  return { exists: () => false, data: () => null, ref: d } as any;
}

export function collectionGroup(name: string) {
  return { _group: name } as any;
}

export function getCountFromServer(_q?: any) {
  return { data: () => ({ count: 0 }) };
}

export async function addDoc(_col: any, _data: any) {
  return { id: `shim-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, ref: { id: `shim-${Date.now()}` } } as any;
}

export async function setDoc(_ref: any, _data: any, _opts?: any) {
  throw new Error('Realtime shim: writes are disabled. Use D1 endpoints/actions.');
}

export async function updateDoc(_ref: any, _data: any) {
  throw new Error('Realtime shim: writes are disabled. Use D1 endpoints/actions.');
}

export async function deleteDoc(_ref: any) {
  throw new Error('Realtime shim: writes are disabled. Use D1 endpoints/actions.');
}

export function query<T = any>(...args: any[]): Query<T> { return args as any; }
export function where(...args: any[]) { return args; }
export function orderBy(...args: any[]) { return args; }
export function limit(n?: number) { return [n]; }
export function startAfter(...args: any[]) { return args; }

export function onSnapshot(_ref: any, onNext?: (snapshot: { docs: any[] }) => void, onError?: (e: any) => void): Unsubscribe {
  if (typeof onNext === 'function') {
    try { onNext({ docs: [] }); } catch (e) { if (typeof onError === 'function') onError(e); }
  }
  return () => {};
}

export const serverTimestamp = () => new Date();
export const Timestamp = { now: () => new Date() } as any;
export const increment = (v: number) => ({ _op: 'increment', v });
export const arrayUnion = (...args: any[]) => ({ _op: 'arrayUnion', args });
export const arrayRemove = (...args: any[]) => ({ _op: 'arrayRemove', args });

export function writeBatch(_db: any) {
  return {
    set: (_ref: any, _data: any, _opts?: any) => {},
    update: (_ref: any, _data: any) => {},
    delete: (_ref: any) => {},
    commit: async () => {}
  } as any;
}

export async function runTransaction(_db: any, _fn: any) {
  throw new Error('Realtime shim: transactions are not supported. Implement server-side operation using D1.');
}

export async function getDocFromServer(ref: any) {
  return getDoc(ref);
}
