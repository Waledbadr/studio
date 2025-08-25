import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

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
  if (admin.apps.length) return admin.app();
  try {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (b64 || svc) {
      const jsonStr = b64
        ? Buffer.from(b64, 'base64').toString('utf8')
        : (typeof svc === 'string' ? svc : JSON.stringify(svc));
      const credentials = JSON.parse(jsonStr);
      return admin.initializeApp({
        credential: admin.credential.cert(credentials as any),
        projectId: (credentials as any).project_id || getProjectIdFallback(),
      });
    }
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: getProjectIdFallback(),
    } as any);
  } catch (e) {
    console.error('firebase-admin init failed', e);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keepEmails, password } = await req.json();
    // naive guard so no one hits this by mistake in production
    if (password !== 'RESET123') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    initAdmin();
    const auth = admin.auth();

    const keep = new Set<string>((keepEmails || []).map((e: string) => String(e || '').trim().toLowerCase()));

  let deleted = 0, kept = 0;
  const keptUsers: { email: string; uid: string }[] = [];
    const MAX_PER_PAGE = 1000;
    let nextPageToken: string | undefined = undefined;

    do {
      const { users, pageToken } = await auth.listUsers(MAX_PER_PAGE, nextPageToken);
      for (const u of users) {
        const email = String(u.email || '').trim().toLowerCase();
        if (keep.has(email)) { kept++; keptUsers.push({ email, uid: u.uid }); continue; }
        await auth.deleteUser(u.uid);
        deleted++;
      }
      nextPageToken = pageToken || undefined;
    } while (nextPageToken);

  return NextResponse.json({ deleted, kept, keptUsers });
  } catch (e: any) {
    console.error('reset-auth error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
