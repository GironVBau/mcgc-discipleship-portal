import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, 
  Shield, 
  Lock, 
  Users, 
  Server, 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  Mail, 
  ArrowRight 
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 selection:bg-amber-400 selection:text-slate-950">
      
      {/* Background Lighting Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Document Container */}
      <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl p-5 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {/* 1. TOP NAVIGATION & HEADER */}
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <div className="text-center pb-4">
            {/* Centered Crest with Pulsating Glow */}
            <div className="flex justify-center mb-4">
              <div className="relative flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber-400/35 blur-lg animate-pulse scale-110" />
                <Image
                  src="/1080.png"
                  alt="MCGC Church Crest"
                  width={80}
                  height={80}
                  className="relative z-10 object-contain w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(251,191,36,0.85)]"
                  priority
                />
              </div>
            </div>

            <span className="inline-flex items-center space-x-2 text-amber-400 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-full mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Data Protection Policy</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-serif uppercase mt-1">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-2">
              Effective Date: August 2026
            </p>
          </div>
        </div>

        {/* FIRST ANIMATED DIVIDER LINE */}
        <div className="relative w-full h-[1px] my-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent blur-[1px] animate-pulse" />
        </div>

        {/* 2. INTRODUCTORY BANNER */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl text-slate-300 text-sm leading-relaxed font-serif my-6">
          The <strong className="text-white font-sans font-semibold">MCGC Discipleship Portal</strong> is committed to safeguarding the privacy and personal information of every member. This Privacy Policy details the standards and procedures governing data collection, usage, storage, and security across the platform.
        </div>

        {/* 3. POLICY SECTIONS */}
        <div className="space-y-8 text-slate-300 font-sans text-xs sm:text-sm my-6">
          
          {/* Section 1: Information We Collect */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm sm:text-base">
              <FileText className="w-4 h-4 shrink-0" />
              <h2 className="text-white">1. Information We Collect</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              To facilitate account administration, track spiritual formation, and evaluate academic progress, the system processes the following data points:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                "Full Name & Identification",
                "Verified E-mail Address",
                "Church Membership Status",
                "Course Progress & Completion Records",
                "Assessment & Examination Grades",
                "Account Authentication Credentials",
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/90 hover:border-amber-400/30 px-3.5 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all duration-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm sm:text-base">
              <UserCheck className="w-4 h-4 shrink-0" />
              <h2 className="text-white">2. How We Use Your Information</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Collected data is utilized strictly to support your discipleship journey and uphold administrative accountability:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pl-1">
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Granting access to curriculum and media materials</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Recording quiz and exam completion results</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Generating official certificates of completion</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Enabling oversight by authorized church leadership</span>
              </li>
            </ul>
          </section>

          {/* Section 3: Data Protection */}
          <section className="bg-slate-950/90 border border-emerald-500/30 p-5 sm:p-6 rounded-xl space-y-2 shadow-inner">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Lock className="w-4 h-4 shrink-0" />
              <h2 className="text-white">3. Data Security &amp; Access Governance</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Administrative and technical safeguards are enforced to prevent unauthorized data access, disclosure, or modification. Internal access to user records is strictly restricted to designated church administrators and pastoral staff responsible for discipleship oversight.
            </p>
          </section>

          {/* Section 4 & 5 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs sm:text-sm">
                <Server className="w-4 h-4 shrink-0" />
                <h2 className="text-white">4. Third-Party Infrastructure</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The platform relies on secure, industry-standard third-party providers:
              </p>
              <ul className="text-xs text-slate-300 space-y-1 pl-1">
                <li><strong className="text-white">Supabase:</strong> Database hosting &amp; encrypted auth</li>
                <li><strong className="text-white">YouTube:</strong> Embedded video curriculum delivery</li>
              </ul>
            </section>

            <section className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs sm:text-sm">
                <Users className="w-4 h-4 shrink-0" />
                <h2 className="text-white">5. Commercial Non-Disclosure</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Personal details are never sold, rented, or distributed to third parties for commercial or marketing purposes. Information is accessed exclusively for ministry operations or legal compliance.
              </p>
            </section>
          </div>

          {/* Section 6 & 7 Responsibilities */}
          <div className="space-y-4 pt-2">
            <section className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Accountability &amp; Account Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Users are responsible for maintaining the confidentiality of their authentication credentials. Any suspected unauthorized account activity should be reported immediately to church platform administrators.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Policy Revisions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This Privacy Policy may be updated periodically to reflect system optimizations or administrative updates. Continued use of the platform constitutes acceptance of the published terms.
              </p>
            </section>
          </div>

        </div>

        {/* SECOND ANIMATED DIVIDER LINE */}
        <div className="relative w-full h-[1px] my-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent blur-[1px] animate-pulse" />
        </div>

        {/* 4. CONTACT CARD */}
        <div className="bg-slate-950/90 border border-amber-400/20 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase">
              <Mail className="w-3.5 h-3.5" />
              <span>Inquiries &amp; Data Requests</span>
            </div>
            <p className="text-xs text-slate-400">
              For questions regarding privacy practices, contact the administration of <strong className="text-slate-200">Ministry of Christ's Great Commission Church Inc.</strong>
            </p>
          </div>
        </div>

        {/* 5. FOOTER ACTION */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-slate-400">
          <span>© 2026 Ministry of Christ's Great Commission Church Inc.</span>
          <Link 
            href="/about" 
            className="inline-flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors group"
          >
            <span>Read About Platform</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}