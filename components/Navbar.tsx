"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowRight, BookOpen, Compass, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Identity */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-amber-400/40 transition-colors">
              <Image
                src="/1080.png"
                alt="MCGC Logo"
                width={32}
                height={32}
                className="object-contain w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base text-white tracking-tight leading-none group-hover:text-amber-400 transition-colors">
                MCGC Standard On-boarding Process | SOP
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 truncate max-w-[200px] sm:max-w-none">
                Ministry of Christ&apos;s Great Commission Church Inc.
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <Link href="/courses" className="hover:text-amber-400 transition-colors">
              Curriculum
            </Link>
            <Link href="/login/staff" className="hover:text-amber-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="hover:text-amber-400 transition-colors">
              About
            </Link>
          </nav>

          {/* Action CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/enroll"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-400/10 flex items-center space-x-1.5 active:scale-[0.98]"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-4 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-400"
          >
            Home
          </Link>
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-400"
          >
            Curriculum
          </Link>
          <Link
            href="/login/staff"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-400"
          >
            Dashboard
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-400"
          >
            About
          </Link>

          <div className="pt-3 border-t border-slate-800/80">
            <Link
              href="/enroll"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-amber-400 text-slate-950 font-bold py-3 text-center rounded-xl text-sm flex items-center justify-center space-x-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}