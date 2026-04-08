import { NextRequest, NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';
import { verifySession, getUserByEmail } from '@/lib/auth-server';

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

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session || typeof session.uid !== 'string') {
      return NextResponse.json({ error: 'missing token' }, { status: 401 });
    }
    const requesterUid = session.uid;

    // Ensure requester is Admin using D1-backed user records
    const d1Db = getD1Db();
    if (!d1Db) {
      return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 });
    }

    const requesterDoc = await d1Db.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists || (requesterDoc.data() as any)?.role !== 'Admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, assignedResidences, themeSettings } = body || {};
    const emailKey = String(email || '').trim().toLowerCase();
    if (!emailKey) return NextResponse.json({ error: 'email required' }, { status: 400 });

    let user = await getUserByEmail(emailKey);
    const uid = user?.id || user?.uid ||
      (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    const payload: Record<string, any> = {
      id: uid,
      name: name || user?.name || emailKey,
      email: emailKey,
      role: role || user?.role || 'Technician',
      assignedResidences: Array.isArray(assignedResidences) ? assignedResidences : user?.assignedResidences || [],
    };
    if (themeSettings && typeof themeSettings === 'object') payload.themeSettings = themeSettings;

    await d1Db.collection('users').doc(uid).set(payload, { merge: true });

    return NextResponse.json({ uid, email: emailKey, user: payload });
  } catch (e: any) {
    console.error('ensure user error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
