'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <footer className="w-full border-t border-amber-400/10 bg-[#02050e] pt-14 pb-10 px-6 sm:px-10 relative z-10 text-slate-400 text-[11px] font-sans">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* =====================================================
            BRANDING
            ===================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-7 border-b border-white/[0.04] text-center sm:text-left">

          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-slate-800">
              <Image
                src="/1080.png"
                alt="MCGC Logo"
                width={30}
                height={30}
                className="object-contain w-7 h-7"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-semibold text-slate-200 text-xs tracking-wide">
                MCGC DISCIPLESHIP SYSTEM
              </span>

              <span className="text-[10px] text-slate-500 tracking-wide mt-1">
                Standard On-boarding Process
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-6 text-slate-400 text-[11px] font-medium tracking-wider uppercase">
            <Link
              href="/about"
              className="hover:text-amber-300 transition-colors focus:outline-none focus:underline"
            >
              About
            </Link>

            <Link
              href="/privacy"
              className="hover:text-amber-300 transition-colors focus:outline-none focus:underline"
            >
              Privacy
            </Link>
          </nav>
        </div>

        {/* =====================================================
            SYSTEM DESCRIPTION
            ===================================================== */}

        <div className="max-w-3xl">
          <p className="text-slate-400/90 leading-relaxed">
            The MCGC Discipleship System is an original discipleship framework
            developed for the Ministry of Christ&apos;s Great Commission Church
            Inc. It provides a structured and intentional pathway for biblical
            formation, assessment, and preparation for ministry.
          </p>
        </div>

        {/* =====================================================
            PWA INSTALL APP BANNER (Auto-hides once installed)
            ===================================================== */}

        {!isInstalled && deferredPrompt && (
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-amber-950/20 border border-amber-400/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 mb-1">
                App Available
              </span>
              <h4 className="font-bold text-slate-200 text-xs sm:text-sm tracking-wide">
                Install MCGC Discipleship Portal
              </h4>
              <p className="text-[11px] text-slate-400">
                Add to your home screen for quick offline access, push updates, and a native app experience.
              </p>
            </div>
            
            <button
              onClick={handleInstallClick}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/10 shrink-0 cursor-pointer"
            >
              Install Now →
            </button>
          </div>
        )}

        {/* =====================================================
            COPYRIGHT & AUTHORSHIP
            ===================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-400/90 leading-relaxed">

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Copyright &amp; Authorship
            </h4>

            <p>
              © 2026 Ministry of Christ&apos;s Great Commission Church Inc.
              All rights reserved.
            </p>

            <p>
              The lessons, teaching materials, assessments, and core
              curriculum were authored and developed by{" "}
              <strong className="text-slate-200 font-medium">
                Viz Giron
              </strong>{" "}
              for the MCGC Discipleship System.
            </p>
          </div>

          {/* PERMISSIONS */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Permissions &amp; Attributions
            </h4>

            <p>
              The materials contained within this system are intended for
              authorized MCGC use. Reproduction, distribution, or adaptation
              outside authorized use requires prior written permission.
            </p>

            <p className="text-slate-400/80 pt-0.5">
              Scripture quotations are taken from the King James Version (KJV) and the New King James Version (NKJV), © 1982 Thomas Nelson. Used with permission and authorized for ministry distribution. All rights reserved.
            </p>
          </div>
        </div>

        {/* =====================================================
            BOTTOM BAR
            ===================================================== */}

        <div className="pt-7 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[10px]">

          <p>
            © 2026 Ministry of Christ&apos;s Great Commission Church Inc.
            All Rights Reserved.
          </p>

          <p className="flex items-center space-x-1.5">
            <span>Designed &amp; Developed by</span>

            <span className="font-semibold text-slate-300 hover:text-amber-400 transition-colors">
              Viz Giron
            </span>
          </p>
        </div>

      </div>
    </footer>
  );
}