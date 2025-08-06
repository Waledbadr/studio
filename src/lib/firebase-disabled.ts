// Temporary Firebase disable for deployment
// This file replaces firebase.ts to ensure the app works without Firebase

import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";

// Export null values to disable Firebase
export const app: FirebaseApp | null = null;
export const db: Firestore | null = null;

console.log("🔧 Firebase disabled - using local storage mode");
