"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Linkedin, Youtube, Instagram } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname?.includes("/dashboard") || pathname?.startsWith("/profile")) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const categories = [
    { name: "Billboard", href: "/search?type=Billboard" },
    { name: "Unipole", href: "/search?type=Unipole" },
    { name: "Gantry", href: "/search?type=Gantry" },
    { name: "Bus Shelter", href: "/search?type=Bus%20Shelter" },
    { name: "Kiosk", href: "/search?type=Kiosk" },
  ];

  const popularCities = [
    { name: "Bhubaneswar", href: "/explore?city=Bhubaneswar" },
    { name: "Cuttack", href: "/explore?city=Cuttack" },
    { name: "Rourkela", href: "/explore?city=Rourkela" },
  ];

  const legal = [
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Cookie Policy", href: "/cookie-policy" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-blue-100/80 text-slate-800 pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/companyLogo/Screenshot 2026-03-02 at 02.10.29.png"
                alt="HoardSpace Logo"
                width={180}
                height={50}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-xs font-semibold tracking-wide text-slate-600 mb-6 max-w-sm">
              India&apos;s leading platform for booking premium outdoor advertising
              spaces. Connect with verified vendors and grow your brand's
              visibility across top cities.
            </p>
            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:bookings@hoardspace.in"
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-[#2563eb] transition-colors"
              >
                <Mail size={14} />
                <span>bookings@hoardspace.in</span>
              </a>
              <a
                href="tel:+917655052057"
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-[#2563eb] transition-colors"
              >
                <Phone size={14} />
                <span>7655-052057</span>
              </a>
              <a
                href="https://www.google.com/maps/place/Hoardspace+bookings+private+limited/@22.2430295,84.9088836,3670m/data=!3m1!1e3!4m6!3m5!1s0x3a201dc4b4a548d5:0x7066c2143a6fd952!8m2!3d22.2548078!4d84.9031843!16s%2Fg%2F11yxhjq0k1?entry=ttu&g_ep=EgoyMDI2MDMwNC4xIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-[#2563eb] transition-colors"
              >
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>
                  TI-103(A), First Floor, TIIR Building (FTBI),
                  <br />
                  NIT Rourkela Campus, Odisha - 769008
                </span>
              </a>
            </div>

          </div>

          {/* Quick Links */}
          {/* <div>
            <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs font-bold tracking-wider text-slate-700 hover:text-[#2563eb] transition-colors block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Categories */}
          <div>
            <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
              Categories
            </h3>
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    href={category.href}
                    className="text-xs font-bold tracking-wider text-slate-700 hover:text-[#2563eb] transition-colors block"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
              Popular Cities
            </h3>
            <ul className="space-y-3">
              {popularCities.map((city) => (
                <li key={city.name}>
                  <Link
                    href={city.href}
                    className="text-xs font-bold tracking-wider text-slate-700 hover:text-[#2563eb] transition-colors block"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Registration Details */}
          <div>
            <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
              Company Details
            </h3>
            <div className="space-y-1.5 text-[11px] font-bold tracking-wider text-slate-700">
              <p>
                Hoardspace Bookings Private Limited
              </p>
              <p>CIN NO: U63120OD2025PTC051640</p>
              <p>PAN NO: AAICH3418E</p>
              <p>TAN NO: BBNH01998D</p>
              <p>CKYC NO: 90003349208072</p>
              <p>GSTIN NO: 21AAICH3418E1Z3</p>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-slate-300/30 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
                Follow Us
              </h4>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/hoardspace-bookings-private-limited"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://x.com/hoardspace1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center transition-colors"
                aria-label="X (formerly Twitter)"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-white"
                >
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.486 3.24H4.298l13.31 17.41z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/hoardspace/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.youtube.com/@HoardSpace"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Supported By Section */}
        <div className="border-t border-slate-300/30 pt-8 mb-8">
          <div className="text-center mb-6">
            <h4 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
              Supported By
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center">
            <a
              href="https://msh.meity.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors w-full h-20 flex items-center justify-center"
            >
              <Image
                src="/logos/IMG_2179.PNG"
                alt="Institution Logo"
                width={100}
                height={60}
                className="object-contain max-h-12 w-auto"
              />
            </a>
            <a
              href="https://msme.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors w-full h-20 flex items-center justify-center"
            >
              <Image
                src="/logos/IMG_2180.JPG"
                alt="Institution Logo"
                width={100}
                height={60}
                className="object-contain max-h-12 w-auto"
              />
            </a>
            <a
              href="https://www.nitrkl.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors w-full h-20 flex items-center justify-center"
            >
              <Image
                src="/logos/IMG_2181.PNG"
                alt="Institution Logo"
                width={100}
                height={60}
                className="object-contain max-h-12 w-auto"
              />
            </a>
            <a
              href="https://www.ftbi-nitrkl.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors w-full h-20 flex items-center justify-center"
            >
              <Image
                src="/logos/IMG_2182.PNG"
                alt="Institution Logo"
                width={100}
                height={60}
                className="object-contain max-h-12 w-auto"
              />
            </a>
            <a
              href="https://startupodisha.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors w-full h-20 flex items-center justify-center"
            >
              <Image
                src="/logos/IMG_2183.PNG"
                alt="Institution Logo"
                width={100}
                height={60}
                className="object-contain max-h-12 w-auto"
              />
            </a>
            <a
              href="https://www.startupindia.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors w-full h-20 flex items-center justify-center"
            >
              <Image
                src="/logos/IMG_2184.JPG"
                alt="Institution Logo"
                width={100}
                height={60}
                className="object-contain max-h-12 w-auto"
              />
            </a>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-blue-400/20 pt-8 mb-8">
          <div className="flex flex-wrap justify-center gap-6">
            {legal.map((link, index) => (
              <Fragment key={link.name}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-orange-400 transition-colors"
                >
                  {link.name}
                </Link>
                {index < legal.length - 1 && (
                  <span className="text-blue-300/50">|</span>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-300/30 pt-8">
          <div className="text-center">
            <p className="text-[11px] font-black tracking-widest text-slate-500 uppercase">
              &copy; {currentYear} HoardSpace. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
