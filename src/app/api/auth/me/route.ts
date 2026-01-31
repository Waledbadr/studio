import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';
import { getCookieFromRequest } from '@/lib/http-cookies';

export async function GET(req: Request) {
  try {
    let token = '';
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('access_token')?.value || '';
    } catch {
      // ignore
    }
    if (!token) {
      token = getCookieFromRequest(req, 'access_token') || '';
    }
    if (!token) return NextResponse.json({ ok: true, user: null });
    let payload: any;
    try {
      payload = await verifyAccessToken(token);
    } catch (verErr: any) {
      return NextResponse.json({ ok: true, user: null });
    }
    const env = await getCloudflareEnvRecord();
    // If D1 is not available (local dev mode), return user info from JWT payload
    if (!env || !env.DB) {
      return NextResponse.json({ 
        ok: true, 
        user: { 
          id: payload.sub, 
          email: payload.email || null, 
          name: payload.name || 'User', 
          role: payload.role || 'Admin' 
        } 
      });
    }
    const user = await getUser(env, payload.sub);
    if (!user) return NextResponse.json({ ok: true, user: null });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e: any) {
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
    const env = await getCloudflareEnvRecord();
    await (await import('@/lib/d1-actions')).updateUser(env, payload.sub, updates);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Update failed' }, { status: 400 });
  }
}

export const runtime = 'edge';
