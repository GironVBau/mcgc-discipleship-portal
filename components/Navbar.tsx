"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Bell } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const NAV_LINKS = [
  { href: "/", label: "Home", tooltip: "Return to homepage" },
  { href: "/bible", label: "Bible", tooltip: "Scripture & reading resources" },
  { href: "/courses", label: "Curriculum", tooltip: "Explore discipleship modules" },
  { href: "/login/staff", label: "Dashboard", tooltip: "Student & admin portal access" },
  { href: "/foreword", label: "Foreword", tooltip: "Platform purpose & message" },
  { href: "/about", label: "About", tooltip: "About the Platform" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const pathname = usePathname();

  // Lazy single client instance matching @supabase/ssr
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const updateBadge = useCallback((count: number) => {
    if (typeof window !== "undefined" && "setAppBadge" in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const syncNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Authenticated user count: counts records where is_read is false OR null
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .or("is_read.eq.false,is_read.is.null");

        if (!error && count !== null) {
          setUnreadCount(count);
          updateBadge(count);
        }

        // Setup Realtime for User
        const channelName = `user_notifications:${user.id}`;
        supabase.removeChannel(supabase.channel(channelName));

        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => syncNotifications()
          )
          .subscribe();
      } else {
        // Guest mode count
        const { count, error } = await supabase
          .from("announcements")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        if (!error && count !== null) {
          setUnreadCount(count);
          updateBadge(count);
        }

        // Setup Realtime for Guest
        const channelName = "guest_announcements";
        supabase.removeChannel(supabase.channel(channelName));

        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "announcements",
            },
            () => syncNotifications()
          )
          .subscribe();
      }
    };

    syncNotifications();

    // Listen to Auth state changes on the same client instance
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncNotifications();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [supabase, updateBadge]);

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/70 backdrop-blur-xl border-b border-white/10 border-t border-t-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* BRAND IDENTITY & LOGO */}
          <Link href="/" className="flex items-center space-x-3 group min-w-0">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-amber-400/40 border-t-amber-300/70 shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.75)] group-hover:border-amber-400 transition-all duration-300 shrink-0">
              <div className="absolute inset-0 rounded-xl bg-amber-400/30 blur-md animate-pulse group-hover:bg-amber-400/50 transition-all duration-300" />
              <Image
                src="/1080.png"
                alt="MCGC Logo"
                width={34}
                height={34}
                className="relative z-10 object-contain w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                priority
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm sm:text-base text-white tracking-tight leading-none group-hover:text-amber-300 transition-colors duration-200 truncate">
                MCGC Discipleship System
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide mt-1 truncate group-hover:text-slate-300 transition-colors duration-200">
                Standard Onboarding Process
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-10 text-xs sm:text-sm font-medium">
            {NAV_LINKS.map(({ href, label, tooltip }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <div key={href} className="relative flex flex-col items-center group/tab">
                  <Link
                    href={href}
                    className={`relative py-2 transition-colors duration-200 group ${
                      isActive ? "text-amber-400 font-semibold" : "text-slate-300 hover:text-amber-300"
                    }`}
                  >
                    <span className="relative z-10">{label}</span>
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(251,191,36,0.8)] ${
                        isActive
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                      }`}
                    />
                  </Link>

                  <div className="absolute top-full mt-2 px-2.5 py-1 bg-slate-900/95 border border-amber-400/30 text-slate-200 text-[11px] font-normal rounded-lg shadow-xl shadow-black/60 backdrop-blur-md whitespace-nowrap opacity-0 translate-y-1 pointer-events-none group-hover/tab:opacity-100 group-hover/tab:translate-y-0 transition-all duration-200 z-50">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-amber-400/30 rotate-45" />
                    <span className="relative z-10">{tooltip}</span>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Notification Bell + Badge */}
            <Link
              href="/notifications"
              className="relative p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-400/40 active:scale-95 transition-all duration-200 shadow-md group"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 border border-slate-950 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Create Account CTA */}
            <Link
              href="/enroll"
              className="group relative overflow-hidden bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:via-amber-300 hover:to-amber-400 text-slate-950 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_6px_25px_rgba(251,191,36,0.55)] hover:scale-[1.02] flex items-center space-x-1.5 active:scale-[0.98] border-t border-amber-100/50"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
              <span className="relative z-10">Create Account</span>
              <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          {/* MOBILE CONTROLS */}
          <div className="flex items-center space-x-3 md:hidden">
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40 active:scale-95 transition-all duration-200 shadow-md"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-slate-950 bg-amber-400 rounded-full border border-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/30 backdrop-blur-sm shadow-md"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 transition-transform duration-200 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-200" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-96 opacity-100 border-t border-white/10" : "max-h-0 opacity-0"
        } bg-slate-950/95 px-4 backdrop-blur-2xl`}
      >
        <div className="py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-amber-400 bg-amber-400/10 border border-amber-400/20 font-semibold shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                    : "text-slate-200 hover:bg-white/5 hover:text-amber-300"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <div className="pt-3 mt-2 border-t border-white/10">
            <Link
              href="/enroll"
              onClick={() => setMobileMenuOpen(false)}
              className="group relative overflow-hidden w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-semibold py-3 text-center rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all duration-200"
            >
              <span className="relative z-10">Create Account</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}