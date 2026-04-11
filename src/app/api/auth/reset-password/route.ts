import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { clearOTPs, findValidOTP, normalizeEmail } from "@/lib/otp";
import { hashPassword } from "@/lib/password";
import { resetPasswordSchema } from "@/lib/validators/user";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const email = normalizeEmail(result.data.email);
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    const validOTP = await findValidOTP({ email }, "reset", result.data.otp);
    if (!validOTP) {
      return NextResponse.json(
        {
          error:
            "That reset code is invalid or expired. Please try again or request a new code.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(result.data.password);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      refreshToken: undefined,
      refreshTokenExpiry: undefined,
    });

    await clearOTPs({ email }, "reset");

    return NextResponse.json({
      message: "Password updated successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
