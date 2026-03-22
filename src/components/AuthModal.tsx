"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  Lock,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import {
  signupSchema,
  loginSchema,
  otpSchema,
  kycSchema,
  type SignupInput,
  type LoginInput,
  type OTPInput,
  type KYCInput,
} from "@/lib/validators/user";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "role" | "auth" | "verify-email" | "kyc-choice" | "kyc" | "verify-phone";
type Role = "buyer" | "vendor";
type AuthMode = "login" | "signup";
type AuthApiResponse = {
  error?: string;
  message?: string;
  email?: string;
  phone?: string;
  verificationRequired?: boolean;
  requiresEmailVerification?: boolean;
  phoneVerificationRequired?: boolean;
  otpSent?: boolean;
  resendAvailableIn?: number;
  user?: {
    isPhoneVerified: boolean;
  };
};

const stepOrder: Step[] = [
  "role",
  "auth",
  "verify-email",
  "kyc-choice",
  "kyc",
  "verify-phone",
];

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("buyer");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [kycDeferred, setKycDeferred] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "buyer" },
  });

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const otpForm = useForm<OTPInput>({
    resolver: zodResolver(otpSchema),
  });

  const kycForm = useForm<KYCInput>({
    resolver: zodResolver(kycSchema),
  });

  const resetModalState = () => {
    setStep("role");
    setRole("buyer");
    setAuthMode("signup");
    setEmail("");
    setPhone("");
    setLoading(false);
    setError("");
    setNotice("");
    setKycDeferred(false);
    setTermsAccepted(false);
    setEmailResendCooldown(0);
    setPhoneResendCooldown(0);
    signupForm.reset({ name: "", email: "", password: "", role: "buyer" });
    loginForm.reset({ email: "", password: "" });
    otpForm.reset({ otp: "" });
    kycForm.reset({
      phone: "",
      companyName: "",
      gstin: "",
      pan: "",
      aadhaar: "",
      address: "",
      documents: [],
    });
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const moveToEmailVerification = (
    targetEmail: string,
    resendAvailableIn = 60,
    nextError = "",
    nextNotice = "",
  ) => {
    setEmail(targetEmail);
    setStep("verify-email");
    setEmailResendCooldown(resendAvailableIn);
    setError(nextError);
    setNotice(nextNotice);
    otpForm.reset({ otp: "" });
  };

  const moveToPhoneVerification = (
    targetPhone: string,
    resendAvailableIn = 60,
    nextError = "",
    nextNotice = "",
  ) => {
    setPhone(targetPhone);
    setStep("verify-phone");
    setPhoneResendCooldown(resendAvailableIn);
    setError(nextError);
    setNotice(nextNotice);
    otpForm.reset({ otp: "" });
  };

  useEffect(() => {
    if (!isOpen) {
      setStep("role");
      setRole("buyer");
      setAuthMode("signup");
      setEmail("");
      setPhone("");
      setLoading(false);
      setError("");
      setNotice("");
      setKycDeferred(false);
      setTermsAccepted(false);
      setEmailResendCooldown(0);
      setPhoneResendCooldown(0);
      signupForm.reset({ name: "", email: "", password: "", role: "buyer" });
      loginForm.reset({ email: "", password: "" });
      otpForm.reset({ otp: "" });
      kycForm.reset({
        phone: "",
        companyName: "",
        gstin: "",
        pan: "",
        aadhaar: "",
        address: "",
        documents: [],
      });
    }
  }, [isOpen, kycForm, loginForm, otpForm, signupForm]);

  useEffect(() => {
    if (emailResendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setEmailResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [emailResendCooldown]);

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setPhoneResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phoneResendCooldown]);

  if (!isOpen) return null;

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    signupForm.setValue("role", selectedRole);
    setStep("auth");
    setAuthMode("signup");
    setError("");
    setNotice("");
  };

  const handleSignupSubmit = async (data: SignupInput) => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const signupData = { ...data, role };
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(signupData),
      });
      const result: AuthApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Signup failed");
      }

      moveToEmailVerification(
        result.email || data.email,
        result.resendAvailableIn ?? 60,
        result.otpSent === false
          ? result.message ||
              "We could not send your verification code yet. Please use resend."
          : "",
        result.otpSent === false ? "" : result.message || "",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (data: LoginInput) => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result: AuthApiResponse = await res.json();

      if (!res.ok) {
        if (result.requiresEmailVerification) {
          moveToEmailVerification(
            result.email || data.email,
            result.resendAvailableIn ?? 0,
            result.otpSent === false
              ? result.error ||
                  "Your email is not verified and we could not send a new code yet."
              : "",
            result.otpSent === false ? "" : result.error || "",
          );
          return;
        }

        throw new Error(result.error || "Login failed");
      }

      if (!result.user?.isPhoneVerified) {
        setStep("kyc-choice");
        setKycDeferred(false);
        setError("");
        setNotice("");
      } else {
        handleClose();
        window.location.reload();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithGoogle = () => {
    const params = new URLSearchParams({ mode: authMode, role });
    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  const handleVerifyEmail = async (data: OTPInput) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: data.otp }),
      });
      const result: AuthApiResponse = await res.json();
      if (!res.ok) throw new Error(result.error || "Verification failed");

      otpForm.reset({ otp: "" });
      setStep("kyc-choice");
      setNotice(result.message || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStartKYC = () => {
    setError("");
    setNotice("");
    setKycDeferred(false);
    setStep("kyc");
  };

  const handleDeferKYC = () => {
    setError("");
    setKycDeferred(true);
  };

  const handleKYCSubmit = async (data: KYCInput) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result: AuthApiResponse = await res.json();
      if (!res.ok) throw new Error(result.error || "KYC submission failed");

      moveToPhoneVerification(
        result.phone || data.phone,
        result.resendAvailableIn ?? 60,
        result.otpSent === false
          ? result.message ||
              "KYC was saved, but we could not send the phone verification code yet."
          : "",
        result.otpSent === false ? "" : result.message || "",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "KYC submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (data: OTPInput) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      body: JSON.stringify({ phone, otp: data.otp, context: "kyc" }),
      });
      const result: AuthApiResponse = await res.json();
      if (!res.ok) throw new Error(result.error || "Phone verification failed");

      handleClose();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Phone verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, type: "verification" }),
      });
      const result: AuthApiResponse & { retryAfter?: number } = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setEmailResendCooldown(result.retryAfter ?? 0);
        }
        throw new Error(result.error || "Could not resend the verification code");
      }

      setEmailResendCooldown(result.resendAvailableIn ?? 60);
      setNotice(result.message || "A new verification code has been sent.");
      otpForm.reset({ otp: "" });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend the verification code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendPhone = async () => {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, type: "verification" }),
      });
      const result: AuthApiResponse & { retryAfter?: number } = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setPhoneResendCooldown(result.retryAfter ?? 0);
        }
        throw new Error(result.error || "Could not resend the verification code");
      }

      setPhoneResendCooldown(result.resendAvailableIn ?? 60);
      setNotice(result.message || "A new verification code has been sent.");
      otpForm.reset({ otp: "" });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend the verification code",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side - Brand / Info (Hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 bg-[#2563eb] p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">
              Empowering All To Advertise
            </h2>
            <p className="text-blue-200">
              Find and buy the best media spots online.
            </p>
          </div>

          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-400/30 blur-3xl"></div>

          <div className="relative z-20 isolate">
            <div className="flex items-center gap-2 mix-blend-multiply">
              {/* Actual Logo with forced blending properties */}
              <Image
                src="/companyLogo/Screenshot 2026-03-02 at 02.10.29.png"
                alt="HoardSpace Logo"
                width={160}
                height={50}
                className="h-10 w-auto object-contain contrast-[1.2] brightness-110"
                style={{ mixBlendMode: 'multiply' }}
                priority
              />
            </div>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-7/12 p-8 relative bg-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="h-full flex flex-col justify-center">
            {/* Steps Visual Indicator (Optional) */}
            <div className="mb-6 flex gap-2">
              {stepOrder.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    stepOrder.indexOf(step) >= i ? "bg-[#2563eb]" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {step === "role" && "Welcome to HoardSpace"}
              {step === "auth" &&
                (authMode === "signup" ? "Create Account" : "Welcome Back")}
              {step === "verify-email" && "Verify Your Email"}
              {step === "kyc-choice" && "KYC Verification"}
              {step === "kyc" && "Complete KYC"}
              {step === "verify-phone" && "Verify Phone"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {step === "role" && "Choose how you would like to proceed"}
              {step === "auth" &&
                (authMode === "signup"
                  ? "Enter your details to register"
                  : "Login to access your dashboard")}
              {step === "verify-email" && `We sent a code to ${email}`}
              {step === "kyc-choice" &&
                "KYC is required before booking. Verify now or come back later."}
              {step === "kyc" && "Fill in your details for verification"}
              {step === "verify-phone" && `We sent a code to ${phone}`}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
                {notice}
              </div>
            )}

            {/* Step 1: Role Selection */}
            {step === "role" && (
              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect("buyer")}
                  className="w-full p-4 border rounded-xl hover:border-[#2563eb] hover:bg-blue-50 transition-all group flex items-center gap-4 text-left"
                >
                  <div className="bg-blue-100 p-3 rounded-full text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      I want to Buy Media
                    </h3>
                    <p className="text-xs text-gray-500">
                      Find and book advertising spaces
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect("vendor")}
                  className="w-full p-4 border rounded-xl hover:border-[#2563eb] hover:bg-blue-50 transition-all group flex items-center gap-4 text-left"
                >
                  <div className="bg-purple-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      I want to Sell Media
                    </h3>
                    <p className="text-xs text-gray-500">
                      List and manage your properties
                    </p>
                  </div>
                </button>

                <div className="text-center mt-4">
                  <span className="text-sm text-gray-500">
                    Already have an account?{" "}
                  </span>
                  <button
                    onClick={() => {
                      setStep("auth");
                      setAuthMode("login");
                      setError("");
                      setNotice("");
                    }}
                    className="text-[#2563eb] font-medium hover:underline"
                  >
                    Login
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Auth (Signup/Login) */}
            {step === "auth" && (
              <form
                onSubmit={
                  authMode === "signup"
                    ? signupForm.handleSubmit(handleSignupSubmit)
                    : loginForm.handleSubmit(handleLoginSubmit)
                }
                className="space-y-4"
              >
                {authMode === "signup" && (
                  <div>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        {...signupForm.register("name")}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-shadow"
                        placeholder="Full Name"
                      />
                    </div>
                    {signupForm.formState.errors.name && (
                      <p className="text-xs text-red-500 mt-1">
                        {signupForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...(authMode === "signup"
                        ? signupForm.register("email")
                        : loginForm.register("email"))}
                      type="email"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-shadow"
                      placeholder="Email Address"
                    />
                  </div>
                  {(authMode === "signup"
                    ? signupForm.formState.errors.email
                    : loginForm.formState.errors.email) && (
                    <p className="text-xs text-red-500 mt-1">
                      {authMode === "signup"
                        ? signupForm.formState.errors.email?.message
                        : loginForm.formState.errors.email?.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      {...(authMode === "signup"
                        ? signupForm.register("password")
                        : loginForm.register("password"))}
                      autoComplete={
                        authMode === "signup" ? "new-password" : "current-password"
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-shadow"
                      placeholder="Password"
                    />
                  </div>
                  {(authMode === "signup"
                    ? signupForm.formState.errors.password
                    : loginForm.formState.errors.password) && (
                    <p className="text-xs text-red-500 mt-1">
                      {authMode === "signup"
                        ? signupForm.formState.errors.password?.message
                        : loginForm.formState.errors.password?.message}
                    </p>
                  )}
                </div>

                {authMode === "signup" && (
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563eb] hover:underline"
                      >
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563eb] hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading || (authMode === "signup" && !termsAccepted)
                  }
                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Processing..."
                    : authMode === "signup"
                      ? "Continue"
                      : "Login"}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  className="w-full flex items-center justify-center gap-2 border py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "signup" ? "login" : "signup");
                      setTermsAccepted(false);
                      setError("");
                      setNotice("");
                    }}
                    className="text-[#2563eb] text-sm hover:underline"
                  >
                    {authMode === "signup"
                      ? "Already have an account? Login"
                      : "New here? Create Account"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Verify Email */}
            {step === "verify-email" && (
              <form
                onSubmit={otpForm.handleSubmit(handleVerifyEmail)}
                className="space-y-6"
              >
                <div className="text-center">
                  <input
                    {...otpForm.register("otp")}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full text-center text-3xl tracking-[1em] font-bold py-4 border-b-2 focus:border-[#2563eb] outline-none"
                    placeholder="000000"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={loading || emailResendCooldown > 0}
                  className="w-full text-sm text-gray-500 hover:text-[#2563eb] disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {emailResendCooldown > 0
                    ? `Resend Code in ${formatCountdown(emailResendCooldown)}`
                    : "Resend Code"}
                </button>
              </form>
            )}

            {/* Step 3.5: KYC Choice */}
            {step === "kyc-choice" && (
              <div className="space-y-5 text-center">
                <p className="text-sm text-gray-500 leading-relaxed">
                  You just finished email verification. Would you like to complete
                  your KYC now or later from your profile?
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleStartKYC}
                    className="flex-1 bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Verify KYC Now
                  </button>
                  <button
                    type="button"
                    onClick={handleDeferKYC}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
                  >
                    I'll verify later
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  KYC is required before booking media; you can finish it anytime
                  from your profile.
                </p>
                {kycDeferred && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-600 space-y-2">
                    <p>
                      We’ll keep your session open. Reopen this modal when you’re ready to
                      submit your KYC details.
                    </p>
                    <p className="text-right">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="text-[#2563eb] font-semibold hover:underline"
                      >
                        Close
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: KYC Form */}
            {step === "kyc" && (
              <form
                onSubmit={kycForm.handleSubmit(handleKYCSubmit)}
                className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...kycForm.register("phone")}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {kycForm.formState.errors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {kycForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      rows={2}
                      {...kycForm.register("address")}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                      placeholder="Registered Address"
                    />
                  </div>
                </div>

                {/* Optional fields based on Schema */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GSTIN{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      {...kycForm.register("gstin")}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none"
                      placeholder="GST Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...kycForm.register("pan")}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none"
                      placeholder="PAN Number"
                    />
                    {kycForm.formState.errors.pan && (
                      <p className="text-xs text-red-500 mt-1">
                        {kycForm.formState.errors.pan.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...kycForm.register("aadhaar")}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none"
                    placeholder="Aadhaar Number"
                  />
                  {kycForm.formState.errors.aadhaar && (
                    <p className="text-xs text-red-500 mt-1">
                      {kycForm.formState.errors.aadhaar.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start">
                  <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Your profile will be verified manually by admin after this
                    step. You can start browsing immediately.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit & Verify Phone"}
                </button>
              </form>
            )}

            {/* Step 5: Verify Phone */}
            {step === "verify-phone" && (
              <form
                onSubmit={otpForm.handleSubmit(handleVerifyPhone)}
                className="space-y-6"
              >
                <div className="text-center">
                  <input
                    {...otpForm.register("otp")}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full text-center text-3xl tracking-[1em] font-bold py-4 border-b-2 focus:border-[#2563eb] outline-none"
                    placeholder="000000"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Enter the code sent to {phone}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Complete Registration" : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={handleResendPhone}
                  disabled={loading || phoneResendCooldown > 0}
                  className="w-full text-sm text-gray-500 hover:text-[#2563eb] disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {phoneResendCooldown > 0
                    ? `Resend Code in ${formatCountdown(phoneResendCooldown)}`
                    : "Resend Code"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
