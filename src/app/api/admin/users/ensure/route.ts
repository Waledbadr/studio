import { NextRequest, NextResponse } from 'next/server';
// TODO: Implement D1-based user ensure functionality
// import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Temporarily disabled during Firebase to D1 migration
    return NextResponse.json({ error: 'User ensure system temporarily unavailable during migration' }, { status: 503 });
    /* TODO: Implement D1-based user ensure
    initAdmin();
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
    */
  } catch (e: any) {
    console.error('ensure user error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
