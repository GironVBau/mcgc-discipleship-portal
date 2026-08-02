import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, BookOpen, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-16 px-6 sm:px-8 selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden">
      
      {/* Background Lighting Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Top Header & Navigation */}
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <div className="space-y-3">
            <span className="inline-block text-amber-400 text-xs font-bold tracking-widest uppercase bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-full">
              About the Platform
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Equipping Every Believer Through a{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Standardized Discipleship Journey
              </span>
            </h1>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base border-t border-slate-900 pt-8">
          
          <p className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed">
            The <strong>MCGC Discipleship Portal</strong> is the official digital learning platform of the <strong>Ministry of Christ's Great Commission Church Inc.</strong> It was established to support the church's Standard On-boarding Process (S.O.P.) by providing every believer with a clear, structured, and biblically grounded pathway for spiritual growth.
          </p>

          <p>
            The platform was created to standardize discipleship across the church, ensuring that every member receives consistent biblical instruction regardless of who facilitates the class or where learning takes place. By combining structured lessons, interactive assessments, progress tracking, and leadership oversight, the portal promotes accountability, doctrinal consistency, and continuous spiritual development.
          </p>

          <p>
            Designed for accessibility and flexibility, the MCGC Discipleship Portal enables members to continue their discipleship journey anytime and anywhere while remaining connected to the guidance and oversight of church leadership. Whether beginning the foundations of faith or advancing toward greater ministry responsibility, every learner follows the same intentional pathway of biblical formation.
          </p>

          {/* Highlight Stats Banner */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 backdrop-blur-md">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">26 Core Lessons</h4>
                <p className="text-xs text-slate-400 mt-1">Organized into three structured learning tracks for progressive growth.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Expanding Library</h4>
                <p className="text-xs text-slate-400 mt-1">Additional courses and resources continue to be introduced.</p>
              </div>
            </div>
          </div>

          {/* Authorship & Doctrinal Alignment Card */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 p-6 sm:p-8 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Authorship &amp; Doctrinal Alignment</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The platform, curriculum, lessons, assessments, and user experience were designed, developed, and authored by <strong>Viz Giron</strong>, drawing from formal training in Christian Music Arts and studies in Biblical Studies, Systematic Theology, and Practical Theology.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
              All instructional content has been prepared in submission to the doctrinal position and Statement of Faith of Ministry of Christ's Great Commission Church Inc., ensuring that every lesson remains aligned with the church's biblical convictions and discipleship mission.
            </p>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-slate-900 flex justify-between items-center text-xs text-slate-400">
          <span>© 2026 Ministry of Christ's Great Commission Church Inc.</span>
          <Link href="/privacy" className="hover:text-amber-400 transition-colors">
            Read Privacy Policy →
          </Link>
        </div>

      </div>
    </div>
  );
}