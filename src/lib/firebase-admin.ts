import type { Bucket } from '@google-cloud/storage';

declare const require: any;

let adminApp: any | null = null;
let adminDb: any | null = null;
let adminBucket: Bucket | null = null;

function parseServiceAccountFromEnv():
	| { projectId?: string; clientEmail?: string; privateKey?: string }
	| null {
	try {
		const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
		if (b64) {
			const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
			const svc = JSON.parse(jsonStr);
			return {
				projectId: svc.project_id || svc.projectId,
				clientEmail: svc.client_email || svc.clientEmail,
				privateKey: svc.private_key || svc.privateKey,
			};
		}
		const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
		if (svc) {
			const obj = typeof svc === 'string' ? JSON.parse(svc) : (svc as any);
			return {
				projectId: obj.project_id || obj.projectId,
				clientEmail: obj.client_email || obj.clientEmail,
				privateKey: obj.private_key || obj.privateKey,
			};
		}
	} catch {
		// ignore
	}
	return null;
}

function initAdmin() {
	if (adminApp) return;

	const admin = require('firebase-admin');
	try {
		require('firebase-admin/storage');
	} catch (e) {
		// storage might be already registered or not needed
	}

	// Prefer explicit service account inputs
	const svcParsed = parseServiceAccountFromEnv();
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || svcParsed?.projectId;
	const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || svcParsed?.clientEmail;
	let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || svcParsed?.privateKey;
	// Allow \n in env to be parsed correctly
	if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

	if (projectId && clientEmail && privateKey) {
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
			adminBucket = bucketName
				? (admin.storage().bucket(bucketName) as unknown as Bucket)
				: (admin.storage().bucket() as unknown as Bucket);
		} catch {}
		return;
	}

	// Fallback: Application Default Credentials ONLY if an explicit, existing path is provided
	const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
	
	if (adcPath && typeof adcPath === 'string') {
		try {
			const fs = require('fs');
			if (fs.existsSync(adcPath)) {
				adminApp = admin.apps.length ? admin.app() : admin.initializeApp();
				adminDb = admin.firestore();
				try {
					const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
					adminBucket = bucketName
						? (admin.storage().bucket(bucketName) as unknown as Bucket)
						: (admin.storage().bucket() as unknown as Bucket);
				} catch {}
			}
		} catch {
			// ignore ADC errors in local/dev
		}
	}
	// If still not initialized, leave adminDb null so callers can detect and skip admin-only writes
}

export function getAdminDb(): any | null {
	if (!adminDb) initAdmin();
	return adminDb;
}

export function getAdminBucket(): Bucket | null {
	if (!adminBucket) initAdmin();
	return adminBucket;
}


