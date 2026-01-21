import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // D1-only: this route is disabled or needs to be rewritten for D1
    return NextResponse.json({ error: 'Not implemented for D1' }, { status: 501 });

    /* Legacy auth-provider code removed
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
