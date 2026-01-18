import { NextResponse } from 'next/server';
import { getRuntimeEnv, isHttpsRequest } from '@/lib/runtime-env';

export const runtime = 'edge';

export async function GET(req: Request) {
    const clientId = await getRuntimeEnv('GOOGLE_CLIENT_ID');
    if (!clientId) {
        return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
    }

    // Determine callback URL based on request (or env var if preferred)
    const url = new URL(req.url);
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();

    // Construct Google Authorization URL
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: state,
        access_type: 'offline', // Request refresh token if needed (optional)
        prompt: 'consent', // Force consent screen to ensure refresh token (optional)
    });

    const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const response = NextResponse.redirect(authorizationUrl);

    // Store state in httpOnly cookie to verify in callback
    response.cookies.set('google_oauth_state', state, {
        httpOnly: true,
        secure: isHttpsRequest(req),
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10, // 10 minutes
    });

    return response;
}
