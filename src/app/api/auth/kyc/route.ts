import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { kycSchema } from '@/lib/validators/user';
import { sendOTPSMS } from '@/lib/sms';
import {
  createPendingOTP,
  getOTPRetryAfterSeconds,
  keepLatestOTP,
  normalizePhone,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const result = kycSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const phone = normalizePhone(result.data.phone);
    const { address, companyName, gstin, pan, aadhaar, documents } = result.data;

    const currentUser = await User.findById(payload.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if phone already exists for another user
    const existingPhone = await User.findOne({ phone, _id: { $ne: payload.userId } });
    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already in use" }, { status: 400 });
    }

    const phoneChanged = Boolean(currentUser.phone && currentUser.phone !== phone);
    const shouldVerifyPhone = !currentUser.isPhoneVerified || phoneChanged;

    // Update User with KYC details
    await User.findByIdAndUpdate(payload.userId, {
      phone,
      isPhoneVerified: shouldVerifyPhone ? false : currentUser.isPhoneVerified,
      kycDetails: {
        phone,
        address,
        companyName,
        gstin,
        pan,
        aadhaar,
        documents: documents || []
      },
      // Set status to pending only if phone is already verified (e.g. user updating kyc)
      // If phone is not verified, it will be set to pending in verify-phone route
      // Or we can set it to pending here if we trust the phone input or if phone didn't change?
      // Safe bet: if user.isPhoneVerified is true, set to pending.
    });

    if (!shouldVerifyPhone) {
      // If phone is already verified and same, just update status to pending
      await User.findByIdAndUpdate(payload.userId, { kycStatus: 'pending' });
      return NextResponse.json({ message: "KYC submitted successfully." });
    }

    const retryAfterSeconds = await getOTPRetryAfterSeconds(
      { phone },
      'verification',
    );

    if (retryAfterSeconds > 0) {
      return NextResponse.json({
        message: "KYC submitted. Use the verification code already sent to your phone.",
        phoneVerificationRequired: true,
        phone,
        otpSent: true,
        resendAvailableIn: retryAfterSeconds,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRecord = await createPendingOTP({ phone }, 'verification', otp);

    // Send OTP SMS
    const smsResult = await sendOTPSMS(phone, otp);
    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      await otpRecord.deleteOne();

      return NextResponse.json({
        message:
          "KYC was saved, but we could not send the verification code right now. Please try resending it.",
        phoneVerificationRequired: true,
        phone,
        otpSent: false,
        resendAvailableIn: 0,
      }, { status: 202 });
    }

    await keepLatestOTP({ phone }, 'verification', otpRecord._id.toString());

    return NextResponse.json({
      message: "KYC submitted. Please verify phone.",
      phoneVerificationRequired: true,
      phone,
      otpSent: true,
      resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
    });

  } catch (error: unknown) {
    console.error("KYC Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
