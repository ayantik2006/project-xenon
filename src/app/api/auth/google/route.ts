import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/auth/google/callback`;

        if (!clientId) {
            return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
        }

        // Build Google OAuth consent screen URL
        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.set('client_id', clientId);
        googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
        googleAuthUrl.searchParams.set('response_type', 'code');
        googleAuthUrl.searchParams.set('scope', 'openid email profile');
        googleAuthUrl.searchParams.set('access_type', 'offline');
        googleAuthUrl.searchParams.set('prompt', 'consent');
        const requestUrl = new URL(req.url);
        const mode = requestUrl.searchParams.get('mode') || 'login';
        const role = requestUrl.searchParams.get('role') || 'buyer';

        const statePayload = JSON.stringify({ mode, role });
        googleAuthUrl.searchParams.set('state', statePayload);

        // Redirect to Google OAuth consent screen
        return NextResponse.redirect(googleAuthUrl.toString());
    } catch (error) {
        console.error('Google OAuth initiation error:', error);
        return NextResponse.json({ error: "Failed to initiate Google sign-in" }, { status: 500 });
    }
}
