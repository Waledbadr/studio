// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

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
  value && typeof value === 'string' && value !== 'undefined' && !value.includes('your_') && value !== 'your_api_key_here'
);

console.log('Firebase config status:', isFirebaseConfigured ? 'Configured' : 'Not configured - using local storage mode');

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("✅ Firebase initialized successfully");
  } catch (e) {
    console.warn("⚠️ Firebase initialization failed, falling back to local storage:", e);
    app = null;
    db = null;
  }
} else {
  console.log("🔧 Firebase not configured - application will use local storage for data persistence");
}

export { app, db };
