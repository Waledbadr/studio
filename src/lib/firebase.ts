// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, setLogLevel, enableIndexedDbPersistence } from "firebase/firestore";

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

// Check if Firebase config is properly set
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => 
  value && typeof value === 'string' && !value.includes('your_') && value !== 'your_api_key_here'
);

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);

    // Quieter console: only errors
    setLogLevel('error');

    // Enable offline persistence in the browser to make snapshots resilient
    if (typeof window !== 'undefined' && db) {
      enableIndexedDbPersistence(db).catch((err) => {
        // Ignore common multi-tab error to avoid noisy logs
        console.warn('IndexedDB persistence unavailable:', err?.code || err);
      });
    }

    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization error. Make sure you have set up your .env file correctly.", e);
  }
} else {
  console.warn("Firebase not configured. Using local storage fallback. Please configure Firebase in .env.local for full functionality.");
}

export { app, db };
