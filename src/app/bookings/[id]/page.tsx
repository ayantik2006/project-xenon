"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Script from "next/script";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params; // hoardingId

  const [user, setUser] = useState<any>(null);
  const [hoarding, setHoarding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  // Check authentication on load - redirect if not authenticated
  useEffect(() => {
    const checkUser = async () => {
      const res = await fetchWithAuth("/api/auth/me");
      if (!res.ok) {
        // Not authenticated, redirect to home
        router.push("/");
        return;
      }

      const data = await res.json();
      const userData = data.user;

      // Check email verification
      if (!userData.emailVerified) {
        alert("Please verify your email first");
        router.push("/profile");
        return;
      }

      // Check KYC status
      if (userData.kycStatus === "not_submitted") {
        alert("Please complete KYC verification from your profile");
        router.push("/profile");
        return;
      }

      if (userData.kycStatus === "pending") {
        alert("Your KYC is under review. Please wait for admin approval");
        router.push("/");
        return;
      }

      if (userData.kycStatus === "rejected") {
        alert("Your KYC was rejected. Please update from your profile");
        router.push("/profile");
        return;
      }

      if (
        userData.kycStatus !== "approved" &&
        userData.kycStatus !== "verified"
      ) {
        alert("KYC verification required to book");
        router.push("/");
        return;
      }

      // All checks passed
      setUser(userData);
      setAuthChecking(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchHoarding = async () => {
      try {
        const res = await fetch(`/api/hoardings/${id}`);
        if (!res.ok) throw new Error("Failed to load details");
        const data = await res.json();
        setHoarding(data.hoarding);
      } catch (err) {
        console.error(err);
        setError("Could not load hoarding details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHoarding();
  }, [id]);

  const handlePayment = async () => {
    if (!startDate || !endDate) {
      setError("Please select dates");
      return;
    }

    // Check if user is logged in
    if (!user) {
      setError("Please go back and login first");
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    // Check email verification
    if (!user.emailVerified) {
      setError("Please verify your email first");
      return;
    }

    // Check KYC status
    if (user.kycStatus === "not_submitted") {
      setError("Please complete KYC verification from your profile");
      setTimeout(() => router.push("/profile"), 2000);
      return;
    }

    if (user.kycStatus === "pending") {
      setError("Your KYC is under review. Please wait for admin approval");
      return;
    }

    if (user.kycStatus === "rejected") {
      setError("Your KYC was rejected. Please update from your profile");
      setTimeout(() => router.push("/profile"), 2000);
      return;
    }

    if (user.kycStatus !== "approved" && user.kycStatus !== "verified") {
      setError("KYC verification required to book");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // 1. Create Order (amount calculated securely on backend)
      const res = await fetchWithAuth("/api/bookings/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hoardingId: id,
          startDate,
          endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }

      // 2. Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "HoardSpace",
        description: `Booking for ${hoarding.name}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/bookings/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              router.push("/bookings/success");
            } else {
              setError("Payment verification failed");
              setProcessing(false);
            }
          } catch (error) {
            setError("Payment verification failed");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the payment modal
            setProcessing(false);
            setError("Payment cancelled");
          },
        },
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2563eb]" size={40} />
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2563eb]" />
      </div>
    );
  if (!hoarding)
    return <div className="p-10 text-center">Hoarding not found</div>;

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Hoarding Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {hoarding.name}
              </h1>
              <div className="flex items-center text-gray-500 mb-4">
                <MapPin size={16} className="mr-1" />
                {hoarding.location.address}, {hoarding.location.city}
              </div>

              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden mb-6">
                {hoarding.images[0] && (
                  <img
                    src={hoarding.images[0]}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-gray-400 uppercase font-bold">
                    Type
                  </span>
                  <p className="font-semibold text-gray-800">{hoarding.type}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase font-bold">
                    Dimensions
                  </span>
                  <p className="font-semibold text-gray-800">
                    {hoarding.dimensions.width}' x {hoarding.dimensions.height}'
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase font-bold">
                    Monthly Price
                  </span>
                  <p className="font-semibold text-gray-800">
                    ₹{hoarding.pricePerMonth.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase font-bold">
                    Min Booking
                  </span>
                  <p className="font-semibold text-gray-800">
                    ₹{hoarding.minimumBookingAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Form */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-blue-100 border border-blue-50 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Book Dates
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 text-sm"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 mb-6">
                <ShieldCheck size={16} className="text-[#2563eb]" />
                <span className="text-xs text-indigo-800 font-medium">
                  Secure Payment by Razorpay
                </span>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                {processing ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "Proceed to Pay"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
