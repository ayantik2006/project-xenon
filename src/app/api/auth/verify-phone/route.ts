import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { otpSchema } from '@/lib/validators/user';
import { clearOTPs, findValidOTP, normalizePhone } from '@/lib/otp';

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

      const otp = body.otp;
      const phone = body.phone ? normalizePhone(body.phone) : "";
      if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

      const result = otpSchema.safeParse({ otp });
      if (!result.success) {
         return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
      }

      const validOTP = await findValidOTP({ phone }, 'verification', otp);

      if (!validOTP) {
         return NextResponse.json({
            error: "That verification code is invalid or expired. Please try again or request a new code.",
         }, { status: 400 });
      }

      // Update User
      const user = await User.findByIdAndUpdate(payload.userId, {
         isPhoneVerified: true,
         kycStatus: 'pending' // Move to pending review by admin
      }, { new: true });

      if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Delete used OTP
      await clearOTPs({ phone }, 'verification');

      return NextResponse.json({
         message: "Phone verified successfully. Account pending approval.",
         user
      });

   } catch (error: unknown) {
      console.error("Verify Phone Error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
   }
}
