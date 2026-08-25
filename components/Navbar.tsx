"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#02050e]/90 backdrop-blur-xl border-b border-amber-400/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* =========================================================
              BRAND IDENTITY
          ========================================================= */}
          <Link
            href="/"
            className="flex items-center space-x-3 group min-w-0"
          >
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 group-hover:border-amber-400/30 transition-all duration-300 shrink-0">
              <Image
                src="/1080.png"
                alt="MCGC Logo"
                width={34}
                height={34}
                className="object-contain w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm sm:text-base text-white tracking-tight leading-none group-hover:text-amber-300 transition-colors">
                MCGC Discipleship System
              </span>

              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide mt-1 truncate">
                Standard On-boarding Process
              </span>
            </div>
          </Link>

          {/* =========================================================
              DESKTOP NAVIGATION
          ========================================================= */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-8 text-xs sm:text-sm font-medium text-slate-300">

            <Link
              href="/"
              className="relative py-2 hover:text-amber-300 transition-colors duration-200 group"
            >
              Home
              <span className="absolute left-0 right-0 bottom-0 h-px bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
            </Link>

            {/* NEW: BIBLE LINK */}
            <Link
              href="/bible"
              className="relative py-2 text-amber-400 hover:text-amber-300 transition-colors duration-200 group flex items-center gap-1.5 font-semibold"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Bible</span>
              <span className="absolute left-0 right-0 bottom-0 h-px bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
            </Link>

            <Link
              href="/courses"
              className="relative py-2 hover:text-amber-300 transition-colors duration-200 group"
            >
              Curriculum
              <span className="absolute left-0 right-0 bottom-0 h-px bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
            </Link>

            <Link
              href="/login/staff"
              className="relative py-2 hover:text-amber-300 transition-colors duration-200 group"
            >
              Dashboard
              <span className="absolute left-0 right-0 bottom-0 h-px bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
            </Link>

            <Link
              href="/about"
              className="relative py-2 hover:text-amber-300 transition-colors duration-200 group"
            >
              About
              <span className="absolute left-0 right-0 bottom-0 h-px bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
            </Link>

          </nav>

          {/* =========================================================
              PRIMARY ACTION
          ========================================================= */}
          <div className="hidden md:flex items-center">
            <Link
              href="/enroll"
              className="group bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:via-amber-300 hover:to-amber-400 text-slate-950 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20 flex items-center space-x-1.5 active:scale-[0.98]"
            >
              <span>Create Account</span>

              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>

          {/* =========================================================
              MOBILE MENU BUTTON
          ========================================================= */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-400/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================
          MOBILE NAVIGATION DRAWER
      ========================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#02050e]/98 backdrop-blur-xl border-b border-amber-400/10 px-4 pt-4 pb-6 space-y-2">

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-3 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition-colors"
          >
            Home
          </Link>

          {/* NEW: MOBILE BIBLE LINK */}
          <Link
            href="/bible"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-3 px-3 rounded-xl text-sm font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Bible</span>
          </Link>

          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-3 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition-colors"
          >
            Curriculum
          </Link>

          <Link
            href="/login/staff"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-3 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition-colors"
          >
            Dashboard
          </Link>

          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-3 px-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition-colors"
          >
            About
          </Link>

          {/* Mobile CTA */}
          <div className="pt-3 mt-2 border-t border-slate-800/80">
            <Link
              href="/enroll"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-semibold py-3.5 text-center rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-400/10"
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