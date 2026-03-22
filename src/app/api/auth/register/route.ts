import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { signupSchema } from '@/lib/validators/user';
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

    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, password, role } = result.data;
    const email = normalizeEmail(result.data.email);

    const existingUser = await User.findOne({ email });

    // If user exists and is verified, reject registration
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json({ error: "Email already registered and verified. Please login instead." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // If user exists but NOT verified, update their details and resend OTP
    if (existingUser && !existingUser.emailVerified) {
      // Update existing unverified user with new details
      await User.findByIdAndUpdate(
        existingUser._id,
        {
          name,
          password: hashedPassword,
          role,
          // Keep emailVerified: false
        },
        { new: true }
      );

    } else {
      // Create new user
      await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: false,
        isPhoneVerified: false,
      });
    }

    const retryAfterSeconds = await getOTPRetryAfterSeconds(
      { email },
      'verification',
    );

    if (retryAfterSeconds > 0) {
      return NextResponse.json({
        message: "A verification code was already sent recently. Please check your inbox.",
        email,
        verificationRequired: true,
        otpSent: true,
        resendAvailableIn: retryAfterSeconds,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRecord = await createPendingOTP({ email }, 'verification', otp);
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);

      await otpRecord.deleteOne();

      return NextResponse.json({
        message:
          "Your account was created, but we could not send the verification code. Please try resending it.",
        email,
        verificationRequired: true,
        otpSent: false,
        resendAvailableIn: 0,
      }, { status: 202 });
    }

    await keepLatestOTP({ email }, 'verification', otpRecord._id.toString());

    // Don't assign tokens yet - user must verify email first
    return NextResponse.json({
      message: existingUser
        ? "A new verification code has been sent to your email."
        : "Registration successful! Please check your email to verify your account.",
      email: email,
      verificationRequired: true,
      otpSent: true,
      resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
    });

  } catch (error: unknown) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
