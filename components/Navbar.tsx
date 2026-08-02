import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full bg-white text-slate-900 px-6 py-4 flex items-center justify-between shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <Link href="/" className="flex items-center space-x-3">
        <Image
          src="/1080.png"
          alt="MCGC Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <div>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ministry of Christ&apos;s Great Commission Church Inc.
          </p>
          <h1 className="text-sm sm:text-base font-bold leading-tight text-slate-900">
            Discipleship Portal for Standard On-boarding Process (S.O.P) 
          </h1>
        </div>
      </Link>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <Link
          href="/courses"
          className="text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-900 transition-colors"
        >
          Courses
        </Link>
        <Link
          href="/login/staff"
          className="text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-900 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/enroll"
          className="bg-[#1e2e68] hover:bg-[#162350] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Enroll Now
        </Link>
      </div>
    </header>
  );
}