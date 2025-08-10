// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, setLogLevel, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, type Auth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";

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

// Check if Firebase config is properly set
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => 
  value && typeof value === 'string' && !value.includes('your_') && value !== 'your_api_key_here'
);

// A promise that resolves when auth state is ready (client-only)
let authReady: Promise<void> = Promise.resolve();

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);

    // Quieter console: only errors
    setLogLevel('error');

    // Initialize Auth and ensure a signed-in user (anonymous) exists on the client
    auth = getAuth(app);

    if (typeof window !== 'undefined') {
      // Persist auth locally so tabs share state
      setPersistence(auth, browserLocalPersistence).catch(() => {});

      authReady = new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth!, () => {
          unsub();
          resolve();
        });
      });

      if (!auth.currentUser) {
        signInAnonymously(auth).catch((e) => {
          // Avoid noisy logs; Firestore will still deny without auth
          console.warn('Anonymous sign-in failed:', e?.code || e);
        });
      }

      // Enable offline persistence in the browser to make snapshots resilient
      if (db) {
        enableIndexedDbPersistence(db).catch((err) => {
          // Ignore common multi-tab error to avoid noisy logs
          console.warn('IndexedDB persistence unavailable:', err?.code || err);
        });
      }
    }

    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization error. Make sure you have set up your .env file correctly.", e);
  }
} else {
  console.warn("Firebase not configured. Using local storage fallback. Please configure Firebase in .env.local for full functionality.");
}

export { app, db, auth, authReady };
