/**
 * Emergency seed endpoint for local dev when D1 binding is missing
 * POST http://localhost:9002/api/seed-local-user
 * Body: { "email": "admin@test.com", "password": "test123", "name": "Admin", "role": "Admin" }
 */
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

// In-memory user store for local development only
const localUsers: Map<string, any> = new Map();

export async function POST(req: Request) {
  try {
    const body = await req.json() as any;
    const { email, password, name, role } = body;
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const passwordHash = await hashPassword(password);
    
    const user = {
      id,
      email: email.toLowerCase(),
      name: name || 'User',
      role: role || 'Technician',
      passwordHash,
      assignedResidences: [],
      themeSettings: { colorTheme: 'blue', mode: 'system' },
      createdAt: new Date().toISOString(),
      disabled: false,
    };

    localUsers.set(email.toLowerCase(), user);
    
    // Also try to write to actual D1 if available.
    try {
      const env = await getCloudflareEnvRecord();
      if ((env as any)?.DB) {
        const { createUser, setUserPasswordHash } = await import('@/lib/d1-actions');
        await createUser(env, id, {
          email: user.email,
          name: user.name,
          role: user.role,
          assignedResidences: [],
          themeSettings: user.themeSettings,
          createdAt: user.createdAt,
          disabled: false,
        });
        await setUserPasswordHash(env, id, passwordHash);
      }
    } catch (d1Err) {
      console.warn('D1 write failed (expected in pure Next dev):', d1Err);
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'User seeded (in-memory for local dev). Switch to wrangler dev for persistent D1.',
      user: { id, email: user.email, name: user.name, role: user.role }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Seed failed' }, { status: 500 });
  }
}

// Export the in-memory store for auth handlers to use as fallback
export { localUsers };


export const runtime = 'edge';
