// Auth shim that calls the app API endpoints for session-based JWT auth
// Provides a small compatibility layer for existing client code.

type User = { uid: string; email?: string | null; displayName?: string | null } | null;
let currentUser: User = null;
let listeners: Array<(u: User) => void> = [];
let pollingHandle: any = null;
let fetchMeInFlight = false;

async function fetchMe() {
  // Prevent concurrent fetches
  if (fetchMeInFlight) return currentUser;
  fetchMeInFlight = true;
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      currentUser = null;
      listeners.forEach(l => { try { l(null); } catch {} });
      return null;
    }
    const json: any = await res.json();
    const user = json?.user ? { uid: json.user.id, email: json.user.email || null, displayName: json.user.name || null } : null;
    const changed = JSON.stringify(user) !== JSON.stringify(currentUser);
    if (changed) {
      currentUser = user;
      listeners.forEach(l => { try { l(currentUser); } catch {} });
    }
    return user;
  } catch (e) {
    console.warn('fetchMe error:', e);
    return null;
  } finally {
    fetchMeInFlight = false;
  }
}

export function getCurrentUser() {
  return currentUser;
}

export async function refreshMe() {
  return await fetchMe();
}

export function onAuthStateChanged(_auth: any, cb: (u: User) => void) {
  // Immediately call with current user (or null)
  try { cb(currentUser); } catch {}
  listeners.push(cb);
  // start polling if not started
  if (!pollingHandle) {
    // First fetch immediately
    void fetchMe().then(() => {
      // Then poll every 5 seconds for faster updates on registration
      pollingHandle = setInterval(() => { void fetchMe(); }, 5_000);
    });
  }
  return () => { listeners = listeners.filter(l => l !== cb); if (listeners.length === 0) { clearInterval(pollingHandle); pollingHandle = null; } };
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  listeners.forEach(l => { try { l(null); } catch {} });
}

export async function signInWithEmailAndPassword(_auth: any, email: string, password: string) {
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const j: any = await res.json();
  if (!j.ok) {
    const msg = j.error || 'Login failed';
    const err: any = new Error(msg);
    if (/password/i.test(msg)) err.code = 'auth/wrong-password';
    throw err;
  }
  currentUser = { uid: j.user.id, email: j.user.email || null, displayName: j.user.name || null };
  listeners.forEach(l => { try { l(currentUser); } catch {} });
  return { user: { uid: j.user.id, email: j.user.email } } as any;
}

export async function createUserWithEmailAndPassword(_auth: any, email: string, password: string) {
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const j: any = await res.json();
  if (!j.ok) {
    const msg = j.error || 'Register failed';
    const err: any = new Error(msg);
    throw err;
  }
  currentUser = { uid: j.user.id, email: j.user.email || null, displayName: j.user.name || null };
  listeners.forEach(l => { try { l(currentUser); } catch {} });
  return { user: { uid: j.user.id, email: j.user.email } } as any;
}

export async function updateProfile(user: any, updates: any) {
  // call /api/auth/me PATCH
  await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  // refresh current user
  await fetchMe();
}

// Export stubs for other exports to keep UI code compiling
export const EmailAuthProvider = { credential: (..._args: any[]) => ({}) };
export const GoogleAuthProvider = function(..._args: any[]) { return {}; } as any;
export const OAuthProvider = function(..._args: any[]) { return {}; } as any;
export function isSignInWithEmailLink(..._args: any[]) { return false; }
export async function signInWithEmailLink(..._args: any[]) { throw new Error('Not implemented'); }
export async function signInWithPopup(..._args: any[]) { throw new Error('Not implemented'); }
export async function signInWithRedirect(..._args: any[]) { throw new Error('Not implemented'); }
export async function getRedirectResult(..._args: any[]) { return null; }
export async function sendPasswordResetEmail(..._args: any[]) { throw new Error('Not implemented'); }
export async function sendSignInLinkToEmail(..._args: any[]) { throw new Error('Not implemented'); }
export async function updatePassword(..._args: any[]) { throw new Error('Not implemented'); }
export async function updateEmail(..._args: any[]) { throw new Error('Not implemented'); }
export async function reauthenticateWithCredential(..._args: any[]) { throw new Error('Not implemented'); }
export async function reauthenticateWithPopup(..._args: any[]) { throw new Error('Not implemented'); }
export async function linkWithCredential(..._args: any[]) { throw new Error('Not implemented'); }
export async function sendPasswordResetEmailAdmin(..._args: any[]) { throw new Error('Not implemented'); }

export type { User };
