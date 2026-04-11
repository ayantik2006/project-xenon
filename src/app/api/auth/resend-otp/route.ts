import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendOTPEmail, sendPasswordResetOTPEmail } from '@/lib/email';
import { sendOTPSMS } from '@/lib/sms';
import {
    createPendingOTP,
    generateOTP,
    getOTPRetryAfterSeconds,
    keepLatestOTP,
    normalizeEmail,
    normalizePhone,
    OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const email = body.email ? normalizeEmail(body.email) : undefined;
        const phone = body.phone ? normalizePhone(body.phone) : undefined;
        const type = body.type === 'login' || body.type === 'reset'
            ? body.type
            : 'verification';

        if (!email && !phone) {
            return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
        }

        // Check if user exists
        let user;
        if (email) {
            user = await User.findOne({ email }).select('+password');
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            if (type === 'verification' && user.emailVerified) {
                return NextResponse.json({ error: "Email already verified" }, { status: 400 });
            }

            if (type === 'reset' && !user.password) {
                return NextResponse.json({
                    error: "This account uses Google sign-in. Please continue with Google instead."
                }, { status: 400 });
            }
        } else if (phone) {
            user = await User.findOne({ phone });
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            if (user.isPhoneVerified) {
                return NextResponse.json({ error: "Phone already verified" }, { status: 400 });
            }
        }

        const retryAfterSeconds = await getOTPRetryAfterSeconds(
            email ? { email } : { phone: phone! },
            type,
        );

        if (retryAfterSeconds > 0) {
            return NextResponse.json({
                error: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
                retryAfter: retryAfterSeconds,
            }, { status: 429 });
        }

        const otp = generateOTP();
        const recipient = email ? { email } : { phone: phone! };
        const otpRecord = await createPendingOTP(recipient, type, otp);

        // Send OTP
        if (email) {
            const result = type === 'reset'
                ? await sendPasswordResetOTPEmail(email, otp)
                : await sendOTPEmail(email, otp);
            if (!result.success) {
                console.error('Failed to send OTP email:', result.error);
                await otpRecord.deleteOne();
                return NextResponse.json({
                    error: type === 'reset'
                        ? "We could not send the password reset email right now. Please try again shortly."
                        : "We could not send the verification email right now. Please try again shortly."
                }, { status: 502 });
            }
        } else if (phone) {
            const result = await sendOTPSMS(phone, otp);
            if (!result.success) {
                console.error('Failed to send OTP SMS:', result.error);
                await otpRecord.deleteOne();
                return NextResponse.json({
                    error: "We could not send the verification SMS right now. Please try again shortly."
                }, { status: 502 });
            }
        }

        await keepLatestOTP(recipient, type, otpRecord._id.toString());

        return NextResponse.json({
            message: `OTP sent successfully to ${email || phone}`,
            resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
        });

    } catch (error: unknown) {
        console.error("Resend OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
