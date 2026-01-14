import jwt from 'jsonwebtoken';
const bcrypt: any = require('bcrypt');
import { getUserByEmail, getUser, createUser, updateUser, setUserPasswordHash } from './d1-actions';

const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';
const ISSUER = process.env.JWT_ISSUER || 'estatecare.local';
const AUD = process.env.JWT_AUD || 'estatecare-client';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: any) {
  if (!PRIVATE_KEY) throw new Error('JWT private key missing');
  return (jwt as any).sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: ACCESS_EXPIRES, issuer: ISSUER, audience: AUD });
}

export function signRefreshToken(payload: any) {
  if (!PRIVATE_KEY) throw new Error('JWT private key missing');
  return (jwt as any).sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES, issuer: ISSUER, audience: AUD });
}

export function verifyAccessToken(token: string) {
  if (!PUBLIC_KEY) throw new Error('JWT public key missing');
  return (jwt as any).verify(token, PUBLIC_KEY, { algorithms: ['RS256'], issuer: ISSUER, audience: AUD }) as any;
}

export function verifyRefreshToken(token: string) {
  if (!PUBLIC_KEY) throw new Error('JWT public key missing');
  return (jwt as any).verify(token, PUBLIC_KEY, { algorithms: ['RS256'], issuer: ISSUER, audience: AUD }) as any;
}

// High-level helpers
export async function registerUser({ name, email, password }: { name: string; email: string; password: string }) {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error('User exists');
  const id = `user_${Date.now()}`;
  const created = { name, email, role: 'Technician', createdAt: new Date().toISOString() } as any;
  await createUser(id, created);
  const hash = await hashPassword(password);
  await setUserPasswordHash(id, hash);
  const user = await getUser(id);
  return user;
}

export async function authenticateUser({ email, password }: { email: string; password: string }) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('User not found');
  if (user.disabled) throw new Error('User disabled');
  if (!user.passwordHash) throw new Error('No password set');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error('Invalid password');
  // update last seen
  await updateUser(user.id, { lastSeen: new Date().toISOString() });
  return user;
}
