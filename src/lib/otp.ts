import { createHash, randomInt } from "crypto";
import OTP from "@/models/OTP";

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

type OTPType = "verification" | "login" | "reset";
type OTPRecipient = {
  email?: string;
  phone?: string;
};

function getRecipientFilter(recipient: OTPRecipient) {
  if (recipient.email) {
    return { email: normalizeEmail(recipient.email) };
  }

  if (recipient.phone) {
    return { phone: normalizePhone(recipient.phone) };
  }

  throw new Error("OTP recipient is required");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s-()]/g, "");
}

export function generateOTP() {
  return randomInt(100000, 1000000).toString();
}

export function hashOTP(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export function getOTPExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export async function getOTPRetryAfterSeconds(
  recipient: OTPRecipient,
  type: OTPType,
) {
  const latestOTP = await OTP.findOne({
    ...getRecipientFilter(recipient),
    type,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select("createdAt");

  if (!latestOTP?.createdAt) {
    return 0;
  }

  const retryAfterMs =
    latestOTP.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000 - Date.now();

  return retryAfterMs > 0 ? Math.ceil(retryAfterMs / 1000) : 0;
}

export async function createPendingOTP(
  recipient: OTPRecipient,
  type: OTPType,
  otp: string,
) {
  return OTP.create({
    ...getRecipientFilter(recipient),
    otp: hashOTP(otp),
    type,
    expiresAt: getOTPExpiryDate(),
  });
}

export async function keepLatestOTP(
  recipient: OTPRecipient,
  type: OTPType,
  keepId: string,
) {
  await OTP.deleteMany({
    ...getRecipientFilter(recipient),
    type,
    _id: { $ne: keepId },
  });
}

export async function findValidOTP(recipient: OTPRecipient, type: OTPType, otp: string) {
  return OTP.findOne({
    ...getRecipientFilter(recipient),
    type,
    otp: { $in: [hashOTP(otp), otp] },
    expiresAt: { $gt: new Date() },
  });
}

export async function clearOTPs(recipient: OTPRecipient, type: OTPType) {
  await OTP.deleteMany({
    ...getRecipientFilter(recipient),
    type,
  });
}
