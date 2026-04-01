"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronDown, List, Map as MapIcon, User, Tag } from "lucide-react";

export default function ExploreClient({ initialHoardings, initialCity = "" }: { initialHoardings: any[], initialCity?: string }) {
  const [hoardings, setHoardings] = useState(initialHoardings);
  const [searchQuery, setSearchQuery] = useState(initialCity.toLowerCase());
  
  // Dummy filtering state purely for UI mimicry
  const [locationOpen, setLocationOpen] = useState(true);
  const [adOptionsOpen, setAdOptionsOpen] = useState(true);
  const [litOpen, setLitOpen] = useState(true);

  // Filter hoardings (mock client-side filtering)
  const filteredHoardings = hoardings.filter((h) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(query) ||
      h.location.city.toLowerCase().includes(query) ||
      h.location.area.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-[#2563eb] font-medium">Outdoor</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white border-r border-gray-100 lg:pr-6 h-full min-h-[600px]">
            <h2 className="text-xl font-bold text-gray-900 mb-6 font-sans">Filters</h2>

            {/* LOCATION Filter */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <button 
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center justify-between w-full text-left font-bold text-slate-700 uppercase tracking-widest text-xs mb-4"
              >
                LOCATION
                <ChevronDown className={`w-4 h-4 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {locationOpen && (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-400 uppercase font-bold tracking-wider">Type to search</span>
                    <select
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">All Cities, Pan India...</option>
                      <option value="bhubaneswar">Bhubaneswar, Odisha</option>
                      <option value="cuttack">Cuttack, Odisha</option>
                      <option value="rourkela">Rourkela, Odisha</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* AD OPTIONS Filter */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <button 
                onClick={() => setAdOptionsOpen(!adOptionsOpen)}
                className="flex items-center justify-between w-full text-left font-bold text-slate-700 uppercase tracking-widest text-xs mb-4"
              >
                AD OPTIONS
                <ChevronDown className={`w-4 h-4 transition-transform ${adOptionsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {adOptionsOpen && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-blue-500 transition-colors"></div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">Printing Charges <span className="text-gray-400 text-xs ml-1">(3155)</span></span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-blue-500 transition-colors"></div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">Mounting Charges <span className="text-gray-400 text-xs ml-1">(3155)</span></span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-[6px] border-blue-500 transition-colors"></div>
                    <span className="text-sm text-gray-900 font-medium">Bus Shelter <span className="text-gray-400 text-xs ml-1 font-normal">(2750)</span></span>
                  </label>
                  <button className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-2 hover:underline">5 More</button>
                </div>
              )}
            </div>

            {/* LIT/NONLIT Filter */}
            <div className="mb-6">
              <button 
                onClick={() => setLitOpen(!litOpen)}
                className="flex items-center justify-between w-full text-left font-bold text-slate-700 uppercase tracking-widest text-xs mb-4"
              >
                LIT/NONLIT
                <ChevronDown className={`w-4 h-4 transition-transform ${litOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {litOpen && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded border-2 border-gray-300 group-hover:border-blue-500 transition-colors"></div>
                    <span className="text-sm text-gray-600 uppercase font-medium group-hover:text-gray-900">Non Lit <span className="text-gray-400 text-xs normal-case ml-1">(1864)</span></span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <main className="flex-1">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
            <h1 className="text-3xl md:text-5xl font-sans font-black text-slate-900 tracking-tighter antialiased">
              Outdoor Advertising <span className="text-[#2563eb]">Agency</span>
            </h1>
            
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full md:w-auto mt-4 md:mt-0">
              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider border-r border-gray-200 hover:bg-gray-100 transition-colors shadow-inner">
                  <List size={14} /> List
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-500 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors">
                  <MapIcon size={14} /> Map
                </button>
              </div>

              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[200px]">
                  <option>Sort by : Top Searched</option>
                  <option>Sort by : Price Low to High</option>
                  <option>Sort by : Price High to Low</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHoardings.map((hoarding, idx) => {
              const sampleImages = [
                'https://res.cloudinary.com/dpju1wia5/image/upload/v1774848145/v4malipjjxwiovgncshj.png',
                'https://res.cloudinary.com/dpju1wia5/image/upload/v1774848146/rcmhjqgezin7s7hbsiii.png',
              ];
              const placeholderImage = sampleImages[idx % sampleImages.length];
              if (
                !(typeof hoarding.minimumBookingAmount === "number" &&
                hoarding.minimumBookingAmount > 0)
              ) {
                hoarding.minimumBookingAmount = hoarding.pricePerMonth || 0;
              }

              return (
              <Link href={`/hoardings/${hoarding._id}`} key={hoarding._id}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
                  {/* Image */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                    <Image
                      src={hoarding.images?.[0] || placeholderImage}
                      alt={hoarding.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-[15px] font-bold text-slate-900 mb-2 leading-tight line-clamp-1">
                      {hoarding.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {hoarding.location.address}, {hoarding.location.city}
                    </p>

                    <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-3 text-slate-600">
                        <User className="w-4 h-4 text-[#2563eb]" />
                        <span className="text-sm font-medium">
                          {typeof hoarding.uniqueReach === "number" &&
                          hoarding.uniqueReach > 0
                            ? `${hoarding.uniqueReach.toLocaleString("en-IN")} Unique Reach`
                            : typeof hoarding.uniqueFootfall === "number" &&
                                hoarding.uniqueFootfall > 0
                              ? `${hoarding.uniqueFootfall.toLocaleString("en-IN")} Footfall`
                              : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Tag className="w-4 h-4 text-[#2563eb]" />
                        <span className="text-sm font-medium">
                          ₹ {hoarding.minimumBookingAmount ? hoarding.minimumBookingAmount.toLocaleString('en-IN') : '23,800'} Min Spend
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}

            {filteredHoardings.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                <p className="font-bold mb-2">No hoardings match your search criteria.</p>
                <p className="text-sm">Try widening your search inputs.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
