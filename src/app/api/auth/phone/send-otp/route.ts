import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { phoneSchema } from "@/lib/validators/user";
import {
  createPendingOTP,
  getOTPRetryAfterSeconds,
  keepLatestOTP,
  normalizePhone,
  OTP_RESEND_COOLDOWN_SECONDS,
  generateOTP,
} from "@/lib/otp";
import { sendOTPSMS } from "@/lib/sms";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const result = phoneSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const phone = normalizePhone(result.data.phone);

    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: payload.userId },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "This phone number is already associated with another account." },
        { status: 400 },
      );
    }

    const retryAfterSeconds = await getOTPRetryAfterSeconds(
      { phone },
      "verification",
    );

    if (retryAfterSeconds > 0) {
      return NextResponse.json(
        {
          message:
            "An OTP was already sent. Please wait before requesting a new code.",
          phone,
          otpSent: true,
          resendAvailableIn: retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    const otp = generateOTP();
    const otpRecord = await createPendingOTP({ phone }, "verification", otp);

    const smsResult = await sendOTPSMS(phone, otp);
    if (!smsResult.success) {
      await otpRecord.deleteOne();
      return NextResponse.json(
        {
          error:
            smsResult.error ||
            "Unable to send OTP right now. Please try again shortly.",
          resendAvailableIn: 0,
          otpSent: false,
        },
        { status: 500 },
      );
    }

    await keepLatestOTP({ phone }, "verification", otpRecord._id.toString());

    return NextResponse.json({
      message: "OTP sent successfully. Check your phone.",
      phone,
      otpSent: true,
      resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error: unknown) {
    console.error("Phone OTP Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
