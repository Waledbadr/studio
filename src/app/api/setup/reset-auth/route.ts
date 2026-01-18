import { NextRequest, NextResponse } from 'next/server';

declare const require: any;

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function getProjectIdFallback(): string | undefined {
  try {
    if (typeof process === 'undefined' || !(process as any)?.env) return undefined;
    const env = (process as any).env;
    if (env.GOOGLE_CLOUD_PROJECT) return env.GOOGLE_CLOUD_PROJECT;
    if (env.GCLOUD_PROJECT) return env.GCLOUD_PROJECT;
    if (env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (env.FIREBASE_CONFIG) {
      const cfg = JSON.parse(env.FIREBASE_CONFIG);
      if (cfg.projectId) return cfg.projectId;
    }
  } catch { }
  return undefined;
}

function initAdmin() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (err) {
    throw new Error('firebase-admin is not available in this build. Reinstall firebase-admin or enable legacy Firebase admin support if you need this route.');
  }

  if (admin.apps.length) return admin;
  try {
    const env = typeof process !== 'undefined' && (process as any)?.env ? (process as any).env : {};
    const b64 = env.FIREBASE_SERVICE_ACCOUNT_B64;
    const svc = env.FIREBASE_SERVICE_ACCOUNT;
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
    // D1-only: this route is disabled or needs to be rewritten for D1
    return NextResponse.json({ error: 'Not implemented for D1' }, { status: 501 });

    /* Firebase code removed
    const { keepEmails, password } = await req.json();
    // naive guard so no one hits this by mistake in production
    if (password !== 'RESET123') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    initAdmin();
    const auth = admin.auth();
    */

    /*
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
    */
    return NextResponse.json({ error: 'Not implemented for D1' }, { status: 501 });
  } catch (e: any) {
    console.error('reset-auth error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
