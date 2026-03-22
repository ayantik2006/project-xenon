"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { User, Menu, X, LayoutDashboard } from "lucide-react";
import AuthModal from "./AuthModal";
import { checkAuth, logout } from "@/lib/fetchWithAuth";

export default function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check for authentication via cookie (with auto-refresh)
    const loadUser = async () => {
      const { authenticated, user: userData } = await checkAuth();
      if (authenticated && userData) {
        setUser(userData);
      }
    };
    loadUser();
  }, [isAuthOpen]); // Re-check when auth modal closes

  const handleLogout = async () => {
    await logout();
    setUser(null);
    window.location.reload();
  };

  return (
    <>
      <div className="relative w-full z-50">
        <nav className="bg-blue-100 text-slate-800 shadow-md border-b-4 border-orange-500 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4 md:h-20 relative">
              
              {/* Left: Logo */}
              <div className="flex items-center shrink-0 h-full">
                <Link href="/" className="flex items-center gap-2 group h-full">
                  <Image
                    src="/companyLogo/Screenshot 2026-03-02 at 02.10.29.png"
                    alt="HoardSpace Logo"
                    width={180}
                    height={50}
                    className="h-10 w-auto object-contain mix-blend-multiply flex-shrink-0"
                    priority
                  />
                </Link>
              </div>

              {/* Center: Global Navigation Links */}
              <div className="hidden min-[731px]:flex flex-1 justify-center items-center gap-8 font-sans h-full">
                <Link href="/#home" className="flex items-center text-xs uppercase tracking-widest font-black text-slate-700 hover:text-orange-600 transition-colors whitespace-nowrap h-full">
                  Home
                </Link>
                <Link href="/explore" className="flex items-center text-xs uppercase tracking-widest font-black text-slate-700 hover:text-orange-600 transition-colors whitespace-nowrap h-full">
                  Explore
                </Link>
                <Link href="/#about" className="flex items-center text-xs uppercase tracking-widest font-black text-slate-700 hover:text-orange-600 transition-colors whitespace-nowrap h-full">
                  About Us
                </Link>
                <Link href="/contact" className="flex items-center text-xs uppercase tracking-widest font-black text-slate-700 hover:text-orange-600 transition-colors whitespace-nowrap h-full">
                  Contact Us
                </Link>
              </div>

              {/* Right: CTA Actions & Mobile Toggle */}
              <div className="flex items-center justify-end shrink-0 gap-2 h-full">
                {/* Desktop Auth Buttons (Only visible > 730px) */}
                <div className="hidden min-[731px]:flex items-center gap-2 h-full">
                  {user ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${user.role}/dashboard`}
                        className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-blue-100 transition-colors"
                      >
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-700">
                          <LayoutDashboard size={18} />
                        </div>
                        <span className="hidden sm:inline text-xs uppercase tracking-widest font-black">
                          Dashboard
                        </span>
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-700">
                          <User size={18} />
                        </div>
                        <span className="hidden sm:inline text-xs uppercase tracking-widest font-black">
                          Profile
                        </span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center text-xs uppercase tracking-widest font-black text-slate-700 hover:text-orange-600 transition-colors px-2"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="flex items-center gap-2 rounded-lg py-2 px-3 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-700">
                        <User size={18} />
                      </div>
                      <span className="hidden sm:inline text-xs uppercase tracking-widest font-black">
                        REGISTER
                      </span>
                    </button>
                  )}
                </div>

                {/* Mobile Hamburger Button (Only visible <= 730px) */}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="min-[731px]:hidden p-2 text-slate-700 hover:text-orange-600 transition-colors"
                >
                  {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Overlay Menu */}
          {isMenuOpen && (
            <div className="min-[731px]:hidden bg-blue-50 border-t border-blue-200 shadow-2xl animate-in slide-in-from-top duration-300">
              <div className="flex flex-col p-4 gap-2">
                <Link 
                  href="/#home" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-blue-100 rounded-lg transition-all"
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-blue-100 rounded-lg transition-all"
                >
                  Explore
                </Link>
                <Link 
                  href="/#about" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-blue-100 rounded-lg transition-all"
                >
                  About Us
                </Link>
                <Link 
                  href="/contact" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-blue-100 rounded-lg transition-all"
                >
                  Contact Us
                </Link>

                {/* Mobile Auth Actions (Register/Profile/Logout) */}
                <div className="mt-4 pt-4 border-t border-blue-100 space-y-2">
                  {user ? (
                    <>
                      <Link
                        href={`/${user.role}/dashboard`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-blue-100 rounded-lg transition-all"
                      >
                        <LayoutDashboard size={18} className="text-blue-500" />
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-blue-100 rounded-lg transition-all"
                      >
                        <User size={18} className="text-blue-500" />
                        Profile
                      </Link>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                         <X size={18} />
                         Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAuthOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#2563eb] hover:bg-blue-100 rounded-lg transition-all"
                    >
                      <User size={18} />
                      Register / Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
