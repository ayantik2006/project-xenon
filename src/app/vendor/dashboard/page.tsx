"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import "@fontsource/chiron-goround-tc";
import MapLocationPicker from "@/components/MapLocationPicker";
import { getLocationFromPincode, isValidIndianPincode } from "@/lib/googleMaps";
import {
  LayoutDashboard,
  Box,
  BadgeCheck,
  MessageSquare,
  PlusCircle,
  MapPin,
  IndianRupee,
  Image as ImageIcon,
  Loader2,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
  ChevronRight,
  Send,
  User,
  ExternalLink,
  Filter,
  MoreVertical,
  XCircle,
  X,
  Bell,
  CalendarDays,
} from "lucide-react";

interface Hoarding {
  _id: string;
  name: string;
  hoardingCode?: string;
  trafficFrom?: string;
  uniqueReach?: number;
  uniqueFootfall?: number;
  location: {
    address: string;
    city: string;
  };
  pricePerMonth: number;
  status: string;
  images: string[];
}

interface Booking {
  _id: string;
  hoarding: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
    };
    pricePerMonth: number;
  } | null;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "requested" | "approved" | "rejected" | "confirmed" | "cancelled";
  paymentId?: string;
  orderId?: string;
  paidAt?: string;
  createdAt: string;
}

type BlockedRange = {
  startDate: string;
  endDate: string;
  type: "booking" | "manual";
  reason?: string;
};

const CITY_OPTIONS = [
  "Bhubaneswar",
  "Cuttack",
  "Rourkela",
];

export default function VendorDashboard() {
  const router = useRouter();
  const [hoardings, setHoardings] = useState<Hoarding[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "listings" | "sold" | "chat">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<{ status: number; text: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; hoardingId: string | null; hoardingName: string }>({ 
    isOpen: false, hoardingId: null, hoardingName: "" 
  });
  const [deleting, setDeleting] = useState(false);
  const [availabilityModal, setAvailabilityModal] = useState<{
    isOpen: boolean;
    hoardingId: string | null;
    hoardingName: string;
    startDate: string;
    endDate: string;
    reason: string;
    blockedRanges: BlockedRange[];
    loading: boolean;
    saving: boolean;
    error: string;
  }>({
    isOpen: false,
    hoardingId: null,
    hoardingName: "",
    startDate: "",
    endDate: "",
    reason: "",
    blockedRanges: [],
    loading: false,
    saving: false,
    error: "",
  });
  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHoarding, setNewHoarding] = useState<any>({
    name: "",
    description: "",
    address: "",
    city: "",
    area: "",
    state: "",
    zipCode: "",
    latitude: 0,
    longitude: 0,
    width: 0,
    height: 0,
    type: "Billboard",
    lightingType: "Lit",
    pricePerMonth: 0,
    minimumBookingMonths: 1,
    hoardingCode: "",
    trafficFrom: "",
    uniqueReach: 0,
    uniqueFootfall: 0,
    images: [""]
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dailyReminderRead, setDailyReminderRead] = useState(false);
  const [showCalendarReminderPopup, setShowCalendarReminderPopup] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const canAddHoarding =
    userData?.kycStatus === "approved" || userData?.kycStatus === "verified";

  const getMessageParty = (
    party?: string | { _id: string; role?: string; name?: string } | null,
  ) => (typeof party === "string" ? { _id: party } : party);
  const currentUserId = userData?._id || userData?.id;
  const todayReminderKey =
    currentUserId
      ? `vendor-calendar-reminder-read-${currentUserId}-${new Date().toLocaleDateString("en-CA")}`
      : null;
  const todayReminderPopupKey =
    currentUserId
      ? `vendor-calendar-reminder-popup-${currentUserId}-${new Date().toLocaleDateString("en-CA")}`
      : null;

  const notifications = messages
    .filter((msg) => {
      const sender = getMessageParty(msg.sender);
      const receiver = getMessageParty(msg.receiver);
      return (
        sender?.role === "admin" &&
        receiver?._id === currentUserId &&
        msg.status !== "archived"
      );
    })
    .slice()
    .reverse()
    .map((msg) => ({
      id: msg._id,
      text: msg.content,
      isRead: msg.status === "read",
      timestamp: msg.createdAt
        ? new Date(msg.createdAt).toLocaleString()
        : "Just now",
      isReminder: false,
    }));

  const combinedNotifications = [
    ...(currentUserId && hoardings.length > 0
      ? [
          {
            id: todayReminderKey || "daily-calendar-reminder",
            text:
              "Daily reminder: if you close any hoarding offline, update its calendar here so buyers cannot book those dates online.",
            isRead: dailyReminderRead,
            timestamp: "Today",
            isReminder: true,
          },
        ]
      : []),
    ...notifications,
  ];

  const unreadCount = combinedNotifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      if (todayReminderKey && id === todayReminderKey) {
        localStorage.setItem(todayReminderKey, "read");
        setDailyReminderRead(true);
        return;
      }

      const res = await fetchWithAuth("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: [id] }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === id ? { ...msg, status: "read" } : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (todayReminderKey) {
        localStorage.setItem(todayReminderKey, "read");
        setDailyReminderRead(true);
      }

      const res = await fetchWithAuth("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllFromAdmin: true }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => {
            const sender = getMessageParty(msg.sender);
            return sender?.role === "admin"
              ? { ...msg, status: "read" }
              : msg;
          }),
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  useEffect(() => {
    if (!todayReminderKey) return;
    setDailyReminderRead(localStorage.getItem(todayReminderKey) === "read");
  }, [todayReminderKey]);

  useEffect(() => {
    if (!todayReminderPopupKey || !currentUserId || hoardings.length === 0) return;

    const popupAlreadyShown = localStorage.getItem(todayReminderPopupKey) === "shown";
    if (!popupAlreadyShown) {
      setShowCalendarReminderPopup(true);
      localStorage.setItem(todayReminderPopupKey, "shown");
    }
  }, [todayReminderPopupKey, currentUserId, hoardings.length]);

  const handleOpenCalendarReminder = () => {
    setShowCalendarReminderPopup(false);
    setShowNotifications(false);
    setActiveTab("listings");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (data.user.role !== "vendor") {
          router.push("/");
          return;
        }
        setUserData(data.user);
        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check failed", error);
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  // Fetch data
  useEffect(() => {
    if (!authChecked) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, bRes] = await Promise.all([
          fetchWithAuth("/api/hoardings?view=vendor"),
          fetchWithAuth("/api/vendor/bookings")
        ]);

        if (hRes.ok) {
          const data = await hRes.json();
          setHoardings(data.hoardings || []);
        }
        
        if (bRes.ok) {
          const data = await bRes.json();
          setBookings(data.bookings || []);
        }
      } catch (error: any) {
        console.error("Failed to load dashboard data", error);
        setErrorObj({ status: 500, text: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Polling for real-time updates (messages, etc.)
    const pollInterval = setInterval(() => {
      fetchMessages();
      // Optional: fetch other dynamic data
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [authChecked]);

  const fetchMessages = async () => {
    console.log("[VendorDashboard] Fetching messages...");
    try {
      const res = await fetchWithAuth("/api/messages");
      console.log("[VendorDashboard] Fetch Status:", res.status);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        const status = res.status;
        const err = await res.json().catch(() => ({}));
        console.error(`[VendorDashboard] Fetch messages failed (${status}):`, err);
      }
    } catch (error) {
      console.error("[VendorDashboard] Error fetching messages:", error);
    }
  };

  useEffect(() => {
    console.log("[VendorDashboard] Messages state updated:", messages.length);
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || chatLoading) return;
    setChatLoading(true);
    console.log("[VendorDashboard] Sending message to admin:", content);
    try {
      const res = await fetchWithAuth("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      console.log("[VendorDashboard] Send Status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[VendorDashboard] Message sent successfully:", data.data);
        setMessages(prev => [...prev, data.data]);
        return true;
      } else {
        const status = res.status;
        const err = await res.json().catch(() => ({}));
        console.error(`[VendorDashboard] Post failed (${status}):`, err);
      }
    } catch (error) {
      console.error("[VendorDashboard] Error sending message:", error);
    } finally {
      setChatLoading(false);
    }
    return false;
  };

  const updateBookingRequestStatus = async (
    bookingId: string,
    status: "requested" | "approved" | "rejected",
  ) => {
    setBookingActionId(bookingId);
    try {
      const res = await fetchWithAuth(`/api/vendor/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update booking request");
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId ? { ...booking, status } : booking,
        ),
      );
    } catch (error) {
      console.error("Failed to update booking status", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update booking request",
      );
    } finally {
      setBookingActionId(null);
    }
  };

  const handlePincodeChangeModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value;
    setNewHoarding({ ...newHoarding, zipCode: pin });
    if (isValidIndianPincode(pin)) {
      setPincodeLoading(true);
      try {
        const loc = await getLocationFromPincode(pin);
        setNewHoarding((prev: any) => ({
          ...prev,
          city: loc.city || prev.city,
          state: loc.state || prev.state,
          area: loc.area || prev.area,
          latitude: loc.lat || prev.latitude,
          longitude: loc.lng || prev.longitude
        }));
      } catch (err) {
        console.error("Pincode error", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleMapLocationSelectModal = (location: any) => {
    setNewHoarding((prev: any) => ({
      ...prev,
      address: location.address || prev.address,
      city: location.city || prev.city,
      state: location.state || prev.state,
      zipCode: location.zipCode || prev.zipCode,
      area: location.area || prev.area,
      latitude: location.lat,
      longitude: location.lng
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const updated = [...newHoarding.images];
        updated[index] = data.url;
        setNewHoarding({ ...newHoarding, images: updated });
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateHoarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out empty image URLs
      const cleanedHoarding = {
        ...newHoarding,
        images: newHoarding.images.filter((url: string) => url.trim() !== ""),
        width: Number(newHoarding.width),
        height: Number(newHoarding.height),
        pricePerMonth: Number(newHoarding.pricePerMonth),
        uniqueReach: Number(newHoarding.uniqueReach) || 0,
        uniqueFootfall: Number(newHoarding.uniqueFootfall) || 0,
      };

      if (!cleanedHoarding.pricePerMonth || cleanedHoarding.pricePerMonth < 1) {
        alert("Price per month is required.");
        return;
      }

      if (
        typeof cleanedHoarding.latitude !== "number" ||
        typeof cleanedHoarding.longitude !== "number" ||
        Number.isNaN(cleanedHoarding.latitude) ||
        Number.isNaN(cleanedHoarding.longitude) ||
        (cleanedHoarding.latitude === 0 && cleanedHoarding.longitude === 0)
      ) {
        alert("Please pin the listing on the map.");
        return;
      }

      const res = await fetchWithAuth("/api/hoardings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedHoarding),
      });

      if (res.ok) {
        const data = await res.json();
        setHoardings(prev => [data.hoarding, ...prev]);
        setIsAddModalOpen(false);
        setNewHoarding({
          name: "",
          description: "",
          address: "",
          city: "",
          area: "",
          state: "",
          zipCode: "",
          latitude: 0,
          longitude: 0,
          width: 0,
          height: 0,
          type: "Billboard",
          lightingType: "Lit",
          pricePerMonth: 0,
          hoardingCode: "",
          trafficFrom: "",
          uniqueReach: 0,
          uniqueFootfall: 0,
          images: [""]
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create hoarding");
      }
    } catch (error) {
      console.error("Create failed", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.hoardingId) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/hoardings/${deleteModal.hoardingId}`, { method: "DELETE" });
      if (res.ok) {
        setHoardings(prev => prev.filter(h => h._id !== deleteModal.hoardingId));
        setDeleteModal({ isOpen: false, hoardingId: null, hoardingName: "" });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete hoarding");
      }
    } catch (error) {
      alert("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const openAddHoardingModal = () => {
    if (!canAddHoarding) return;
    setIsAddModalOpen(true);
  };

  const openAvailabilityModal = async (hoarding: Hoarding) => {
    setAvailabilityModal({
      isOpen: true,
      hoardingId: hoarding._id,
      hoardingName: hoarding.name,
      startDate: "",
      endDate: "",
      reason: "",
      blockedRanges: [],
      loading: true,
      saving: false,
      error: "",
    });

    try {
      const res = await fetchWithAuth(`/api/hoardings/${hoarding._id}/availability`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load availability");
      }

      setAvailabilityModal((prev) => ({
        ...prev,
        blockedRanges: data.blockedRanges || [],
        loading: false,
      }));
    } catch (error: any) {
      setAvailabilityModal((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load availability",
      }));
    }
  };

  const closeAvailabilityModal = () => {
    setAvailabilityModal({
      isOpen: false,
      hoardingId: null,
      hoardingName: "",
      startDate: "",
      endDate: "",
      reason: "",
      blockedRanges: [],
      loading: false,
      saving: false,
      error: "",
    });
  };

  const handleBlockDates = async () => {
    if (!availabilityModal.hoardingId) return;
    if (!availabilityModal.startDate || !availabilityModal.endDate) {
      setAvailabilityModal((prev) => ({
        ...prev,
        error: "Please select both start and end dates.",
      }));
      return;
    }

    setAvailabilityModal((prev) => ({ ...prev, saving: true, error: "" }));

    try {
      const res = await fetchWithAuth(
        `/api/hoardings/${availabilityModal.hoardingId}/availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: availabilityModal.startDate,
            endDate: availabilityModal.endDate,
            reason: availabilityModal.reason,
          }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to block dates");
      }

      setAvailabilityModal((prev) => ({
        ...prev,
        startDate: "",
        endDate: "",
        reason: "",
        saving: false,
        blockedRanges: [...prev.blockedRanges, data.blockedRange],
      }));
    } catch (error: any) {
      setAvailabilityModal((prev) => ({
        ...prev,
        saving: false,
        error: error.message || "Failed to block dates",
      }));
    }
  };

  const handleRemoveBlockedRange = async (range: BlockedRange) => {
    if (!availabilityModal.hoardingId) return;

    setAvailabilityModal((prev) => ({ ...prev, saving: true, error: "" }));

    try {
      const res = await fetchWithAuth(
        `/api/hoardings/${availabilityModal.hoardingId}/availability`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: range.startDate,
            endDate: range.endDate,
          }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove blocked dates");
      }

      setAvailabilityModal((prev) => ({
        ...prev,
        saving: false,
        blockedRanges: prev.blockedRanges.filter(
          (item) =>
            !(
              item.type === "manual" &&
              item.startDate === range.startDate &&
              item.endDate === range.endDate
            ),
        ),
      }));
    } catch (error: any) {
      setAvailabilityModal((prev) => ({
        ...prev,
        saving: false,
        error: error.message || "Failed to remove blocked dates",
      }));
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredHoardings = hoardings.filter((hoarding) => {
    if (!normalizedSearchQuery) return true;

    return [
      hoarding.name,
      hoarding.location.address,
      hoarding.location.city,
      hoarding.status,
      String(hoarding.pricePerMonth ?? ""),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchQuery);
  });

  const filteredBookings = bookings.filter((booking) => {
    if (!normalizedSearchQuery) return true;

    return [
      booking.orderId,
      booking.paymentId ?? "",
      booking.status,
      booking.user?.name ?? "",
      booking.user?.email ?? "",
      booking.user?.phone ?? "",
      booking.hoarding?.name ?? "",
      booking.hoarding?.location.city ?? "",
      booking.hoarding?.location.address ?? "",
      String(booking.totalAmount ?? ""),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchQuery);
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium animate-pulse">Initializing Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden" style={{ fontFamily: "'Chiron GoRound TC', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 items-center pt-4 pb-8 px-4 hidden lg:flex lg:flex-col">
        <div className="mb-2 w-full px-2"></div>

        <nav className="w-full flex-1 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <NavItem 
            icon={<Box size={20} />} 
            label="My Hoardings" 
            active={activeTab === "listings"} 
            onClick={() => setActiveTab("listings")} 
          />
          <NavItem 
            icon={<BadgeCheck size={20} />} 
            label="Sold/Booked" 
            active={activeTab === "sold"} 
            onClick={() => setActiveTab("sold")} 
          />
        </nav>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings, locations, orders..." 
                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-blue-500 rounded-none text-sm focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 font-bold placeholder-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openAddHoardingModal}
              disabled={!canAddHoarding}
              title={
                canAddHoarding
                  ? "Add a new hoarding"
                  : "KYC verification is required to add a hoarding"
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              <PlusCircle size={16} />
              Add Hoarding
            </button>
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-xl relative transition-all ${showNotifications ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400 hover:text-blue-500'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 animate-in fade-in zoom-in-95 duration-200 z-50 overflow-hidden">
                  <div className="px-5 mb-3 flex items-center justify-between">
                    <h4 className="font-black text-gray-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {combinedNotifications.length > 0 ? (
                      combinedNotifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            if (notif.isReminder) {
                              handleOpenCalendarReminder();
                            }
                          }}
                          className={`group relative cursor-pointer border-l-4 px-5 py-4 transition-all duration-300 hover:bg-gray-50 ${notif.isRead ? 'border-transparent opacity-60' : 'border-blue-500 bg-blue-50/5'}`}
                        >
                          <p className={`text-xs font-bold leading-tight ${notif.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                            {notif.text}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{notif.timestamp}</p>
                          {!notif.isRead && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(notif.id);
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-10 text-center">
                        <Bell className="mx-auto w-8 h-8 text-gray-200 mb-3" />
                        <p className="text-xs font-bold text-gray-400">You have no new messages.</p>
                      </div>
                    )}
                  </div>
                    {combinedNotifications.length > 0 && unreadCount > 0 && (
                    <div className="mt-2 px-5 pt-3 border-t border-gray-50">
                      <button 
                        onClick={markAllAsRead}
                        className="w-full text-[10px] font-black uppercase text-gray-400 hover:text-blue-500 transition-colors text-center"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link href="/profile" className="flex items-center gap-4 pl-6 border-l border-gray-100 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{userData?.name || "Vendor"}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Verified Vendor
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl p-[2px] transition-transform group-hover:scale-105 overflow-hidden">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
                  <div className="w-full h-full bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black overflow-hidden">
                    {userData?.image ? (
                      <img src={userData.image} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-8 pb-12 max-w-7xl mx-auto">
          {activeTab === "dashboard" && <Overview bookings={filteredBookings} hoardings={filteredHoardings} setActiveTab={setActiveTab} />}
          {activeTab === "listings" && (
            <Listings
              hoardings={filteredHoardings}
              setHoardings={setHoardings}
              setDeleteModal={setDeleteModal}
              openAvailabilityModal={openAvailabilityModal}
            />
          )}
          {activeTab === "sold" && (
            <BookingRequests
              bookings={filteredBookings}
              bookingActionId={bookingActionId}
              onUpdateStatus={updateBookingRequestStatus}
            />
          )}
          {activeTab === "chat" && <ChatBox messages={messages} onSend={handleSendMessage} userData={userData} loading={chatLoading} />}
        </div>
      </main>

      {/* Add Hoarding Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-10 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-3xl font-black text-gray-900 mb-2">New Listing</h3>
                 <p className="text-gray-500 font-medium">Fill in the details for your new media property.</p>
               </div>
               <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                 <XCircle size={24} />
               </button>
             </div>

             <form onSubmit={handleCreateHoarding} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Property Name</label>
                     <input 
                      required
                      type="text" 
                      placeholder="e.g. Billboard kiit square patia"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                      value={newHoarding.name}
                      onChange={(e) => setNewHoarding({...newHoarding, name: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Board Type</label>
                     <select 
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700 appearance-none"
                      value={newHoarding.type}
                      onChange={(e) => setNewHoarding({...newHoarding, type: e.target.value})}
                     >
                       <option>Billboard</option>
                       <option>Unipole</option>
                       <option>Gantry</option>
                       <option>Bus Shelter</option>
                       <option>Kiosk</option>
                       <option>Other</option>
                     </select>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
                  <textarea 
                    placeholder="Describe visibility, traffic, and surroundings..."
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700 h-32 resize-none"
                    value={newHoarding.description}
                    onChange={(e) => setNewHoarding({...newHoarding, description: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location Details</label>
                    <button 
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-[10px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1"
                    >
                      <MapPin size={12} /> {showMap ? "Hide Map" : "Pin on Map *"}
                    </button>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 px-1">
                    Price and map pin are required before submitting.
                  </p>

                  {showMap && (
                    <div className="border border-gray-100 rounded-3xl overflow-hidden mb-4">
                      <MapLocationPicker onLocationSelect={handleMapLocationSelectModal} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2 lg:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Address</label>
                       <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                        value={newHoarding.address}
                        onChange={(e) => setNewHoarding({...newHoarding, address: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Zip Code</label>
                       <div className="relative">
                         <input 
                          required
                          type="text" 
                          placeholder="6-Digit PIN"
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                          value={newHoarding.zipCode}
                          onChange={handlePincodeChangeModal}
                         />
                         {pincodeLoading && <Loader2 className="absolute right-4 top-4 animate-spin text-blue-600" size={16} />}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">City</label>
                       <select
                        required
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                        value={newHoarding.city}
                        onChange={(e) => {
                          const selectedCity = e.target.value;
                          setNewHoarding({
                            ...newHoarding,
                            city: selectedCity,
                            state:
                              CITY_OPTIONS.includes(selectedCity) &&
                              !newHoarding.state.trim()
                                ? "Odisha"
                                : newHoarding.state,
                          });
                        }}
                       >
                         <option value="" disabled>
                           Select city
                         </option>
                         {CITY_OPTIONS.map((city) => (
                           <option key={city} value={city}>
                             {city}, Odisha
                           </option>
                         ))}
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Area</label>
                       <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                        value={newHoarding.area}
                        onChange={(e) => setNewHoarding({...newHoarding, area: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">State</label>
                       <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                        value={newHoarding.state}
                        onChange={(e) => setNewHoarding({...newHoarding, state: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block">Width (ft)</label>
                      <input 
                       required
                       type="number" 
                       className="w-24 md:w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700 text-center"
                       value={newHoarding.width}
                       onChange={(e) => setNewHoarding({...newHoarding, width: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block">Height (ft)</label>
                      <input 
                       required
                       type="number" 
                       className="w-24 md:w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700 text-center"
                       value={newHoarding.height}
                       onChange={(e) => setNewHoarding({...newHoarding, height: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Lighting</label>
                     <div className="flex gap-2">
                        {["Lit", "Non-Lit", "Front Lit", "Back Lit"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewHoarding({...newHoarding, lightingType: type})}
                            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all border ${
                              newHoarding.lightingType === type 
                                ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                     </div>
                   </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Price / Month</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                          <input 
                            required
                            type="number" 
                            min="1"
                            className="w-full pl-10 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                            value={newHoarding.pricePerMonth}
                            onChange={(e) => setNewHoarding({...newHoarding, pricePerMonth: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Minimum Booking Period (Months)</label>
                        <select 
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700 appearance-none"
                          value={newHoarding.minimumBookingMonths || 1}
                          onChange={(e) => setNewHoarding({...newHoarding, minimumBookingMonths: Number(e.target.value)})}
                        >
                          {[1, 2, 3, 6, 12].map(m => (
                            <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                        <p className="text-[10px] font-bold text-blue-500 mt-1 px-1">Default is 1 month if not selected.</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Property Code
                    </label>
                    <input
                      type="text"
                      placeholder="Optional code"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                      value={newHoarding.hoardingCode}
                      onChange={(e) =>
                        setNewHoarding({
                          ...newHoarding,
                          hoardingCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Traffic From
                    </label>
                    <input
                      type="text"
                      placeholder="Main road, market, highway..."
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                      value={newHoarding.trafficFrom}
                      onChange={(e) =>
                        setNewHoarding({
                          ...newHoarding,
                          trafficFrom: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Unique Traffic / Week
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Optional"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                      value={newHoarding.uniqueReach}
                      onChange={(e) =>
                        setNewHoarding({
                          ...newHoarding,
                          uniqueReach: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Unique Footfall / Week
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Optional"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                      value={newHoarding.uniqueFootfall}
                      onChange={(e) =>
                        setNewHoarding({
                          ...newHoarding,
                          uniqueFootfall: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block">Property Images (Upload)</label>
                  {newHoarding.images.map((url: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      {url ? (
                        <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-100 h-16 flex items-center justify-center">
                           <img src={url} className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                             <a href={url} target="_blank" className="text-white text-xs font-bold">View</a>
                           </div>
                        </div>
                      ) : (
                        <div className="flex-1 relative px-5 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-600 outline-none flex items-center justify-center min-h-[64px] hover:bg-gray-100 transition-colors">
                          {uploading ? (
                            <Loader2 className="animate-spin text-blue-600" size={20} />
                          ) : (
                            <>
                              <span className="text-sm font-bold text-gray-700">Click to Upload to Cloudinary</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </>
                          )}
                        </div>
                      )}
                      {index === newHoarding.images.length - 1 ? (
                        <button 
                          type="button"
                          onClick={() => setNewHoarding({...newHoarding, images: [...newHoarding.images, ""]})}
                          className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors self-start"
                        >
                          <PlusCircle size={24} />
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = newHoarding.images.filter((_: any, i: number) => i !== index);
                            setNewHoarding({...newHoarding, images: updated});
                          }}
                          className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors self-start"
                        >
                          <Trash2 size={24} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-blue-400"
                   >
                     {loading ? <Loader2 className="animate-spin" size={20} /> : <BadgeCheck size={20} />}
                     List My Property
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {availabilityModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Block Listing Dates
                </h3>
                <p className="text-gray-500 mt-1">
                  Manage unavailable dates for{" "}
                  <span className="font-bold text-gray-800">
                    {availabilityModal.hoardingName}
                  </span>
                </p>
              </div>
              <button
                onClick={closeAvailabilityModal}
                className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={availabilityModal.startDate}
                  onChange={(e) =>
                    setAvailabilityModal((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  min={availabilityModal.startDate || undefined}
                  value={availabilityModal.endDate}
                  onChange={(e) =>
                    setAvailabilityModal((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <input
                type="text"
                placeholder="Optional reason for blocking"
                value={availabilityModal.reason}
                onChange={(e) =>
                  setAvailabilityModal((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {availabilityModal.error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {availabilityModal.error}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleBlockDates}
                disabled={availabilityModal.loading || availabilityModal.saving}
                className="px-5 py-3 rounded-xl bg-[#2563eb] text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {availabilityModal.saving ? "Saving..." : "Block Dates"}
              </button>
            </div>

            <div className="mt-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                Existing Unavailable Dates
              </h4>
              <div className="space-y-3">
                {availabilityModal.loading ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-500 flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin" />
                    Loading availability...
                  </div>
                ) : availabilityModal.blockedRanges.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-400">
                    No blocked or booked dates yet
                  </div>
                ) : (
                  availabilityModal.blockedRanges.map((range) => (
                    <div
                      key={`${range.type}-${range.startDate}-${range.endDate}`}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(range.startDate).toLocaleDateString()} -{" "}
                          {new Date(range.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {range.type === "booking"
                            ? "Booked by a buyer"
                            : range.reason || "Blocked by vendor"}
                        </p>
                      </div>
                      {range.type === "manual" ? (
                        <button
                          onClick={() => handleRemoveBlockedRange(range)}
                          disabled={availabilityModal.saving}
                          className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-gray-500">
                          Locked
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCalendarReminderPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <CalendarDays size={22} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Daily Calendar Reminder
                </h3>
                <p className="text-gray-500 mt-2">
                  If any hoarding gets booked offline, please update its calendar here so buyers cannot book those dates from the website.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm font-medium text-amber-800">
              Open your listing calendars every day and block offline-booked dates to keep your online availability accurate.
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowCalendarReminderPopup(false)}
                className="flex-1 py-4 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleOpenCalendarReminder}
                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                Open Listing Calendars
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Delete Listing</h3>
            <p className="text-gray-500 text-center mb-8 px-4">
              Are you sure you want to remove <span className="font-bold text-gray-800">&quot;{deleteModal.hoardingName}&quot;</span>? This action is permanent.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, hoardingId: null, hoardingName: "" })}
                className="flex-1 py-4 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function NavItem({ icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm group ${
        active 
          ? "bg-blue-50 text-blue-600 shadow-sm" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      <span className={`transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function MetricCard({ title, value, subtext, type = "default" }: { title: string; value: string; subtext?: string; type?: string }) {
  const isRevenue = type === "revenue";
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      </div>
      {subtext && (
        <p className={`text-[11px] mt-2 font-bold ${subtext.startsWith("+") ? "text-green-500" : subtext.startsWith("-") ? "text-red-500" : "text-gray-400"}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}

function Overview({ bookings, hoardings, setActiveTab }: { bookings: Booking[]; hoardings: Hoarding[]; setActiveTab: (t: any) => void }) {
  const currentYear = new Date().getFullYear();
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "requested" || booking.status === "approved",
  );
  const approvedListings = hoardings.filter((hoarding) => hoarding.status === "approved").length;
  const pendingListings = hoardings.filter((hoarding) => hoarding.status === "pending").length;
  const revenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue = Array.from({ length: 12 }, (_, monthIndex) =>
    confirmedBookings
      .filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.getFullYear() === currentYear && bookingDate.getMonth() === monthIndex;
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0),
  );
  const maxRevenue = Math.max(...monthlyRevenue, 1);
  const chartPoints = monthlyRevenue.map((value, index) => {
    const x = 50 + index * (700 / 11);
    const y = 170 - (value / maxRevenue) * 120;
    return { x, y };
  });
  const chartLine = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const chartArea = `${chartLine} L ${chartPoints[chartPoints.length - 1]?.x ?? 750} 200 L ${chartPoints[0]?.x ?? 50} 200 Z`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Removed Welcome Section */}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Revenue" value={`₹${revenue.toLocaleString()}`} subtext={`${confirmedBookings.length} confirmed bookings`} type="revenue" />
        <MetricCard title="Active Listings" value={approvedListings.toString()} subtext={pendingListings > 0 ? `${pendingListings} pending approval` : "No listings pending approval"} />
        <MetricCard title="Confirmed Bookings" value={confirmedBookings.length.toString()} subtext={pendingBookings.length > 0 ? `${pendingBookings.length} pending requests` : "No pending requests"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metric Comparison Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Metrics Comparison</h3>
              <p className="text-xs text-gray-400 font-medium">Confirmed revenue by month ({currentYear})</p>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-[11px] font-bold text-gray-500">
              Total ₹{revenue.toLocaleString()}
            </div>
          </div>
          
          {/* SVG Line Chart (Simple Mockup) */}
          <div className="h-64 w-full mt-10 relative group">
             <svg viewBox="0 0 800 200" className="w-full h-full">
               <path 
                d={chartLine}
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="4"
                strokeLinecap="round"
                className="drop-shadow-lg"
               />
               <path 
                d={chartArea}
                fill="url(#gradient)" 
                opacity="0.1"
               />
               <defs>
                 <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="#2563eb" />
                   <stop offset="100%" stopColor="transparent" />
                 </linearGradient>
               </defs>
               {chartPoints.map((point, index) => (
                 <circle key={monthLabels[index]} cx={point.x} cy={point.y} r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
               ))}
              </svg>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 text-[10px] font-bold text-gray-400 mt-4">
                {monthLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{bookings.length} BOOKINGS</span>
          </div>
          
          <div className="space-y-2 mb-8">
            <button 
              onClick={() => {
                const event = new CustomEvent("hoardspace-open-support-chat");
                window.dispatchEvent(event);
              }} 
              className="w-full py-3 bg-white text-gray-700 border border-gray-100 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
            >
              Open Support Chat
            </button>
          </div>

          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent Bookings</h4>
          <div className="space-y-4">
            {recentBookings.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {b.user?.name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{b.user?.name || "Client"}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{b.hoarding?.location.city || "Various"}</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-400">
                No bookings yet
              </div>
            )}
            <button 
              onClick={() => setActiveTab("sold")}
              className="w-full py-2.5 text-center text-[11px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest mt-2"
            >
              View all bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Listings({ hoardings, setHoardings, setDeleteModal, openAvailabilityModal }: any) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Your Inventory</h2>
          <p className="text-sm text-gray-500 font-medium">Manage and monitor all your listed hoardings.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hoardings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-3xl col-span-full">
            <ImageIcon className="text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold">No hoardings listed yet</p>
          </div>
        ) : (
          hoardings.map((item: Hoarding) => (
            <div key={item._id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="h-48 relative overflow-hidden">
                {item.images[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">No Image</div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                    item.status === "approved" ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-white"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-extrabold text-gray-900 line-clamp-1">{item.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mb-6">
                  <MapPin size={14} className="text-blue-500" /> {item.location.city}, {item.location.address}
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Rent</p>
                     <p className="text-lg font-black text-blue-600">₹{item.pricePerMonth?.toLocaleString()}</p>
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => openAvailabilityModal(item)}
                       className="p-2.5 bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                       title="Block listing dates"
                     >
                       <CalendarDays size={18} />
                     </button>
                     <Link href={`/vendor/edit-hoarding/${item._id}`} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                       <Edit size={18} />
                     </Link>
                     <button 
                       onClick={() => setDeleteModal({ isOpen: true, hoardingId: item._id, hoardingName: item.name })}
                       className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SoldBookings({ bookings }: { bookings: Booking[] }) {
  const confirmed = bookings.filter(b => b.status === "confirmed");
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Bookings & Revenue</h2>
          <p className="text-sm text-gray-500 font-medium">Track your confirmed hoarding reservations.</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirmed Revenue</p>
             <p className="text-xl font-black text-blue-600">₹{confirmed.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Hoarding</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Revenue</th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {confirmed.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                        {b.user?.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">{b.user?.name || "Client"}</p>
                        <p className="text-[10px] font-medium text-gray-400 truncate max-w-[150px]">{b.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-gray-800">{b.hoarding?.name || "N/A"}</p>
                    <p className="text-[10px] font-medium text-gray-400">{b.hoarding?.location.city}</p>
                  </td>
                  <td className="px-6 py-6 font-medium text-xs text-gray-600">
                    {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-black text-gray-900">₹{b.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Paid via UPI</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {confirmed.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center">
                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <BadgeCheck className="text-gray-200" size={32} />
                       </div>
                       <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No confirmed bookings yet</p>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BookingRequests({
  bookings,
  bookingActionId,
  onUpdateStatus,
}: {
  bookings: Booking[];
  bookingActionId: string | null;
  onUpdateStatus: (
    bookingId: string,
    status: "requested" | "approved" | "rejected",
  ) => Promise<void>;
}) {
  const confirmedRevenue = bookings
    .filter((booking) => booking.status === "confirmed")
    .reduce((sum, booking) => sum + booking.totalAmount, 0);

  const getStatusClasses = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 text-green-600";
      case "approved":
        return "bg-blue-50 text-blue-600";
      case "requested":
        return "bg-amber-50 text-amber-600";
      case "rejected":
        return "bg-red-50 text-red-600";
      case "cancelled":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Booking Requests</h2>
          <p className="text-sm text-gray-500 font-medium">
            Approve, reject, or reopen buyer requests before payment.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Confirmed Revenue
            </p>
            <p className="text-xl font-black text-blue-600">
              ₹{confirmedRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Client
                </th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Hoarding
                </th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Duration
                </th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((booking) => {
                const isUpdating = bookingActionId === booking._id;

                return (
                  <tr key={booking._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                          {booking.user?.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-gray-900">
                            {booking.user?.name || "Client"}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400 truncate max-w-[170px]">
                            {booking.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-bold text-gray-800">
                        {booking.hoarding?.name || "N/A"}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400">
                        {booking.hoarding?.location.city}
                      </p>
                    </td>
                    <td className="px-6 py-6 font-medium text-xs text-gray-600">
                      {new Date(booking.startDate).toLocaleDateString()} -{" "}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-black text-gray-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {booking.status === "confirmed" ? "Paid" : "Awaiting payment"}
                      </p>
                      {booking.orderId && (
                        <p className="text-[10px] font-medium text-gray-400 break-all">
                          Order: <span className="font-mono">{booking.orderId}</span>
                        </p>
                      )}
                      {booking.paymentId && (
                        <p className="text-[10px] font-medium text-green-600 break-all">
                          Payment: <span className="font-mono">{booking.paymentId}</span>
                        </p>
                      )}
                      {booking.paidAt && (
                        <p className="text-[10px] font-medium text-gray-400">
                          Paid on {new Date(booking.paidAt).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusClasses(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap justify-end gap-2">
                        {booking.status === "requested" && (
                          <>
                            {booking.hoarding?._id && (
                              <Link
                                href={`/hoardings/${booking.hoarding._id}`}
                                className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100"
                              >
                                View Listing
                              </Link>
                            )}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(booking._id, "approved")}
                              className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(booking._id, "rejected")}
                              className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === "approved" && (
                          <>
                            {booking.hoarding?._id && (
                              <Link
                                href={`/hoardings/${booking.hoarding._id}`}
                                className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100"
                              >
                                View Listing
                              </Link>
                            )}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(booking._id, "rejected")}
                              className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <span className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                              Buyer Can Pay
                            </span>
                          </>
                        )}
                        {booking.status === "rejected" && (
                          <>
                            {booking.hoarding?._id && (
                              <Link
                                href={`/hoardings/${booking.hoarding._id}`}
                                className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100"
                              >
                                View Listing
                              </Link>
                            )}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(booking._id, "requested")}
                              className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <>
                            {booking.hoarding?._id && (
                              <Link
                                href={`/hoardings/${booking.hoarding._id}`}
                                className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100"
                              >
                                View Listing
                              </Link>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                              Payment Complete
                            </span>
                          </>
                        )}
                        {booking.status === "cancelled" && (
                          <>
                            {booking.hoarding?._id && (
                              <Link
                                href={`/hoardings/${booking.hoarding._id}`}
                                className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100"
                              >
                                View Listing
                              </Link>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Cancelled
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <BadgeCheck className="text-gray-200" size={32} />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                        No booking requests yet
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChatBox({ messages, onSend, userData, loading }: any) {
  const [msg, setMsg] = useState("");
  const getMessageSenderId = (sender: any) =>
    typeof sender === "string" ? sender : sender?._id;
  const currentUserId = userData?._id || userData?.id;

  const handleSend = async () => {
    if (!msg.trim()) return;
    const success = await onSend(msg);
    if (success) setMsg("");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
               <User size={24} />
            </div>
            <div className="absolute -right-1 -bottom-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 leading-tight">HoardSpace Support</h3>
            <p className="text-[11px] font-bold text-green-500 uppercase tracking-widest mt-0.5">Always Online</p>
          </div>
        </div>
        <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-all">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FCFDFF] custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <MessageSquare size={48} className="mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">No conversation yet</p>
          </div>
        )}
        {messages.map((chat: any, i: number) => (
          <div key={i} className={`flex ${getMessageSenderId(chat.sender) === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-6 py-4 rounded-[24px] text-sm ${
              getMessageSenderId(chat.sender) === currentUserId 
                ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-100" 
                : "bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm"
            }`}>
              <p className="font-medium leading-relaxed">{chat.content}</p>
              <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-widest ${getMessageSenderId(chat.sender) === currentUserId ? "text-blue-100" : "text-gray-400"}`}>
                {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-white border-t border-gray-50 relative z-10">
        <div className="relative flex items-center">
           <input 
             type="text" 
             value={msg}
             onChange={(e) => setMsg(e.target.value)}
             onKeyPress={(e) => e.key === "Enter" && handleSend()}
             disabled={loading}
             placeholder={loading ? "Sending..." : "Describe your issue or ask a question..."} 
             className="w-full pl-6 pr-16 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-gray-400 placeholder:font-medium font-medium"
           />
           <button 
             onClick={handleSend}
             disabled={loading}
             className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
           </button>
        </div>
        <p className="text-[10px] text-center text-gray-300 font-bold uppercase tracking-widest mt-4">
          Your conversation is encrypted and handled by support agents
        </p>
      </div>
    </div>
  );
}
