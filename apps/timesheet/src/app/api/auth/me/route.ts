import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-server';
import { getUserById } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await verifySession(req);
  if (!session || !session.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(String(session.uid));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'Technician',
  });
}
