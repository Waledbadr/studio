/**
 * Emergency seed endpoint for local dev when D1 binding is missing
 * POST http://localhost:9002/api/seed-local-user
 * Body: { "email": "admin@test.com", "password": "test123", "name": "Admin", "role": "Admin" }
 */
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';
import fs from 'fs';
import path from 'path';

const LOCAL_USERS_FILE = path.join(process.cwd(), '.local-users.json');

// Helper to read local users from file
function readLocalUsers(): Map<string, any> {
  try {
    if (fs.existsSync(LOCAL_USERS_FILE)) {
      const data = fs.readFileSync(LOCAL_USERS_FILE, 'utf-8');
      const users = JSON.parse(data);
      return new Map(Object.entries(users));
    }
  } catch (e) {
    console.warn('[readLocalUsers] Error reading file:', e);
  }
  return new Map();
}

// Helper to write local users to file
function writeLocalUsers(users: Map<string, any>): void {
  try {
    const obj = Object.fromEntries(users.entries());
    fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(obj, null, 2));
    console.log('[writeLocalUsers] Users saved to file:', LOCAL_USERS_FILE);
  } catch (e) {
    console.error('[writeLocalUsers] Error writing file:', e);
  }
}

// Export function to get local users
export function getLocalUsers(): Map<string, any> {
  return readLocalUsers();
}

// Export function to write local users (for seeding)
export function setLocalUsers(users: Map<string, any>): void {
  writeLocalUsers(users);
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as any;
    const { email, password, name, role } = body;
    console.log('[seed-local-user] POST request received:', { email, name, role });
    
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

    const localUsers = readLocalUsers();
    localUsers.set(email.toLowerCase(), user);
    writeLocalUsers(localUsers);
    console.log('[seed-local-user] User added to file:', { email: email.toLowerCase(), mapSize: localUsers.size });
    
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

// Use Node.js runtime for filesystem access
export const runtime = 'nodejs';
