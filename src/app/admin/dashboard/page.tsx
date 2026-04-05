"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { normalizeKycStatus } from "@/lib/kycStatus";
import {
  Users,
  User as UserIcon,
  Building2,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Send,
} from "lucide-react";

interface Stats {
  users: {
    total: number;
    vendors: number;
    buyers: number;
    pendingKYC: number;
  };
  hoardings: {
    total: number;
    approved: number;
    pending: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    totalGMV: number;
    platformRevenue: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  role: string;
  emailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: string;
  createdAt: string;
}

interface UserDetails extends User {
  kycDetails?: {
    companyName?: string;
    gstin?: string;
    pan?: string;
    aadhaar?: string;
    address?: string;
    documents?: string[];
  };
}

interface Hoarding {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
  };
  pricePerMonth: number;
  status: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
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
  status: string;
  paymentId?: string;
  orderId?: string;
  paidAt?: string;
  createdAt: string;
}

type PlatformSettings = {
  hoardspaceCommissionPercent: number;
  razorpayPercent: number;
  gstPercent: number;
};

type TabType = "overview" | "users" | "hoardings" | "payments" | "messages";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hoardings, setHoardings] = useState<Hoarding[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings | null>(null);
  const [commissionInput, setCommissionInput] = useState("0");
  const [platformSettingsLoading, setPlatformSettingsLoading] = useState(false);
  const [platformSettingsSaving, setPlatformSettingsSaving] = useState(false);

  // Filter states
  const [userRoleFilter, setUserRoleFilter] = useState<string>("");
  const [userKYCFilter, setUserKYCFilter] = useState<string>("");
  const [hoardingStatusFilter, setHoardingStatusFilter] = useState<string>("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "user" | "hoarding" | null;
    id: string | null;
    name: string;
  }>({ isOpen: false, type: null, id: null, name: "" });

  // User details modal
  const [userDetailsModal, setUserDetailsModal] = useState<{
    isOpen: boolean;
    user: UserDetails | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, user: null, loading: false, error: null });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const modalStatus = userDetailsModal.user
    ? normalizeKycStatus(userDetailsModal.user.kycStatus)
    : "not_submitted";

  // Message states
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        if (data.user.role !== "admin") {
          router.push("/");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check failed", error);
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch stats
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    const fetchStatsData = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
    fetchPlatformSettings();

    // Polling for messages
    const pollInterval = setInterval(() => {
      fetchAdminMessages();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [authChecked]);

  const fetchPlatformSettings = async () => {
    setPlatformSettingsLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/platform-settings");
      if (res.ok) {
        const data = await res.json();
        setPlatformSettings(data.settings);
        setCommissionInput(
          String(data.settings?.hoardspaceCommissionPercent ?? 0),
        );
      }
    } catch (error) {
      console.error("Failed to fetch platform settings", error);
    } finally {
      setPlatformSettingsLoading(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    setPlatformSettingsSaving(true);
    try {
      const res = await fetchWithAuth("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoardspaceCommissionPercent: Number(commissionInput || 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update platform settings");
        return;
      }

      setPlatformSettings(data.settings);
      setCommissionInput(
        String(data.settings?.hoardspaceCommissionPercent ?? 0),
      );
    } catch (error) {
      console.error("Failed to save platform settings", error);
      alert("Failed to update platform settings");
    } finally {
      setPlatformSettingsSaving(false);
    }
  };

  const fetchAdminMessages = async () => {
    setMessageLoading(true);
    console.log("[AdminDashboard] Fetching inquiries...");
    try {
      const res = await fetchWithAuth("/api/admin/messages");
      console.log("[AdminDashboard] Fetch Response Status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[AdminDashboard] Messages received:", data.messages?.length || 0);
        setAdminMessages(data.messages || []);
      } else {
        const err = await res.json();
        console.error("[AdminDashboard] Fetch failed:", err);
      }
    } catch (error) {
      console.error("[AdminDashboard] Error fetching messages:", error);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!adminReply.trim() || !selectedThreadId) return;

    console.log("[AdminDashboard] Sending reply to thread:", selectedThreadId);
    try {
      const res = await fetchWithAuth("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver: selectedThreadId,
          content: adminReply,
        }),
      });

      console.log("[AdminDashboard] Reply send status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[AdminDashboard] Reply sent successfully:", data.data);
        setAdminMessages((prev) => [...prev, data.data]);
        setAdminReply("");
      } else {
        const err = await res.json();
        console.error("[AdminDashboard] Reply failed:", err);
      }
    } catch (error) {
      console.error("[AdminDashboard] Error sending reply:", error);
    }
  };

  const getGroupedMessages = () => {
    const groups: { [key: string]: any } = {};
    adminMessages.forEach((m) => {
      // We want to group by the 'other person' (not the admin themselves)
      const otherPerson = m.sender?.role === 'admin' ? m.receiver : m.sender;
      
      const key = otherPerson?._id || m.email || "guest";
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          name: otherPerson?.name || m.name || m.email || "Guest User",
          messages: [],
          lastMessage: m.content,
          time: m.createdAt,
        };
      }
      groups[key].messages.push(m);
      if (new Date(m.createdAt) > new Date(groups[key].time)) {
        groups[key].lastMessage = m.content;
        groups[key].time = m.createdAt;
      }
    });
    // Sort groups by latest message
    return Object.values(groups).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  const groupedThreads = getGroupedMessages();
  const filteredThreads = groupedThreads.filter((thread) => {
    const query = messageSearchQuery.trim().toLowerCase();
    if (!query) return true;

    return [thread.name, thread.lastMessage]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  const activeThread =
    filteredThreads.find((t) => t.id === selectedThreadId) || filteredThreads[0];

  useEffect(() => {
    console.log("[AdminDashboard] State Update: Admin Messages Count =", adminMessages.length);
    console.log("[AdminDashboard] State Update: Grouped Threads Count =", groupedThreads.length);
    if (activeThread) {
      console.log("[AdminDashboard] Active Thread:", activeThread.name, "Messages:", activeThread.messages.length);
    }
  }, [adminMessages, groupedThreads, activeThread]);

  const fetchUsers = async () => {
    try {
      let url = "/api/admin/users";
      const params = new URLSearchParams();
      if (userRoleFilter) params.append("role", userRoleFilter);
      if (userKYCFilter) params.append("kycStatus", userKYCFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users.filter((user: User) => user.role !== "admin"));
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchHoardings = async () => {
    try {
      let url = "/api/admin/hoardings";
      if (hoardingStatusFilter) {
        url += `?status=${hoardingStatusFilter}`;
      }

      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        setHoardings(data.hoardings);
      }
    } catch (error) {
      console.error("Failed to fetch hoardings", error);
    }
  };

  const fetchBookingsData = async () => {
    try {
      let url = "/api/admin/bookings";
      if (bookingStatusFilter) {
        url += `?status=${bookingStatusFilter}`;
      }

      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "hoardings") fetchHoardings();
    if (activeTab === "payments") fetchBookingsData();
  }, [
    authChecked,
    activeTab,
    userRoleFilter,
    userKYCFilter,
    hoardingStatusFilter,
    bookingStatusFilter,
  ]);

  useEffect(() => {
    if (!userDetailsModal.isOpen || !selectedUserId) return;

    let isCancelled = false;

    const fetchUserDetails = async () => {
      setUserDetailsModal((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const res = await fetchWithAuth(`/api/admin/users/${selectedUserId}/details`);

        if (isCancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (isCancelled) return;

          setUserDetailsModal({
            isOpen: true,
            user: data.user,
            loading: false,
            error: null,
          });
          return;
        }

        setUserDetailsModal((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load full KYC details. Showing available user info.",
        }));
      } catch (error) {
        if (isCancelled) return;

        setUserDetailsModal((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load full KYC details. Showing available user info.",
        }));
      }
    };

    fetchUserDetails();

    return () => {
      isCancelled = true;
    };
  }, [selectedUserId, userDetailsModal.isOpen]);

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const closeUserDetailsModal = () => {
    setSelectedUserId(null);
    setUserDetailsModal({
      isOpen: false,
      user: null,
      loading: false,
      error: null,
    });
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  // Update user KYC status
  const handleUpdateKYC = async (userId: string, status: string) => {
    setActionLoading(userId);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycStatus: status }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...data.user } : user,
          ),
        );
        setUserDetailsModal((prev) =>
          prev.user && prev.user._id === userId
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  ...data.user,
                },
              }
            : prev,
        );
        await fetchUsers();
        await fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update KYC status");
      }
    } catch (error) {
      alert("Failed to update KYC status");
    } finally {
      setActionLoading(null);
    }
  };

  // Update hoarding status
  const handleUpdateHoardingStatus = async (
    hoardingId: string,
    status: string,
  ) => {
    setActionLoading(hoardingId);
    try {
      const res = await fetchWithAuth(`/api/admin/hoardings/${hoardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchHoardings();
        await fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update hoarding status");
      }
    } catch (error) {
      alert("Failed to update hoarding status");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    setActionLoading(deleteModal.id);
    try {
      const endpoint =
        deleteModal.type === "user"
          ? `/api/admin/users/${deleteModal.id}`
          : `/api/admin/hoardings/${deleteModal.id}`;

      const res = await fetchWithAuth(endpoint, { method: "DELETE" });

      if (res.ok) {
        if (deleteModal.type === "user") {
          setUsers((prev) => prev.filter((u) => u._id !== deleteModal.id));
        } else {
          setHoardings((prev) => prev.filter((h) => h._id !== deleteModal.id));
        }
        setDeleteModal({ isOpen: false, type: null, id: null, name: "" });
        await fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      alert("Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  // View user details
  const handleViewUserDetails = (selectedUser: User) => {
    setSelectedUserId(selectedUser._id);
    setUserDetailsModal({
      isOpen: true,
      user: selectedUser,
      loading: false,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="text-[#2563eb]" size={32} />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Manage users, hoardings, and platform operations
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Platform Revenue</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    ₹{stats.bookings.platformRevenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black italic tracking-widest">
                    Earnings
                  </p>
                </div>
                <TrendingUp className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Volume (GMV)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{stats.bookings.totalGMV?.toLocaleString() || 0}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black italic tracking-widest">
                    {stats.bookings.confirmed} Confirmations
                  </p>
                </div>
                <CreditCard className="text-indigo-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Submitted KYC</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.users.pendingKYC}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black italic tracking-widest">
                    Awaiting Review
                  </p>
                </div>
                <Clock className="text-yellow-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Live Inventory</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.hoardings.approved}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-black italic tracking-widest">
                    Total: {stats.hoardings.total}
                  </p>
                </div>
                <Building2 className="text-green-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100">
            <div className="flex gap-1 p-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  activeTab === "overview"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  activeTab === "users"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("hoardings")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  activeTab === "hoardings"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Hoardings
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "payments"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CreditCard size={18} />
                Payments
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "messages"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <MessageSquare size={18} />
                Messages
                      </button>
                    </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900">
                      Platform Overview
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Switch to Users, Hoardings, Payments, or Messages to
                      manage day-to-day platform activity.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Pricing Controls
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Buyers see vendor price + HoardSpace commission +
                          Razorpay + GST.
                        </p>
                      </div>
                      {(platformSettingsLoading || platformSettingsSaving) && (
                        <Loader2 className="animate-spin text-blue-600" size={20} />
                      )}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          HoardSpace Commission
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={commissionInput}
                            onChange={(e) => setCommissionInput(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#2563eb]"
                          />
                          <span className="text-sm font-semibold text-gray-500">
                            %
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          Razorpay Charges
                        </p>
                        <p className="mt-4 text-2xl font-bold text-gray-900">
                          {platformSettings?.razorpayPercent ?? 2.5}%
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 relative overflow-hidden">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          GST
                        </p>
                        <div className="mt-4 flex flex-col">
                          <p className="text-2xl font-bold text-gray-900">
                            {platformSettings?.gstPercent ?? 2.5}%
                          </p>
                          <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-tighter">
                            + (18% on {platformSettings?.gstPercent ?? 2.5}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <p className="text-xs text-gray-500">
                        Default commission is currently set to{" "}
                        <span className="font-bold text-gray-900">
                          {platformSettings?.hoardspaceCommissionPercent ?? 0}%
                        </span>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={handleSavePlatformSettings}
                        disabled={platformSettingsSaving}
                        className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                      >
                        {platformSettingsSaving ? "Saving..." : "Save Pricing"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="buyer">Buyer</option>
                    <option value="vendor">Vendor</option>
                  </select>

                  <select
                    value={userKYCFilter}
                    onChange={(e) => setUserKYCFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="">All KYC Status</option>
                    <option value="not_submitted">Not Submitted</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Verification
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          KYC Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => {
                        const normalizedStatus = normalizeKycStatus(user.kycStatus);
                        return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">
                                {user.image ? (
                                  <img
                                    src={user.image}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserIcon size={20} />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail size={12} /> {user.email}
                                </p>
                                {user.phone && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Phone size={12} /> {user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : user.role === "vendor"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <span title="Email Verified">
                                {user.emailVerified ? (
                                  <CheckCircle
                                    size={16}
                                    className="text-green-500"
                                  />
                                ) : (
                                  <XCircle size={16} className="text-red-500" />
                                )}
                              </span>
                              <span title="Phone Verified">
                                {user.isPhoneVerified ? (
                                  <CheckCircle
                                    size={16}
                                    className="text-green-500"
                                  />
                                ) : (
                                  <XCircle size={16} className="text-red-500" />
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                normalizedStatus === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : normalizedStatus === "submitted"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : normalizedStatus === "rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {normalizedStatus.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {/* <div className="flex gap-2"> */}
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleViewUserDetails(user);
                                  console.log("jf")
                                }}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                            {/* </div> */}
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "hoardings" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <select
                    value={hoardingStatusFilter}
                    onChange={(e) => setHoardingStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Hoardings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Hoarding
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {hoardings.map((hoarding) => (
                        <tr key={hoarding._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {hoarding.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {hoarding.location.city}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {hoarding.owner.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {hoarding.owner.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">
                              ₹{hoarding.pricePerMonth.toLocaleString()}/mo
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                hoarding.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : hoarding.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {hoarding.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              {hoarding.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateHoardingStatus(
                                        hoarding._id,
                                        "approved",
                                      )
                                    }
                                    disabled={actionLoading === hoarding._id}
                                    className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateHoardingStatus(
                                        hoarding._id,
                                        "rejected",
                                      )
                                    }
                                    disabled={actionLoading === hoarding._id}
                                    className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    type: "hoarding",
                                    id: hoarding._id,
                                    name: hoarding.name,
                                  })
                                }
                                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {hoardings.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No hoardings found
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Booking ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Hoarding
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Period
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Payment Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <p className="text-xs font-mono text-gray-500">
                              {booking._id.slice(-8)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {booking.hoarding ? (
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {booking.hoarding.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booking.hoarding.location.city}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-red-500 italic">
                                Hoarding deleted
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {booking.user ? (
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {booking.user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booking.user.email}
                                </p>
                                {booking.user.phone && (
                                  <p className="text-xs text-gray-500">
                                    {booking.user.phone}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-red-500 italic">
                                User deleted
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs">
                              <p className="text-gray-600">
                                {new Date(
                                  booking.startDate,
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-gray-400">to</p>
                              <p className="text-gray-600">
                                {new Date(booking.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-bold text-gray-900">
                              ₹{booking.totalAmount.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="text-gray-500">Order ID:</span>
                                <p className="font-mono text-gray-700 break-all">
                                  {booking.orderId || "Not created"}
                                </p>
                              </div>
                              {booking.paymentId && (
                                <div>
                                  <span className="text-gray-500">
                                    Payment ID:
                                  </span>
                                  <p className="font-mono text-green-700 break-all">
                                    {booking.paymentId}
                                  </p>
                                </div>
                              )}
                              {booking.paidAt && (
                                <div>
                                  <span className="text-gray-500">Paid At:</span>
                                  <p className="text-gray-700">
                                    {new Date(booking.paidAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : booking.status === "approved"
                                    ? "bg-blue-100 text-blue-700"
                                    : booking.status === "requested"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : booking.status === "rejected" || booking.status === "cancelled"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-gray-600">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(booking.createdAt).toLocaleTimeString()}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bookings.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No payments found
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "messages" && (
              <div className="animate-in fade-in duration-500 flex flex-col h-[700px] border border-gray-100 rounded-[32px] overflow-hidden bg-white shadow-xl shadow-blue-100/20">
                <div className="flex-1 flex flex-col md:flex-row divide-x divide-gray-100">
                  {/* Chat List */}
                  <div className="w-full md:w-80 flex flex-col bg-gray-50/10">
                    <div className="p-6 border-b border-gray-100 bg-white">
                       <h3 className="text-lg font-black text-gray-900 mb-4">Inquiries</h3>
                       <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            value={messageSearchQuery}
                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                            placeholder="Find conversations..." 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none placeholder:text-gray-400 font-medium focus:ring-2 focus:ring-blue-100"
                          />
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                       {filteredThreads.length === 0 ? (
                         <div className="p-10 text-center space-y-2 opacity-50">
                            <MessageSquare className="mx-auto text-gray-300" size={32} />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                              {messageSearchQuery.trim() ? "No Matching Conversations" : "No Messages Yet"}
                            </p>
                         </div>
                       ) : (
                        <div className="p-3 space-y-1">
                          {filteredThreads.map((thread) => (
                            <div 
                              key={thread.id} 
                              onClick={() => setSelectedThreadId(thread.id)}
                              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${selectedThreadId === thread.id || (!selectedThreadId && thread.id === filteredThreads[0]?.id) ? "bg-white shadow-lg shadow-blue-100/50 border border-blue-50" : "hover:bg-white/50"}`}
                            >
                               <div className="flex justify-between items-start mb-1">
                                  <p className={`text-sm font-black ${selectedThreadId === thread.id ? "text-blue-600" : "text-gray-900"}`}>{thread.name}</p>
                                  <span className="text-[9px] text-gray-400 font-bold">{new Date(thread.time).toLocaleDateString()}</span>
                               </div>
                               <p className="text-xs text-gray-500 truncate font-medium">{thread.lastMessage}</p>
                            </div>
                          ))}
                        </div>
                       )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col bg-white">
                     {activeThread ? (
                       <>
                        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase">
                                {activeThread.name[0]}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-gray-900">{activeThread.name}</h4>
                                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active Discussion</p>
                              </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-gray-50/30 custom-scrollbar">
                            {activeThread.messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg: any, idx: number) => (
                              <div key={idx} className={`flex ${msg.sender?.role === 'admin' ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender?.role === 'admin' ? "bg-blue-600 text-white shadow-lg shadow-blue-100 rounded-tr-none" : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none font-medium"}`}>
                                  {msg.content}
                                  <p className={`text-[9px] mt-2 opacity-60 font-bold uppercase ${msg.sender?.role === 'admin' ? "text-blue-50" : "text-gray-400"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border-t border-gray-100">
                            <div className="relative flex items-center gap-3">
                              <input 
                                type="text" 
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                placeholder="Type your response..." 
                                className="flex-1 pl-6 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm outline-none font-medium focus:ring-2 focus:ring-blue-100"
                              />
                              <button 
                                onClick={handleSendReply}
                                className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:scale-110 active:scale-95"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                        </div>
                       </>
                     ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
                          <MessageSquare size={64} className="text-gray-300 mb-4" />
                          <h4 className="text-xl font-black text-gray-900">Select a conversation</h4>
                          <p className="text-sm font-medium text-gray-500">Choose a query from the list to start replying</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Delete {deleteModal.type === "user" ? "User" : "Hoarding"}
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">"{deleteModal.name}"</span>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    type: null,
                    id: null,
                    name: "",
                  })
                }
                disabled={!!actionLoading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isMounted &&
        userDetailsModal.isOpen &&
        createPortal((
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 overflow-y-auto"
          onClick={closeUserDetailsModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 relative"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Shield className="text-blue-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  User Details & KYC Review
                </h3>
              </div>
              <button
                onClick={closeUserDetailsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {userDetailsModal.loading && !userDetailsModal.user ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
                </div>
              ) : userDetailsModal.user ? (
                <div className="space-y-6">
                  {userDetailsModal.error && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
                      {userDetailsModal.error}
                    </div>
                  )}
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users size={20} className="text-[#2563eb]" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">
                          {userDetailsModal.user.image ? (
                            <img
                              src={userDetailsModal.user.image}
                              alt={userDetailsModal.user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon size={32} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Profile Image</p>
                          <p className="text-gray-900 font-medium">
                            {userDetailsModal.user.image ? "Uploaded" : "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          Name
                        </label>
                        <p className="text-gray-900 font-medium">
                          {userDetailsModal.user.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          Role
                        </label>
                        <p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              userDetailsModal.user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : userDetailsModal.user.role === "vendor"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {userDetailsModal.user.role}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                          <Mail size={14} /> Email
                        </label>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          {userDetailsModal.user.email}
                          {userDetailsModal.user.emailVerified && (
                            <CheckCircle size={16} className="text-green-500" />
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                          <Phone size={14} /> Phone
                        </label>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          {userDetailsModal.user.phone || "Not provided"}
                          {userDetailsModal.user.isPhoneVerified && (
                            <CheckCircle size={16} className="text-green-500" />
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          KYC Status
                        </label>
                        <p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              modalStatus === "approved"
                                ? "bg-green-100 text-green-700"
                                : modalStatus === "submitted"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : modalStatus === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {modalStatus.replace("_", " ")}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">
                          User ID
                        </label>
                        <p className="text-gray-700 text-sm font-mono">
                          {userDetailsModal.user._id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* KYC Details */}
                  {userDetailsModal.user.kycDetails && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-[#2563eb]" />
                        KYC Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userDetailsModal.user.kycDetails.companyName && (
                          <div>
                            <label className="text-sm font-semibold text-gray-600">
                              Company Name
                            </label>
                            <p className="text-gray-900 font-medium">
                              {userDetailsModal.user.kycDetails.companyName}
                            </p>
                    </div>
                  )}
                        {userDetailsModal.user.kycDetails.gstin && (
                          <div>
                            <label className="text-sm font-semibold text-gray-600">
                              GSTIN
                            </label>
                            <p className="text-gray-900 font-medium font-mono">
                              {userDetailsModal.user.kycDetails.gstin}
                            </p>
                          </div>
                        )}
                        {userDetailsModal.user.kycDetails.pan && (
                          <div>
                            <label className="text-sm font-semibold text-gray-600">
                              PAN Number
                            </label>
                            <p className="text-gray-900 font-medium font-mono">
                               {userDetailsModal.user.kycDetails.pan}
                            </p>
                          </div>
                        )}
                        {userDetailsModal.user.kycDetails.aadhaar && (
                          <div>
                            <label className="text-sm font-semibold text-gray-600">
                              Aadhaar Number
                            </label>
                            <p className="text-gray-900 font-medium font-mono">
                              {userDetailsModal.user.kycDetails.aadhaar}
                            </p>
                          </div>
                        )}
                        {userDetailsModal.user.kycDetails.address && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-gray-600">
                              Address
                            </label>
                            <p className="text-gray-900 font-medium">
                              {userDetailsModal.user.kycDetails.address}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* KYC Documents */}
                      {userDetailsModal.user.kycDetails.documents &&
                        userDetailsModal.user.kycDetails.documents.length >
                          0 && (
                          <div className="mt-6">
                            <h5 className="text-md font-bold text-gray-900 mb-3">
                              KYC Documents (
                               {userDetailsModal.user.kycDetails.documents.length}
                              )
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {userDetailsModal.user.kycDetails.documents.map(
                                (doc: string, index: number) => (
                                  <div
                                    key={index}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedImage(doc)}
                                  >
                                    <img
                                      src={doc}
                                      alt={`KYC Document ${index + 1}`}
                                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-[#2563eb] transition-all"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <Eye size={24} className="text-white" />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 text-center">
                                      Document {index + 1}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* No KYC Submitted */}
                  {(!userDetailsModal.user.kycDetails ||
                    modalStatus === "not_submitted") && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <Clock
                        className="mx-auto text-yellow-600 mb-2"
                        size={32}
                      />
                      <p className="text-yellow-800 font-semibold">
                        No KYC details submitted yet
                      </p>
                    </div>
                  )}

                  {/* KYC Actions */}
                  {userDetailsModal.user.role !== "admin" &&
                    modalStatus === "submitted" && (
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={async () => {
                          await handleUpdateKYC(
                            userDetailsModal.user!._id,
                            "approved",
                          );
                          closeUserDetailsModal();
                        }}
                        disabled={!!actionLoading}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Approve KYC
                      </button>
                      <button
                        onClick={async () => {
                          await handleUpdateKYC(
                            userDetailsModal.user!._id,
                            "rejected",
                          );
                          closeUserDetailsModal();
                        }}
                        disabled={!!actionLoading}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Reject KYC
                      </button>
                    </div>
                  )}
                  {userDetailsModal.user.role !== "admin" &&
                    modalStatus === "approved" && (
                    <div className="pt-4 border-t">
                      <button
                        onClick={async () => {
                          await handleUpdateKYC(
                            userDetailsModal.user!._id,
                            "rejected",
                          );
                          closeUserDetailsModal();
                        }}
                        disabled={!!actionLoading}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Disapprove KYC
                      </button>
                    </div>
                  )}
                  {userDetailsModal.user.role !== "admin" &&
                    modalStatus === "rejected" && (
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={async () => {
                          await handleUpdateKYC(
                            userDetailsModal.user!._id,
                            "approved",
                          );
                          closeUserDetailsModal();
                        }}
                        disabled={!!actionLoading}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Approve KYC
                      </button>
                      <button
                        onClick={async () => {
                          await handleUpdateKYC(
                            userDetailsModal.user!._id,
                            "not_submitted",
                          );
                          closeUserDetailsModal();
                        }}
                        disabled={!!actionLoading}
                        className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={18} />
                        Reopen For Resubmission
                      </button>
                    </div>
                  )}
                    </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Failed to load user details
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <XCircle size={32} />
          </button>
          <img
            src={selectedImage}
            alt="KYC Document"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
