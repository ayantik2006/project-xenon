import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { comparePassword } from '@/lib/password';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/validators/user';
import { sendOTPEmail } from '@/lib/email';
import {
  createPendingOTP,
  getOTPRetryAfterSeconds,
  keepLatestOTP,
  normalizeEmail,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const email = normalizeEmail(result.data.email);
    const { password } = result.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.password || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      const retryAfterSeconds = await getOTPRetryAfterSeconds(
        { email },
        'verification',
      );

      if (retryAfterSeconds > 0) {
        return NextResponse.json({
          error: "Email not verified. Use the verification code already sent to your inbox.",
          requiresEmailVerification: true,
          email: user.email,
          otpSent: true,
          resendAvailableIn: retryAfterSeconds,
        }, { status: 403 });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpRecord = await createPendingOTP({ email }, 'verification', otp);

      const emailResult = await sendOTPEmail(email, otp);
      if (!emailResult.success) {
        console.error('Failed to send OTP email:', emailResult.error);

        await otpRecord.deleteOne();

        return NextResponse.json({
          error:
            "Email not verified, and we could not send a new verification code right now. Please try resending it.",
          requiresEmailVerification: true,
          email: user.email,
          otpSent: false,
          resendAvailableIn: 0,
        }, { status: 403 });
      }

      await keepLatestOTP({ email }, 'verification', otpRecord._id.toString());

      return NextResponse.json({
        error: "Email not verified. A verification code has been sent to your email.",
        requiresEmailVerification: true,
        email: user.email,
        otpSent: true,
        resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
      }, { status: 403 });
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const { token: refreshToken, expiresAt } = signRefreshToken(user._id.toString());

    // Store refresh token in database
    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      refreshTokenExpiry: expiresAt
    });

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        kycStatus: user.kycStatus
      }
    });

    // Set access token cookie (15 minutes)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    });

    // Set refresh token cookie (7 days)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error: unknown) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
