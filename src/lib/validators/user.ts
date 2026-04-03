import { z } from 'zod';

// Auth Schemas
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['buyer', 'vendor']),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const phoneSchema = z.object({
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[\d\s-()]+$/, "Invalid phone number format"),
});

export const otpSchema = z.object({
  otp: z.string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

// KYC Schemas
export const kycSchema = z.object({
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 characters")
    .regex(/^[+]?[\d\s-()]+$/, "Phone number can only contain digits, +, -, (, ), and spaces")
    .transform((val) => val.replace(/[\s-()]/g, '')), // Remove formatting characters
  companyName: z.string().optional(), // Is optional but typically good to have
  gstin: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  pan: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .transform(v => v.toUpperCase()),
  aadhaar: z.string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  address: z.string().optional(),
  documents: z.array(z.string().url()).optional(),
  acceptTerms: z
    .boolean()
    .refine(
      (value) => value,
      "You must accept the terms and conditions before submitting KYC.",
    ),
});

export const profileKycSchema = kycSchema.omit({
  phone: true,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type KYCInput = z.infer<typeof kycSchema>;
export type ProfileKYCInput = z.infer<typeof profileKycSchema>;

