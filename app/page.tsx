export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      
      {/* Custom Keyframes: Logo Glow ignites on lower half of bounce */}
      <style>{`
        @keyframes logoGlowOnGround {
          0%, 100% {
            filter: drop-shadow(0 10px 20px rgba(251, 191, 36, 0.2));
          }
          50% {
            filter: drop-shadow(0 25px 45px rgba(251, 191, 36, 0.8));
          }
        }

        .animate-ground-glow {
          animation: logoGlowOnGround 5s ease-in-out infinite;
        }
      `}</style>

      {/* Background Lighting & Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} 
      />
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Hero Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column - Hero Content */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2.5 bg-slate-900/90 text-amber-400 text-xs font-bold px-4 py-2 rounded-full border border-amber-400/20 uppercase tracking-widest backdrop-blur-md shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>Official Church Learning Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            One Platform. <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Every Step of Discipleship.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
            A modern discipleship platform designed to guide believers from their first step of faith to mature Christian leadership.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href="/login/student"
              className="group relative bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-extrabold px-7 py-4 rounded-2xl flex items-center space-x-2 transition-all shadow-xl shadow-amber-400/15 text-sm"
            >
              <span>Student Portal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/courses"
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold px-7 py-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all text-sm backdrop-blur-md"
            >
              Explore Curriculum
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 border-t border-slate-800/60 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left">
            <div>
              <div className="text-amber-400 font-extrabold text-lg sm:text-xl">26</div>
              <div className="text-slate-400 text-xs">Lessons</div>
            </div>
            <div>
              <div className="text-amber-400 font-extrabold text-lg sm:text-xl">3</div>
              <div className="text-slate-400 text-xs">Learning Paths</div>
            </div>
            <div>
              <div className="text-amber-400 font-extrabold text-lg sm:text-xl">100%</div>
              <div className="text-slate-400 text-xs">Biblically Grounded</div>
            </div>
          </div>

        </div>

        {/* Right Column - Bouncing Logo */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-blue-600/15 to-amber-400/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 animate-[bounce_5s_infinite_ease-in-out] flex items-center justify-center">
              <Image
                src="/1080.png"
                alt="Ministry Logo"
                width={360}
                height={360}
                className="object-contain animate-ground-glow"
                priority
              />
            </div>
          </div>
        </div>

      </main>

      {/* Feature Bento Section */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-amber-400/30 backdrop-blur-md p-6 rounded-2xl transition-all duration-300 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Biblical Foundation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Carefully curated curriculum built to strengthen core doctrine and practical Christian living.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-amber-400/30 backdrop-blur-md p-6 rounded-2xl transition-all duration-300 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Progress Tracking</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Complete modules, take evaluation exams, and automatically unlock advanced levels as you pass.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-amber-400/30 backdrop-blur-md p-6 rounded-2xl transition-all duration-300 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Leader Approved</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Direct oversight and manual verification from church leadership to guide every step.
            </p>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer Section */}
      <footer className="border-t border-slate-900 bg-slate-950 pt-16 pb-12 px-6 sm:px-8 relative z-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Top Footer Header: Logo & Clean Nav Links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
            <div className="flex items-center space-x-3">
              <Image
                src="/1080.png"
                alt="MCGC Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="font-bold text-slate-200 text-sm tracking-wide">
                MCGC Discipleship Portal
              </span>
            </div>

            <nav className="flex items-center space-x-6 text-slate-400">
              <Link href="/about" className="hover:text-amber-400 transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-amber-400 transition-colors">
                Privacy
              </Link>
            </nav>
          </div>

          {/* Middle Footer: Detailed Legal & Copyright Notices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-400 leading-relaxed text-[11px]">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Copyright &amp; Authorship Notice
              </h4>
              <p>
                © 2026 Ministry of Christ's Great Commission Church Inc. All rights reserved.
              </p>
              <p>
                All course lessons, teaching materials, and core curriculum were authored by{" "}
                <strong className="text-slate-300 font-medium">Viz Giron</strong> for the MCGC Discipleship Platform.
              </p>
              <p>
                The MCGC Discipleship Portal, including its software, interface design, lesson content, assessments, examinations, graphics, and documentation, is protected under applicable copyright laws.
              </p>
              <p>
                No part of this platform may be reproduced, distributed, modified, or transmitted in any form without prior written permission from Ministry of Christ's Great Commission Church Inc., except where permitted by law.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Permissions &amp; Attributions
              </h4>
              <p>
                No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without prior written permission from MCGC, except for brief quotations used for teaching or review purposes.
              </p>
              <p className="text-slate-400 pt-1">
                All Scripture quotations are taken from the New King James Version (NKJV), © 1982 Thomas Nelson, unless otherwise noted.
              </p>
            </div>
          </div>

          {/* Bottom Footer: Final Copyright Line */}
          <div className="pt-8 border-t border-slate-900 text-center text-slate-400 text-[11px]">
            © 2026 Ministry of Christ's Great Commission Church Inc. All Rights Reserved.
          </div>

        </div>
      </footer>

    </div>
  );
}