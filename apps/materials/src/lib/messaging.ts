import { db, app } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';

// Lazy import messaging modules because not all environments support it
let _isSupported: any;
let _getMessaging: any;
let _getToken: any;
let _onMessage: any;

async function loadMessaging() {
  if (_isSupported) return;
  const m = await import('firebase/messaging');
  _isSupported = m.isSupported;
  _getMessaging = m.getMessaging;
  _getToken = m.getToken;
  _onMessage = m.onMessage;
}

export async function enablePushIfGranted(userId?: string) {
  try {
    if (typeof window === 'undefined' || !app || !db) return;
    await loadMessaging();
    if (!(await _isSupported())) return;
    // Only register if permission already granted (no intrusive prompt here)
    if (Notification.permission !== 'granted') return;

    // Ensure service worker is registered for messaging
    let reg: ServiceWorkerRegistration | undefined = undefined;
    try {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch {}

    const messaging = _getMessaging(app);
    // VAPID key is optional if configured in console, but recommended
    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    const token = await _getToken(messaging, { vapidKey, serviceWorkerRegistration: reg }).catch(() => undefined);
    if (!token) return;

    // Store/Upsert token document
    // Using deterministic doc id with the token avoids duplicates
    const tokenId = token.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 500);
    await setDoc(doc(collection(db, 'fcmTokens'), tokenId), {
      token,
      userId: userId || null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    // noop
  }
}

export async function setupForegroundMessageListener(cb: (payload: any) => void) {
  try {
    if (typeof window === 'undefined' || !app) return () => {};
    await loadMessaging();
    if (!(await _isSupported())) return () => {};
    const messaging = _getMessaging(app);
    const unsub = _onMessage(messaging, (payload: any) => cb?.(payload));
    return unsub;
  } catch {
    return () => {};
  }
}
