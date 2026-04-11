import { Resend } from 'resend';
import { OTP_EXPIRY_MINUTES } from '@/lib/otp';

const resendApiKey = process.env.RESEND_API_KEY;
const authFromEmail =
  process.env.EMAIL_FROM || 'HoardSpace Auth <auth@hoardspace.in>';
const generalFromEmail =
  process.env.EMAIL_FROM || 'HoardSpace <hello@hoardspace.in>';

let resendClient: Resend | null = null;

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    if (!resendClient) {
      console.error('Resend API key not configured.');
      return {
        success: false,
        error:
          'Email verification service is unavailable right now. Please try again later.',
      };
    }

    const { data, error } = await resendClient.emails.send({
      from: options.from || generalFromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error:
          error.message ||
          'We could not send the verification email right now. Please try again later.',
      };
    }

    console.log(`Email sent successfully to ${options.to}, ID: ${data?.id}`);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: unknown) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? error.message
          : 'We could not send the verification email right now. Please try again later.',
    };
  }
}

export async function sendOTPEmail(
  email: string,
  otp: string,
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - HoardSpace</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">HoardSpace</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Outdoor Advertising Platform</p>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #2563eb; margin-top: 0;">Verify Your Email Address</h2>

          <p style="font-size: 16px; color: #555;">Thank you for registering with HoardSpace. Use the verification code below to complete your registration.</p>

          <div style="background: #f8f9fa; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</div>
            <div style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Security Notice:</strong> This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. Never share it with anyone. HoardSpace will never ask for your verification code.
            </p>
          </div>

          <p style="font-size: 14px; color: #777; margin-top: 30px;">If you did not request this verification code, you can ignore this email.</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} HoardSpace. All rights reserved.<br>
            <a href="https://hoardspace.in" style="color: #2563eb; text-decoration: none;">Visit our website</a>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Your HoardSpace verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes. Never share this code with anyone.

If you did not request this code, you can ignore this email.

Copyright ${new Date().getFullYear()} HoardSpace. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - HoardSpace',
    html,
    text,
    from: authFromEmail,
  });
}

export async function sendPasswordResetOTPEmail(
  email: string,
  otp: string,
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - HoardSpace</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">HoardSpace</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Password reset request</p>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #2563eb; margin-top: 0;">Reset Your Password</h2>

          <p style="font-size: 16px; color: #555;">Use the verification code below to reset your HoardSpace password.</p>

          <div style="background: #f8f9fa; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</div>
            <div style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Security Notice:</strong> This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} HoardSpace. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Your HoardSpace password reset code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes. If you did not request a password reset, you can ignore this email.

Copyright ${new Date().getFullYear()} HoardSpace. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - HoardSpace',
    html,
    text,
    from: authFromEmail,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: 'buyer' | 'vendor',
): Promise<EmailResult> {
  const isBuyer = role === 'buyer';

  const getStartedContent = isBuyer
    ? `
            <h3 style="color: #2563eb; margin-top: 0;">Get Started as an Advertiser:</h3>
            <ul style="color: #555; padding-left: 20px;">
              <li>Browse thousands of premium hoarding locations across India</li>
              <li>Compare prices and availability in real time</li>
              <li>Book advertising spaces with verified vendors</li>
              <li>Manage multiple campaigns from one dashboard</li>
              <li>Track bookings and payments seamlessly</li>
            </ul>
      `
    : `
            <h3 style="color: #2563eb; margin-top: 0;">Get Started as a Vendor:</h3>
            <ul style="color: #555; padding-left: 20px;">
              <li>List your hoarding locations and reach advertisers nationwide</li>
              <li>Set your pricing and manage availability in real time</li>
              <li>Receive booking requests directly from brands and agencies</li>
              <li>Track your inventory performance with detailed analytics</li>
              <li>Grow your business with our transparent platform</li>
            </ul>
      `;

  const ctaText = isBuyer ? 'Browse Hoardings' : 'List Your Hoardings';
  const ctaUrl = isBuyer
    ? 'https://hoardspace.in/search'
    : 'https://hoardspace.in/vendor/add-hoarding';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to HoardSpace</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to HoardSpace!</h1>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2563eb; margin-top: 0;">Hi ${name}!</h2>

          <p style="font-size: 16px; color: #555;">Your email has been successfully verified. Welcome to HoardSpace, India's outdoor advertising platform.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            ${getStartedContent}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${ctaUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">${ctaText}</a>
          </div>

          <p style="font-size: 14px; color: #777; margin-top: 30px;">Need help? Reach us at <a href="mailto:bookings@hoardspace.in" style="color: #2563eb;">bookings@hoardspace.in</a></p>
        </div>

        <div style="text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} HoardSpace. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to HoardSpace!',
    html,
    from: generalFromEmail,
  });
}

export async function sendBookingConfirmationEmail({
  email,
  buyerName,
  hoardingName,
  city,
  startDate,
  endDate,
  totalAmount,
  orderId,
  paymentId,
  paidAt,
}: {
  email: string;
  buyerName: string;
  hoardingName: string;
  city?: string;
  startDate: Date | string;
  endDate: Date | string;
  totalAmount: number;
  orderId?: string;
  paymentId?: string;
  paidAt?: Date | string;
}): Promise<EmailResult> {
  const formattedStart = new Date(startDate).toLocaleDateString("en-IN");
  const formattedEnd = new Date(endDate).toLocaleDateString("en-IN");
  const formattedPaidAt = paidAt
    ? new Date(paidAt).toLocaleString("en-IN")
    : new Date().toLocaleString("en-IN");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed - HoardSpace</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your HoardSpace payment receipt</p>
        </div>

        <div style="background: #ffffff; padding: 32px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; color: #555;">Hi ${buyerName},</p>
          <p style="font-size: 16px; color: #555;">Your booking payment has been received successfully. Your campaign is now confirmed.</p>

          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #111827;">Booking Summary</h3>
            <p style="margin: 8px 0;"><strong>Listing:</strong> ${hoardingName}</p>
            <p style="margin: 8px 0;"><strong>Location:</strong> ${city || "N/A"}</p>
            <p style="margin: 8px 0;"><strong>Campaign Dates:</strong> ${formattedStart} to ${formattedEnd}</p>
            <p style="margin: 8px 0;"><strong>Total Paid:</strong> Rs ${Number(totalAmount || 0).toLocaleString("en-IN")}</p>
          </div>

          <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 10px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #111827;">Payment Receipt</h3>
            <p style="margin: 8px 0;"><strong>Order ID:</strong> ${orderId || "Pending"}</p>
            <p style="margin: 8px 0;"><strong>Payment ID:</strong> ${paymentId || "Pending"}</p>
            <p style="margin: 8px 0;"><strong>Paid At:</strong> ${formattedPaidAt}</p>
          </div>

          <p style="font-size: 14px; color: #6b7280;">Please keep this email for your records. You can also view the transaction from your HoardSpace dashboard.</p>
        </div>

        <div style="text-align: center; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} HoardSpace. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Booking Confirmed

Hi ${buyerName},

Your booking payment has been received successfully.

Listing: ${hoardingName}
Location: ${city || "N/A"}
Campaign Dates: ${formattedStart} to ${formattedEnd}
Total Paid: Rs ${Number(totalAmount || 0).toLocaleString("en-IN")}
Order ID: ${orderId || "Pending"}
Payment ID: ${paymentId || "Pending"}
Paid At: ${formattedPaidAt}
`;

  return sendEmail({
    to: email,
    subject: "Booking Confirmed & Payment Receipt - HoardSpace",
    html,
    text,
    from: generalFromEmail,
  });
}
