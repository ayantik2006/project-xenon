import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const LOCATIONS = [
  { 
    name: "Mumbai, Bandra West", 
    type: "Premium Billboard", 
    image: "https://images.unsplash.com/photo-1559828330-9b3de57c1692?auto=format&fit=crop&q=80&w=800" 
  },
  { 
    name: "Delhi, Connaught Place", 
    type: "Digital Screen", 
    image: "https://images.unsplash.com/photo-1542316652-3eb0072b2512?auto=format&fit=crop&q=80&w=800" 
  },
  { 
    name: "Bengaluru, MG Road", 
    type: "Unipole", 
    image: "https://images.unsplash.com/photo-1601334415516-e4ef7d8b512c?auto=format&fit=crop&q=80&w=800" 
  },
];

export default function TopCities() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-[28px] font-bold text-[#0f172a] tracking-tight">Featured Locations</h2>
        <Link 
          href="/explore" 
          className="group flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
        >
          Explore
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LOCATIONS.map((loc, index) => (
          <div key={index} className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Image */}
            <div className="relative h-[220px] w-full bg-gray-100">
              <img 
                src={loc.image}
                alt={loc.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-1">
                <MapPin size={16} className="text-gray-400 stroke-[2.5]" />
                <span className="text-[15px]">{loc.name}</span>
              </div>
              <div className="text-slate-500 text-[14px] mb-6 font-medium">
                {loc.type}
              </div>
              
              <div className="mt-auto">
                <Link 
                  href={`/explore?location=${encodeURIComponent(loc.name)}`}
                  className="inline-block bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

