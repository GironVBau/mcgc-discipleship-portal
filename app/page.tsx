export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-12 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6">
          <span className="inline-block bg-amber-400/10 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-400/20 uppercase tracking-widest">
            🔴 Official Church Learning Platform
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Grow Deeper in <br />
            <span className="text-amber-400">Your Faith</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg">
            Structured discipleship courses designed to strengthen your foundation in Christ. Progress at your pace, guided by trusted church leaders.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/login/student"
              className="bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-extrabold px-6 py-3.5 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-amber-400/10 text-sm"
            >
              <span>Student Login</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href="/courses"
              className="bg-slate-900/80 hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-sm"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <Image
              src="/1080.png"
              alt="Ministry Logo"
              width={320}
              height={320}
              className="object-contain drop-shadow-2xl relative z-10"
              priority
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 sm:px-8 relative z-10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/1080.png"
              alt="MCGC Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="italic text-sm tracking-wide text-slate-300">
              Ministry of Christ's Great Commission Church Inc.
            </span>
          </div>

          <div className="text-xs text-slate-500 text-center sm:text-right">
            Discipleship Portal © 2026. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}