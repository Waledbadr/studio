import admin from 'firebase-admin';
import 'firebase-admin/storage';
import type { Bucket } from '@google-cloud/storage';

let adminApp: admin.app.App | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminBucket: Bucket | null = null;

function initAdmin() {
	if (adminApp) return;
	const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
	let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
	// Allow \n in env to be parsed correctly
	if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

	if (!projectId || !clientEmail || !privateKey) {
		// Attempt to use default credentials (useful in emulator/local with ADC)
		try {
			adminApp = admin.apps.length ? admin.app() : admin.initializeApp();
			adminDb = admin.firestore();
			try {
				const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
				adminBucket = bucketName ? (admin.storage().bucket(bucketName) as unknown as Bucket) : (admin.storage().bucket() as unknown as Bucket);
			} catch {}
			return;
		} catch {
			// Not available
			return;
		}
	}

	adminApp = admin.apps.length
		? admin.app()
		: admin.initializeApp({
				credential: admin.credential.cert({
					projectId,
					clientEmail,
					privateKey,
				}),
			});
	adminDb = admin.firestore();
			try {
				const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
				adminBucket = bucketName ? (admin.storage().bucket(bucketName) as unknown as Bucket) : (admin.storage().bucket() as unknown as Bucket);
			} catch {}
}

export function getAdminDb(): admin.firestore.Firestore | null {
	if (!adminDb) initAdmin();
	return adminDb;
}

export function getAdminBucket(): Bucket | null {
	if (!adminBucket) initAdmin();
	return adminBucket;
}

