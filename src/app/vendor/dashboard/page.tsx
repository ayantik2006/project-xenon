"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Plus,
  MapPin,
  IndianRupee,
  Image as ImageIcon,
  Loader2,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Hoarding {
  _id: string;
  name: string;
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
  status: string;
  paymentId?: string;
  orderId: string;
  createdAt: string;
}

export default function VendorDashboard() {
  const router = useRouter();
  const [hoardings, setHoardings] = useState<Hoarding[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "payments">("listings");
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<{
    status: number;
    text: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    hoardingId: string | null;
    hoardingName: string;
  }>({ isOpen: false, hoardingId: null, hoardingName: "" });
  const [deleting, setDeleting] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("");

  // Check authentication on mount
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

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check failed", error);
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return; // Wait for auth check

    const fetchHoardings = async () => {
      setErrorObj(null);

      try {
        const res = await fetchWithAuth("/api/hoardings?view=vendor");

        if (res.ok) {
          const data = await res.json();
          setHoardings(data.hoardings || []); // Ensure array
        } else {
          console.error(
            "Failed to fetch hoardings:",
            res.status,
            res.statusText,
          );
          const errData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            router.push("/");
            return;
          }
          setErrorObj({
            status: res.status,
            text: errData.error || res.statusText || "Unknown error",
          });
        }
      } catch (error: any) {
        console.error("Failed to load hoardings", error);
        setErrorObj({ status: 500, text: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchHoardings();
  }, [router, authChecked]);

  // Fetch bookings for vendor's hoardings
  const fetchBookings = async () => {
    try {
      let url = "/api/vendor/bookings";
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
    if (activeTab === "payments") {
      fetchBookings();
    }
  }, [authChecked, activeTab, bookingStatusFilter]);

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, hoardingId: id, hoardingName: name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.hoardingId) return;

    setDeleting(true);
    try {
      const res = await fetchWithAuth(
        `/api/hoardings/${deleteModal.hoardingId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        // Remove from list
        setHoardings((prev) =>
          prev.filter((h) => h._id !== deleteModal.hoardingId),
        );
        setDeleteModal({ isOpen: false, hoardingId: null, hoardingName: "" });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete hoarding");
      }
    } catch (error) {
      alert("Failed to delete hoarding");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, hoardingId: null, hoardingName: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (errorObj) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-gray-700">Status: {errorObj.status}</p>
        <p className="text-gray-600">{errorObj.text}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vendor Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your hoarding listings and bookings
            </p>
          </div>
          <Link
            href="/vendor/add-hoarding"
            className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> List New Hoarding
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "listings"
                ? "bg-[#2563eb] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "payments"
                ? "bg-[#2563eb] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Payment History
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm font-medium mb-1">
              Total Listings
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {hoardings.length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm font-medium mb-1">
              Active Bookings
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {bookings.filter((b) => b.status === "confirmed").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm font-medium mb-1">
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-gray-900 flex items-center">
              <IndianRupee size={24} />
              {bookings
                .filter((b) => b.status === "confirmed")
                .reduce((sum, b) => sum + b.totalAmount, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {activeTab === "listings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Your Listings</h2>
            </div>

          {hoardings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>No hoardings listed yet.</p>
              <Link
                href="/vendor/add-hoarding"
                className="text-blue-600 font-medium hover:underline mt-2 inline-block"
              >
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {hoardings.map((item) => (
                <div
                  key={item._id}
                  className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2563eb] transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin size={14} /> {item.location.address},{" "}
                          {item.location.city}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          item.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : item.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 uppercase font-bold">
                          Price
                        </span>
                        <div className="flex items-center font-bold text-gray-900 mt-0.5">
                          <IndianRupee size={14} />{" "}
                          {item.pricePerMonth.toLocaleString()} / mo
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/vendor/edit-hoarding/${item._id}`}
                          className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-[#2563eb] rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                        >
                          <Edit size={16} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(item._id, item.name)}
                          className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Payment History */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] outline-none"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                          <div className="text-xs">
                            <p className="text-gray-600">
                              {new Date(booking.startDate).toLocaleDateString()}
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Delete Hoarding
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                "{deleteModal.hoardingName}"
              </span>
              ? All associated data will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
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
    </div>
  );
}
