import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // Handle OAuth error (user cancelled or denied)
        if (error) {
            return NextResponse.redirect(new URL('/?auth=error', req.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/?auth=error', req.url));
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/auth/google/callback`;

        if (!clientId || !clientSecret) {
            return NextResponse.redirect(new URL('/?auth=error', req.url));
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error('Failed to get access token:', tokens);
            return NextResponse.redirect(new URL('/?auth=error', req.url));
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userInfoResponse.json();

        if (!googleUser.email || !googleUser.id) {
            console.error('Failed to get user info:', googleUser);
            return NextResponse.redirect(new URL('/?auth=error', req.url));
        }

        await dbConnect();

        // Check if user exists by email or googleId
        let user = await User.findOne({
            $or: [{ email: googleUser.email }, { googleId: googleUser.id }]
        });

        if (user) {
            // Existing user - update googleId if not set
            if (!user.googleId) {
                user.googleId = googleUser.id;
            }
            // Update profile image if not set
            if (!user.image && googleUser.picture) {
                user.image = googleUser.picture;
            }
            // Mark email as verified (Google verified it)
            user.emailVerified = true;
            // Update authProvider if was local
            if (user.authProvider === 'local') {
                user.authProvider = 'google';
            }
            await user.save();
        } else {
            // New user trying to login without registering first
            return NextResponse.redirect(new URL('/?error=Please%20register%20first', req.url));
        }

        // Generate JWT tokens (same as email verification flow)
        const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
        const { token: refreshToken, expiresAt: refreshTokenExpiry } = signRefreshToken(user._id.toString());

        // Save refresh token to database
        await User.findByIdAndUpdate(user._id, {
            refreshToken,
            refreshTokenExpiry,
        });

        // Set cookies
        const cookieStore = await cookies();
        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/',
        });

        cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        // Redirect to home page with success
        return NextResponse.redirect(new URL('/?auth=success', req.url));
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        return NextResponse.redirect(new URL('/?auth=error', req.url));
    }
}
