'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, KeyRound, ShieldAlert, UserCheck, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  // Replace this with your actual email address
  const developerEmail = "earpointn@gmail.com"; 

  const handleContactClick = () => {
    window.location.href = `mailto:${developerEmail}?subject=Password%20Reset%20Request%20-%20MCGC%20Portal&body=Hi%20Viz,%0A%0AI%20forgot%20my%20password%20for%20the%20MCGC%20Discipleship%20Portal.%20My%20registered%20full%20name%20is:%20`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full space-y-6">
          
          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Image
                src="/1080.png"
                alt="MCGC Logo"
                width={64}
                height={64}
                className="object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <KeyRound className="w-6 h-6 text-amber-400" />
              <span>Need help signing in?</span>
            </h1>
          </div>

          {/* Contact Developer Notice */}
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-slate-200 rounded-2xl text-xs space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Manual Password Reset Required</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              If you've forgotten your password, please contact <strong className="text-white">Viz Giron</strong> (Creator & System Developer) for assistance.
            </p>
            <div className="pt-2 border-t border-amber-500/20 flex items-center space-x-2 text-slate-400">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your password can be securely reset after your identity is verified.</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleContactClick}
            type="button"
            className="w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-extrabold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-400/10 text-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Contact System Developer</span>
          </button>

          {/* Back to Login Link */}
          <div className="pt-2 text-center border-t border-slate-800/60">
            <Link
              href="/login/student"
              className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Student Login</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 relative z-10 bg-slate-950/80 backdrop-blur-md text-center text-xs text-slate-500">
        Ministry of Christ's Great Commission Church Inc. © 2026
      </footer>
    </div>
  );
}