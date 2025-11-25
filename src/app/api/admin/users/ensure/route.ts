import { NextRequest, NextResponse } from 'next/server';

declare const require: any;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getProjectIdFallback(): string | undefined {
  try {
    if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
    if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (process.env.FIREBASE_CONFIG) {
      const cfg = JSON.parse(process.env.FIREBASE_CONFIG);
      if (cfg.projectId) return cfg.projectId;
    }
  } catch {}
  return undefined;
}

function initAdmin() {
  const admin = require('firebase-admin');
  if (admin.apps.length) return admin;
  try {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (b64 || svc) {
      const jsonStr = b64
        ? Buffer.from(b64, 'base64').toString('utf8')
        : (typeof svc === 'string' ? svc : JSON.stringify(svc));
      const credentials = JSON.parse(jsonStr);
      admin.initializeApp({
        credential: admin.credential.cert(credentials as any),
        projectId: (credentials as any).project_id || getProjectIdFallback(),
      });
      return admin;
    }
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: getProjectIdFallback(),
    } as any);
    return admin;
  } catch (e) {
    console.error('firebase-admin init failed', e);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = initAdmin();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : '';
    if (!token) return NextResponse.json({ error: 'missing token' }, { status: 401 });

    const decoded = await admin.auth().verifyIdToken(token);
    const requesterUid = decoded.uid;

    // Ensure requester is Admin in Firestore
    const db = admin.firestore();
    const requesterDoc = await db.doc(`users/${requesterUid}`).get();
    if (!requesterDoc.exists || (requesterDoc.data() as any)?.role !== 'Admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, assignedResidences, themeSettings } = body || {};
    const emailKey = String(email || '').trim().toLowerCase();
    if (!emailKey) return NextResponse.json({ error: 'email required' }, { status: 400 });

    // Lookup Auth user by email (must exist already for security flow)
    let user;
    try {
      user = await admin.auth().getUserByEmail(emailKey);
    } catch (e: any) {
      return NextResponse.json({ error: 'auth user not found' }, { status: 404 });
    }

    const uid = user.uid;
    const payload: Record<string, any> = {
      id: uid,
      name: name || user.displayName || emailKey,
      email: emailKey,
      role: role || 'Technician',
      assignedResidences: Array.isArray(assignedResidences) ? assignedResidences : [],
    };
    if (themeSettings && typeof themeSettings === 'object') payload.themeSettings = themeSettings;

    await db.doc(`users/${uid}`).set(payload, { merge: true });

    return NextResponse.json({ uid, email: emailKey, user: payload });
  } catch (e: any) {
    console.error('ensure user error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
