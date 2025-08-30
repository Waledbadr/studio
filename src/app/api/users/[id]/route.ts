import { NextRequest, NextResponse } from 'next/server';
import { LocalCloudflareDB } from '../../../../lib/local-db';

function toDbRole(role: any): 'admin' | 'manager' | 'user' | 'maintenance' {
  const r = String(role || 'user').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'user' || r === 'maintenance') return r;
  // Map common UI roles
  if (r === 'owner' || r === 'superadmin') return 'admin';
  if (r === 'tech' || r === 'technician') return 'maintenance';
  return 'user';
}

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const db = new LocalCloudflareDB();
    const user = await db.getUserById(id);

    if (!user) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("/api/users/[id] GET failed", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body: Record<string, any> = await request.json();

    // Whitelist updatable fields and map role to DB values if provided
    const allowed: Record<string, any> = {};
    if (typeof body.name === 'string') allowed.name = body.name;
    if (typeof body.email === 'string') allowed.email = body.email;
    if (typeof body.phone === 'string') allowed.phone = body.phone;
    if (typeof body.role !== 'undefined') allowed.role = toDbRole(body.role);
    if (typeof body.avatar_url === 'string') allowed.avatar_url = body.avatar_url;
    if (typeof body.is_active === 'boolean') allowed.is_active = body.is_active;

    const db = new LocalCloudflareDB();
    await db.updateUser(id, allowed);

    return NextResponse.json({ id, updated: true });
  } catch (err: any) {
    console.error("/api/users/[id] PUT failed", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const db = new LocalCloudflareDB();
    await db.deleteUser(id);

    return NextResponse.json({ id, deleted: true });
  } catch (err: any) {
    console.error("/api/users/[id] DELETE failed", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}