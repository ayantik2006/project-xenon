"use client";

import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from "lucide-react";

export default function ContactPage() {

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-sm font-black text-blue-700 tracking-[0.2em] uppercase mb-4">Contact Us</h2>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500">Touch</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative">
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-slate-200 -z-10"></div>
          
          <div className="relative group bg-white p-8 border-2 border-slate-200 hover:border-blue-500 rounded-none hover:shadow-xl transition-all duration-300 lg:-translate-y-6">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 flex items-center justify-center mb-8">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Email</h3>
            <p className="text-slate-700 leading-relaxed text-base font-medium mb-3">
              For bookings and inquiries
            </p>
            <a
              href="mailto:bookings@hoardspace.in"
              className="text-blue-600 font-bold hover:text-blue-800 transition-colors break-all flex items-center gap-1"
            >
              bookings@hoardspace.in
            </a>
          </div>

          <div className="relative group bg-white p-8 border-2 border-slate-200 hover:border-green-500 rounded-none hover:shadow-xl transition-all duration-300 lg:translate-y-6">
            <div className="w-14 h-14 bg-green-50 border border-green-100 flex items-center justify-center mb-8">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Phone</h3>
            <p className="text-slate-700 leading-relaxed text-base font-medium mb-3">
              Mon-Fri from 9am to 6pm
            </p>
            <a
              href="tel:+917655052057"
              className="text-green-600 font-bold hover:text-green-800 transition-colors flex items-center gap-1"
            >
              7655-052057
            </a>
          </div>

          <div className="relative group bg-white p-8 border-2 border-slate-200 hover:border-emerald-500 rounded-none hover:shadow-xl transition-all duration-300 lg:-translate-y-6">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-8">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">WhatsApp</h3>
            <p className="text-slate-700 leading-relaxed text-base font-medium mb-3">Chat with us instantly</p>
            <a
              href="https://wa.me/917655052057"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors flex items-center gap-1"
            >
              Message on WhatsApp
            </a>
          </div>

          <div className="relative group bg-white p-8 border-2 border-slate-200 hover:border-orange-500 rounded-none hover:shadow-xl transition-all duration-300 lg:translate-y-6">
            <div className="w-14 h-14 bg-orange-50 border border-orange-100 flex items-center justify-center mb-8">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Office</h3>
            <p className="text-slate-700 leading-relaxed text-sm font-medium mb-3">
              TI-103(A), First Floor
              <br />
              TIIR Building (FTBI)
              <br />
              NIT Rourkela Campus
              <br />
              Odisha - 769008
            </p>
            <a
              href="https://www.google.com/maps/place/Hoardspace+bookings+private+limited/@22.2430295,84.9088836,3670m/data=!3m1!1e3!4m6!3m5!1s0x3a201dc4b4a548d5:0x7066c2143a6fd952!8m2!3d22.2548078!4d84.9031843!16s%2Fg%2F11yxhjq0k1?entry=ttu&g_ep=EgoyMDI2MDMwNC4xIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 font-bold hover:text-orange-800 transition-colors text-sm flex items-center gap-1"
            >
              View on Map →
            </a>
          </div>
        </div>


        {/* Contact Action */}
        <div className="bg-white rounded-none shadow-sm border-2 border-slate-200 p-8 md:p-16 relative overflow-hidden flex flex-col items-center justify-center text-center">
          {/* Subtle background blob */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-50 blur-3xl pointer-events-none"></div>
          
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6 relative z-10">
            Send us a message
          </h2>

          <p className="text-lg text-slate-600 mb-10 max-w-2xl relative z-10">
            Click the button below to open your email client and send us a message directly. We typically respond within 24 hours.
          </p>

          <a
            href="mailto:bookings@hoardspace.in"
            className="w-full md:w-auto min-w-[300px] bg-blue-600 text-white py-5 px-8 rounded-none font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center justify-center gap-3 relative z-10"
          >
            <Mail size={20} />
            Email Us Now
          </a>
        </div>
      </div>
    </div>
  );
}
