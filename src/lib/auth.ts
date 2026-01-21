import { SignJWT, jwtVerify } from 'jose';
import './setimmediate-polyfill';
import * as bcrypt from 'bcryptjs';
import { getUserByEmail, getUser, createUser, updateUser, setUserPasswordHash } from './d1-actions';
import { getRuntimeEnv } from './runtime-env';
import { getCloudflareEnvRecord } from './runtime-env';

// Helper to get env for D1 actions
async function getEnvForD1() {
  return (await getCloudflareEnvRecord()) ?? null;
}

// Fallback in-memory store when D1 binding is missing (local dev only)
let localUsersFallback: Map<string, any> | null = null;
let isSeeded = false;

async function seedDefaultUsers(users: Map<string, any>) {
  if (isSeeded) return;
  isSeeded = true;

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
    if (!users.has(user.email)) {
      users.set(user.email, user);
      console.log(`✓ Pre-seeded test user: ${user.email}`);
    }
  }
}

async function getLocalUsers() {
  if (localUsersFallback) return localUsersFallback;

  try {
    const module = await import('@/app/api/seed-local-user/route');
    localUsersFallback = module.localUsers;
  } catch {
    localUsersFallback = new Map();
  }

  await seedDefaultUsers(localUsersFallback);
  return localUsersFallback;
}

const DEFAULT_SECRET = 'development_secret_key_must_be_long';
const DEFAULT_ISSUER = 'estatecare.local';
const DEFAULT_AUD = 'estatecare-client';

async function getSecretKeyBytes() {
  const secret = await getRuntimeEnv('JWT_PRIVATE_KEY', DEFAULT_SECRET);
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
  // Use sync API to avoid Edge runtime restrictions (bcryptjs async uses setImmediate).
  return bcrypt.compareSync(password, hash);
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
  const env = await getEnvForD1();
  let existing = await getUserByEmail(env, email);
  // Fallback: check in-memory store if D1 returned null
  if (!existing) {
    const local = await getLocalUsers();
    existing = local.get(email.toLowerCase()) || null;
  }
  if (existing) throw new Error('User exists');

  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const hash = await hashPassword(password);
  const created = { name, email, role: 'Technician', passwordHash: hash, createdAt: new Date().toISOString(), disabled: false } as any;

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
  const env = await getEnvForD1();
  let user = await getUserByEmail(env, email);

  // Fallback: check in-memory store if D1 returned null
  if (!user) {
    const local = await getLocalUsers();
    user = local.get(email.toLowerCase()) || null;
  }

  if (!user) throw new Error('User not found');
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
