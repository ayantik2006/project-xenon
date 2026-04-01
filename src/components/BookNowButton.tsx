"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { normalizeKycStatus } from "@/lib/kycStatus";

interface BookNowButtonProps {
  hoardingId: string;
  onAuthRequired: () => void;
}

export default function BookNowButton({
  hoardingId,
  onAuthRequired,
}: BookNowButtonProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleBookNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    setChecking(true);
    setError("");

    try {
      // Step 1: Check if user is logged in
      const res = await fetchWithAuth("/api/auth/me");

      // Not logged in - open modal
      if (!res.ok) {
        console.log("User not logged in, opening auth modal");
        onAuthRequired();
        setChecking(false);
        return;
      }

      // Step 2: User is logged in, get user data
      const data = await res.json();
      const user = data.user;
      const normalizedStatus = normalizeKycStatus(user.kycStatus);
      console.log("User logged in:", user);

      if (user.role !== "buyer") {
        setError("Only buyers can book hoardings. Please use a buyer account.");
        setTimeout(() => setError(""), 4000);
        setChecking(false);
        return;
      }

      // Step 3: Check email verification
      if (!user.emailVerified) {
        setError("Please verify your email first");
        setTimeout(() => setError(""), 4000);
        setChecking(false);
        return;
      }

      // Step 4: Check KYC status
      if (normalizedStatus === "not_submitted") {
        setError("Please complete KYC verification from your profile");
        setTimeout(() => router.push("/profile"), 1000);
        setChecking(false);
        return;
      }

      if (normalizedStatus === "submitted") {
        setError("Your KYC is under review. Please wait for admin approval");
        setTimeout(() => setError(""), 3000);
        setChecking(false);
        return;
      }

      if (normalizedStatus === "rejected") {
        setError("Your KYC was rejected. Please update from your profile");
        setTimeout(() => router.push("/profile"), 1000);
        setChecking(false);
        return;
      }

      // Step 5: Only approved/verified users can proceed
      if (normalizedStatus === "approved") {
        console.log("All checks passed, navigating to booking page");
        router.push(`/bookings/${hoardingId}`);
      } else {
        setError("KYC verification required to book");
        setTimeout(() => setError(""), 4000);
        setChecking(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // If there's any error, open auth modal
      onAuthRequired();
      setChecking(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg text-center">
          {error}
        </div>
      )}
      <button
        onClick={handleBookNow}
        disabled={checking}
        className="block w-full text-center bg-gray-50 hover:bg-[#2563eb] hover:text-white text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? "Checking..." : "Book Now"}
      </button>
    </div>
  );
}
