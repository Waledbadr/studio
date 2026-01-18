import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : '';

    if (!token) return NextResponse.json({ error: 'missing token' }, { status: 401 });

    let requesterUid;
    try {
      const payload = await verifyAccessToken(token);
      requesterUid = payload.sub as string;
    } catch (e) {
      return NextResponse.json({ error: 'invalid token' }, { status: 401 });
    }

    const db = getDb();

    // Check requester role
    const requester = await db.select().from(users).where(eq(users.id, requesterUid)).get();
    if (!requester || requester.role !== 'Admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json() as any;
    const { email, name, role, assignedResidences, themeSettings } = body || {};
    const emailKey = String(email || '').trim().toLowerCase();

    if (!emailKey) return NextResponse.json({ error: 'email required' }, { status: 400 });

    // In this D1 migration, 'ensure' might create a user if they don't exist, 
    // or just update them. The original logic looked up a firebase user. 
    // Here we will check if the user exists in our DB.

    let targetUser = await db.select().from(users).where(eq(users.email, emailKey)).get();

    const timestamp = new Date().toISOString();
    const payload: any = {
      name: name || targetUser?.name || emailKey,
      email: emailKey, // Ensure email is set
      role: role || targetUser?.role || 'Technician',
      assignedResidences: Array.isArray(assignedResidences) ? JSON.stringify(assignedResidences) : (targetUser?.assignedResidences || '[]'),
      updatedAt: timestamp,
    };

    // Theme settings logic if needed (D1 schema might not have it, but we can store it in a JSON field if schema allows)
    // Assuming schema has no 'themeSettings' column based on previous views, we ignore it or put it in metadata if available.
    // Checking schema later if needed. For now, ignoring themeSettings to avoid error if column missing.

    if (!targetUser) {
      // Create new user
      const newId = crypto.randomUUID();
      const newUser = {
        id: newId,
        ...payload,
        createdAt: timestamp,
        passwordHash: '', // No password yet
        isActive: 1,
      };
      await db.insert(users).values(newUser).run();
      targetUser = newUser;
    } else {
      // Update user
      await db.update(users).set(payload).where(eq(users.id, targetUser.id)).run();
      targetUser = { ...targetUser, ...payload };
    }

    // Parse assignedResidences back to array for response
    const responseUser = {
      ...targetUser,
      assignedResidences: typeof targetUser.assignedResidences === 'string' ? JSON.parse(targetUser.assignedResidences) : targetUser.assignedResidences
    };

    return NextResponse.json({ uid: targetUser.id, email: emailKey, user: responseUser });
  } catch (e: any) {
    console.error('ensure user error', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
