import { SignJWT, jwtVerify } from 'jose';
import './setimmediate-polyfill';
import * as bcrypt from 'bcryptjs';
import { getUserByEmail, getUser, getUsers, createUser, updateUser, setUserPasswordHash } from './d1-actions';
import { getRuntimeEnv } from './runtime-env';
import { getCloudflareEnvRecord } from './runtime-env';

// Helper to get env for D1 actions
async function getEnvForD1() {
  return (await getCloudflareEnvRecord()) ?? null;
}

// Fallback in-memory store when D1 binding is missing (local dev only)
const localUsersCache = new Map<string, any>();
let isSeeded = false;

async function seedDefaultUsers() {
  // Pre-seed test users with hashed passwords
  const testUsers = [
    {
      id: 'user_admin_local',
      email: 'admin@estatecare.com',
      name: 'Admin User',
      role: 'Admin',
      passwordHash: await hashPassword('admin123'),
      assignedResidences: [],
      themeSettings: { colorTheme: 'blue', mode: 'system' },
      createdAt: new Date().toISOString(),
      disabled: false,
    },
    {
      id: 'user_test_local',
      email: 'test@test.com',
      name: 'Test User',
      role: 'Technician',
      passwordHash: await hashPassword('test123'),
      assignedResidences: [],
      themeSettings: { colorTheme: 'blue', mode: 'system' },
      createdAt: new Date().toISOString(),
      disabled: false,
    },
  ];

  for (const user of testUsers) {
    if (!localUsersCache.has(user.email)) {
      localUsersCache.set(user.email, user);
      console.log(`✓ Pre-seeded test user: ${user.email}`);
    }
  }
}

async function getLocalUsers() {
  // Seed default users on first read
  if (!isSeeded) {
    isSeeded = true;
    await seedDefaultUsers();
  }
  
  return localUsersCache;
}

const DEFAULT_SECRET = 'development_secret_key_must_be_long';
const DEFAULT_ISSUER = 'estatecare.local';
const DEFAULT_AUD = 'estatecare-client';

async function getSecretKeyBytes() {
  const secret = await getRuntimeEnv('JWT_PRIVATE_KEY');
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_PRIVATE_KEY is not configured. Set it as a Secret in Cloudflare Pages > Settings > Environment Variables.');
    }
    return new TextEncoder().encode(DEFAULT_SECRET);
  }
  return new TextEncoder().encode(secret);
}

async function getJwtIssuer() {
  return getRuntimeEnv('JWT_ISSUER', DEFAULT_ISSUER);
}

async function getJwtAudience() {
  return getRuntimeEnv('JWT_AUD', DEFAULT_AUD);
}

async function getAccessExpires() {
  return getRuntimeEnv('JWT_ACCESS_EXPIRES', '15m');
}

async function getRefreshExpires() {
  return getRuntimeEnv('JWT_REFRESH_EXPIRES', '30d');
}

async function getBcryptRounds() {
  const roundsStr = await getRuntimeEnv('BCRYPT_ROUNDS', '10');
  const rounds = Number(roundsStr);
  return Number.isFinite(rounds) && rounds > 0 ? rounds : 10;
}

export async function hashPassword(password: string) {
  const rounds = await getBcryptRounds();
  // Use sync API to avoid Edge runtime restrictions (bcryptjs async uses setImmediate).
  return bcrypt.hashSync(password, rounds);
}

export async function verifyPassword(password: string, hash: string) {
  // Check if it's a PBKDF2 hash (format: pbkdf2:iterations:salt:hash)
  if (hash.startsWith('pbkdf2:')) {
    const parts = hash.split(':');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = Uint8Array.from(Buffer.from(parts[2], 'hex'));
    const storedHash = parts[3];
    
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    const derivedArray = Array.from(new Uint8Array(derivedBits));
    const computed = derivedArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Constant-time comparison
    let match = computed.length === storedHash.length;
    for (let i = 0; i < Math.max(computed.length, storedHash.length); i++) {
      match = match && (computed[i] === storedHash[i]);
    }
    return match;
  }
  
  // Legacy bcrypt hashes
  if (hash.startsWith('$2') || hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compareSync(password, hash);
  }
  
  // Dev fallback: accept plain-text matches for local storage users
  return password === hash;
}

export async function signAccessToken(payload: any) {
  const SECRET_KEY = await getSecretKeyBytes();
  const ISSUER = await getJwtIssuer();
  const AUD = await getJwtAudience();
  const ACCESS_EXPIRES = await getAccessExpires();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUD)
    .setExpirationTime(ACCESS_EXPIRES)
    .sign(SECRET_KEY);
}

export async function signRefreshToken(payload: any) {
  const SECRET_KEY = await getSecretKeyBytes();
  const ISSUER = await getJwtIssuer();
  const AUD = await getJwtAudience();
  const REFRESH_EXPIRES = await getRefreshExpires();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUD)
    .setExpirationTime(REFRESH_EXPIRES)
    .sign(SECRET_KEY);
}

export async function verifyAccessToken(token: string) {
  const SECRET_KEY = await getSecretKeyBytes();
  const ISSUER = await getJwtIssuer();
  const AUD = await getJwtAudience();
  const { payload } = await jwtVerify(token, SECRET_KEY, {
    issuer: ISSUER,
    audience: AUD,
  });
  return payload;
}

export async function verifyRefreshToken(token: string) {
  const SECRET_KEY = await getSecretKeyBytes();
  const ISSUER = await getJwtIssuer();
  const AUD = await getJwtAudience();
  const { payload } = await jwtVerify(token, SECRET_KEY, {
    issuer: ISSUER,
    audience: AUD,
  });
  return payload;
}

// High-level helpers
export async function registerUser({ name, email, password }: { name: string; email: string; password: string }) {
  email = String(email ?? '').trim().toLowerCase();
  const env = await getEnvForD1();
  let existing = await getUserByEmail(env, email);
  // Fallback: check in-memory store if D1 returned null
  if (!existing) {
    const local = await getLocalUsers();
    existing = local.get(email.toLowerCase()) || null;
  }

  // If the user already exists but has no password set (pre-provisioned / imported user),
  // allow this "signup" to set their initial password.
  if (existing) {
    if ((existing as any)?.disabled) throw new Error('User disabled');
    const existingHash = (existing as any)?.passwordHash;
    const hasPassword = typeof existingHash === 'string' && existingHash.length > 0;
    if (hasPassword) throw new Error('User exists');

    const hash = await hashPassword(password);

    // Try to persist password to D1 if available; otherwise update local fallback.
    try {
      if (env && (env as any).DB) {
        await setUserPasswordHash(env, (existing as any).id, hash);
        await updateUser(env, (existing as any).id, {
          name: name || (existing as any).name || email,
          email,
          disabled: false,
        });
        const updated = await getUser(env, (existing as any).id);
        if (updated) return updated as any;
      }
    } catch (e) {
      console.warn('D1 update failed, using in-memory fallback', e);
    }

    const local = await getLocalUsers();
    const next = {
      ...(existing as any),
      name: name || (existing as any).name || email,
      email,
      passwordHash: hash,
      disabled: false,
    };
    local.set(email.toLowerCase(), next);
    return next;
  }

  // Bootstrap: if this is the first user in D1, make them Admin.
  // This avoids a "locked out" production where no admin exists yet.
  let role: any = 'Technician';
  try {
    if (env && (env as any).DB) {
      const all = await getUsers(env);
      if (Array.isArray(all) && all.length === 0) {
        role = 'Admin';
      }
    }
  } catch {
    // If counting users fails, keep default Technician.
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const hash = await hashPassword(password);
  const created = { name, email, role, passwordHash: hash, createdAt: new Date().toISOString(), disabled: false } as any;

  try {
    // Only call createUser, which includes the passwordHash in `created` object
    await createUser(env, id, created);
    // await setUserPasswordHash(env, id, hash); // Redundant
    const user = await getUser(env, id);
    if (user) return user;
  } catch (d1Err) {
    console.warn('D1 create failed, using in-memory fallback', d1Err);
  }

  // Fallback: store in-memory
  const local = await getLocalUsers();
  local.set(email.toLowerCase(), { id, ...created });
  return { id, ...created };
}

export async function authenticateUser({ email, password }: { email: string; password: string }) {
  email = String(email ?? '').trim().toLowerCase();
  const env = await getEnvForD1();
  let user = await getUserByEmail(env, email);

  // Fallback: check in-memory store if D1 returned null
  if (!user) {
    const local = await getLocalUsers();
    console.log('[authenticateUser] D1 user not found, checking localUsers Map:', { email, mapSize: local.size, hasUser: local.has(email) });
    user = local.get(email.toLowerCase()) || null;
    if (user) {
      console.log('[authenticateUser] User found in Map:', { id: user.id, email: user.email });
    }
  }

  if (!user) {
    console.log('[authenticateUser] User not found anywhere:', { email });
    throw new Error('User not found');
  }
  if (user.disabled) throw new Error('User disabled');
  if (!user.passwordHash) throw new Error('No password set');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error('Invalid password');

  // update last seen (try D1, fallback to in-memory)
  try {
    await updateUser(env, user.id, { lastSeen: new Date().toISOString() });
  } catch { }

  return user;
}
