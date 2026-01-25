// Auth shim that calls the app API endpoints for session-based JWT auth
// Provides a small compatibility layer for existing client code.

type User = { uid: string; email?: string | null; displayName?: string | null } | null;
let currentUser: User = null;
let listeners: Array<(u: User) => void> = [];
let pollingHandle: any = null;
let fetchMeInFlight = false;
let refreshInFlight = false;
let lastRefreshAttemptAt = 0;
let hadSession = false;

let eventHandlersAttached = false;

function broadcastAuthChange() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('ec_auth_changed_at', String(Date.now()));
    }
  } catch {
    // ignore
  }
}

function ensureAuthEventHandlers() {
  if (eventHandlersAttached) return;
  if (typeof window === 'undefined') return;
  eventHandlersAttached = true;

  const refreshIfVisible = () => {
    try {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    } catch {
      // ignore
    }
    void fetchMe({ allowRefresh: true });
  };

  window.addEventListener('focus', refreshIfVisible);
  window.addEventListener('online', refreshIfVisible);
  document.addEventListener('visibilitychange', refreshIfVisible);
  window.addEventListener('storage', (e) => {
    if (e.key === 'ec_auth_changed_at') {
      refreshIfVisible();
    }
  });
}

function markHadSession() {
  if (hadSession) return;
  hadSession = true;
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('ec_had_session', '1');
      // Also persist across reloads/new tabs.
      window.localStorage?.setItem('ec_had_session', '1');
    }
  } catch {
    // ignore
  }
}

function initHadSessionFromStorage() {
  if (hadSession) return;
  try {
    if (typeof window !== 'undefined') {
      hadSession = window.sessionStorage?.getItem('ec_had_session') === '1' || window.localStorage?.getItem('ec_had_session') === '1';
    }
  } catch {
    // ignore
  }
}

async function tryRefreshOnce() {
  const now = Date.now();
  if (refreshInFlight) return false;
  // Avoid hammering refresh endpoint during logged-out states.
  if (now - lastRefreshAttemptAt < 60_000) return false;
  lastRefreshAttemptAt = now;
  refreshInFlight = true;
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const j: any = await res.json().catch(() => ({}));
    return !!(res.ok && j?.ok);
  } catch {
    return false;
  } finally {
    refreshInFlight = false;
  }
}

async function fetchMe(opts?: { allowRefresh?: boolean }) {
  initHadSessionFromStorage();
  // Prevent concurrent fetches
  if (fetchMeInFlight) return currentUser;
  fetchMeInFlight = true;
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      // Access token might have expired. If we previously had a session, try refresh once.
      if ((res.status === 401 || res.status === 403) && opts?.allowRefresh) {
        const refreshed = await tryRefreshOnce();
        if (refreshed) {
          markHadSession();
          fetchMeInFlight = false;
          return await fetchMe({ allowRefresh: false });
        }
      }

      currentUser = null;
      listeners.forEach(l => { try { l(null); } catch {} });
      return null;
    }
    const json: any = await res.json();
    const user = json?.user ? { uid: json.user.id, email: json.user.email || null, displayName: json.user.name || null } : null;

     if (user) {
       markHadSession();
     }

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
  return await fetchMe({ allowRefresh: true });
}

export function onAuthStateChanged(_auth: any, cb: (u: User) => void) {
  // Immediately call with current user (or null)
  try { cb(currentUser); } catch {}
  listeners.push(cb);
  ensureAuthEventHandlers();
  // Fetch once on first subscription without forcing refresh (let fetchMe handle refresh only on 401/403)
  if (!pollingHandle) {
    pollingHandle = true;
    void fetchMe();
  }
  return () => {
    listeners = listeners.filter(l => l !== cb);
    // Keep event handlers attached (cheap) but reset the one-time guard.
    if (listeners.length === 0) {
      pollingHandle = null;
    }
  };
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  listeners.forEach(l => { try { l(null); } catch {} });
  broadcastAuthChange();
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
  markHadSession();
  listeners.forEach(l => { try { l(currentUser); } catch {} });
  broadcastAuthChange();
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
  markHadSession();
  listeners.forEach(l => { try { l(currentUser); } catch {} });
  broadcastAuthChange();
  return { user: { uid: j.user.id, email: j.user.email } } as any;
}

export async function updateProfile(user: any, updates: any) {
  // call /api/auth/me PATCH
  await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  // refresh current user without forcing token refresh
  await fetchMe();
}

// Export stubs for other exports to keep UI code compiling
export const EmailAuthProvider = { credential: (..._args: any[]) => ({}) };
export const GoogleAuthProvider = function(..._args: any[]) { return {}; } as any;
export const OAuthProvider = function(..._args: any[]) { return {}; } as any;
// Optional OAuth/email-link APIs are not supported by the session-based shim.
// Export them as `undefined` so UI code can feature-detect via `typeof fn === 'function'`.
export const isSignInWithEmailLink: undefined | ((...args: any[]) => boolean) = undefined;
export const signInWithEmailLink: undefined | ((...args: any[]) => Promise<any>) = undefined;
export const signInWithPopup: undefined | ((...args: any[]) => Promise<any>) = undefined;
export const signInWithRedirect: undefined | ((...args: any[]) => Promise<any>) = undefined;
export const getRedirectResult: undefined | ((...args: any[]) => Promise<any>) = undefined;
export const sendPasswordResetEmail: undefined | ((...args: any[]) => Promise<void>) = async (_auth: any, email: string, _actionCodeSettings?: any) => {
  const res = await fetch('/api/auth/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || !j?.ok) {
    const msg = j?.error || 'Failed to request reset email';
    const err: any = new Error(msg);
    if (/invalid.*email/i.test(msg)) err.code = 'auth/invalid-email';
    if (/too many/i.test(msg)) err.code = 'auth/too-many-requests';
    throw err;
  }
};
export const sendSignInLinkToEmail: undefined | ((...args: any[]) => Promise<void>) = undefined;
export const updatePassword: undefined | ((...args: any[]) => Promise<void>) = undefined;
export const updateEmail: undefined | ((...args: any[]) => Promise<void>) = undefined;
export const reauthenticateWithCredential: undefined | ((...args: any[]) => Promise<void>) = undefined;
export const reauthenticateWithPopup: undefined | ((...args: any[]) => Promise<void>) = undefined;
export async function linkWithCredential(..._args: any[]) { throw new Error('Not implemented'); }
export async function sendPasswordResetEmailAdmin(..._args: any[]) { throw new Error('Not implemented'); }

export type { User };
