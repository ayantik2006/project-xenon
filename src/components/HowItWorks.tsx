"use client";

import { useState } from "react";
import { 
  Building2, 
  Store, 
  Search, 
  BarChart, 
  CalendarCheck, 
  LayoutDashboard,
  PlusSquare,
  Globe,
  CheckCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"agencies" | "vendors">("agencies");

  const agencySteps = [
    {
      icon: <Search className="w-8 h-8 text-blue-600" />,
      title: "1. Discover Hoardings",
      description: "Search hoardings by city, location, traffic, and budget to find the most relevant advertising spaces.",
      color: "bg-blue-100"
    },
    {
      icon: <BarChart className="w-8 h-8 text-blue-600" />,
      title: "2. Evaluate Options",
      description: "Explore images, specifications, pricing, and real-time availability to make informed decisions.",
      color: "bg-blue-100"
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-blue-600" />,
      title: "3. Book Instantly",
      description: "Select your preferred hoarding, choose your campaign dates, and confirm your booking seamlessly online.",
      color: "bg-blue-100"
    },
    {
      icon: <LayoutDashboard className="w-8 h-8 text-blue-600" />,
      title: "4. Track & Manage",
      description: "Monitor bookings, campaign timelines, and performance from a single dashboard, with regular updates including monthly photos of your hoardings.",
      color: "bg-blue-100"
    }
  ];

  const vendorSteps = [
    {
      icon: <PlusSquare className="w-8 h-8 text-orange-600" />,
      title: "1. List Your Hoardings",
      description: "Add your inventory with photos, location, size, pricing, and availability to showcase your spaces.",
      color: "bg-orange-100"
    },
    {
      icon: <Globe className="w-8 h-8 text-orange-600" />,
      title: "2. Get Discovered",
      description: "Reach advertisers and agencies actively searching for hoarding spaces across cities.",
      color: "bg-orange-100"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-orange-600" />,
      title: "3. Receive & Confirm Bookings",
      description: "Get booking requests from verified clients and confirm them seamlessly through the platform.",
      color: "bg-orange-100"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
      title: "4. Manage Inventory & Earnings",
      description: "Update availability, manage bookings, track revenue, and monitor performance from a single dashboard.",
      color: "bg-orange-100"
    }
  ];

  const currentSteps = activeTab === "agencies" ? agencySteps : vendorSteps;
  const isAgencies = activeTab === "agencies";

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 relative border-t border-slate-200">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-sm font-black text-blue-700 tracking-[0.2em] uppercase mb-4"></h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-slate-900 tracking-tight mb-6">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500">Works</span>
          </h3>
          <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed">
            A streamlined, transparent platform built for advertisers booking spaces and vendors scaling their revenue.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-20">
          <div className="inline-flex flex-col sm:flex-row bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-full md:w-auto">
            <button
              onClick={() => setActiveTab("agencies")}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-md text-base font-bold transition-all duration-200 w-full sm:w-auto ${
                isAgencies 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Building2 size={22} className={isAgencies ? "text-white" : "text-slate-400"} />
              For Ad Agencies & Brands
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-md text-base font-bold transition-all duration-200 w-full sm:w-auto mt-2 sm:mt-0 ${
                !isAgencies 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Store size={22} className={!isAgencies ? "text-white" : "text-slate-400"} />
              For Hoarding Vendors
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-slate-200 -z-10"></div>
          
          {currentSteps.map((step, index) => (
            <div 
              key={index} 
              className={`relative group bg-white p-8 border-2 rounded-none hover:shadow-xl transition-all duration-300 ${
                isAgencies ? 'border-slate-200 hover:border-blue-500' : 'border-slate-200 hover:border-slate-800'
              } ${index % 2 === 0 ? 'lg:-translate-y-6' : 'lg:translate-y-6'}`}
            >
              <div className="flex flex-col items-start h-full text-left">
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-none flex items-center justify-center mb-8 border ${isAgencies ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                  {step.icon}
                </div>
                
                {/* Text Content */}
                <h4 className="text-xl font-black text-slate-900 mb-3">{step.title}</h4>
                <p className="text-slate-700 leading-relaxed text-base font-medium flex-grow">
                  {step.description}
                </p>
                
                {/* Arrow */}
                {index < currentSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-5 top-[60px] -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center z-10 text-slate-400">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
