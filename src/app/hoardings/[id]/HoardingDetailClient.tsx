"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronRight, 
  MapPin, 
  Tag, 
  User, 
  Maximize, 
  Zap, 
  Truck, 
  Clock, 
  Calendar,
  Share2,
  Heart,
  MessageSquare,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface HoardingDetailClientProps {
  hoarding: any;
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "12px",
};

export default function HoardingDetailClient({ hoarding }: HoardingDetailClientProps) {
  const [selectedDates, setSelectedDates] = useState({ start: "", end: "", months: "1" });
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [dateError, setDateError] = useState("");
  const [bookRoleMessage, setBookRoleMessage] = useState("");
  const [bookSuccessMessage, setBookSuccessMessage] = useState("");
  const [bookingRequestLoading, setBookingRequestLoading] = useState(false);
  const [wishlistRoleMessage, setWishlistRoleMessage] = useState("");
  const [wishlistSuccessMessage, setWishlistSuccessMessage] = useState("");
  const [enquiryRoleMessage, setEnquiryRoleMessage] = useState("");
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryText, setEnquiryText] = useState("");
  const [enquirySuccessMessage, setEnquirySuccessMessage] = useState("");
  const [sendingEnquiry, setSendingEnquiry] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserKycStatus, setCurrentUserKycStatus] = useState<string | null>(null);
  const browserMapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
  const [mapsLoadFailed, setMapsLoadFailed] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const basePricePerMonth = hoarding.basePricePerMonth || hoarding.pricePerMonth || 0;
  const commissionPercent =
    hoarding.pricingConfig?.hoardspaceCommissionPercent || 0;
  const razorpayPercent = hoarding.pricingConfig?.razorpayPercent || 2.5;
  const gstPercent = hoarding.pricingConfig?.gstPercent || 2.5;
  const start = selectedDates.start ? new Date(selectedDates.start) : null;
  const end = selectedDates.end ? new Date(selectedDates.end) : null;
  const diffDays = start && end ? Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 30;
  const durationMonths = Math.max(1, diffDays / 30);

  const approxMonthlyCost =
    hoarding.pricingBreakdown?.totalPricePerMonth ||
    Math.ceil(
      (basePricePerMonth +
        (basePricePerMonth * commissionPercent) / 100 +
        (basePricePerMonth * razorpayPercent) / 100 +
        (basePricePerMonth * gstPercent) / 100 +
        ((basePricePerMonth * gstPercent) / 100) * 0.18) * durationMonths,
    );
  const isBuyerKycVerified =
    currentUserKycStatus === "approved" || currentUserKycStatus === "verified";

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUserRole(data.user?.role || null);
        setCurrentUserKycStatus(data.user?.kycStatus || null);
      } catch (error) {
        console.error("Failed to load current user", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/hoardings/${hoarding._id}/availability`);
        if (res.ok) {
          const data = await res.json();
          setBlockedDates(data.blockedRanges || []);
        }
      } catch (err) {
        console.error("Failed to fetch availability", err);
      }
    };
    fetchAvailability();
  }, [hoarding._id]);

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

  const handleDateChange = (type: "start" | "end" | "months", value: string) => {
    setDateError("");
    setBookRoleMessage("");

    if (type === "start") {
      const start = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        setDateError("Start date cannot be in the past.");
        return;
      }

      // If months is present, update end date
      const months = parseFloat(selectedDates.months);
      if (months > 0) {
        const end = new Date(start);
        end.setDate(end.getDate() + Math.ceil(months * 30));
        setSelectedDates({ 
          start: value, 
          end: end.toISOString().split('T')[0], 
          months: selectedDates.months 
        });
      } else {
        setSelectedDates((prev) => ({ ...prev, start: value }));
      }
    } else if (type === "months") {
      const monthsStr = value;
      const monthsNum = parseFloat(value);
      
      if (isNaN(monthsNum) || monthsNum <= 0) {
        setSelectedDates(prev => ({ ...prev, months: monthsStr }));
        return;
      }

      if (selectedDates.start) {
        const start = new Date(selectedDates.start);
        const end = new Date(start);
        end.setDate(end.getDate() + Math.ceil(monthsNum * 30));
        setSelectedDates({ 
          ...selectedDates, 
          months: monthsStr, 
          end: end.toISOString().split('T')[0] 
        });
      } else {
        setSelectedDates(prev => ({ ...prev, months: monthsStr }));
      }
    } else if (type === "end") {
      if (!selectedDates.start) {
        setDateError("Please select a start date first.");
        return;
      }

      const start = new Date(selectedDates.start);
      const end = new Date(value);

      if (end <= start) {
        setDateError("End date must be after the start date.");
        return;
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const minMonths = (hoarding as any).minimumBookingMonths || 1;
      const minDays = minMonths * 30;

      if (diffDays < minDays) {
        setDateError(`Minimum booking duration for this hoarding is ${minMonths} month${minMonths > 1 ? 's' : ''}.`);
        setSelectedDates((prev) => ({ ...prev, end: value, months: (diffDays / 30).toFixed(1) }));
        return;
      }

      setSelectedDates((prev) => ({ ...prev, end: value, months: (diffDays / 30).toFixed(1) }));
    }
  };

  const handleBookNow = async () => {
    if (currentUserRole && currentUserRole !== "buyer") {
      setBookSuccessMessage("");
      setBookRoleMessage("Only buyers can book hoardings.");
      return;
    }

    if (currentUserRole === "buyer" && !isBuyerKycVerified) {
      setBookSuccessMessage("");
      setBookRoleMessage("Complete and verify your KYC before booking hoardings.");
      return;
    }

    if (!selectedDates.start || !selectedDates.end) {
      setBookSuccessMessage("");
      setBookRoleMessage("Please select campaign dates.");
      return;
    }

    setBookRoleMessage("");
    setBookSuccessMessage("");
    if (!validateDates(selectedDates.start, selectedDates.end)) return;

    setBookingRequestLoading(true);
    try {
      const res = await fetchWithAuth("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoardingId: hoarding._id,
          startDate: selectedDates.start,
          endDate: selectedDates.end,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setBookRoleMessage("Please log in as a buyer to send a booking request.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to send booking request.");
      }

      setBookSuccessMessage(
        data.message || "Booking request sent to vendor. You can pay after approval.",
      );
    } catch (error: any) {
      setBookRoleMessage(
        error?.message || "Failed to send booking request.",
      );
    } finally {
      setBookingRequestLoading(false);
    }
  };

  const handleAddToWishlist = () => {
    if (currentUserRole && currentUserRole !== "buyer") {
      setWishlistSuccessMessage("");
      setWishlistRoleMessage("Only buyers can add hoardings to wishlist.");
      return;
    }

    const saveToWishlist = async () => {
      setWishlistRoleMessage("");
      setWishlistSuccessMessage("");

      try {
        const res = await fetchWithAuth("/api/buyer/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hoardingId: hoarding._id }),
        });

        const data = await res.json();

        if (res.status === 401) {
          setWishlistRoleMessage("Please log in as a buyer to save this listing.");
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to add listing to wishlist.");
        }

        setWishlistSuccessMessage(
          data.message || "Listing added to your wishlist.",
        );
      } catch (error: any) {
        setWishlistRoleMessage(
          error.message || "Failed to add listing to wishlist.",
        );
      }
    };

    void saveToWishlist();
  };

  const handleEnquireNow = () => {
    if (currentUserRole && currentUserRole !== "buyer") {
      setEnquirySuccessMessage("");
      setEnquiryRoleMessage("Only buyers can enquire about hoardings.");
      return;
    }

    setEnquiryRoleMessage("");
    setEnquirySuccessMessage("");
    setEnquiryText(
      `Hi, I want to enquire about "${hoarding.name}" (${hoarding.hoardingCode || hoarding._id}) in ${hoarding.location.city}.`,
    );
    setIsEnquiryModalOpen(true);
  };

  const handleSendEnquiry = async () => {
    if (!enquiryText.trim()) {
      setEnquiryRoleMessage("Please enter your message for the admin.");
      return;
    }

    setSendingEnquiry(true);
    setEnquiryRoleMessage("");
    setEnquirySuccessMessage("");

    try {
      const res = await fetchWithAuth("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `${enquiryText.trim()}\n\nListing: ${hoarding.name}\nListing ID: ${hoarding._id}\nCity: ${hoarding.location.city}`,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setEnquiryRoleMessage("Please log in as a buyer to send an enquiry.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to send enquiry.");
      }

      setEnquirySuccessMessage("Your enquiry has been sent to the admin.");
      setEnquiryText("");
      setIsEnquiryModalOpen(false);
    } catch (error: any) {
      setEnquiryRoleMessage(error.message || "Failed to send enquiry.");
    } finally {
      setSendingEnquiry(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: hoarding.name,
        text: hoarding.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const propertyDetails = [
    { label: "Property Code", value: hoarding.hoardingCode || "N/A", icon: Tag },
    { label: "Property Type", value: hoarding.type || "Billboard", icon: Maximize },
    { label: "Lit Type", value: hoarding.lightingType || "Non-Lit", icon: Zap },
    { label: "Traffic From", value: hoarding.trafficFrom || "N/A", icon: Truck },
    { label: "Size (W x H)", value: `${hoarding.dimensions?.width || 0} x ${hoarding.dimensions?.height || 0} Feet`, icon: Maximize },
    { label: "Square Feet", value: `${(hoarding.dimensions?.width || 0) * (hoarding.dimensions?.height || 0)} sq ft`, icon: Maximize },
    {
      label: "Traffic Data",
      value: hoarding.uniqueReach
        ? `${hoarding.uniqueReach} unique reach/ week`
        : "N/A",
      icon: User,
    },
    {
      label: "Footfall Data",
      value: hoarding.uniqueFootfall
        ? `${hoarding.uniqueFootfall} unique footfall/ week`
        : "N/A",
      icon: User,
    },
    { label: "Structure Type", value: hoarding.structureType || "Hoarding", icon: Maximize },
    { label: "Available", value: hoarding.availabilityStatus || "Immediately", icon: Clock },
  ];

  const locationCoordinates = hoarding.location.coordinates || {
    lat: 20.2961,
    lng: 85.8245,
  };
  const googleMapsDirectionUrl = `https://www.google.com/maps?q=${locationCoordinates.lat},${locationCoordinates.lng}`;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: browserMapsApiKey
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <Link href={`/explore?city=${hoarding.location.city}`} className="hover:text-[#2563eb] transition-colors uppercase">{hoarding.location.city}</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-[#2563eb] font-medium">{hoarding.name}</span>
      </nav>

      {/* Title and Location Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{hoarding.name}</h1>
        <div className="flex items-center text-gray-500">
          <MapPin className="w-4 h-4 mr-1 text-[#2563eb]" />
          <span>{hoarding.location.address}, {hoarding.location.city}, {hoarding.location.state}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media, Property Details, Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Image & Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-gray-100 shadow-xl border border-white group">
              <Image
                src={hoarding.images?.[activeImageIndex] || 'https://images.unsplash.com/photo-1541535650810-10d26f5c2abb?auto=format&fit=crop&q=80&w=2000'}
                alt={hoarding.name}
                fill
                className="object-cover transition-all duration-700 ease-in-out hover:scale-105"
                priority
              />
              
              {/* Navigation Arrows */}
              {hoarding.images && hoarding.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? hoarding.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === hoarding.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  {/* Image Count Badge */}
                  <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-2xl text-xs font-black uppercase tracking-widest border border-white/20">
                    {activeImageIndex + 1} / {hoarding.images.length} Photos
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails Gallery */}
            {hoarding.images && hoarding.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                {hoarding.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-28 aspect-video rounded-2xl overflow-hidden shrink-0 transition-all border-4 snap-start ${activeImageIndex === idx ? 'border-blue-600 scale-95 shadow-lg shadow-blue-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Details Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-50">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
              {propertyDetails.map((detail, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{detail.label}:</span>
                  <span className="text-sm font-semibold text-gray-800">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-50">Description</h2>
            <p className="text-gray-600 leading-relaxed italic text-[15px]">
              {hoarding.description || "This large format billboard is strategically located on the busy road, facing traffic moving towards major hubs. Excellent visibility near educational institutions and residential areas. Ideal for targeting students, professionals, and local residents. Front-lit for nighttime visibility."}
            </p>
          </div>
        </div>

        {/* Right Column: Actions, Pricing, Map */}
        <div className="space-y-8">
          {/* Campaign Dates Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4">Select Campaign Dates</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start Date</span>
                    <input 
                      type="date"
                      value={selectedDates.start}
                      onChange={(e) => handleDateChange("start", e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    />
                    <Calendar className="absolute right-4 bottom-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative w-24">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Months</span>
                    <input 
                      type="number"
                      min="1"
                      step="0.5"
                      value={selectedDates.months}
                      onChange={(e) => handleDateChange("months", e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-center"
                    />
                  </div>
                </div>
                <div className="relative">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End Date (Calculated)</span>
                  <input 
                    type="date"
                    value={selectedDates.end}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  />
                  <Calendar className="absolute right-4 bottom-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {dateError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
                  {dateError}
                </div>
              )}

              {bookRoleMessage && (
                <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium">
                  {bookRoleMessage}
                </div>
              )}

              {currentUserRole === "buyer" && !isBuyerKycVerified && (
                <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium">
                  Complete and verify your KYC before sending a booking request.
                </div>
              )}

              {bookSuccessMessage && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg font-medium">
                  {bookSuccessMessage}
                </div>
              )}

              {blockedDates.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Already Booked:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-2 custom-scrollbar text-[11px]">
                    {blockedDates.map((range, i) => (
                      <div key={i} className="flex justify-between text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
                        <span>{new Date(range.startDate).toLocaleDateString()} - {new Date(range.endDate).toLocaleDateString()}</span>
                        <span className="text-red-400 font-bold uppercase text-[9px]">{range.type === 'booking' ? 'Booked' : 'Blocked'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleBookNow}
                disabled={
                  bookingRequestLoading ||
                  (currentUserRole === "buyer" && !isBuyerKycVerified) ||
                  !!dateError ||
                  !selectedDates.start ||
                  !selectedDates.end
                }
                className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingRequestLoading ? "Sending Request..." : "Book"}
              </button>
            </div>
          </div>

          {/* Pricing Details Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-4">Pricing Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium tracking-tight">Approx. Total Cost:</span>
                  <span className="text-[10px] text-blue-600 font-black uppercase mt-1">
                    Duration: {durationMonths.toFixed(1)} Months
                  </span>
                </div>
                <div className="text-gray-900 font-black tracking-tight flex flex-col items-end">
                  <span>₹ {Number(approxMonthlyCost).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                    Includes GST 2.5% <span className="text-red-500">+ (18% on 2.5%)</span>
                  </span>
                </div>
              </div>
              
              <div className="pt-2 space-y-3">
                {wishlistRoleMessage && (
                  <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium">
                    {wishlistRoleMessage}
                  </div>
                )}
                {wishlistSuccessMessage && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg font-medium">
                    {wishlistSuccessMessage}
                  </div>
                )}
                <button
                  onClick={handleAddToWishlist}
                  className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Add to Wishlist
                </button>
                {enquiryRoleMessage && (
                  <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium">
                    {enquiryRoleMessage}
                  </div>
                )}
                {enquirySuccessMessage && (
                  <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg font-medium">
                    {enquirySuccessMessage}
                  </div>
                )}
                <button
                  onClick={handleEnquireNow}
                  className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Enquire Now
                </button>
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 py-2 text-sm font-medium hover:text-[#2563eb] transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Location Map Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-md font-bold text-gray-900 mb-4">Location Map</h3>
            <div className="relative">
              {!browserMapsApiKey || mapsLoadFailed || loadError ? (
                <div className="w-full h-[300px] bg-gray-50 rounded-xl flex flex-col items-center justify-center text-center p-6">
                  <MapPin className="w-6 h-6 text-[#2563eb] mb-3" />
                  <p className="text-sm font-semibold text-gray-800">
                    Interactive map unavailable
                  </p>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs">
                    {(mapsLoadFailed || loadError) ? "Failed to load Google Maps script." : "Add a valid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable the embedded map for this listing."}
                  </p>
                  <a
                    href={googleMapsDirectionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 text-sm font-semibold text-[#2563eb] hover:underline"
                  >
                    Open location in Google Maps
                  </a>
                </div>
              ) : !isLoaded ? (
                <div className="w-full h-[300px] bg-gray-50 rounded-xl flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={locationCoordinates}
                  zoom={15}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                  }}
                >
                  {hoarding.location.coordinates && (
                    <Marker position={hoarding.location.coordinates} />
                  )}
                </GoogleMap>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/explore" className="text-blue-600 text-sm font-bold hover:underline uppercase tracking-wider">
              View Similar Media
            </Link>
          </div>
        </div>
      </div>

      {isEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Enquire About This Listing
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Send a message to admin about{" "}
                  <span className="font-semibold text-gray-800">
                    {hoarding.name}
                  </span>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(false)}
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            <textarea
              value={enquiryText}
              onChange={(e) => setEnquiryText(e.target.value)}
              rows={6}
              placeholder="Write your question about this listing..."
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#2563eb]"
            />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSendEnquiry}
                disabled={sendingEnquiry}
                className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingEnquiry ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
