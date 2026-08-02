import Link from "next/link";
import { ChevronLeft, Shield, Lock, Users, Server, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-16 px-6 sm:px-8 selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden">
      
      {/* Background Lighting Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

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
            <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold tracking-widest uppercase bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              <span>Data Protection</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Last Updated: August 2026
            </p>
          </div>
        </div>

        {/* Introductory Banner */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-slate-300 text-sm leading-relaxed backdrop-blur-md">
          The <strong>MCGC Discipleship Portal</strong> is committed to protecting the privacy and personal information of every member. This Privacy Policy explains how information is collected, used, stored, and protected while using the platform.
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-10 text-slate-300 leading-relaxed text-sm border-t border-slate-900 pt-8">
          
          {/* 1. Information We Collect */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
              <FileText className="w-4 h-4" />
              <h2 className="text-white">Information We Collect</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              To provide access to the discipleship platform and monitor learning progress, we may collect the following information:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
              <li className="bg-slate-900/40 border border-slate-800/80 px-3.5 py-2.5 rounded-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Your name</span>
              </li>
              <li className="bg-slate-900/40 border border-slate-800/80 px-3.5 py-2.5 rounded-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>E-mail address</span>
              </li>
              <li className="bg-slate-900/40 border border-slate-800/80 px-3.5 py-2.5 rounded-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Church membership information (when applicable)</span>
              </li>
              <li className="bg-slate-900/40 border border-slate-800/80 px-3.5 py-2.5 rounded-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Learning progress and course completion records</span>
              </li>
              <li className="bg-slate-900/40 border border-slate-800/80 px-3.5 py-2.5 rounded-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Quiz, examination, and assessment results</span>
              </li>
              <li className="bg-slate-900/40 border border-slate-800/80 px-3.5 py-2.5 rounded-lg flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Account login information</span>
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">How We Use Your Information</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              The information collected is used solely for the purpose of supporting your discipleship journey. This includes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 pl-2">
              <li>Providing access to courses and learning materials</li>
              <li>Tracking learning progress and course completion</li>
              <li>Recording assessment and examination results</li>
              <li>Issuing completion certificates</li>
              <li>Providing guidance and support through authorized church leadership</li>
              <li>Improving the quality and functionality of the platform</li>
            </ul>
          </section>

          {/* 3. Data Protection */}
          <section className="space-y-3 bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Lock className="w-4 h-4" />
              <h2 className="text-white">Data Protection</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reasonable administrative and technical measures are implemented to protect your personal information from unauthorized access, alteration, disclosure, or misuse. Access to personal data is limited to authorized administrators and church leaders responsible for managing the discipleship program.
            </p>
          </section>

          {/* 4. Third-Party Services & Data Sharing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="space-y-3 bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <Server className="w-4 h-4" />
                <h2 className="text-white">Third-Party Services</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The platform may use trusted third-party services to operate certain features, including:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                <li><strong>Supabase</strong> for secure data storage and authentication</li>
                <li><strong>YouTube</strong> for embedded educational video content</li>
              </ul>
              <p className="text-[11px] text-slate-500 pt-1">
                These services are governed by their own respective privacy policies.
              </p>
            </section>

            <section className="space-y-3 bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                <h2 className="text-white">Data Sharing</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Personal information is not sold, rented, or shared with third parties for commercial purposes. Information may only be accessed by authorized church personnel when necessary to administer the discipleship program or when required by applicable law.
              </p>
            </section>
          </div>

          {/* 5. User Responsibility & Policy Changes */}
          <div className="space-y-6 pt-2">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-white">Your Responsibility</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Users are responsible for maintaining the confidentiality of their account credentials and for notifying a church administrator if they believe their account has been accessed without authorization.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white">Changes to This Policy</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                This Privacy Policy may be updated from time to time to reflect improvements to the platform or changes in applicable requirements. Any updates will be published on this page.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-900 pt-6">
              <h2 className="text-base font-bold text-white">Contact</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you have any questions regarding this Privacy Policy or the handling of your personal information, please contact the administrators of the <strong>Ministry of Christ's Great Commission Church Inc.</strong>
              </p>
            </section>
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="pt-8 border-t border-slate-900 flex justify-between items-center text-xs text-slate-400">
          <span>© 2026 Ministry of Christ's Great Commission Church Inc.</span>
          <Link href="/about" className="hover:text-amber-400 transition-colors">
            Read About Platform →
          </Link>
        </div>

      </div>
    </div>
  );
}