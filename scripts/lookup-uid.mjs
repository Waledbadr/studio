// Lookup Firebase Auth UIDs by email using firebase-admin
// Usage:
//   1) Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
//      or set FIREBASE_SERVICE_ACCOUNT to the JSON string
//   2) Run: npm run lookup:uid -- email1@example.com email2@example.com

import 'dotenv/config';
import admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps.length) return admin.app();
  // Prefer Application Default Credentials if available
  try {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (svc) {
      const credentials = typeof svc === 'string' ? JSON.parse(svc) : svc;
      return admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id,
      });
    }
    // Fallback to ADC via GOOGLE_APPLICATION_CREDENTIALS
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (e) {
    console.error('Failed to initialize firebase-admin. Ensure credentials are set.', e);
    process.exit(1);
  }
}

async function main() {
  const emails = process.argv.slice(2).filter(Boolean);
  if (emails.length === 0) {
    console.error('Provide at least one email. Example: npm run lookup:uid -- user@example.com');
    process.exit(1);
  }

  initAdmin();
  const auth = admin.auth();

  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`${email} -> UID: ${user.uid}`);
    } catch (e) {
      const msg = e?.errorInfo?.message || e?.message || String(e);
      console.log(`${email} -> ERROR: ${msg}`);
    }
  }
}

main();
