// Minimal Firebase stub for D1-only mode
// Exports nulls and a resolved authReady promise so the codebase can
// safely import from '@/lib/firebase' without initializing the SDK.

const USE_D1 = String(process.env.NEXT_PUBLIC_USE_D1 || '').toLowerCase() === 'true' || false;

if (USE_D1) {
  console.log('D1-only mode: Firebase features are disabled.');

  // Install a lightweight client-side error suppression for known Firebase config errors
  // This prevents noisy uncaught exceptions in D1-only mode while we progressively
  // refactor functions to use D1 fallbacks instead of throwing synchronously.
  try {
    if (typeof window !== 'undefined') {
      const onWinError = (e: ErrorEvent) => {
        try {
          if (e && e.message && /Firebase is not configured/.test(e.message)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return true;
          }
        } catch {}
        return false;
      };
      const onUnhandled = (ev: PromiseRejectionEvent) => {
        try {
          const reason = (ev && (ev.reason || '') || '').toString();
          if (/Firebase is not configured/.test(reason)) {
            ev.preventDefault();
            return true;
          }
        } catch {}
        return false;
      };
      window.addEventListener('error', onWinError as any, true);
      window.addEventListener('unhandledrejection', onUnhandled as any, true);
    }
  } catch (e) {
    // ignore
  }
}

const app = null as null;
const db = null as null;
const auth = null as null;
const storage = null as null;
const authReady: Promise<void> = Promise.resolve();

export { app, db, auth, storage, authReady };

