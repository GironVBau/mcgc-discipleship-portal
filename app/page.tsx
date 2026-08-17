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
  Award,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient();

/* =========================================================
   PHILIPPINE STANDARD TIME CLOCK
========================================================= */

function PhilippineClock() {
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const formattedTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        weekday: "long",
        month: "long",
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
    <div className="flex flex-col items-center justify-center text-center mt-7 space-y-2 font-sans">
      <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-400/20 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

        <span className="text-[11px] font-medium uppercase tracking-wider text-amber-200/90">
          Philippine Standard Time
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-200 font-medium tracking-wide">
        <span className="font-mono text-slate-100 font-semibold">
          {timeString || "00:00:00 PM"}
        </span>

        <span className="text-amber-400/50 font-light">|</span>

        <span className="text-slate-300">{dateString || "Loading date..."}</span>

        <span className="text-amber-400/60 font-medium">PHT</span>
      </div>
    </div>
  );
}

/* =========================================================
   TYPES
========================================================= */

type Announcement = {
  id: string | number;
  title: string;
  description: string | null;
  event_date: string;
};

type Passer = {
  id: string | number;
  name?: string | null;
  student_name?: string | null;
  score_percentage?: number | string | null;
  score?: number | string | null;
};

/* =========================================================
   HOMEPAGE
========================================================= */

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fraPassers, setFraPassers] = useState<Passer[]>([]);
  const [fcaPassers, setFcaPassers] = useState<Passer[]>([]);

  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  /* =======================================================
     FETCH ANNOUNCEMENTS
  ======================================================= */

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
        } else if (error) {
          console.error("Announcement error:", error);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoadingAnnouncements(false);
      }
    }

    fetchAnnouncements();
  }, []);

  /* =======================================================
     FETCH FRA & FCA RESULTS
  ======================================================= */

  useEffect(() => {
    async function fetchAssessmentResults() {
      try {
        const [fraResult, fcaResult] = await Promise.all([
          supabase
            .from("fra_passers")
            .select("*")
            .order("score_percentage", {
              ascending: false,
            }),

          supabase
            .from("fca_passers")
            .select("*")
            .order("score_percentage", {
              ascending: false,
            }),
        ]);

        if (fraResult.error) {
          console.error("FRA error:", fraResult.error);
        } else if (fraResult.data) {
          setFraPassers(fraResult.data);
        }

        if (fcaResult.error) {
          console.error("FCA error:", fcaResult.error);
        } else if (fcaResult.data) {
          setFcaPassers(fcaResult.data);
        }
      } catch (error) {
        console.error("Error fetching assessment results:", error);
      } finally {
        setLoadingAssessments(false);
      }
    }

    fetchAssessmentResults();
  }, []);

  /* =======================================================
     HELPERS
  ======================================================= */

  function getStudentName(passer: Passer) {
    return passer.student_name || passer.name || "Unnamed Student";
  }

  function getScore(passer: Passer) {
    const value =
      passer.score_percentage !== null &&
      passer.score_percentage !== undefined
        ? passer.score_percentage
        : passer.score;

    const numericScore = Number(value);

    return Number.isFinite(numericScore) ? numericScore : 0;
  }

  function getRankClass(index: number) {
    if (index === 0) {
      return "bg-amber-400/10 border-amber-400/30";
    }

    if (index === 1) {
      return "bg-slate-300/5 border-slate-300/15";
    }

    if (index === 2) {
      return "bg-orange-400/5 border-orange-400/15";
    }

    return "bg-slate-950/30 border-white/[0.05]";
  }

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-amber-300 selection:text-slate-950">

      {/* =====================================================
          TYPOGRAPHY & ANIMATIONS
      ===================================================== */}

      <style>{`
        :root {
          --font-display:
            "SF Pro Display",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;

          --font-text:
            "SF Pro Text",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
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
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(-10px) rotate(0.5deg);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.95);
          }

          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .animate-float {
            animation: floatLogo 6s ease-in-out infinite;
          }

          .animate-pulse-glow {
            animation: pulseGlow 5s ease-in-out infinite;
          }
        }
      `}</style>

      {/* =====================================================
          GLOBAL BACKGROUND GRID
      ===================================================== */}

      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* =====================================================
          HERO
      ===================================================== */}

      <main className="relative flex-1 w-full overflow-hidden">

        {/* MEMBER PHOTO BACKGROUND */}

        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/mcgc-members-bg.jpg')",
          }}
        />

        {/* Deep Navy Overlay */}

        <div className="absolute inset-0 bg-[#02050e]/80" />

        {/* Left-to-right readability gradient */}

        <div className="absolute inset-0 bg-gradient-to-r from-[#02050e]/98 via-[#02050e]/88 to-[#02050e]/65" />

        {/* Bottom fade into page */}

        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#02050e] via-[#02050e]/80 to-transparent" />

        {/* Top atmospheric darkness */}

        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#02050e]/80 to-transparent" />

        {/* Gold atmospheric light */}

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="absolute top-[450px] right-0 w-[450px] h-[450px] bg-amber-500/[0.035] rounded-full blur-[160px] pointer-events-none" />

        {/* HERO CONTENT */}

        <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pt-16 sm:pt-28 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">

          {/* LEFT COLUMN */}

          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">

            {/* Standard On-boarding Process */}

            <div className="inline-flex items-center gap-2.5 bg-slate-950/50 text-amber-200/90 text-[11px] sf-text-ui font-medium px-3.5 py-1.5 rounded-full border border-amber-400/20 backdrop-blur-md tracking-wider uppercase shadow-lg">

              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>

              <span>Standard On-boarding Process</span>
            </div>

            {/* Main Heading */}

            <h1 className="hero-title text-slate-100">

              One Platform.
              <br />

              <span className="bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                The Complete Pathway of Discipleship Formation.
              </span>

            </h1>

            {/* Description */}

            <p className="hero-subtext text-slate-200/90 max-w-xl mx-auto lg:mx-0">
              A Scripture-anchored educational platform, thoughtfully ordered as the Standard Onboarding Process of MCGC, designed to walk with the faithful from the first steps of discipleship to mature Christian leadership.
            </p>

            {/* CTA */}

            <div className="flex items-center justify-center lg:justify-start pt-2 sf-text-ui">

              <Link
                href="/login/student"
                className="group relative bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 shadow-md active:scale-[0.98] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950 tracking-wider uppercase text-xs"
              >
                <span>Sign In</span>

                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-950 stroke-[2.5]" />
              </Link>

            </div>

            {/* STATS */}

            <div className="pt-8 border-t border-amber-400/10 grid grid-cols-3 gap-6 max-w-sm mx-auto lg:mx-0 text-center sm:text-left">

              <div>
                <div className="stat-number text-amber-200/90">
                  26
                </div>

                <div className="stat-label text-slate-400 uppercase mt-1.5">
                  Core Lessons
                </div>
              </div>

              <div>
                <div className="stat-number text-amber-200/90">
                  3
                </div>

                <div className="stat-label text-slate-400 uppercase mt-1.5">
                  Learning Tracks
                </div>
              </div>

              <div>
                <div className="stat-number text-amber-200/90">
                  1
                </div>

                <div className="stat-label text-slate-400 uppercase mt-1.5">
                  Complete Journey
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN */}

          <div className="lg:col-span-5 flex flex-col items-center justify-center">

            <div className="relative w-full max-w-xs sm:max-w-sm flex flex-col items-center justify-center">

              {/* Logo Glow */}

              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

              {/* Logo */}

              <div className="relative z-10 animate-float flex flex-col items-center justify-center py-4">

                <Image
                  src="/1080.png"
                  alt="MCGC Logo"
                  width={220}
                  height={220}
                  className="w-40 h-40 sm:w-48 sm:h-48 object-contain filter drop-shadow-[0_20px_40px_rgba(251,191,36,0.2)] transition-transform duration-700 hover:scale-105"
                  priority
                />

              </div>

              {/* Live Clock */}

              <PhilippineClock />

            </div>

          </div>

        </section>
      </main>

      {/* =====================================================
          MCGC DISCIPLESHIP SYSTEM IDENTITY
      ===================================================== */}

      <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pt-6 pb-20">

        <div className="max-w-3xl">

          <div className="inline-flex items-center gap-2 bg-amber-500/[0.03] text-amber-200/90 text-[11px] sf-text-ui font-medium px-3.5 py-1.5 rounded-full border border-amber-400/15 backdrop-blur-md tracking-wider uppercase mb-4">

            <ShieldCheck className="w-3 h-3 text-amber-400" />

            <span>MCGC Discipleship System</span>

          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 sf-display-ui">

            An Original Discipleship Framework Developed for MCGC.

          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">

            We desire every believer to understand what they believe, why they
            believe it, and how Scripture establishes the truth of their
            faith.

          </p>

        </div>

      </section>

      {/* =====================================================
          STUDENT UPDATES
      ===================================================== */}

      <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-20">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">

          <div>

            <div className="inline-flex items-center gap-2 bg-amber-500/[0.03] text-amber-200/90 text-[11px] sf-text-ui font-medium px-3.5 py-1.5 rounded-full border border-amber-400/15 backdrop-blur-md tracking-wider uppercase mb-3">

              <Calendar className="w-3 h-3 text-amber-400" />

              <span>Student Updates</span>

            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 sf-display-ui">

              Upcoming Updates

            </h2>

          </div>

          <p className="text-sm text-slate-400 max-w-md">

            Important schedules, announcements, and upcoming assessment
            information for students progressing through the Standard
            On-boarding Process.

          </p>

        </div>

        {loadingAnnouncements ? (

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {[1, 2, 3].map((n) => (

              <div
                key={n}
                className="bg-slate-950/40 border border-amber-400/10 backdrop-blur-lg p-6 rounded-2xl animate-pulse h-48"
              />

            ))}

          </div>

        ) : announcements.length > 0 ? (

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {announcements.map((item) => {

              const eventDateObj = new Date(item.event_date);

              const formattedDate = eventDateObj.toLocaleDateString(
                "en-US",
                {
                  timeZone: "Asia/Manila",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              const formattedTime = eventDateObj.toLocaleTimeString(
                "en-US",
                {
                  timeZone: "Asia/Manila",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              );

              return (

                <div
                  key={item.id}
                  className="bg-slate-950/50 border border-amber-400/10 hover:border-amber-400/30 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-4 group flex flex-col justify-between shadow-lg"
                >

                  <div className="space-y-3">

                    <div className="flex items-center gap-2 flex-wrap">

                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-400/20 px-2.5 py-1 rounded-md">

                        <Calendar className="w-3 h-3" />

                        {formattedDate}

                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-900/90 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md">

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

                    <span className="uppercase tracking-wider text-[10px] text-amber-400/80 font-semibold">

                      MCGC Student Update

                    </span>

                    <span className="text-amber-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">

                      View

                      <ChevronRight className="w-3 h-3" />

                    </span>

                  </div>

                </div>

              );

            })}

          </div>

        ) : (

          <div className="bg-slate-950/40 border border-amber-400/10 backdrop-blur-lg p-8 rounded-2xl text-center space-y-2">

            <p className="text-slate-300 font-medium">

              No upcoming student updates.

            </p>

            <p className="text-slate-500 text-sm">

              Check back for upcoming schedules and assessment notices.

            </p>

          </div>

        )}

      </section>

      {/* =====================================================
          ASSESSMENT RESULTS / HONOR ROLL
      ===================================================== */}

      <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-24">

        <div className="text-center max-w-2xl mx-auto mb-12">

          <div className="inline-flex items-center gap-2 bg-amber-500/[0.03] text-amber-200/90 text-[11px] sf-text-ui font-medium px-3.5 py-1.5 rounded-full border border-amber-400/15 backdrop-blur-md tracking-wider uppercase mb-4">

            <Award className="w-3 h-3 text-amber-400" />

            <span>Assessment Results</span>

          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 sf-display-ui">

            Assessment Honor Roll

          </h2>

          <p className="mt-3 text-sm text-slate-400 leading-relaxed">

            Recognizing students who have successfully completed the
            assessment requirements of their respective stages of
            discipleship formation.

          </p>

        </div>

        {loadingAssessments ? (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {[1, 2].map((n) => (

              <div
                key={n}
                className="bg-slate-950/40 border border-amber-400/10 rounded-3xl p-6 h-80 animate-pulse"
              />

            ))}

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* =================================================
                FRA
            ================================================= */}

            <div className="relative overflow-hidden bg-slate-950/55 border border-amber-400/15 backdrop-blur-xl rounded-3xl shadow-2xl">

              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              <div className="p-6 sm:p-7 border-b border-amber-400/10">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-2 text-amber-300 mb-2">

                      <Trophy className="w-4 h-4" />

                      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
                        Assessment Honor Roll
                      </span>

                    </div>

                    <h3 className="text-xl font-bold text-slate-100 sf-display-ui">

                      FRA

                    </h3>

                    <p className="text-xs text-slate-400 mt-1">

                      Foundational Readiness Assessment

                    </p>

                  </div>

                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/15">

                    <GraduationCap className="w-4 h-4 text-amber-300" />

                  </div>

                </div>

              </div>

              <div className="p-4 sm:p-5 space-y-2">

                {fraPassers.length > 0 ? (

                  fraPassers.map((passer, index) => {

                    const score = getScore(passer);

                    return (

                      <div
                        key={passer.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${getRankClass(index)}`}
                      >

                        <div className="w-7 text-center shrink-0">

                          {index === 0 ? (

                            <Trophy className="w-4 h-4 mx-auto text-amber-300" />

                          ) : (

                            <span className="text-xs font-mono text-slate-500">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                          )}

                        </div>

                        <div className="flex-1 min-w-0">

                          <p
                            className={`text-sm truncate ${
                              index === 0
                                ? "font-semibold text-amber-100"
                                : "font-medium text-slate-200"
                            }`}
                          >
                            {getStudentName(passer)}
                          </p>

                        </div>

                        <div className="text-right shrink-0">

                          <span
                            className={`font-mono text-sm font-semibold ${
                              index === 0
                                ? "text-amber-300"
                                : "text-slate-300"
                            }`}
                          >
                            {score}%
                          </span>

                        </div>

                      </div>

                    );

                  })

                ) : (

                  <div className="py-10 text-center">

                    <Award className="w-7 h-7 mx-auto text-slate-600 mb-3" />

                    <p className="text-sm text-slate-400">
                      No FRA results recorded yet.
                    </p>

                  </div>

                )}

              </div>

            </div>

            {/* =================================================
                FCA
            ================================================= */}

            <div className="relative overflow-hidden bg-slate-950/55 border border-amber-400/15 backdrop-blur-xl rounded-3xl shadow-2xl">

              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              <div className="p-6 sm:p-7 border-b border-amber-400/10">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-2 text-amber-300 mb-2">

                      <Trophy className="w-4 h-4" />

                      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
                        Assessment Honor Roll
                      </span>

                    </div>

                    <h3 className="text-xl font-bold text-slate-100 sf-display-ui">

                      FCA

                    </h3>

                    <p className="text-xs text-slate-400 mt-1">

                      Fundamental Competency Assessment

                    </p>

                  </div>

                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/15">

                    <GraduationCap className="w-4 h-4 text-amber-300" />

                  </div>

                </div>

              </div>

              <div className="p-4 sm:p-5 space-y-2">

                {fcaPassers.length > 0 ? (

                  fcaPassers.map((passer, index) => {

                    const score = getScore(passer);

                    return (

                      <div
                        key={passer.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${getRankClass(index)}`}
                      >

                        <div className="w-7 text-center shrink-0">

                          {index === 0 ? (

                            <Trophy className="w-4 h-4 mx-auto text-amber-300" />

                          ) : (

                            <span className="text-xs font-mono text-slate-500">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                          )}

                        </div>

                        <div className="flex-1 min-w-0">

                          <p
                            className={`text-sm truncate ${
                              index === 0
                                ? "font-semibold text-amber-100"
                                : "font-medium text-slate-200"
                            }`}
                          >
                            {getStudentName(passer)}
                          </p>

                        </div>

                        <div className="text-right shrink-0">

                          <span
                            className={`font-mono text-sm font-semibold ${
                              index === 0
                                ? "text-amber-300"
                                : "text-slate-300"
                            }`}
                          >
                            {score}%
                          </span>

                        </div>

                      </div>

                    );

                  })

                ) : (

                  <div className="py-10 text-center">

                    <Award className="w-7 h-7 mx-auto text-slate-600 mb-3" />

                    <p className="text-sm text-slate-400">
                      No FCA results recorded yet.
                    </p>

                  </div>

                )}

              </div>

            </div>

          </div>

        )}

      </section>

      {/* =====================================================
          FEATURE CARDS
      ===================================================== */}

      <section className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-24 sm:pb-32">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Biblical Foundation */}

          <div className="bg-slate-950/50 border border-amber-400/10 hover:border-amber-400/20 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-3 group hover:-translate-y-0.5">

            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center border border-amber-400/15">

              <BookOpen className="w-4 h-4" />

            </div>

            <h3 className="feature-title text-slate-100">

              Biblical Foundation

            </h3>

            <p className="feature-body text-slate-300/80">

              Structured biblical instruction designed to establish a clear
              understanding of Christian truth and doctrine.

            </p>

          </div>

          {/* Progression */}

          <div className="bg-slate-950/50 border border-amber-400/10 hover:border-amber-400/20 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-3 group hover:-translate-y-0.5">

            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/15">

              <GraduationCap className="w-4 h-4" />

            </div>

            <h3 className="feature-title text-slate-100">

              Structured Progression

            </h3>

            <p className="feature-body text-slate-300/80">

              Progress through each stage in sequence, complete the required
              lessons and assessments, and advance as requirements are met.

            </p>

          </div>

          {/* Ministry Preparation */}

          <div className="bg-slate-950/50 border border-amber-400/10 hover:border-amber-400/20 backdrop-blur-lg p-6 rounded-2xl transition-all duration-300 space-y-3 group hover:-translate-y-0.5">

            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/15">

              <ShieldCheck className="w-4 h-4" />

            </div>

            <h3 className="feature-title text-slate-100">

              Ministry Preparation

            </h3>

            <p className="feature-body text-slate-300/80">

              Build a biblical foundation and develop the understanding needed
              to prepare for meaningful service and ministry.

            </p>

          </div>

        </div>

      </section>

    </div>
  );
}