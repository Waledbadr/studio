import { addDoc, collection, serverTimestamp, doc, setDoc } from '@/lib/firestore-shim';
import * as D1Client from '@/lib/d1-client';

const USE_D1 =
  String(
    (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_USE_D1 : '') || ''
  ).toLowerCase() === 'true' || false;

// When in D1-only mode, messaging is disabled. Keep functions no-op.
let _isSupported: any;
let _getMessaging: any;
let _getToken: any;
let _onMessage: any;

let loadMessaging = async () => {
  // Default: messaging disabled
  _isSupported = async () => false;
  _getMessaging = () => undefined;
  _getToken = async () => undefined;
  _onMessage = () => () => {};
};



export async function enablePushIfGranted(userId?: string) {
  try {
    if (USE_D1) return; // disabled in D1 mode
    if (typeof window === 'undefined') return;
    await loadMessaging();
    if (!(await _isSupported())) return;
    if (Notification.permission !== 'granted') return;

    let reg: ServiceWorkerRegistration | undefined = undefined;
    try {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch {}

    const messaging = _getMessaging();
    const vapidKey =
      (typeof process !== 'undefined' && (process as any).env ? (process as any).env.NEXT_PUBLIC_FCM_VAPID_KEY : undefined) as
        | string
        | undefined;
    const token = await _getToken(messaging, { vapidKey, serviceWorkerRegistration: reg }).catch(() => undefined);
    if (!token) return;

    const tokenId = token.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 500);

    // In D1 mode we could store tokens in D1 if implemented; for now skip
    await setDoc(doc(collection(undefined as any, 'fcmTokens'), tokenId), {
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
  if (USE_D1) return () => {};
  try {
    if (typeof window === 'undefined') return () => {};
    await loadMessaging();
    if (!(await _isSupported())) return () => {};
    const messaging = _getMessaging();
    const unsub = _onMessage(messaging, (payload: any) => cb?.(payload));
    return unsub;
  } catch {
    return () => {};
  }
}
