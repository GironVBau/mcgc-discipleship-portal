import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap, ShieldCheck, Award, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 selection:bg-amber-400 selection:text-slate-950">
      
      {/* Background Lighting Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Formatted Document Container matching Foreword styling */}
      <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl p-5 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Decorative Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {/* 1. HEADER & BRAND CREST */}
        <div className="text-center pb-6 sm:pb-8">
          
          {/* Centered Church Logo with Pure Pulsating Glow */}
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

          <span className="inline-block text-amber-400 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-full mb-4">
            About the Platform
          </span>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-serif uppercase">
            Equipping Believers{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              in Faith
            </span>
          </h1>
        </div>

        {/* FIRST ANIMATED DIVIDER LINE */}
        <div className="relative w-full h-[1px] my-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent blur-[1px] animate-pulse" />
        </div>

        {/* 2. BODY TEXT CONTENT */}
        <div className="space-y-6 text-slate-300 font-serif text-sm sm:text-base leading-relaxed py-6 text-left sm:text-justify">
          <p className="text-base sm:text-lg text-slate-200 font-normal">
            The <strong className="text-white font-sans font-semibold">MCGC Discipleship Portal</strong> is the official digital learning platform of the <strong className="text-amber-300 font-sans font-semibold">Ministry of Christ's Great Commission Church Inc.</strong> It was established to support the church's Standard On-boarding Process (S.O.P.) by providing every believer with a clear, structured, and biblically grounded pathway for spiritual growth.
          </p>

          <p>
            The platform was created to standardize discipleship across the church, ensuring that every member receives consistent biblical instruction regardless of who facilitates the class or where learning takes place. By combining structured lessons, interactive assessments, progress tracking, and leadership oversight, the portal promotes accountability, doctrinal consistency, and continuous spiritual development.
          </p>

          <p>
            Designed for accessibility and flexibility, the MCGC Discipleship Portal enables members to continue their discipleship journey anytime and anywhere while remaining connected to the guidance and oversight of church leadership. Whether beginning the foundations of faith or advancing toward greater ministry responsibility, every learner follows the same intentional pathway of biblical formation.
          </p>
        </div>

        {/* SECOND ANIMATED DIVIDER LINE */}
        <div className="relative w-full h-[1px] my-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent blur-[1px] animate-pulse" />
        </div>

        {/* 3. HIGHLIGHT METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-8 font-sans">
          <div className="bg-slate-950/80 border border-slate-800/90 p-5 rounded-xl flex items-start space-x-4 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">26 Core Lessons</h4>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Organized into three structured learning tracks for progressive spiritual growth.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 p-5 rounded-xl flex items-start space-x-4 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center border border-amber-400/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Expanding Curriculum</h4>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Additional courses, electives, and leadership training modules continuously integrated.
              </p>
            </div>
          </div>
        </div>

        {/* 4. AUTHORSHIP & DOCTRINAL ALIGNMENT CARD */}
        <div className="bg-slate-950/90 border border-amber-400/30 p-6 sm:p-8 rounded-xl space-y-4 shadow-xl font-sans relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-amber-400">
            <Award className="w-32 h-32" />
          </div>

          <div className="flex items-center space-x-3 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm sm:text-base tracking-wide uppercase">
              Authorship &amp; Doctrinal Alignment
            </h3>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10">
            The platform, curriculum, lessons, assessments, and user experience were designed, developed, and authored by <strong className="text-amber-300 font-semibold">Viz Giron</strong>, drawing from formal training in Christian Music Arts and studies in Biblical Studies, Systematic Theology, and Practical Theology.
          </p>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-3 border-t border-slate-800/80 relative z-10">
            All instructional content has been prepared in submission to the doctrinal position and Statement of Faith of Ministry of Christ's Great Commission Church Inc., ensuring that every lesson remains aligned with the church's biblical convictions and discipleship mission.
          </p>
        </div>

        {/* 5. FOOTER ACTION & LEGAL */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-slate-400">
          <span>© 2026 Ministry of Christ's Great Commission Church Inc.</span>
          <Link 
            href="/courses" 
            className="inline-flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors group"
          >
            <span>Explore Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}