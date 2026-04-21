import { getD1Db } from '@/lib/firebase-admin';
import { createJwt, verifyJwt } from '@/lib/jwt';
import { devFindByField, devGetById, devUpsert } from '@/lib/dev-d1-memory';

export const SESSION_COOKIE = '__session';
const PASSWORD_SECRET = process.env.AUTH_PASSWORD_SECRET || process.env.AUTH_JWT_SECRET || '';

const encoder = new TextEncoder();

function normalizeUserRecord(user: any) {
  if (!user || typeof user !== 'object') return user;
  return {
    ...user,
    passwordHash: user.passwordHash ?? user.password_hash ?? null,
    assignedResidences: user.assignedResidences ?? user.assigned_residences ?? [],
    themeSettings: user.themeSettings ?? user.theme_settings ?? {},
    createdAt: user.createdAt ?? user.created_at ?? null,
    updatedAt: user.updatedAt ?? user.updated_at ?? null,
  };
}

function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

function shouldUseSecureCookie(req: Request) {
  try {
    // NextRequest exposes nextUrl
    const maybeNext = req as any;
    return maybeNext.nextUrl?.protocol === 'https:' || process.env.NODE_ENV === 'production';
  } catch {
    return process.env.NODE_ENV === 'production';
  }
}

export async function hashPassword(password: string) {
  const data = encoder.encode(password + PASSWORD_SECRET);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

export async function verifyPassword(password: string, hash: string) {
  const candidate = await hashPassword(password);
  return candidate === hash;
}

export async function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.get('cookie'));
  return cookies[SESSION_COOKIE] || null;
}

export async function verifySession(req: Request) {
  const token = await getTokenFromRequest(req);
  if (!token) return null;
  try {
    const payload = await verifyJwt(token);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: Response | any, token: string, req: Request) {
  const secure = shouldUseSecureCookie(req);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(res: Response | any, req: Request) {
  const secure = shouldUseSecureCookie(req);
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0,
  });
}

export async function getUserByEmail(email: string) {
  const d1Db = getD1Db();
  if (d1Db) {
    const rows = await d1Db.collection('users').where('email', '==', email).get();
    return rows.docs[0] ? normalizeUserRecord(rows.docs[0].data() as any) : null;
  }

  // Dev fallback: use in-memory store when D1 is not available (next dev)
  if (process.env.NODE_ENV !== 'production') {
    return devFindByField('users', 'email', email.toLowerCase()) as any;
  }

  throw new Error('D1 database is not configured');
}

export async function getUserById(id: string) {
  const d1Db = getD1Db();
  if (d1Db) {
    const userDoc = await d1Db.collection('users').doc(id).get();
    return userDoc.exists ? normalizeUserRecord(userDoc.data() as any) : null;
  }

  if (process.env.NODE_ENV !== 'production') {
    return devGetById('users', id) as any;
  }

  throw new Error('D1 database is not configured');
}

export async function generateSession(user: Record<string, unknown>) {
  // Ensure dev store keeps the latest user snapshot when running without D1
  if (!getD1Db() && process.env.NODE_ENV !== 'production') {
    const id = String(user.id || user.uid || '');
    if (id) devUpsert('users', id, user as any);
  }

  const token = await createJwt({
    uid: String(user.id || user.uid || ''),
    email: String(user.email || ''),
    role: String(user.role || ''),
    name: String(user.name || ''),
  });
  return token;
}
