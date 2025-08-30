import { NextRequest, NextResponse } from 'next/server';
import { LocalCloudflareDB } from '../../../lib/local-db';

function toDbRole(role: any): 'admin' | 'manager' | 'user' | 'maintenance' {
  const r = String(role || 'user').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'user' || r === 'maintenance') return r;
  // Map common UI roles
  if (r === 'owner' || r === 'superadmin') return 'admin';
  if (r === 'tech' || r === 'technician') return 'maintenance';
  return 'user';
}

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

    const db = new LocalCloudflareDB();
    const users = await db.getUsers(limit, offset);

    return NextResponse.json(users);
  } catch (err: any) {
    console.error('/api/users GET failed', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body: Record<string, any> = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing name or email' }, { status: 400 });
    }

    const role = toDbRole(body.role);
    const id = crypto.randomUUID();

    const db = new LocalCloudflareDB();
    await db.createUser({
      id,
      name,
      email,
      phone: body.phone || null,
      role,
      password_hash: 'placeholder', // No auth on this branch; set a non-null placeholder
      avatar_url: body.avatar_url || null,
      is_active: body.is_active !== false,
      last_login: null,
      created_at: '', // ignored by insert
      updated_at: '', // ignored by insert
    } as any);

    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    console.error('/api/users POST failed', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}