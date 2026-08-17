import Link from "next/link";
import Image from "next/image";

export default function Footer() {
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
              Scripture quotations: NKJV, © 1982 Thomas Nelson.
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