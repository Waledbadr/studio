import { NextRequest, NextResponse } from 'next/server';
// TODO: Implement D1-based auth reset
// import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Temporarily disabled during Firebase to D1 migration
    return NextResponse.json({ error: 'Auth reset system temporarily unavailable during migration' }, { status: 503 });
    /* TODO: Implement D1-based auth reset
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
    */
  } catch (e: any) {
    console.error('reset-auth error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
