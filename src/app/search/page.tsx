"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Home, X, Ruler, IndianRupee, ChevronRight } from "lucide-react";
import BookNowButton from "@/components/BookNowButton";
import AuthModal from "@/components/AuthModal";

interface Hoarding {
  _id: string;
  name: string;
  description?: string;
  location: {
    address: string;
    city: string;
    area: string;
    state: string;
  };
  type: string;
  images: string[];
  pricePerMonth: number;
  minimumBookingAmount: number;
  dimensions: {
    width: number;
    height: number;
  };
  owner: {
    _id: string;
    name: string;
  };
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const city = searchParams.get("city");
  const type = searchParams.get("type");

  const [hoardings, setHoardings] = useState<Hoarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function fetchHoardings() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (city) params.append("city", city);
        if (type) params.append("type", type);

        const response = await fetch(`/api/hoardings?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setHoardings(data.hoardings || []);
        }
      } catch (error) {
        console.error("Error fetching hoardings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHoardings();
  }, [city, type]);

  const clearFilters = () => {
    router.push("/search");
  };

  const removeFilter = (filterType: "city" | "type") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filterType);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header with active filters */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-800">
                  Search Results
                </h1>
                {!loading && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {hoardings.length}{" "}
                    {hoardings.length === 1 ? "hoarding" : "hoardings"} found
                  </span>
                )}
              </div>

              {(city || type) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Filters:
                  </span>
                  {city && (
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold flex items-center gap-1">
                      📍 {city}
                      <button
                        onClick={() => removeFilter("city")}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {type && (
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold flex items-center gap-1">
                      🎯 {type}
                      <button
                        onClick={() => removeFilter("type")}
                        className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-red-600 font-medium underline ml-2 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar Filters (Sticky) */}
            <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-32 h-fit">
              <div className="bg-white border text-gray-800 rounded-3xl p-6 h-full shadow-sm border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Filters</h2>
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-100">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Location</p>
                    <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                      {city || "All Cities"}
                    </div>
                  </div>
                  <div className="pb-6 border-b border-gray-100">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Hoarding Type</p>
                    <div className="text-sm font-bold text-purple-600 bg-purple-50 px-4 py-3 rounded-xl border border-purple-100">
                      {type || "All Types"}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link href="/explore" className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                      More detailed filters <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading hoardings...</p>
                </div>
              ) : hoardings.length === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                    <Home size={64} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      No hoardings found
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your filters or{" "}
                      {(city || type) && (
                        <button
                          onClick={clearFilters}
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          clear all filters
                        </button>
                      )}
                    </p>
                    <Link
                      href="/"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hoardings.map((hoarding) => (
                <div
                  key={hoarding._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full"
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden shrink-0">
                    {hoarding.images && hoarding.images.length > 0 ? (
                      <img
                        src={hoarding.images[0]}
                        alt={hoarding.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#2563eb] uppercase shadow-sm">
                      {hoarding.type}
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex flex-col grow">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {hoarding.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={14} className="shrink-0" />
                        <span className="line-clamp-1">
                          {hoarding.location.address}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-50 mt-auto">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                          Dimensions
                        </p>
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium text-sm">
                          <Ruler size={14} className="text-[#2563eb]" />
                          {hoarding.dimensions.width}' x{" "}
                          {hoarding.dimensions.height}'
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                          Pricing
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex items-center font-bold text-gray-900 text-sm">
                            <IndianRupee size={12} className="mt-0.5" />
                            {hoarding.pricePerMonth.toLocaleString(
                              "en-IN",
                            )}{" "}
                            <span className="text-xs font-normal text-gray-400 ml-1">
                              /mo
                            </span>
                          </div>
                          {(hoarding.minimumBookingAmount || 0) > 0 && (
                            <div className="text-xs text-blue-600 font-medium">
                              Min Booking: ₹
                              {hoarding.minimumBookingAmount.toLocaleString(
                                "en-IN",
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <BookNowButton
                      hoardingId={hoarding._id}
                      onAuthRequired={() => setShowAuthModal(true)}
                    />
                  </div>
                </div>
              ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading search results...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
