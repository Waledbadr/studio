// Minimal Firestore shim for D1-only mode
// Provides compatibility exports so code importing from 'firebase/firestore'
// doesn't crash when Firebase is removed. These are lightweight stubs —
// read functions return empty results; write functions throw a descriptive error.

export function collection(db: any, name: string) {
  return { _name: name } as any;
}

export function doc(db: any, path: string, id?: string) {
  return { _path: path, _id: id } as any;
}

export async function getDocs(q: any) {
  return { docs: [] } as any;
}

export async function getDoc(d: any) {
  return { exists: () => false, data: () => null } as any;
}

export async function addDoc(col: any, data: any) {
  throw new Error('Firestore write operations are disabled in D1-only mode. Use D1 endpoints or implement D1 actions.');
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

export function query(...args: any[]) { return args; }
export function where() { return []; }
export function orderBy() { return []; }
export function limit() { return []; }
export function startAfter() { return []; }
export function getCountFromServer() { return { data: () => ({ count: 0 }) }; }
export function onSnapshot(ref: any, onNext?: any, onError?: any) {
  // No realtime in D1 shim — immediately call onNext with empty snapshot if provided
  if (onNext) {
    try { onNext({ docs: [] }); } catch {}
  }
  return () => {}; // unsubscribe
}

export const serverTimestamp = () => new Date();
export const Timestamp = { now: () => new Date() };
export const increment = (v: number) => ({ _op: 'increment', v });
export const arrayUnion = (...args: any[]) => ({ _op: 'arrayUnion', args });

export function writeBatch(db: any) {
  return { set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} };
}

export async function runTransaction(db: any, fn: any) {
  throw new Error('Transactions are not supported in D1 shim. Implement server-side operation using D1.');
}

// Convenience: alias for server-side getDoc when code expects it
export async function getDocFromServer(ref: any) {
  return getDoc(ref);
}
