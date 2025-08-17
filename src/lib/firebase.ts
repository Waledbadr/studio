// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  initializeFirestore,
  type Firestore,
  connectFirestoreEmulator,
  setLogLevel,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import { getAuth, type Auth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

// Check if Firebase config is properly set (require only essential keys)
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const isFirebaseConfigured = requiredKeys.every((k) => {
  const v = (firebaseConfig as any)[k];
  return v && typeof v === 'string' && v.trim().length > 0 && !v.includes('your_') && v !== 'your_api_key_here';
});

// A promise that resolves when auth state is ready (client-only)
let authReady: Promise<void> = Promise.resolve();

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    // Quieter console: only errors
    setLogLevel('error');

    // Decide cache strategy
    const useMemoryCache = (process.env.NEXT_PUBLIC_FIRESTORE_CACHE || '').toLowerCase() === 'memory'
      || process.env.NODE_ENV !== 'production';

    // Initialize Firestore with robust local cache and network settings
    try {
      db = initializeFirestore(app, {
        localCache: useMemoryCache
          ? memoryLocalCache()
          : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: useMemoryCache, // avoid primary lease contention in dev
        experimentalAutoDetectLongPolling: !useMemoryCache,
      } as any);
    } catch (e) {
      // Fallback (e.g., Safari Private Mode)
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
      } as any);
    }

    // If an emulator host is provided via env, connect the client to it so
    // local development doesn't try to reach production Firestore.
    // Accepts formats like "localhost:8080" or "localhost,8080" or just "localhost"
    const emulatorEnv =
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;

    if (emulatorEnv) {
      try {
        let host = String(emulatorEnv);
        let port = 8080;
        if (host.includes(':')) {
          const [h, p] = host.split(':');
          host = h;
          port = Number(p) || port;
        } else if (host.includes(',')) {
          const [h, p] = host.split(',');
          host = h;
          port = Number(p) || port;
        }

        if (typeof window !== 'undefined' && db) {
          // connectFirestoreEmulator is safe to call in the modular SDK v9+/v11
          connectFirestoreEmulator(db, host, port);
          console.log(`Firestore emulator enabled at ${host}:${port}`);
        }
      } catch (err) {
        console.warn('Failed to connect to Firestore emulator:', err);
      }
    }

    storage = getStorage(app);

    // Initialize Auth and ensure auth state is hydrated on the client
    auth = getAuth(app);

    if (typeof window !== 'undefined') {
      // Persist auth locally so tabs share state
      setPersistence(auth, browserLocalPersistence).catch(() => {});

      // Prefer device language for OAuth & email templates
      try { auth.useDeviceLanguage(); } catch {}

      authReady = new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth!, () => {
          unsub();
          resolve();
        });
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      const key = String(firebaseConfig.apiKey || '');
      const masked = key ? `${key.slice(0, 6)}...${key.slice(-2)}` : 'missing';
      console.log(`Firebase initialized. apiKey: ${masked}`);
    } else {
      console.log("Firebase initialized successfully");
    }
  } catch (e) {
    console.error("Firebase initialization error. Make sure you have set up your .env file correctly.", e);
  }
} else {
  console.warn("Firebase not configured. Using local storage fallback. Please configure Firebase in .env.local for full functionality.");
}

export { app, db, auth, storage, authReady };
