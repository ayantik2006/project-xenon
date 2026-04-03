"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Loader2,
  CheckCircle,
  Clock,
  Info,
  Share2,
  Heart,
  TrendingUp,
  Maximize2,
  Zap,
  MessageSquare,
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
  const { id } = params;

  const [user, setUser] = useState<any>(null);
  const [hoarding, setHoarding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [dateError, setDateError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [wishlistMsg, setWishlistMsg] = useState("");
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const isBuyerKycVerified =
    user?.kycStatus === "approved" || user?.kycStatus === "verified";

  useEffect(() => {
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const bookingId = searchParams.get("bookingId");
    if (start) setStartDate(start);
    if (end) setEndDate(end);
    if (bookingId) setSelectedBookingId(bookingId);
  }, [searchParams]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/hoardings/${id}/availability`);
        if (res.ok) {
          const data = await res.json();
          setBlockedDates(data.blockedRanges || []);
        }
      } catch (err) {
        console.error("Failed to fetch availability", err);
      }
    };
    if (id) fetchAvailability();
  }, [id]);

  const getDayStamp = (dateValue: string | Date) => {
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split("-").map(Number);
      return Date.UTC(year, month - 1, day);
    }

    const parsedDate = new Date(dateValue);
    return Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
    );
  };

  const isDateBlocked = (dateValue: string) => {
    const selectedStamp = getDayStamp(dateValue);

    return blockedDates.some((range) => {
      const blockStart = getDayStamp(range.startDate);
      const blockEnd = getDayStamp(range.endDate);
      return selectedStamp >= blockStart && selectedStamp <= blockEnd;
    });
  };

  const validateDates = (start: string, end: string) => {
    if (!start || !end) return true;
    const s = getDayStamp(start);
    const e = getDayStamp(end);
    
    if (s > e) {
      setDateError("Start date cannot be after end date");
      return false;
    }

    const overlap = blockedDates.find((range) => {
      const bStart = getDayStamp(range.startDate);
      const bEnd = getDayStamp(range.endDate);
      return s <= bEnd && e >= bStart;
    });

    if (overlap) {
      setDateError("Selected dates overlap with an existing booking or block.");
      return false;
    }

    setDateError("");
    return true;
  };

  const handleDateInputChange = (type: "start" | "end", value: string) => {
    if (value && isDateBlocked(value)) {
      setDateError("That date is unavailable because it is already booked or blocked.");
      if (type === "start") {
        setStartDate("");
      } else {
        setEndDate("");
      }
      return;
    }

    const nextStart = type === "start" ? value : startDate;
    const nextEnd = type === "end" ? value : endDate;

    if (nextStart && nextEnd && !validateDates(nextStart, nextEnd)) {
      if (type === "start") {
        setStartDate("");
      } else {
        setEndDate("");
      }
      return;
    }

    setDateError("");
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const res = await fetchWithAuth("/api/auth/me");
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setUser(data.user);
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

  // Pricing Logic
  const calculatePricing = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.max(1, diffDays / 30);

    const basePricePerMonth = hoarding.basePricePerMonth || hoarding.pricePerMonth;
    const commissionPercent = hoarding.pricingConfig?.hoardspaceCommissionPercent || 0;
    const gatewayPercent = hoarding.pricingConfig?.razorpayPercent || 2.5;
    const gstPercent = hoarding.pricingConfig?.gstPercent || 2.5;

    const basePrice = basePricePerMonth * months;
    const commission = basePrice * (commissionPercent / 100);
    const subtotal = basePrice + commission;
    const gatewayCharges = subtotal * (gatewayPercent / 100);
    const gst = subtotal * (gstPercent / 100);
    const gstTax = gst * 0.18;

    const total = subtotal + gatewayCharges + gst + gstTax;

    return {
      base: basePrice,
      durationMonths: months,
      commission,
      commissionPercent,
      gateway: gatewayCharges,
      gatewayPercent,
      gst,
      gstPercent,
      gstTax,
      total: Math.round(total),
    };
  };

  const pricing = calculatePricing();

  const handleBookingAction = async () => {
    if (user?.role !== "buyer") {
      setError("Only buyers can book hoardings.");
      setSuccessMsg("");
      setWishlistMsg("");
      return;
    }

    if (!isBuyerKycVerified) {
      setError(
        selectedBookingId
          ? "Complete and verify your KYC before making payments."
          : "Complete and verify your KYC before booking hoardings.",
      );
      setSuccessMsg("");
      setWishlistMsg("");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select campaign dates");
      return;
    }
    if (!validateDates(startDate, endDate)) {
      setError("Selected dates are unavailable.");
      return;
    }
    setProcessing(true);
    setError("");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      setError("Minimum booking duration is 1 month (30 days).");
      setProcessing(false);
      return;
    }

    try {
      if (!selectedBookingId) {
        const requestRes = await fetchWithAuth("/api/bookings/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hoardingId: id, startDate, endDate }),
        });

        const requestData = await requestRes.json();
        if (!requestRes.ok) throw new Error(requestData.error);

        setSuccessMsg(
          requestData.message || "Booking request sent to vendor.",
        );
        setSelectedBookingId(requestData.bookingId || "");
        setProcessing(false);
        return;
      }

      const res = await fetchWithAuth("/api/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBookingId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "HoardSpace",
        description: `Premium Booking: ${hoarding.name}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/bookings/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) router.push("/bookings/success");
            else setError("Payment verification failed");
          } catch (error) {
            setError("Payment verification failed");
          } finally {
            setProcessing(false);
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

  const addToWishlist = async () => {
    if (user?.role !== "buyer") {
      setWishlistMsg("Only buyers can add hoardings to wishlist.");
      setSuccessMsg("");
      return;
    }

    setError("");
    setSuccessMsg("");
    setWishlistMsg("");
    try {
      const res = await fetchWithAuth("/api/buyer/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoardingId: id }),
      });
      if (res.ok) {
        setSuccessMsg("Added to your wishlist!");
      } else {
        const data = await res.json();
        setWishlistMsg(data.error || "Failed to add to wishlist");
      }
    } catch (error) {
      setWishlistMsg("Failed to add to wishlist");
    }
  };

  const enquireNow = async () => {
    if (user?.role !== "buyer") {
      setEnquiryMsg("Only buyers can enquire about hoardings.");
      setError("");
      setSuccessMsg("");
      return;
    }

    setError("");
    setSuccessMsg("");
    setEnquiryMsg("");
    try {
      const res = await fetchWithAuth("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?._id,
          content: `Inquiry regarding hoarding: ${hoarding.name} (ID: ${hoarding.hoardingCode})`,
          subject: "Hoarding Inquiry",
          type: "query",
        }),
      });
      if (res.ok) {
        setSuccessMsg("Inquiry sent to admin!");
      } else {
        setEnquiryMsg("Failed to send inquiry");
      }
    } catch (error) {
      setEnquiryMsg("Failed to send inquiry");
    }
  };

  if (authChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!hoarding)
    return (
      <div className="p-20 text-center font-bold text-gray-400">
        Hoarding data unavailable
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F9FD] py-12 px-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumbs */}
        <nav className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <span>Home</span> <span className="text-gray-200">/</span>
          <span>{hoarding.location.city}</span>{" "}
          <span className="text-gray-200">/</span>
          <span className="text-blue-600">{hoarding.name}</span>
        </nav>

        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {hoarding.name}
          </h1>
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <MapPin size={18} className="text-blue-600" />
            <span>
              {hoarding.location.address}, {hoarding.location.city},{" "}
              {hoarding.location.state}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content (Images & Details) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Image Gallery */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-blue-100 border border-gray-100 group">
              <div className="aspect-[16/9] relative">
                <img
                  src={hoarding.images[0]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  alt={hoarding.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Property Details Table */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-8">
              <h3 className="text-2xl font-black text-gray-900">
                Property Details
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
                {[
                  {
                    label: "Property Code",
                    value: hoarding.hoardingCode || "RHU-PAT-001",
                  },
                  { label: "Property Type", value: hoarding.type },
                  { label: "Lit Type", value: hoarding.lightingType },
                  {
                    label: "Front Lit",
                    value: hoarding.lightingType === "Front Lit" ? "Yes" : "No",
                  },
                  {
                    label: "Traffic From",
                    value: hoarding.trafficFrom || "Main Road",
                  },
                  {
                    label: "Size (WxH)",
                    value: `${hoarding.dimensions.width} x ${hoarding.dimensions.height} Feet`,
                  },
                  {
                    label: "Square Feet",
                    value: `${
                      hoarding.dimensions.width * hoarding.dimensions.height
                    } sq.ft`,
                  },
                  {
                    label: "Available",
                    value: hoarding.availabilityStatus || "Immediately",
                    color: "text-green-600",
                  },
                  {
                    label: "Structure Type",
                    value: hoarding.structureType || "Hoarding",
                  },
                  {
                    label: "Traffic Data",
                    value: `${
                      hoarding.uniqueReach?.toLocaleString() || "0"
                    } unique reach/week`,
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-bold italic">
                      {item.label}
                    </p>
                    <p
                      className={`font-black text-gray-900 ${item.color || ""}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-2xl font-black text-gray-900">Description</h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                {hoarding.description ||
                  "This premium hoarding space offers maximum visibility at a high-traffic location. Ideal for brands looking to make a massive impact in the city center. Front-lit for high night-time visibility."}
              </p>
            </div>

            {/* Location Map Placeholder */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">
                  Location Map
                </h3>
                <button className="text-blue-600 font-bold text-sm underline flex items-center gap-1">
                  <Maximize2 size={14} /> Open in Maps
                </button>
              </div>
              <div className="aspect-[21/9] bg-blue-50 rounded-[30px] flex items-center justify-center border-2 border-dashed border-blue-200">
                <div className="flex flex-col items-center gap-2 text-blue-400">
                  <MapPin size={40} />
                  <p className="text-sm font-bold">
                    Google Maps Integrated View
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full py-6 text-blue-600 font-black tracking-widest uppercase text-sm border-2 border-blue-600 rounded-[30px] hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-50/50">
              View Similar Media
            </button>
          </div>

          {/* Right Sidebar (Booking & Pricing) */}
          <div className="space-y-8">
            {/* Date Selection Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-blue-100 border border-gray-100 sticky top-10 space-y-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">
                  Select Campaign Dates
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Minimum booking duration: 1 month
                </p>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Campaign Start
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
                      size={18}
                    />
                    <input
                      type="date"
                      className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 font-bold text-gray-700"
                      value={startDate}
                      onChange={(e) =>
                        handleDateInputChange("start", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Campaign End
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
                      size={18}
                    />
                    <input
                      type="date"
                      className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 font-bold text-gray-700"
                      min={startDate}
                      value={endDate}
                      onChange={(e) =>
                        handleDateInputChange("end", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {(dateError || error || successMsg) && (
                <div
                  className={`p-4 text-xs font-bold rounded-2xl border animate-in fade-in slide-in-from-top-2 ${
                    error || dateError
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-green-50 text-green-600 border-green-100"
                  }`}
                >
                  {error || dateError ? `Error: ${error || dateError}` : successMsg}
                </div>
              )}

              {user?.role === "buyer" && !isBuyerKycVerified && (
                <div className="p-4 text-xs font-bold rounded-2xl border bg-amber-50 text-amber-700 border-amber-100">
                  {selectedBookingId
                    ? "Complete and verify your KYC before making payment."
                    : "Complete and verify your KYC before sending a booking request."}
                </div>
              )}

              {blockedDates.length > 0 && (
                <div className="space-y-3 bg-gray-50/50 p-6 rounded-[25px] border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Already Booked Dates</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {blockedDates.map((range, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] p-2 bg-white rounded-xl border border-gray-50 shadow-sm">
                        <span className="font-bold text-gray-600">
                          {new Date(range.startDate).toLocaleDateString()} - {new Date(range.endDate).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-1 bg-red-50 text-red-500 rounded-md">
                          {range.type === 'booking' ? 'Booked' : 'Blocked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleBookingAction}
                disabled={processing || (user?.role === "buyer" && !isBuyerKycVerified)}
                className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-black text-lg shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {processing ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  selectedBookingId ? "Pay Now" : "Send Booking Request"
                )}
              </button>

              {/* Pricing Details Card */}
              <div className="bg-gray-50/50 rounded-[30px] p-8 space-y-6">
                <h4 className="text-sm font-black text-gray-900 uppercase">
                  Pricing Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                      Base Cost / Month
                    </span>
                    <span className="text-gray-900 font-black tracking-tight">
                      ₹{pricing.base.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                      HoardSpace Commission ({pricing.commissionPercent}%)
                    </span>
                    <span className="text-gray-900 font-black tracking-tight">
                      ₹{pricing.commission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium font-bold">
                      Subtotal
                    </span>
                    <span className="text-gray-900 font-black tracking-tight border-b-2 border-gray-200">
                      ₹
                      {(pricing.base + pricing.commission).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-500 font-medium">
                      Razorpay Charges ({pricing.gatewayPercent}%)
                    </span>
                    <span className="text-gray-900 font-black tracking-tight">
                      ₹{pricing.gateway.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                      GST ({pricing.gstPercent}%)
                      <span className="text-red-500 text-[10px] font-bold ml-1">
                        + (18% on {pricing.gstPercent}%)
                      </span>
                    </span>
                    <span className="text-gray-900 font-black tracking-tight">
                      ₹{(pricing.gst + (pricing as any).gstTax).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black text-blue-600">
                        Total Price
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        ₹{pricing.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  {wishlistMsg && (
                    <div className="p-4 text-xs font-bold rounded-2xl border bg-amber-50 text-amber-700 border-amber-100 animate-in fade-in slide-in-from-top-2">
                      {wishlistMsg}
                    </div>
                  )}
                  <button
                    onClick={addToWishlist}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all transition-colors duration-300"
                  >
                    <Heart size={16} /> Add to Wishlist
                  </button>
                  {enquiryMsg && (
                    <div className="p-4 text-xs font-bold rounded-2xl border bg-amber-50 text-amber-700 border-amber-100 animate-in fade-in slide-in-from-top-2">
                      {enquiryMsg}
                    </div>
                  )}
                  <button
                    onClick={enquireNow}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    <MessageSquare size={16} /> Enquire Now
                  </button>
                  <button className="w-full flex items-center justify-center gap-3 py-4 text-gray-400 font-bold text-xs uppercase hover:text-gray-600 transition-colors">
                    <Share2 size={14} /> Share Listing
                  </button>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
