import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1e2e68] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-12 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-block bg-[#2d3e7d] text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-400/30 uppercase tracking-wider">
            • Official Church Learning Platform
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Grow Deeper in <br />
            <span className="text-[#facc15]">Your Faith</span>
          </h1>

          <p className="text-blue-100 text-base sm:text-lg leading-relaxed max-w-lg">
            Structured discipleship courses designed to strengthen your foundation in Christ. Progress at your pace, guided by trusted church leaders.
          </p>

          <div className="flex items-center space-x-4 pt-4">
            <Link
              href="/login/student"
              className="bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-semibold px-6 py-3.5 rounded-xl flex items-center space-x-2 transition-colors shadow-lg"
            >
              <span>Student Login</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href="/courses"
              className="border border-blue-300/40 hover:bg-white/10 text-white font-medium px-6 py-3.5 rounded-xl transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
            <Image
              src="/1080.png"
              alt="Ministry Logo"
              width={320}
              height={320}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-400/20 py-6 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Logo & Church Name */}
          <div className="flex items-center space-x-3">
            <Image
              src="/1080.png"
              alt="MCGC Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-italic text-sm tracking-wide text-white">
              Ministry of Christ's Great Commission Church Inc.
            </span>
          </div>

          {/* Right: Copyright */}
          <div className="text-xs text-blue-200/80 text-center sm:text-right">
            Discipleship Portal © 2026. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}