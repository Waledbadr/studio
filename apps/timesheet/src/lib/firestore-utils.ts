import { onSnapshot as fbOnSnapshot, type DocumentData, type Query, type Unsubscribe } from 'firebase/firestore';

/**
 * A small wrapper over Firestore onSnapshot that logs detailed errors
 * and optionally retries once for transient watch-stream-close errors.
 */
export function safeOnSnapshot<T extends DocumentData = DocumentData>(
  query: Query<T>,
  next: (snapshot: any) => void,
  error?: (err: Error) => void,
  options?: { retryOnClose?: boolean }
) {
  let retried = false;

  const wrappedError = (err: any): void | Unsubscribe => {
    try {
      console.error('Firestore listener error (safeOnSnapshot):', err);
    } catch {}
    // Firestore sometimes closes watch streams with a specific message;
    // offer a single retry when configured.
    const message = (err && err.message) || String(err);
    const isWatchClose = /watch stream closed|UNAVAILABLE|Failed to get new host/i.test(message);
    if (options?.retryOnClose && !retried && isWatchClose) {
      retried = true;
      console.warn('safeOnSnapshot: retrying listener once after watch-stream-close');
      // re-subscribe: return a fresh subscription
      return fbOnSnapshot(query, next, (e) => wrappedError(e));
    }

    if (typeof error === 'function') error(err);
  };

  return fbOnSnapshot(query, next, (e) => wrappedError(e));
}

export default safeOnSnapshot;
