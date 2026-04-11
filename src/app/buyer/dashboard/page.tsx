"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import "@fontsource/chiron-goround-tc";
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
  Search,
  LayoutDashboard,
  Heart,
  MessageSquare,
  Bell,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  Filter,
  MoreVertical,
  Send,
  Trash2,
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
  } | null;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status:
    | "requested"
    | "approved"
    | "rejected"
    | "confirmed"
    | "cancelled";
  orderId?: string;
  paymentId?: string;
  paidAt?: string;
  createdAt: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalSpent: number;
}

type TabType = "overview" | "campaigns" | "wishlist" | "chat";

interface UserData {
  _id: string;
  id?: string;
  name: string;
  role: string;
  email?: string;
  image?: string;
}

interface WishlistItem {
  _id: string;
  name: string;
  images: string[];
  location: {
    address: string;
    city: string;
    state: string;
  };
  pricePerMonth: number;
}

interface ChatMessage {
  _id: string;
  sender?: string | { _id: string; role?: string; name?: string } | null;
  receiver?: string | { _id: string; role?: string; name?: string } | null;
  content: string;
  status?: "unread" | "read" | "archived";
  createdAt?: string;
}

interface NotificationItem {
  id: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  bookingId?: string;
  hoardingId?: string;
}

const getBookingStatusClasses = (status: Booking["status"]) => {
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

function BuyerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
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
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Additional dynamic data
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const getMessageParty = (
    party?: string | { _id: string; role?: string; name?: string } | null,
  ) => (typeof party === "string" ? { _id: party } : party);
  const currentUserId = user?._id || user?.id;

  const adminNotifications: NotificationItem[] = messages
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
      timestamp: msg.createdAt
        ? new Date(msg.createdAt).toLocaleString()
        : "Just now",
      isRead: msg.status === "read",
    }));

  const bookingNotifications: NotificationItem[] = notifications.map((item) => ({
    id: item._id,
    text: item.content,
    timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now",
    isRead: item.status === "read",
    bookingId: item.metadata?.bookingId,
    hoardingId: item.metadata?.hoardingId,
  }));

  const allNotifications = [...bookingNotifications, ...adminNotifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesBuyerSearch = (value: string) =>
    !normalizedSearchQuery || value.toLowerCase().includes(normalizedSearchQuery);

  const filteredBookings = bookings.filter((booking) =>
    matchesBuyerSearch(
      [
        booking.hoarding?.name ?? "",
        booking.hoarding?.location.city ?? "",
        booking.hoarding?.location.state ?? "",
        booking.hoarding?.location.address ?? "",
        booking.status,
        booking.startDate,
        booking.endDate,
        String(booking.totalAmount ?? ""),
      ].join(" "),
    ),
  );

  const filteredActiveBookings = activeBookings.filter((booking) =>
    matchesBuyerSearch(
      [
        booking.hoarding?.name ?? "",
        booking.hoarding?.location.city ?? "",
        booking.hoarding?.location.state ?? "",
        booking.hoarding?.location.address ?? "",
        booking.status,
        booking.startDate,
        booking.endDate,
        String(booking.totalAmount ?? ""),
      ].join(" "),
    ),
  );

  const filteredWishlist = wishlist.filter((item) =>
    matchesBuyerSearch(
      [
        item.name,
        item.location.city,
        item.location.state,
        item.location.address,
        String(item.pricePerMonth ?? ""),
      ].join(" "),
    ),
  );

  const markRead = async (id: string) => {
    try {
      const notification = notifications.find((item) => item._id === id);
      if (notification) {
        const res = await fetchWithAuth("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [id] }),
        });

        if (res.ok) {
          setNotifications((prev) =>
            prev.map((item) =>
              item._id === id ? { ...item, status: "read" } : item,
            ),
          );
        }
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
      if (notifications.some((item) => item.status !== "read")) {
        const notificationRes = await fetchWithAuth("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAll: true }),
        });

        if (notificationRes.ok) {
          setNotifications((prev) =>
            prev.map((item) => ({ ...item, status: "read" })),
          );
        }
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
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "wishlist" || tab === "campaigns" || tab === "overview" || tab === "chat") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetchWithAuth("/api/auth/me");
        if (!userRes.ok) {
          router.push("/");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        if (userData.user.role !== "buyer") {
          router.push("/");
          return;
        }

        const bookingsRes = await fetchWithAuth("/api/buyer/bookings");
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
          setActiveBookings(data.activeBookings || []);
          setPastBookings(data.pastBookings || []);
          setStats(
            data.stats || {
              total: 0,
              confirmed: 0,
              pending: 0,
              cancelled: 0,
              totalSpent: 0,
            },
          );
        }

        // Fetch Wishlist
        const wishlistRes = await fetchWithAuth("/api/buyer/wishlist");
        if (wishlistRes.ok) {
          const data = await wishlistRes.json();
          setWishlist(data.wishlist.hoardings || []);
        }

        const notificationsRes = await fetchWithAuth("/api/notifications");
        if (notificationsRes.ok) {
          const data = await notificationsRes.json();
          setNotifications(data.notifications || []);
        }

        // Fetch Messages
        const messagesRes = await fetchWithAuth("/api/messages");
        console.log("[BuyerDashboard] Fetch Messages Status:", messagesRes.status);
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          console.log("[BuyerDashboard] Messages received:", data.messages?.length || 0);
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("[BuyerDashboard] Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Polling for updates
    const pollInterval = setInterval(() => {
      fetchMessages();
      fetchNotifications();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [router]);

  const fetchMessages = async () => {
    try {
      const messagesRes = await fetchWithAuth("/api/messages");
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("[BuyerDashboard] Polling Error:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("[BuyerDashboard] Notification polling error:", error);
    }
  };

  useEffect(() => {
    console.log("[BuyerDashboard] Messages state updated:", messages.length);
  }, [messages]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const removeFromWishlist = async (hoardingId: string) => {
    try {
      const res = await fetchWithAuth("/api/buyer/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoardingId }),
      });
      if (res.ok) {
        setWishlist((prev) => prev.filter((item) => item._id !== hoardingId));
      }
    } catch (error) {
      console.error("Wishlist removal failed", error);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || chatLoading) return;

    setChatLoading(true);
    console.log("[BuyerDashboard] Sending message:", chatMessage);
    try {
      const res = await fetchWithAuth("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatMessage }),
      });

      console.log("[BuyerDashboard] Send Status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[BuyerDashboard] Message sent successfully:", data.data);
        setMessages((prev) => [...prev, data.data]);
        setChatMessage("");
      } else {
        const status = res.status;
        const err = await res.json().catch(() => ({}));
        console.error(`[BuyerDashboard] Send Message failed (${status}):`, err);
      }
    } catch (error) {
      console.error("[BuyerDashboard] Error sending chat:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const handlePayNow = async (booking: Booking) => {
    if (!booking.hoarding?._id || processingBookingId) return;

    setProcessingBookingId(booking._id);
    try {
      const res = await fetchWithAuth("/api/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment initiation failed");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "HoardSpace",
        description: `Premium Booking: ${booking.hoarding.name}`,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/bookings/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            const updatedFields = {
              status: "confirmed" as const,
              paymentId:
                verifyData.booking?.paymentId || response.razorpay_payment_id,
              orderId: verifyData.booking?.orderId || response.razorpay_order_id,
              paidAt: verifyData.booking?.paidAt || new Date().toISOString(),
            };

            setBookings((prev) =>
              prev.map((item) =>
                item._id === booking._id ? { ...item, ...updatedFields } : item,
              ),
            );
            setActiveBookings((prev) =>
              prev.map((item) =>
                item._id === booking._id ? { ...item, ...updatedFields } : item,
              ),
            );
            setPastBookings((prev) =>
              prev.map((item) =>
                item._id === booking._id ? { ...item, ...updatedFields } : item,
              ),
            );
            setStats((prev) => ({
              ...prev,
              confirmed: prev.confirmed + 1,
              pending: Math.max(0, prev.pending - 1),
              totalSpent: prev.totalSpent + booking.totalAmount,
            }));
          } catch (error) {
            console.error("Payment verification failed", error);
            alert(
              error instanceof Error
                ? error.message
                : "Payment verification failed",
            );
          } finally {
            setProcessingBookingId(null);
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", (response: any) => {
        setProcessingBookingId(null);
        alert(
          response?.error?.description || "Payment failed. Please try again.",
        );
      });
    } catch (error) {
      console.error("Payment initiation failed", error);
      alert(
        error instanceof Error ? error.message : "Payment initiation failed",
      );
      setProcessingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#2563eb]" />
          <p className="text-gray-500 font-medium animate-pulse">
            Loading Your Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden" style={{ fontFamily: "'Chiron GoRound TC', sans-serif" }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 items-center pt-4 pb-8 px-4 hidden lg:flex lg:flex-col">
        <div className="mb-2 w-full px-2"></div>

        <nav className="flex-1 w-full space-y-2">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Dashboard" },
            { id: "campaigns", icon: Package, label: "My Campaigns" },
            { id: "wishlist", icon: Heart, label: "Wishlist" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]"
                  : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <item.icon
                size={22}
                className={
                  activeTab === item.id
                    ? "text-white"
                    : "group-hover:scale-110 transition-transform"
                }
              />
              <span className="font-bold text-sm tracking-wide">
                {item.label}
              </span>
              {activeTab === item.id && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>
          ))}
        </nav>

        <div className="w-full pt-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
          >
            <LogOut
              size={22}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="hidden md:flex relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns, dates, locations..."
                className="pl-11 pr-6 py-2.5 bg-white border-2 border-blue-500 rounded-none w-96 text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 font-bold placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
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
                    {allNotifications.length > 0 ? (
                      allNotifications.map((notif) => (
                        <div 
                          key={notif.id}
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
                  {allNotifications.length > 0 && unreadCount > 0 && (
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
                <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{user?.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Premium Buyer
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl p-[2px] transition-transform group-hover:scale-105 overflow-hidden">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
                  <div className="w-full h-full bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black overflow-hidden">
                    {user?.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0].toUpperCase()
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
              {/* Removed Welcome Banner */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                    <IndianRupee size={28} />
                  </div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    Total Advertising Spend
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-gray-900">
                      ₹{stats.totalSpent.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Package size={28} />
                  </div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    Ongoing Campaigns
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-gray-900">
                      {activeBookings.length}
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                    <Clock size={28} />
                  </div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    Pending Inquiries
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-gray-900">
                      {stats.pending}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-gray-900">
                      Recent Campaigns
                    </h3>
                    <button
                      onClick={() => setActiveTab("campaigns")}
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {filteredActiveBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking._id}
                        className="p-4 bg-gray-50/50 rounded-2xl flex items-center gap-6 border border-transparent hover:border-blue-100 transition-all"
                      >
                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100 p-1">
                          <img
                            src={
                              booking.hoarding?.images[0] || "/placeholder.jpg"
                            }
                            className="w-full h-full object-cover rounded-lg"
                            alt="hoarding"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">
                            {booking.hoarding?.name || "Deleted Location"}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {booking.hoarding?.location.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900">
                            ₹{booking.totalAmount.toLocaleString()}
                          </p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${getBookingStatusClasses(booking.status)}`}>{booking.status}</span>
                        </div>
                      </div>
                    ))}
                    {filteredActiveBookings.length === 0 && <p className="text-center py-10 text-gray-400 font-medium">No matching active campaigns</p>}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-gray-900">
                    Quick Tools
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/"
                      className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                      <Search className="text-gray-400" size={24} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Explore</span>
                    </Link>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                      <MessageSquare className="text-gray-400" size={24} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Help
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "campaigns" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                Your Campaigns
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all p-5 group"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-2xl overflow-hidden shrink-0 border border-gray-50">
                        <img
                          src={booking.hoarding?.images[0] || "/placeholder.jpg"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt="campaign"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-black text-gray-900">
                          {booking.hoarding?.name || "Deleted Location"}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium">
                          {booking.hoarding?.location.city},{" "}
                          {booking.hoarding?.location.state}
                        </p>
                        <div className="flex justify-between items-center pt-2">
                          <p className="text-lg font-black text-blue-600">
                            ₹{booking.totalAmount.toLocaleString()}
                          </p>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${getBookingStatusClasses(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-400">
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-3">
                          {booking.hoarding?._id && (
                            <Link
                              href={`/hoardings/${booking.hoarding._id}`}
                              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              View Listing
                            </Link>
                          )}
                          {booking.status === "approved" && booking.hoarding?._id && (
                            <button
                              type="button"
                              onClick={() => handlePayNow(booking)}
                              disabled={processingBookingId === booking._id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {processingBookingId === booking._id ? "Processing..." : "Pay Now"}
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                        {(booking.paymentId || booking.orderId || booking.paidAt) && (
                          <div className="pt-1 space-y-1">
                            {booking.orderId && (
                              <p className="text-[10px] font-medium text-gray-400 break-all">
                                Order ID: <span className="font-mono">{booking.orderId}</span>
                              </p>
                            )}
                            {booking.paymentId && (
                              <p className="text-[10px] font-medium text-green-600 break-all">
                                Payment ID: <span className="font-mono">{booking.paymentId}</span>
                              </p>
                            )}
                            {booking.paidAt && (
                              <p className="text-[10px] font-medium text-gray-400">
                                Paid on {new Date(booking.paidAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] font-medium text-gray-500">
                          {booking.status === "requested" && "Waiting for vendor approval before payment is enabled."}
                          {booking.status === "approved" && "Vendor approved this request. You can now pay to confirm it."}
                          {booking.status === "rejected" && "Vendor rejected this request. It may reopen if they change their decision."}
                          {booking.status === "confirmed" && "Payment completed and your campaign is confirmed."}
                          {booking.status === "cancelled" && "This booking is no longer active."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                   <div className="md:col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <Package size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-bold">
                        {searchQuery.trim()
                          ? "No campaigns match your search"
                          : "You haven&apos;t booked any campaigns yet"}
                      </p>
                      <Link href="/" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Start Exploring</Link>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
               <h2 className="text-4xl font-black text-gray-900 tracking-tight">Saved for Later</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWishlist.map((item) => (
                    <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                       <div className="h-44 relative overflow-hidden">
                          <img src={item.images[0] || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <button 
                            onClick={() => removeFromWishlist(item._id)}
                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                       <div className="p-4 space-y-3">
                          <h4 className="font-black text-gray-900 line-clamp-1">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                             <MapPin size={12} /> {item.location.city}
                          </p>
                          <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                             <p className="text-lg font-black text-gray-900">₹{item.pricePerMonth.toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                             <Link href={`/hoardings/${item._id}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                <ArrowUpRight size={18}/>
                             </Link>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               {filteredWishlist.length === 0 && (
                 <div className="text-center pt-20">
                    <Heart size={80} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-gray-400 font-bold text-lg">
                      {searchQuery.trim() ? "No wishlist items match your search" : "Your Wishlist is Empty"}
                    </p>
                    <Link href="/" className="mt-8 inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-blue-100">Find Locations</Link>
                 </div>
               )}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="animate-in fade-in zoom-in-95 duration-500 h-[calc(100vh-220px)] flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden relative">
              <div className="p-8 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white relative">
                    <User size={28} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Admin Support</h3>
                    <p className="text-xs font-bold text-green-500 uppercase tracking-widest">
                      Online
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30">
                {messages.length === 0 && (
                  <div className="text-center py-20 opacity-50 space-y-2">
                    <MessageSquare size={48} className="mx-auto text-gray-300" />
                    <p className="font-bold text-gray-400">Start a conversation with us</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      getMessageParty(msg.sender)?._id === currentUserId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-6 rounded-[28px] ${
                        getMessageParty(msg.sender)?._id === currentUserId
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-50 rounded-tr-none"
                          : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none font-medium text-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-white border-t border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={chatLoading}
                    placeholder={chatLoading ? "Sending..." : "Type your message..."}
                    className="w-full pl-8 pr-20 py-5 bg-gray-50 border-none rounded-2xl text-sm outline-none font-medium"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={chatLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {chatLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BuyerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 animate-spin text-[#2563eb]" /><p className="text-gray-500 font-medium animate-pulse">Loading Your Portal...</p></div></div>}>
      <BuyerDashboardContent />
    </Suspense>
  );
}
