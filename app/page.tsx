import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1e2e68] text-white flex flex-col font-sans">
      {/* Navbar */}
      <header className="w-full bg-white text-gray-900 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <Image
            src="/1080.png"
            alt="MCGC Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ministry of Christ's Great Commission Church Inc.
            </p>
            <h1 className="text-base font-bold leading-tight">
              Discipleship Portal
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Link
            href="/login/staff"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/enroll"
            className="bg-[#1e2e68] hover:bg-[#162350] text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
          >
            Enroll Now
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <div className="space-y-6">
          <span className="inline-block bg-[#2d3e7d] text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-400/30 uppercase tracking-wider">
            • Official Church Learning Platform
          </span>

          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Grow Deeper in <br />
            <span className="text-[#facc15]">Your Faith</span>
          </h1>

          <p className="text-blue-100 text-lg leading-relaxed max-w-lg">
            Structured discipleship courses designed to strengthen your foundation in Christ. Progress at your pace, guided by trusted church leaders.
          </p>

          <div className="flex items-center space-x-4 pt-4">
            <Link
              href="/login/student"
              className="bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-semibold px-6 py-3.5 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
            >
              <span>Student Login</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login/staff"
              className="border border-blue-300/40 hover:bg-white/10 text-white font-medium px-6 py-3.5 rounded-lg transition-colors"
            >
              Staff Sign In
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex justify-center items-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            <Image
              src="/1080.png"
              alt="Ministry Logo"
              width={300}
              height={300}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </main>
    </div>
  );
}