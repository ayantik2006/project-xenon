"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Calendar,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  IndianRupee,
  ExternalLink,
  Loader2,
  User,
  ArrowRight,
} from "lucide-react";

interface Booking {
  _id: string;
  hoarding: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
      state: string;
    };
    images: string[];
    type: string;
    pricePerMonth: number;
    dimensions: {
      width: number;
      height: number;
    };
  };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled";
  orderId: string;
  paymentId?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalSpent: number;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetchWithAuth("/api/auth/me");
        if (!userRes.ok) {
          router.push("/");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // Check if user is buyer
        if (userData.user.role !== "buyer") {
          router.push("/");
          return;
        }

        // Fetch bookings
        const bookingsRes = await fetchWithAuth("/api/buyer/bookings");
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings);
          setActiveBookings(data.activeBookings);
          setPastBookings(data.pastBookings);
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
    };
    const icons = {
      confirmed: <CheckCircle size={14} />,
      pending: <Clock size={14} />,
      cancelled: <XCircle size={14} />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status as keyof typeof styles]
        }`}
      >
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-blue-100">Manage your advertising campaigns</p>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <User size={18} />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Package className="text-blue-200" size={24} />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.total}</p>
              <p className="text-blue-100 text-sm">Total Bookings</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-green-300" size={24} />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.confirmed}</p>
              <p className="text-blue-100 text-sm">Confirmed</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Clock className="text-yellow-300" size={24} />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.pending}</p>
              <p className="text-blue-100 text-sm">Pending</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-blue-200" size={24} />
              </div>
              <p className="text-3xl font-bold mb-1">
                ₹{stats.totalSpent.toLocaleString("en-IN")}
              </p>
              <p className="text-blue-100 text-sm">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Browse Hoardings</p>
                <p className="text-sm text-gray-600">Find new locations</p>
              </div>
              <ArrowRight size={20} className="ml-auto text-gray-400" />
            </Link>

            <Link
              href="/search"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Calendar size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Search</p>
                <p className="text-sm text-gray-600">Find by city & type</p>
              </div>
              <ArrowRight size={20} className="ml-auto text-gray-400" />
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Profile Settings</p>
                <p className="text-sm text-gray-600">Update your info</p>
              </div>
              <ArrowRight size={20} className="ml-auto text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === "active"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Active Bookings ({activeBookings.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === "history"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Booking History ({pastBookings.length})
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {activeTab === "active" && (
              <>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No Active Bookings
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start advertising by booking a hoarding space
                    </p>
                    <Link
                      href="/"
                      className="inline-block bg-[#2563eb] text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Browse Hoardings
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map((booking) => {
                      // Handle deleted hoarding
                      if (!booking.hoarding) {
                        return (
                          <div
                            key={booking._id}
                            className="bg-red-50 rounded-xl p-5 border border-red-100"
                          >
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                              <XCircle size={20} />
                              <span className="font-semibold">
                                Hoarding No Longer Available
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              This hoarding has been removed from the platform.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={booking._id}
                          className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow border border-gray-100"
                        >
                          <div className="flex flex-col lg:flex-row gap-4">
                            {/* Image */}
                            <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                              {booking.hoarding.images &&
                              booking.hoarding.images.length > 0 ? (
                                <img
                                  src={booking.hoarding.images[0]}
                                  alt={booking.hoarding.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <MapPin size={32} />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {booking.hoarding.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin size={14} />
                                    <span>
                                      {booking.hoarding.location.city},{" "}
                                      {booking.hoarding.location.state}
                                    </span>
                                  </div>
                                </div>
                                {getStatusBadge(booking.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Start Date
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatDate(booking.startDate)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    End Date
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatDate(booking.endDate)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Duration
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {calculateDuration(
                                      booking.startDate,
                                      booking.endDate,
                                    )}{" "}
                                    days
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Total Amount
                                  </p>
                                  <p className="text-2xl font-bold text-blue-600 flex items-center">
                                    <IndianRupee size={18} />
                                    {booking.totalAmount.toLocaleString(
                                      "en-IN",
                                    )}
                                  </p>
                                </div>
                                <Link
                                  href={`/bookings/details/${booking._id}`}
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                  View Details
                                  <ExternalLink size={16} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <>
                {pastBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No Booking History
                    </h3>
                    <p className="text-gray-600">
                      Your past bookings will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking) => {
                      // Handle deleted hoarding
                      if (!booking.hoarding) {
                        return (
                          <div
                            key={booking._id}
                            className="bg-red-50 rounded-xl p-5 border border-red-100 opacity-90"
                          >
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                              <XCircle size={20} />
                              <span className="font-semibold">
                                Hoarding No Longer Available
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              This hoarding has been removed from the platform.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={booking._id}
                          className="bg-gray-50 rounded-xl p-5 border border-gray-100 opacity-90"
                        >
                          <div className="flex flex-col lg:flex-row gap-4">
                            {/* Image */}
                            <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                              {booking.hoarding.images &&
                              booking.hoarding.images.length > 0 ? (
                                <img
                                  src={booking.hoarding.images[0]}
                                  alt={booking.hoarding.name}
                                  className="w-full h-full object-cover grayscale"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <MapPin size={32} />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {booking.hoarding.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin size={14} />
                                    <span>
                                      {booking.hoarding.location.city},{" "}
                                      {booking.hoarding.location.state}
                                    </span>
                                  </div>
                                </div>
                                {getStatusBadge(booking.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Start Date
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatDate(booking.startDate)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    End Date
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatDate(booking.endDate)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Duration
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {calculateDuration(
                                      booking.startDate,
                                      booking.endDate,
                                    )}{" "}
                                    days
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Total Amount
                                  </p>
                                  <p className="text-xl font-bold text-gray-700 flex items-center">
                                    <IndianRupee size={16} />
                                    {booking.totalAmount.toLocaleString(
                                      "en-IN",
                                    )}
                                  </p>
                                </div>
                                <Link
                                  href={`/bookings/details/${booking._id}`}
                                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
                                >
                                  View Details
                                  <ExternalLink size={16} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
