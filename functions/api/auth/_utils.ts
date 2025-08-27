// Small helpers for Cloudflare Pages Functions auth endpoints
import { AuthService } from '../../../src/lib/auth';
import type { CloudflareEnv } from '../../../src/lib/cloudflare-db';

export type Env = CloudflareEnv;

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function getCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get('Cookie') || '';
  const parts = cookie.split(/;\s*/);
  for (const part of parts) {
    const [k, ...rest] = part.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function setCookie(res: Response, name: string, value: string, options: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  maxAge?: number; // seconds
  path?: string;
} = {}): Response {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    options.httpOnly ? 'HttpOnly' : '',
    options.secure ? 'Secure' : '',
    options.sameSite ? `SameSite=${options.sameSite}` : '',
    options.maxAge != null ? `Max-Age=${Math.max(0, Math.floor(options.maxAge))}` : '',
  ].filter(Boolean);
  const headers = new Headers(res.headers);
  headers.append('Set-Cookie', parts.join('; '));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function clearCookie(res: Response, name: string): Response {
  return setCookie(res, name, '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'Lax' });
}

export function authService(env: Env) {
  return new AuthService(env);
}
