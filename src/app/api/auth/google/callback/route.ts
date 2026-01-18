import { NextResponse } from 'next/server';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getRuntimeEnv, isHttpsRequest } from '@/lib/runtime-env';

export const runtime = 'edge';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const cookies = (req.headers.get('cookie') || '').split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        acc[k] = v;
        return acc;
    }, {} as Record<string, string>);

    const storedState = cookies['google_oauth_state'];

    if (error) {
        return NextResponse.json({ error: `Google Auth Error: ${error}` }, { status: 400 });
    }

    if (!code || !state || !storedState || state !== storedState) {
        return NextResponse.json({ error: 'Invalid state or code' }, { status: 400 });
    }

    const clientId = await getRuntimeEnv('GOOGLE_CLIENT_ID');
    const clientSecret = await getRuntimeEnv('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const redirectUri = `${url.origin}/api/auth/google/callback`;

    interface GoogleTokens {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
        scope: string;
        token_type: string;
        id_token: string;
        error?: string;
        error_description?: string;
    }

    interface GoogleUser {
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
        locale: string;
    }

    try {
        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokens = await tokenResponse.json() as GoogleTokens;
        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        // 2. Get User Info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userRes.json() as GoogleUser;
        if (!googleUser.email) {
            throw new Error('Email not provided by Google');
        }

        const email = googleUser.email.toLowerCase();

        // 3. Find or Create User in D1
        const db = getDb();
        let user: any = await db.select().from(users).where(eq(users.email, email)).get();

        if (!user) {
            // Create new user
            const newId = crypto.randomUUID();
            const now = new Date().toISOString();

            // Insert with strict schema compliance
            await db.insert(users).values({
                id: newId,
                name: googleUser.name || email.split('@')[0],
                email: email,
                role: 'Technician',
                passwordHash: 'GOOGLE_AUTH',
                createdAt: now,
                assignedResidences: '[]',
                themeSettings: JSON.stringify({ colorTheme: 'blue', mode: 'system' }),
                disabled: false,
            }).run();

            // Construct user object successfully created
            user = {
                id: newId,
                name: googleUser.name || email.split('@')[0],
                email: email,
                role: 'Technician',
            };
        }

        // 4. Create Session
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = await signAccessToken(payload);
        const refreshToken = await signRefreshToken(payload);

        // 5. Redirect and Set Cookies
        const response = NextResponse.redirect(`${url.origin}/`);
        const secure = isHttpsRequest(req);

        // Clear state cookie
        response.cookies.set('google_oauth_state', '', { maxAge: 0 });

        // Set auth cookies
        response.cookies.set('access_token', accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure,
            path: '/',
            maxAge: 15 * 60
        });

        response.cookies.set('refresh_token', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure,
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        return response;

    } catch (err: any) {
        console.error('Google Auth Error:', err);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
