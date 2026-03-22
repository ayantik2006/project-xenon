"use client";

import { useEffect, useState } from "react";
import dbConnect from "@/lib/dbConnect";
import Hoarding from "@/models/Hoarding";
import HoardingsClient from "@/components/HoardingsClient";
import SearchBar from "@/components/SearchBar";
import { 
  Mail, 
  Send, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  Target,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function Home() {
  const [hoardings, setHoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: "", email: "", content: "" });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchHoardings = async () => {
      try {
        const res = await fetch("/api/hoardings");
        if (res.ok) {
          const data = await res.json();
          // Filter only approved ones for home page
          setHoardings(data.hoardings.filter((h: any) => h.status === "approved"));
        }
      } catch (error) {
        console.error("Failed to fetch hoardings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHoardings();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contactForm, type: "query" }),
      });
      if (res.ok) {
        setSuccess(true);
        setContactForm({ name: "", email: "", content: "" });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Contact failed", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD]">
      {/* Hero Section */}
      <div className="relative bg-[#2563eb] text-white py-24 md:py-36 px-6 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 opacity-20">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-300 rounded-full blur-[80px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <TrendingUp size={14} className="text-blue-200" />
            Leading Outdoor Advertising Platform
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black leading-tight tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-700">
            Find the Perfect <br />
            <span className="text-blue-200">Hoarding Space</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-medium leading-relaxed opacity-90">
             Discover and book premium outdoor advertising locations across top cities in India with instant verification and secure booking.
          </p>

          <div className="w-full max-w-5xl pt-4">
            <SearchBar />
          </div>
        </div>
      </div>
      {/* Featured Cities & Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: Target, title: "High Reach", desc: "Access premium high-traffic locations" },
           { icon: ShieldCheck, title: "Verified Media", desc: "100% verified hoarding inventory" },
           { icon: MessageSquare, title: "24/7 Support", desc: "Direct communication with admins" }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-100/50 border border-blue-50 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                 <stat.icon size={32} />
              </div>
              <div>
                 <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{stat.title}</h4>
                 <p className="text-sm text-gray-500 font-medium">{stat.desc}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Browse Inventory */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
           <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Browse Locations</h2>
              <p className="text-gray-500 font-medium text-lg">Premium outdoor media spaces waiting for your brand</p>
           </div>
           <div className="flex gap-4">
              <div className="h-[2px] w-24 bg-blue-600 rounded-full mb-3 self-end hidden md:block"></div>
           </div>
        </div>

        {loading ? (
           <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Scanning Network...</p>
           </div>
        ) : (
           <HoardingsClient hoardings={hoardings} />
        )}
      </div>

      {/* Contact / Inquiry Section */}
      <section className="bg-white py-24 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
               <div className="space-y-4">
                  <h3 className="text-4xl font-black text-gray-900 tracking-tight">Have a Specific <br />Requirement?</h3>
                  <p className="text-gray-500 font-medium text-lg leading-relaxed">
                     Our experts are here to help you find the best advertising locations for your campaign goals. Send us a query and we&apos;ll get back to you within 24 hours.
                  </p>
               </div>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4 text-gray-900">
                     <div className="w-12 h-12 bg-[#F8F9FD] rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                        <Mail size={20} />
                     </div>
                     <p className="font-bold">support@hoardspace.com</p>
                  </div>
                  <div className="flex items-center gap-4 text-gray-900">
                     <div className="w-12 h-12 bg-[#F8F9FD] rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                        <Phone size={20} />
                     </div>
                     <p className="font-bold">+91 98765 43210</p>
                  </div>
               </div>
            </div>

            <div className="bg-[#F8F9FD] p-10 rounded-[40px] border border-blue-50 shadow-2xl shadow-blue-100/20 relative overflow-hidden">
               {/* Success Overlay */}
               {success && (
                 <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                       <CheckCircle size={48} />
                    </div>
                    <h4 className="text-2xl font-black text-gray-900">Query Received!</h4>
                    <p className="text-gray-500 font-medium mt-2">Our team will contact you shortly.</p>
                 </div>
               )}

               <form onSubmit={handleContactSubmit} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2 italic">Full Name</label>
                        <input 
                           required
                           type="text" 
                           placeholder="John Doe"
                           className="w-full px-6 py-4 bg-white border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-200 transition-all font-bold text-gray-700" 
                           value={contactForm.name}
                           onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2 italic">Work Email</label>
                        <input 
                           required
                           type="email" 
                           placeholder="john@brand.com"
                           className="w-full px-6 py-4 bg-white border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-200 transition-all font-bold text-gray-700" 
                           value={contactForm.email}
                           onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2 italic">How can we help?</label>
                     <textarea 
                        required
                        rows={4}
                        placeholder="I'm looking for hoardings in Mumbai for a 2-month campaign starting next week..."
                        className="w-full px-6 py-4 bg-white border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-200 transition-all font-bold text-gray-700 resize-none"
                        value={contactForm.content}
                        onChange={(e) => setContactForm({ ...contactForm, content: e.target.value })}
                     ></textarea>
                  </div>
                  
                  <button 
                     disabled={sending}
                     type="submit" 
                     className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                     {sending ? <Loader2 className="animate-spin" size={24} /> : (
                        <>Send Inquiry <Send size={20} /></>
                     )}
                  </button>
               </form>
            </div>
         </div>
      </section>

      {/* Footer Branding */}
      <footer className="bg-[#F8F9FD] pt-24 pb-12 border-t border-gray-100 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">H</div>
               <span className="text-2xl font-black text-gray-900 tracking-tight">HoardSpace</span>
            </div>
            <p className="text-gray-400 text-sm font-medium italic">Empowering India&apos;s Premium Outdoor Media Reach</p>
            <div className="flex gap-8 text-sm font-bold text-gray-600">
               <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Dashboard</a>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">© 2024 HoardSpace India Pvt Ltd</p>
         </div>
      </footer>
    </div>
  );
}
