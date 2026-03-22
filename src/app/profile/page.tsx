"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  ShieldCheck,
  AlertCircle,
  LogOut,
  CheckCircle,
  Clock,
  Shield,
  ArrowRight,
} from "lucide-react";
import { kycSchema, type KYCInput } from "@/lib/validators/user";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpRecipient, setOtpRecipient] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const PHONE_OTP_COOLDOWN_SECONDS = 60;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const kycForm = useForm<KYCInput>({
    resolver: zodResolver(kycSchema),
  });

  const loadUser = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/auth/me");

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setPhotoPreview(data.user.image || null);
          setPhotoFile(null);
          setPhotoStatus(null);
          setPhoneInput(data.user.phone || "");
        const kycDefaults = {
          phone: data.user.phone || "",
          companyName: "",
          gstin: "",
          pan: "",
          aadhaar: "",
          address: "",
          documents: [],
        };

        if (data.user.kycDetails) {
          kycForm.reset({
            ...kycDefaults,
            companyName: data.user.kycDetails.companyName || "",
            gstin: data.user.kycDetails.gstin || "",
            pan: data.user.kycDetails.pan || "",
            aadhaar: data.user.kycDetails.aadhaar || "",
            address: data.user.kycDetails.address || "",
            documents: data.user.kycDetails.documents || [],
          });
        } else {
          kycForm.reset(kycDefaults);
        }
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router, kycForm]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout failed", e);
    }
    window.location.href = "/";
  };

  const handleSendPhoneOtp = async (
    event?: FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();
    setPhoneStatus(null);
    const trimmedPhone = phoneInput.trim();
    if (!trimmedPhone) {
      setPhoneStatus({
        type: "error",
        message: "Please enter a valid phone number.",
      });
      return;
    }

    setSendingPhoneOtp(true);
    try {
      const res = await fetchWithAuth("/api/auth/phone/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: trimmedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneStatus({
          type: "error",
          message: data.error || data.message || "Could not send OTP.",
        });
        if (data.resendAvailableIn) {
          setResendCooldown(data.resendAvailableIn);
        }
        return;
      }

      setOtpSent(true);
      setOtpRecipient(data.phone || trimmedPhone);
      setResendCooldown(
        data.resendAvailableIn ?? PHONE_OTP_COOLDOWN_SECONDS,
      );
      setPhoneStatus({
        type: "success",
        message: data.message || "OTP sent successfully.",
      });
    } catch (err: any) {
      console.error("Send OTP failed", err);
      setPhoneStatus({
        type: "error",
        message: err.message || "Failed to send OTP. Please try again.",
      });
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setPhoneStatus({
        type: "error",
        message: "Enter the 6-digit verification code.",
      });
      return;
    }

    setVerifyingPhoneOtp(true);
    setPhoneStatus(null);
    try {
      const res = await fetchWithAuth("/api/auth/verify-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          otp: otpCode.trim(),
          context: "profile",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setPhoneStatus({
        type: "success",
        message: data.message || "Phone verified successfully.",
      });
      setOtpSent(false);
      setOtpCode("");
      setResendCooldown(0);
      setOtpRecipient("");
      await loadUser();
    } catch (err: any) {
      setPhoneStatus({
        type: "error",
        message: err.message || "Invalid verification code.",
      });
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoStatus(null);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      setPhotoStatus({
        type: "error",
        message: "Please select an image before uploading.",
      });
      return;
    }

    setPhotoStatus(null);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);

      const res = await fetchWithAuth("/api/profile/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setPhotoStatus({
        type: "success",
        message: data.message || "Profile photo updated.",
      });
      setPhotoFile(null);
      setPhotoPreview(data.imageUrl || photoPreview);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadUser();
    } catch (err: any) {
      console.error("Upload error", err);
      setPhotoStatus({
        type: "error",
        message: err.message || "Upload failed. Please try again.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleKYCSubmit = async (data: KYCInput) => {
    setError("");
    setSuccess("");
    if (!user?.phone || !user?.isPhoneVerified) {
      setError("Please verify your phone number before submitting KYC.");
      return;
    }

    setKycSubmitting(true);
    try {
      const payload = {
        ...data,
        phone: user.phone,
      };
      const res = await fetchWithAuth("/api/auth/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "KYC submission failed");

      setSuccess(result.message || "KYC Details Submitted Successfully.");
      await loadUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setKycSubmitting(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header / Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] h-32 relative">
            <div className="absolute top-4 right-4 flex gap-3">
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold shadow-lg"
                >
                  <Shield size={16} />
                  Admin Dashboard
                  <ArrowRight size={16} />
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm text-sm font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="flex items-end gap-6">
                <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg">
                  <div className="h-full w-full rounded-xl bg-blue-50 flex items-center justify-center text-[#2563eb]">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="h-full w-full object-cover rounded-xl"
                      />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                </div>
                <div className="pb-1">
                  <p className="text-sm text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                    user.kycStatus === "approved" ||
                    user.kycStatus === "verified"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : user.kycStatus === "pending"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : user.kycStatus === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {(user.kycStatus === "approved" ||
                    user.kycStatus === "verified") && <CheckCircle size={14} />}
                  {user.kycStatus === "pending" && <Clock size={14} />}
                  {user.kycStatus === "rejected" && <AlertCircle size={14} />}
                  {user.kycStatus === "not_submitted" && (
                    <AlertCircle size={14} />
                  )}
                  {user.kycStatus === "not_submitted"
                    ? "KYC Not Submitted"
                    : user.kycStatus.charAt(0).toUpperCase() +
                      user.kycStatus.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Contact Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-sm">{user.email}</span>
                    {user.emailVerified && (
                      <CheckCircle
                        size={14}
                        className="text-green-500 ml-auto"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <Phone size={18} className="text-gray-400" />
                    <span className="text-sm">
                      {user.phone || "Not provided"}
                    </span>
                    {user.isPhoneVerified && (
                      <CheckCircle
                        size={14}
                        className="text-green-500 ml-auto"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Buyer Dashboard Option */}
              {user.role === "buyer" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Buyer Controls
                  </h3>
                  <div className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-xl p-5 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold">My Bookings</h4>
                    </div>
                    <p className="text-blue-100 text-sm mb-4">
                      View and manage your hoarding bookings.
                    </p>
                    <button
                      onClick={() => router.push("/buyer/dashboard")}
                      className="w-full bg-white text-[#2563eb] font-bold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Vendor Dashboard Option */}
              {user.role === "vendor" &&
                (user.kycStatus === "approved" ||
                  user.kycStatus === "verified") && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Vendor Controls
                    </h3>
                    <div className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-xl p-5 text-white shadow-lg shadow-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold">Manage Hoardings</h4>
                      </div>
                      <p className="text-blue-100 text-sm mb-4">
                        Add, edit, and track your property listings.
                      </p>
                      <button
                        onClick={() => router.push("/vendor/dashboard")}
                        className="w-full bg-white text-[#2563eb] font-bold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
                )}

              {/* Vendor Account Pending Message */}
              {user.role === "vendor" && user.kycStatus === "pending" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Vendor Status
                  </h3>
                  <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200 shadow-sm">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <Clock size={20} />
                      <h4 className="text-lg font-bold">
                        Verification In Progress
                      </h4>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Your vendor account functions (Dashboard, Add Hoarding)
                      will be enabled once your KYC is approved by the admin.
                    </p>
                  </div>
                </div>
              )}

              {(user.kycStatus === "approved" ||
                user.kycStatus === "verified" ||
                user.kycStatus === "pending") &&
                user.kycDetails && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Company Details
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-400 mt-1" />
                        <span className="text-sm text-gray-600">
                          {user.kycDetails.address || "No address provided"}
                        </span>
                      </div>
                      {user.kycDetails.companyName && (
                        <div className="flex items-center gap-3">
                          <Building2 size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {user.kycDetails.companyName}
                          </span>
                        </div>
                      )}
                      {user.kycDetails.gstin && (
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            GSTIN: {user.kycDetails.gstin}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Profile Picture */}
      {["buyer", "vendor"].includes(user.role) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {user.role === "vendor"
                  ? "Vendor Profile Picture"
                  : "Buyer Profile Picture"}
              </h2>
              <p className="text-sm text-gray-500">
                {user.role === "vendor"
                  ? "Upload a brand or personal image so buyers feel confident booking from you."
                  : "Upload a friendly face or brand avatar so vendors can recognize you while chatting."}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center text-gray-400">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-500">
                  No photo
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
                >
                  Choose file
                </button>
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={!photoFile || uploadingPhoto}
                  className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPhoto ? "Uploading..." : "Upload photo"}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
              <p className="text-xs text-gray-400">
                Supported formats: JPG/PNG. Keep file size under 5MB.
              </p>
              <p className="text-xs text-gray-400">
                Your photo is stored securely via Cloudinary and linked to your
                buyer profile.
              </p>
              {photoStatus && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    photoStatus.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}
                >
                  {photoStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Phone Verification Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg text-[#2563eb]">
                <Phone size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Phone Verification
                </h2>
                <p className="text-sm text-gray-500 max-w-xl">
                  Confirm your phone number to access bookings and alerts. OTPs are
                  delivered securely via Twilio.
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                user.isPhoneVerified
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}
            >
              {user.isPhoneVerified ? (
                <>
                  <CheckCircle size={14} />
                  Phone Verified
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  Add & verify
                </>
              )}
            </span>
          </div>

          <form onSubmit={handleSendPhoneOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setPhoneStatus(null);
                    setOtpSent(false);
                    setOtpCode("");
                    setResendCooldown(0);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              {!phoneInput && (
                <p className="mt-1 text-xs text-gray-500">
                  Enter the number you want to receive the OTP on.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={
                  sendingPhoneOtp ||
                  !phoneInput.trim() ||
                  resendCooldown > 0
                }
                className="px-5 py-2.5 rounded-lg bg-[#2563eb] text-white font-semibold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingPhoneOtp
                  ? "Sending OTP..."
                  : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
              </button>
              {resendCooldown > 0 && (
                <span className="text-xs text-gray-500">
                  You can resend in {resendCooldown} second
                  {resendCooldown !== 1 ? "s" : ""}.
                </span>
              )}
              <span className="text-xs text-gray-400">
                Current phone:{" "}
                {user.phone ? (
                  <>
                    {user.phone}{" "}
                    {user.isPhoneVerified ? "(verified)" : "(unverified)"}
                  </>
                ) : (
                  "Not provided"
                )}
              </span>
            </div>
          </form>

          {otpSent && (
            <form
              onSubmit={handleVerifyPhoneOtp}
              className="space-y-3 max-w-md bg-blue-50 border border-blue-100 p-4 rounded-xl"
            >
              <p className="text-sm text-blue-700">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold">
                  {otpRecipient || phoneInput}
                </span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-[#2563eb] outline-none"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={verifyingPhoneOtp || !otpCode.trim()}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {verifyingPhoneOtp ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPhoneOtp()}
                  disabled={sendingPhoneOtp || resendCooldown > 0}
                  className="text-xs text-[#2563eb] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {phoneStatus && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                phoneStatus.type === "success"
                  ? "bg-green-50 text-green-600 border border-green-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}
            >
              {phoneStatus.message}
            </div>
          )}

          <p className="text-xs text-gray-400">
            OTPs are handled by Twilio. Never share your verification code with
            anyone.
          </p>
        </div>

        {/* KYC Section */}
        {(user.kycStatus === "not_submitted" ||
          user.kycStatus === "rejected") && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg text-[#2563eb]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Complete Your KYC
                </h2>
                <p className="text-sm text-gray-500">
                  Verify your identity to unlock all features
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex gap-2 items-center">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm rounded-xl flex gap-2 items-center">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            <form
              onSubmit={kycForm.handleSubmit(handleKYCSubmit)}
              className="space-y-6"
            >
              <p className="text-xs text-gray-500">
                Submit your company details once your phone number above is
                verified.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      {...kycForm.register("companyName")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
                      placeholder="Business Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSTIN{" "}
                    <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    {...kycForm.register("gstin")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563eb] outline-none transition-all"
                    placeholder="GSTIN Number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registered Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      rows={3}
                      {...kycForm.register("address")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all"
                      placeholder="Full Address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...kycForm.register("pan")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563eb] outline-none transition-all"
                    placeholder="PAN Number"
                  />
                  {kycForm.formState.errors.pan && (
                    <p className="text-xs text-red-500 mt-1">
                      {kycForm.formState.errors.pan.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...kycForm.register("aadhaar")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563eb] outline-none transition-all"
                    placeholder="Aadhaar Number"
                  />
                  {kycForm.formState.errors.aadhaar && (
                    <p className="text-xs text-red-500 mt-1">
                      {kycForm.formState.errors.aadhaar.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={kycSubmitting}
                  className="bg-[#2563eb] text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                  {kycSubmitting ? "Submitting..." : "Submit KYC Details"}
                </button>
              </div>
            </form>
          </div>
        )}

        {user.kycStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
              <Clock size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verification in Progress
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your KYC documents have been submitted and are currently under
              review by our admin team. This process usually takes 24-48 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
