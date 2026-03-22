"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSuccess(true);
    setIsSubmitting(false);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });

    setTimeout(() => setSuccess(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get in <span className="text-[#2563eb]">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4">
              <Mail className="w-6 h-6 text-[#2563eb]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600 text-sm mb-2">
              For bookings and inquiries
            </p>
            <a
              href="mailto:bookings@hoardspace.in"
              className="text-[#2563eb] font-medium hover:underline break-all"
            >
              bookings@hoardspace.in
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="p-3 bg-green-50 rounded-xl w-fit mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600 text-sm mb-2">
              Mon-Fri from 9am to 6pm
            </p>
            <a
              href="tel:+917655052057"
              className="text-[#2563eb] font-medium hover:underline"
            >
              7655-052057
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-4">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-gray-600 text-sm mb-2">Chat with us instantly</p>
            <a
              href="https://wa.me/917655052057"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563eb] font-medium hover:underline"
            >
              Message on WhatsApp
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="p-3 bg-orange-50 rounded-xl w-fit mb-4">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Office</h3>
            <p className="text-gray-600 text-sm mb-3">
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
              className="text-[#2563eb] font-medium hover:underline text-sm"
            >
              View on Map →
            </a>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our <span className="text-[#2563eb]">Team</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Driven by innovation and expertise, our team is committed to
              transforming outdoor advertising in India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                    src="https://res.cloudinary.com/du5qoczcn/image/upload/v1773081079/IMG_2169_ealh6r.jpg"
                    alt="Debi Prasad Sahoo"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Debi Prasad Sahoo
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Founder & CEO
                </p>
                <p className="text-sm text-gray-600">
                  Chemical Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081081/IMG_2170_s2qrjn.jpg"}
                     alt="Ankush Senapati"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Ankush Senapati
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Chief Financial Officer
                </p>
                <p className="text-sm text-gray-600">
                  BS Economics
                  <br />
                  IIT Patna
                </p>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081082/IMG_2171_gll65n.jpg"}
                      alt="Roupya Swasat Prusty"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Roupya Swasat Prusty
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Business Development Lead
                </p>
                <p className="text-sm text-gray-600">
                  Petroleum Engineering
                  <br />
                  IIT (ISM) Dhanbad
                </p>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081084/IMG_2175_yzl7jc.jpg"}
                     alt="Preetam Samal"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Preetam Samal
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Head of Marketing
                </p>
                <p className="text-sm text-gray-600">
                  Food Processing
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 5 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081081/IMG_2176_xx5ksb.jpg"}
                     alt="Debansh Sahu"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Debansh Sahu
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Co-founder & CTO
                </p>
                <p className="text-sm text-gray-600">
                  Computer Science
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 6 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081077/IMG_2168_s7qqig.jpg"}
            
                     alt="Churepally Neha"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Churepally Neha
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Head of Design
                </p>
                <p className="text-sm text-gray-600">
                  Civil Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 7 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081075/IMG_2197_w0sovn.jpg"}
                     alt="Pulin Mohapatra"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Pulin Mohapatra
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Head of Operations
                </p>
                <p className="text-sm text-gray-600">
                  Mechanical Engineering
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>

            {/* Team Member 8 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081079/IMG_2174_b7n0re.jpg"}

                     alt="Durgaprasad Sahoo"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Durgaprasad Sahoo
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Co-founder & Head of AI/ML
                </p>
                <p className="text-sm text-gray-600">
                  Artificial Intelligence
                  <br />& Machine Learning
                </p>
              </div>
            </div>

            {/* Team Member 9 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                  <Image
                  src={"https://res.cloudinary.com/du5qoczcn/image/upload/v1773081060/IMG_2177_1_og5vqm.jpg"}
                     alt="Omkar Ashutosh Behera"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Omkar Ashutosh Behera
                </h3>
                <p className="text-[#2563eb] font-semibold mb-2">
                  Head of Business Development
                </p>
                <p className="text-sm text-gray-600">
                  Electronics & Communication
                  <br />
                  NIT Rourkela
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-slate-100 p-8 md:p-12 relative overflow-hidden">
          {/* Subtle background blob */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-50 blur-3xl pointer-events-none"></div>
          
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 relative z-10">
            Send us a message
          </h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>
                Message sent successfully! We'll get back to you soon.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563eb] outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563eb] outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563eb] outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563eb] outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="How can we help?"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563eb] outline-none transition-all resize-none font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white py-4 px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3 mt-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
