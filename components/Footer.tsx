import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full border-t border-amber-400/10 bg-[#02050e] pt-12 pb-10 px-6 sm:px-10 relative z-10 text-slate-400 text-[11px] font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Branding & Nav Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/[0.04] text-center sm:text-left">
          <div className="flex items-center space-x-2.5">
            <Image
              src="/1080.png"
              alt="MCGC Logo"
              width={28}
              height={28}
              className="object-contain w-7 h-7 opacity-80"
            />
            <span className="font-medium text-slate-200 text-xs tracking-wide">
              MCGC Discipleship Portal
            </span>
          </div>

          <nav className="flex items-center space-x-6 text-slate-400 text-[11px] font-medium tracking-wider uppercase">
            <Link href="/about" className="hover:text-amber-300 transition-colors focus:outline-none focus:underline">
              About
            </Link>
            <Link href="/privacy" className="hover:text-amber-300 transition-colors focus:outline-none focus:underline">
              Privacy
            </Link>
          </nav>
        </div>

        {/* Detailed Footnote Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-400/90 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Copyright &amp; Authorship Notice
            </h4>
            <p>© 2026 Ministry of Christ's Great Commission Church Inc. All rights reserved.</p>
            <p>
              All course lessons, teaching materials, and core curriculum were authored by{" "}
              <strong className="text-slate-200 font-medium">Viz Giron</strong> for the MCGC Discipleship Platform.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Permissions &amp; Attributions
            </h4>
            <p>
              No part of this publication may be reproduced or transmitted without prior written permission from MCGC, except for brief teaching quotations.
            </p>
            <p className="text-slate-400/80 pt-0.5">
              Scripture quotations: NKJV, © 1982 Thomas Nelson.
            </p>
          </div>
        </div>

        {/* Bottom Bar with Your Creator Credit */}
        <div className="pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[10px]">
          <p>© 2026 Ministry of Christ's Great Commission Church Inc. All Rights Reserved.</p>
          
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