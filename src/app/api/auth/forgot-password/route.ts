import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { sendPasswordResetOTPEmail } from "@/lib/email";
import {
  createPendingOTP,
  generateOTP,
  getOTPRetryAfterSeconds,
  keepLatestOTP,
  normalizeEmail,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/otp";
import { forgotPasswordSchema } from "@/lib/validators/user";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const email = normalizeEmail(result.data.email);
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account exists for this email, a password reset code will arrive shortly.",
        },
        { status: 200 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "This account uses Google sign-in. Please continue with Google instead.",
        },
        { status: 400 },
      );
    }

    const retryAfterSeconds = await getOTPRetryAfterSeconds({ email }, "reset");
    if (retryAfterSeconds > 0) {
      return NextResponse.json({
        message:
          "A reset code was already sent recently. Please check your inbox.",
        email,
        resendAvailableIn: retryAfterSeconds,
      });
    }

    const otp = generateOTP();
    const otpRecord = await createPendingOTP({ email }, "reset", otp);
    const emailResult = await sendPasswordResetOTPEmail(email, otp);

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      await otpRecord.deleteOne();

      return NextResponse.json(
        {
          error:
            "We could not send the password reset email right now. Please try again shortly.",
        },
        { status: 502 },
      );
    }

    await keepLatestOTP({ email }, "reset", otpRecord._id.toString());

    return NextResponse.json({
      message: "We sent a password reset code to your email.",
      email,
      resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
