// Minimal Firestore shim for D1-only mode
// Provides compatibility exports so code importing from 'firebase/firestore'
// doesn't crash when Firebase is removed. These are lightweight stubs —
// read functions return empty results; write functions throw a descriptive error.

export type Firestore = any;
export type DocumentReference<T = any> = any;
export type DocumentSnapshot<T = any> = { exists: () => boolean; data: () => T; id?: string; ref?: any };
export type QueryDocumentSnapshot<T = any> = DocumentSnapshot<T> & { id: string };
export type DocumentData = any;
export type Query<T = any> = any;
export type Unsubscribe = () => void;
export type Timestamp = any;

export function collection(db: any, name: string) {
  return { _name: name } as any;
}

export function doc(refOrDb: any, pathOrId?: string, id?: string) {
  // Support both doc(collection, id) and doc(db, path, id) call shapes
  if (typeof pathOrId === 'string' && id === undefined) {
    // called as doc(collectionRef)
    return { _ref: refOrDb, _id: pathOrId } as any;
  }
  return { _path: pathOrId || null, _id: id || null } as any;
}

export async function getDocs(q: any) {
  return { docs: [] } as any;
}

export async function getDoc(d: any) {
  return { exists: () => false, data: () => null, ref: d } as any;
}

export function collectionGroup(name: string) {
  return { _group: name } as any;
}

export function getCountFromServer(q?: any) { return { data: () => ({ count: 0 }) }; }
export async function addDoc(col: any, data: any) {
  // In D1-only mode, we don't persist writes here; return a fake ref to satisfy callers
  return { id: `shim-${Date.now()}-${Math.random().toString(36).slice(2,9)}`, ref: { id: `shim-${Date.now()}` } } as any;
}

export async function setDoc(ref: any, data: any, opts?: any) {
  throw new Error('Firestore write operations are disabled in D1-only mode. Use D1 endpoints or implement D1 actions.');
}

export async function updateDoc(ref: any, data: any) {
  throw new Error('Firestore write operations are disabled in D1-only mode. Use D1 endpoints or implement D1 actions.');
}

export async function deleteDoc(ref: any) {
  throw new Error('Firestore write operations are disabled in D1-only mode. Use D1 endpoints or implement D1 actions.');
}

export function query<T = any>(...args: any[]): Query<T> { return args as any; }
export function where(...args: any[]) { return args; }
export function orderBy(...args: any[]) { return args; }
export function limit(n?: number) { return [n]; }
export function startAfter(...args: any[]) { return args; }

export function onSnapshot(ref: any, onNext?: (snapshot: { docs: any[] }) => void, onError?: (e: any) => void): Unsubscribe {
  // No realtime in D1 shim — immediately call onNext with empty snapshot if provided
  if (typeof onNext === 'function') {
    try { onNext({ docs: [] }); } catch (e) { if (typeof onError === 'function') onError(e); }
  }
  return () => {}; // unsubscribe
}

export const serverTimestamp = () => new Date();
export const Timestamp = { now: () => new Date() } as any;
export const increment = (v: number) => ({ _op: 'increment', v });
export const arrayUnion = (...args: any[]) => ({ _op: 'arrayUnion', args });
export const arrayRemove = (...args: any[]) => ({ _op: 'arrayRemove', args });

export function writeBatch(db: any) {
  return {
    set: (ref: any, data: any, opts?: any) => {},
    update: (ref: any, data: any) => {},
    delete: (ref: any) => {},
    commit: async () => {}
  } as any;
}

export async function runTransaction(db: any, fn: any) {
  throw new Error('Transactions are not supported in D1 shim. Implement server-side operation using D1.');
}

// Convenience: alias for server-side getDoc when code expects it
export async function getDocFromServer(ref: any) {
  return getDoc(ref);
}
