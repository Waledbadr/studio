import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getRuntimeEnv, isHttpsRequest } from '@/lib/runtime-env';

export const runtime = 'edge';

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getRequestOrigin(req: Request): string {
  const proto = req.headers.get('x-forwarded-proto') || (isHttpsRequest(req) ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
  return `${proto}://${host}`;
}

async function sendResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
  const resendKey = await getRuntimeEnv('RESEND_API_KEY', '');
  const emailFrom = await getRuntimeEnv('EMAIL_FROM', 'no-reply@estatecare.local');

  if (!resendKey) {
    throw new Error('Email provider not configured (set RESEND_API_KEY)');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: params.to,
      subject: 'Reset your EstateCare password',
      html: `\n        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.6">\n          <p>We received a request to reset your password.</p>\n          <p><a href="${params.resetUrl}">Click here to reset your password</a></p>\n          <p>If you did not request this, you can ignore this email.</p>\n        </div>\n      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const emailRaw = typeof body?.email === 'string' ? body.email : '';
    const email = emailRaw.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }

    // Always respond with ok to avoid user enumeration.
    const okResponse = () => NextResponse.json({ ok: true });

    let user: any = null;
    try {
      const db = getDb();
      user = await db.select().from(users).where(eq(users.email, email)).get();
    } catch {
      // If D1 is not configured, we can't issue reset tokens.
      return NextResponse.json({ ok: false, error: 'Backend not configured (D1 unavailable)' }, { status: 503 });
    }

    if (!user?.id) return okResponse();

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = base64UrlFromBytes(tokenBytes);
    const tokenHash = await sha256Hex(token);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    const id = `prt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const origin = (await getRuntimeEnv('APP_ORIGIN', '')) || getRequestOrigin(req);
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    const db = getDb();
    await db.insert(passwordResetTokens).values({
      id,
      userId: user.id,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      requestedIp: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || null,
      requestedUa: req.headers.get('user-agent') || null,
    } as any).run();

    // If email sending fails, don't leak details; return ok.
    try {
      await sendResetEmail({ to: email, resetUrl });
    } catch (e) {
      console.warn('[password-reset] email send failed', e);
      const allowDebug = (await getRuntimeEnv('ALLOW_RESET_DEBUG', 'false')).toLowerCase() === 'true';
      if (allowDebug) {
        return NextResponse.json({ ok: true, debugResetUrl: resetUrl });
      }
    }

    return okResponse();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
