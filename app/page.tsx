"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ArrowUpRight,
  Calendar,
  Clock,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client for the browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Real-Time Philippine Standard Time (PST) Clock Component (Single Line)
function PhilippineClock() {
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format time in Asia/Manila timezone
      const formattedTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      // Format date in Asia/Manila timezone
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(now);

      setTimeString(formattedTime);
      setDateString(formattedDate);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 space-y-2 font-sans">
      <div className="flex items-center gap-2 bg-slate-900/80 border border-amber-400/20 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-amber-200/90">
          PST (GMT+8)
        </span>
      </div>
      
      {/* Time | Date Single Line */}
      <div className="flex items-center space-x-2 text-sm text-slate-200 font-medium tracking-wide">
        <span className="font-mono text-slate-100 font-semibold">
          {timeString || "00:00:00 PM"}
        </span>
        <span className="text-amber-400/50 font-light">|</span>
        <span className="text-slate-300">
          {dateString || "Loading date..."}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(3);

        if (!error && data) {
          setAnnouncements(data);
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setLoadingAnnouncements(false);
      }
    }

    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-amber-300 selection:text-slate-950">
      
      {/* Strict Apple SF Pro Typography System */}
      <style>{`
        :root {
          --font-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          --font-text: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
          font-family: var(--font-text);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.125rem, 3.5vw, 3.125rem);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.022em;
        }

        .hero-subtext {
          font-family: var(--font-text);
          font-size: clamp(0.9375rem, 1.2vw, 1.0625rem);
          font-weight: 400;
          line-height: 1.65;
          letter-spacing: -0.011em;
        }

        .feature-title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 600;
          letter-spacing: -0.014em;
        }

        .feature-body {
          font-family: var(--font-text);
          font-size: 0.875rem;
          line-height: 1.6;
          letter-spacing: -0.006em;
        }

        .stat-number {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 2vw, 1.75rem);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-family: var(--font-text);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .sf-text-ui {
          font-family: var(--font-text);
        }

        .sf-display-ui {
          font-family: var(--font-display);
        }

        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.25; transform: scale(0.95); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-float { animation: floatLogo 6s ease-in-out infinite; }
          .animate-pulse-glow { animation: pulseGlow 5s ease-in-out infinite; }
        }
      `}</style>

      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} 
      />

      {/* Ambient Radial Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-amber-200/5 to-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[500px] right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 pt-16 sm:pt-28 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2.5 bg-amber-500/[0.03] text-amber-200/90 text-[11px] sf-text-ui font-medium px-3.5 py-1.5 rounded-full border border-amber-400/15 backdrop-blur-md tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Standard On-boarding Process</span>
          </div>

          <h1 className="hero-title text-slate-100">
            One Platform. <br />
            <span className="bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              The Complete Pathway of Discipleship Formation.
            </span>
          </h1>

          <p className="hero-subtext text-slate-300/90 max-w-xl mx-auto lg:mx-0">
            A Scripture-anchored educational platform, carefully ordered as the Standard On-boarding Process of MCGC, to guide the faithful from the first steps of discipleship to mature Christian leadership.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2 sf-text-ui">
            <Link
              href="/login/student"
              className="group relative bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 shadow-md active:scale-[0.98] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950 w-full sm:w-auto tracking-wider uppercase text-xs"
            >
              <span>Sign in</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-950 stroke-[2.5]" />
            </Link>

            <Link
              href="/courses"
              className="inline-flex items-center space-x-1 text-xs font-medium uppercase tracking-wider text-slate-300 hover:text-amber-300 transition-colors py-2 px-3 focus:outline-none focus:underline"
            >
              <span>Explore Curriculum</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition-colors" />
            </Link>
          </div>

          <div className="pt-8 border-t border-amber-400/10 grid grid-cols-3 gap-6 max-w-sm mx-auto lg:mx-0 text-center sm:text-left">
            <div>
              <div className="stat-number text-amber-200/90">26</div>
              <div className="stat-label text-slate-400 uppercase mt-1.5">Core Lessons</div>
            </div>
            <div>
              <div className="stat-number text-amber-200/90">3</div>
              <div className="stat-label text-slate-400 uppercase mt-1.5">Learning Tracks</div>
            </div>
            <div>
              <div className="stat-number text-amber-200/90">100%</div>
              <div className="stat-label text-slate-400 uppercase mt-1.5">Biblical Basis</div>
            </div>
          </div>

        </div>

        {/* Right Column - Floating Logo & Single-Line PST Time/Date */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-xs sm:max-w-sm flex flex-col items-center justify-center">
            
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

            <div className="relative z-10 animate-float flex flex-col items-center justify-center py-4">
              <Image
                src="/1080.png"
                alt="Ministry Logo"
                width={220}
                height={220}
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain filter drop-shadow-[0_20px_40px_rgba(251,191,36,0.2)] transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>

            <PhilippineClock />

          </div>
        </div>

      </main>

      {/* Announcements & Upcoming Events Section */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/[0.03] text-amber-200/90 text-[11px] sf-text-ui font-medium px-3.5 py-1.5 rounded-full border border-amber-400/15 backdrop-blur-md tracking-wider uppercase mb-3">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Community Updates</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 sf-display-ui">
              Upcoming Events & Announcements
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Stay informed on upcoming church gatherings, fellowship activities, and important schedule notices.
          </p>
        </div>

        {loadingAnnouncements ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-950/40 border border-amber-400/10 backdrop-blur-lg p-6 rounded-2xl animate-pulse h-48" />
            ))}
          </div>
        ) : announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((item) => {
              const eventDateObj = new Date(item.event_date);
              const formattedDate = eventDateObj.toLocaleDateString("en-US", {
                timeZone: "Asia/Manila",
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = eventDateObj.toLocaleTimeString("en-US", {
                timeZone: "Asia/Manila",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/40 border border-amber-400/10 hover:border-amber-400/30 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-4 group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-400/20 px-2.5 py-1 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {formattedTime}
                      </span>
                    </div>

                    <h3 className="feature-title text-slate-100 group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>

                    <p className="feature-body text-slate-300/80 line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-amber-400/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="uppercase tracking-wider text-[10px] text-amber-400/80 font-semibold">MCGC Announcement</span>
                    <span className="text-amber-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                      View <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-950/40 border border-amber-400/10 backdrop-blur-lg p-8 rounded-2xl text-center space-y-2">
            <p className="text-slate-300 font-medium">No upcoming announcements right now.</p>
            <p className="text-slate-500 text-sm">Check back soon for upcoming church events and activities.</p>
          </div>
        )}
      </section>

      {/* Feature Cards Section */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-24 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-950/40 border border-amber-400/10 hover:border-amber-400/20 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-3 group hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center border border-amber-400/15">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="feature-title text-slate-100">Biblical Foundation</h3>
            <p className="feature-body text-slate-300/80">
              Carefully curated curriculum built to strengthen core doctrine and practical Christian living.
            </p>
          </div>

          <div className="bg-slate-950/40 border border-amber-400/10 hover:border-amber-400/20 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-3 group hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/15">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="feature-title text-slate-100">Progress Tracking</h3>
            <p className="feature-body text-slate-300/80">
              Complete modules, take evaluation exams, and automatically unlock advanced levels as you pass.
            </p>
          </div>

          <div className="bg-slate-950/40 border border-amber-400/10 hover:border-amber-400/20 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-3 group hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/15">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="feature-title text-slate-100">Leader Approved</h3>
            <p className="feature-body text-slate-300/80">
              Direct oversight and manual verification from church leadership to guide every step.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}