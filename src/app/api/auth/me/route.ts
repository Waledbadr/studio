import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/d1-actions';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value || '';
    console.log('[AUTH ME] token present:', Boolean(token), token ? token.slice(0, 12) + '...' : '');
    if (!token) return NextResponse.json({ ok: true, user: null });
    let payload: any;
    try {
      payload = await verifyAccessToken(token);
      console.log('[AUTH ME] token verified, sub:', payload?.sub);
    } catch (verErr: any) {
      console.warn('[AUTH ME] token verify failed:', verErr?.message || verErr);
      return NextResponse.json({ ok: true, user: null });
    }
    const { env } = getRequestContext();
    const user = await getUser(env, payload.sub);
    if (!user) return NextResponse.json({ ok: true, user: null });
    console.log('[AUTH ME] found user:', user?.id, user?.email);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e: any) {
    console.error('[AUTH ME] unexpected error', e);
    return NextResponse.json({ ok: true, user: null });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value || '';
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const payload: any = await verifyAccessToken(token);
    const body = await req.json() as any;
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;
    const { env } = getRequestContext();
    await (await import('@/lib/d1-actions')).updateUser(env, payload.sub, updates);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Update failed' }, { status: 400 });
  }
}

export const runtime = 'edge';
