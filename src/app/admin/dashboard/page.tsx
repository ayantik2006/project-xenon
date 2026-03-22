"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Users,
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
    active: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: string;
  createdAt: string;
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
  orderId: string;
  createdAt: string;
}

type TabType = "overview" | "users" | "hoardings" | "payments";

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
    user: any | null;
    loading: boolean;
  }>({ isOpen: false, user: null, loading: false });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    if (!authChecked) return;

    const fetchStats = async () => {
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

    fetchStats();
  }, [authChecked]);

  // Fetch users
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
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  // Fetch hoardings
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

  // Fetch bookings/payments
  const fetchBookings = async () => {
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
    if (activeTab === "payments") fetchBookings();
  }, [
    authChecked,
    activeTab,
    userRoleFilter,
    userKYCFilter,
    hoardingStatusFilter,
    bookingStatusFilter,
  ]);

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

  // View user details
  const handleViewUserDetails = async (userId: string) => {
    setUserDetailsModal({ isOpen: true, user: null, loading: true });
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}/details`);
      if (res.ok) {
        const data = await res.json();
        setUserDetailsModal({ isOpen: true, user: data.user, loading: false });
      } else {
        alert("Failed to fetch user details");
        setUserDetailsModal({ isOpen: false, user: null, loading: false });
      }
    } catch (error) {
      alert("Failed to fetch user details");
      setUserDetailsModal({ isOpen: false, user: null, loading: false });
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

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
                  <p className="text-sm text-gray-500 font-medium">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.users.total}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.users.vendors} vendors, {stats.users.buyers} buyers
                  </p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Total Hoardings
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.hoardings.total}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.hoardings.approved} approved
                  </p>
                </div>
                <Building2 className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Pending KYC
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.users.pendingKYC}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Requires approval
                  </p>
                </div>
                <Clock className="text-yellow-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Total Bookings
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.bookings.total}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.bookings.active} active
                  </p>
                </div>
                <ShoppingCart className="text-purple-500" size={32} />
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
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Platform Overview
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Switch to Users or Hoardings tabs to manage the platform
                  </p>
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
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userKYCFilter}
                    onChange={(e) => setUserKYCFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                  >
                    <option value="">All KYC Status</option>
                    <option value="not_submitted">Not Submitted</option>
                    <option value="pending">Pending</option>
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
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
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
                                user.kycStatus === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : user.kycStatus === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : user.kycStatus === "rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.kycStatus.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewUserDetails(user._id)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {user.kycStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateKYC(user._id, "approved")
                                    }
                                    disabled={actionLoading === user._id}
                                    className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateKYC(user._id, "rejected")
                                    }
                                    disabled={actionLoading === user._id}
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
                                    type: "user",
                                    id: user._id,
                                    name: user.name,
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
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-green-600 uppercase">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      ₹
                      {bookings
                        .filter((b) => b.status === "confirmed")
                        .reduce((sum, b) => sum + b.totalAmount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-600 uppercase">
                      Confirmed Bookings
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {bookings.filter((b) => b.status === "confirmed").length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-yellow-600 uppercase">
                      Pending Payments
                    </p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {bookings.filter((b) => b.status === "pending").length}
                    </p>
                  </div>
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
                                  {booking.orderId}
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
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : booking.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
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
      {userDetailsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
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
                onClick={() =>
                  setUserDetailsModal({
                    isOpen: false,
                    user: null,
                    loading: false,
                  })
                }
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {userDetailsModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
                </div>
              ) : userDetailsModal.user ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users size={20} className="text-[#2563eb]" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              userDetailsModal.user.kycStatus === "approved"
                                ? "bg-green-100 text-green-700"
                                : userDetailsModal.user.kycStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : userDetailsModal.user.kycStatus ===
                                      "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {userDetailsModal.user.kycStatus.replace("_", " ")}
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
                              {
                                userDetailsModal.user.kycDetails.documents
                                  .length
                              }
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
                    userDetailsModal.user.kycStatus === "not_submitted") && (
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
                  {userDetailsModal.user.kycStatus === "pending" && (
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={async () => {
                          await handleUpdateKYC(
                            userDetailsModal.user._id,
                            "approved",
                          );
                          setUserDetailsModal({
                            isOpen: false,
                            user: null,
                            loading: false,
                          });
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
                            userDetailsModal.user._id,
                            "rejected",
                          );
                          setUserDetailsModal({
                            isOpen: false,
                            user: null,
                            loading: false,
                          });
                        }}
                        disabled={!!actionLoading}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Reject KYC
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
      )}

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
