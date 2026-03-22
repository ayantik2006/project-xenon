"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
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
  Download,
  MoreVertical,
  XCircle,
  X,
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "listings" | "sold" | "chat">("dashboard");
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<{ status: number; text: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; hoardingId: string | null; hoardingName: string }>({ 
    isOpen: false, hoardingId: null, hoardingName: "" 
  });
  const [deleting, setDeleting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
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
    images: [""]
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

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
        pricePerMonth: Number(newHoarding.pricePerMonth)
      };

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
          width: 0,
          height: 0,
          type: "Billboard",
          lightingType: "Lit",
          pricePerMonth: 0,
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium animate-pulse">Initializing Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FD] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 items-center py-8 px-4 hidden lg:flex lg:flex-col">
        <div className="mb-10 w-full px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            H
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-800">HoardSpace</span>
        </div>

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
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Admin Chat" 
            active={activeTab === "chat"} 
            onClick={() => setActiveTab("chat")} 
          />
        </nav>

        <div className="w-full mt-auto pt-4 border-t border-gray-100">
          <button 
            onClick={() => router.push("/vendor/add-hoarding")}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <PlusCircle size={18} /> New Hoarding
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#F8F9FD]">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">
              {activeTab === "dashboard" ? "Vendor Overview" : activeTab === "listings" ? "Hoarding Inventory" : activeTab === "sold" ? "Confirmed Bookings" : "Admin Communication"}
            </h1>
            <div className="relative max-w-md w-full ml-4 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search listings, locations, orders..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg relative">
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
              <MessageSquare size={20} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg pr-3 transition-colors">
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <User size={20} />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none">{userData?.name || "Vendor"}</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Active Portal</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-8 pb-12 max-w-7xl mx-auto">
          {activeTab === "dashboard" && <Overview bookings={bookings} hoardings={hoardings} setActiveTab={setActiveTab} setIsAddModalOpen={setIsAddModalOpen} />}
          {activeTab === "listings" && <Listings hoardings={hoardings} setHoardings={setHoardings} setDeleteModal={setDeleteModal} setIsAddModalOpen={setIsAddModalOpen} />}
          {activeTab === "sold" && <SoldBookings bookings={bookings} />}
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
                      <MapPin size={12} /> {showMap ? "Hide Map" : "Pin on Map"}
                    </button>
                  </div>

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
                       <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                        value={newHoarding.city}
                        onChange={(e) => setNewHoarding({...newHoarding, city: e.target.value})}
                       />
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
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Price / Month</label>
                     <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                        <input 
                          required
                          type="number" 
                          className="w-full pl-10 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                          value={newHoarding.pricePerMonth}
                          onChange={(e) => setNewHoarding({...newHoarding, pricePerMonth: e.target.value})}
                        />
                     </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block">Property Images (URLs)</label>
                  {newHoarding.images.map((url: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="https://images.cloudinary.com/..."
                        className="flex-1 px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-700"
                        value={url}
                        onChange={(e) => {
                          const updated = [...newHoarding.images];
                          updated[index] = e.target.value;
                          setNewHoarding({...newHoarding, images: updated});
                        }}
                      />
                      {index === newHoarding.images.length - 1 ? (
                        <button 
                          type="button"
                          onClick={() => setNewHoarding({...newHoarding, images: [...newHoarding.images, ""]})}
                          className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
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
                          className="p-4 bg-red-50 text-red-50 rounded-2xl hover:bg-red-100 transition-colors"
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

function Overview({ bookings, hoardings, setActiveTab, setIsAddModalOpen }: { bookings: Booking[]; hoardings: Hoarding[]; setActiveTab: (t: any) => void; setIsAddModalOpen: (o: boolean) => void }) {
  const revenue = bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + b.totalAmount, 0);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-blue-600 p-8 rounded-3xl text-white overflow-hidden relative shadow-xl shadow-blue-100">
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold mb-1">Congratulations, Vendor!</h2>
          <p className="text-blue-100 text-sm opacity-90">Your listings have reached over 12.4k potential buyers this month.</p>
          <button className="mt-6 px-6 py-2.5 bg-white text-blue-600 rounded-full font-bold text-xs hover:bg-blue-50 transition-colors">
            View Analytics Detail
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-blue-500/20 to-transparent pointer-events-none"></div>
        <div className="flex flex-col items-center justify-center bg-blue-500/30 backdrop-blur-md px-10 py-6 rounded-3xl border border-blue-400/50 relative z-10 min-w-[200px]">
          <span className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Portal Score</span>
          <p className="text-4xl font-black">98 <span className="text-sm font-medium">pts</span></p>
          <button className="mt-4 text-[10px] font-bold uppercase tracking-widest hover:underline">Explore More</button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Revenue" value={`₹${revenue.toLocaleString()}`} subtext="ROI: 12x" type="revenue" />
        <MetricCard title="Active Listings" value={hoardings.length.toString()} subtext="2 pending approval" />
        <MetricCard title="Confirmed Bookings" value={bookings.filter(b => b.status === "confirmed").length.toString()} subtext="View details" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metric Comparison Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Metrics Comparison</h3>
              <p className="text-xs text-gray-400 font-medium">Revenue vs Month (2025)</p>
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-[11px] font-bold text-gray-500 outline-none">
                <option>Year 2025</option>
                <option>Year 2024</option>
              </select>
              <button className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-gray-100">
                <Download size={14} /> Download
              </button>
            </div>
          </div>
          
          {/* SVG Line Chart (Simple Mockup) */}
          <div className="h-64 w-full mt-10 relative group">
             <svg viewBox="0 0 800 200" className="w-full h-full">
               <path 
                d="M 50 150 Q 150 140, 200 80 T 350 100 T 500 40 T 650 90 T 750 40" 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="4"
                strokeLinecap="round"
                className="drop-shadow-lg"
               />
               <path 
                d="M 50 150 Q 150 140, 200 80 T 350 100 T 500 40 T 650 90 T 750 40 L 750 200 L 50 200 Z" 
                fill="url(#gradient)" 
                opacity="0.1"
               />
               <defs>
                 <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="#2563eb" />
                   <stop offset="100%" stopColor="transparent" />
                 </linearGradient>
               </defs>
               {/* Points */}
               <circle cx="200" cy="80" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
               <circle cx="350" cy="100" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
               <circle cx="500" cy="40" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
               <circle cx="750" cy="40" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
             </svg>
             <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10 text-[10px] font-bold text-gray-400 mt-4">
               <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
             </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">52 INQUIRIES</span>
          </div>
          
          <div className="space-y-2 mb-8">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-50 mb-2"
            >
              Add Listing
            </button>
            <button className="w-full py-3 bg-white text-gray-700 border border-gray-100 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all">
              New Booking Enquiry
            </button>
          </div>

          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent Bookings</h4>
          <div className="space-y-4">
            {bookings.slice(0, 3).map((b, i) => (
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

function Listings({ hoardings, setHoardings, setDeleteModal, setIsAddModalOpen }: any) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Your Inventory</h2>
          <p className="text-sm text-gray-500 font-medium">Manage and monitor all your listed hoardings.</p>
        </div>
        <div className="flex gap-2">
          <button 
           onClick={() => setIsAddModalOpen(true)}
           className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
          >
            <PlusCircle size={16} /> Add Hoarding
          </button>
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

function ChatBox({ messages, onSend, userData, loading }: any) {
  const [msg, setMsg] = useState("");

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
          <div key={i} className={`flex ${chat.sender === userData?._id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-6 py-4 rounded-[24px] text-sm ${
              chat.sender === userData?._id 
                ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-100" 
                : "bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm"
            }`}>
              <p className="font-medium leading-relaxed">{chat.content}</p>
              <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-widest ${chat.sender === userData?._id ? "text-blue-100" : "text-gray-400"}`}>
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
