import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/d1-actions';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value || '';
    if (!token) return NextResponse.json({ ok: true, user: null });
    const payload: any = verifyAccessToken(token);
    const user = await getUser(payload.sub);
    if (!user) return NextResponse.json({ ok: true, user: null });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e: any) {
    return NextResponse.json({ ok: true, user: null });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value || '';
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const payload: any = verifyAccessToken(token);
    const body = await req.json();
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;
    await (await import('@/lib/d1-actions')).updateUser(payload.sub, updates);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Update failed' }, { status: 400 });
  }
}