import React from "react";
import Image from "next/image";
import { Award, CheckCircle2 } from "lucide-react";

export default function ForewordTab() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Official Parchment/Document Container */}
      <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl p-5 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {/* 1. OFFICIAL LETTERHEAD HEADER */}
        <div className="text-center pb-6 sm:pb-8">
          
          {/* Centered Church Logo with Pure Pulsating Glow */}
          <div className="flex justify-center mb-4">
            <div className="relative flex items-center justify-center shrink-0">
              
              {/* Continuous Pulsating Glow Layer matching Logo Shape */}
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

          <p className="text-amber-400 font-bold text-[11px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase font-sans">
            Ministry of Christ's Great Commission Church Inc.
          </p>
          <p className="text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-widest font-sans mt-1">
            Office of the Senior Pastor • General Leadership Directorate
          </p>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-[10px] sm:text-xs font-mono text-slate-400">
            <span>REF NO: MCGC-FW-2026-01</span>
            <span className="hidden sm:inline">•</span>
            <span>OFFICIAL PASTORAL COMMENDATION</span>
            <span className="hidden sm:inline">•</span>
            <span>DATE: SEPTEMBER 2026</span>
          </div>
        </div>

        {/* FIRST ANIMATED DIVIDER LINE */}
        <div className="relative w-full h-[1px] my-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent blur-[1px] animate-pulse" />
        </div>

        {/* 2. DOCUMENT TITLE */}
        <div className="my-8 sm:my-10 text-center px-2">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white font-serif tracking-tight uppercase whitespace-normal md:whitespace-nowrap">
            Official Endorsement & Foreword
          </h1>
          <p className="text-amber-300/90 text-xs sm:text-sm font-sans mt-2 tracking-wide font-medium">
            Concerning the Launch of the MCGC Discipleship System Portal
          </p>
        </div>

        {/* SECOND ANIMATED DIVIDER LINE */}
        <div className="relative w-full h-[1px] my-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent blur-[1px] animate-pulse" />
        </div>

        {/* 3. STATEMENT BODY (Formal Justified Prose) */}
        <div className="space-y-5 sm:space-y-6 text-slate-200 font-serif text-sm sm:text-base md:text-lg leading-relaxed text-left sm:text-justify py-6 sm:py-8">
          <p>
            <span className="font-sans font-bold text-white uppercase tracking-wider text-xs sm:text-sm block mb-1 text-left">
              To the MCGC Church Community and Believers in Christ,
            </span>
            Discipleship is not a program we complete; it is a lifelong journey of following Jesus, growing in His truth, and being transformed into His image. In an era marked by noise and shifting cultural norms, holding fast to a clear, grounded understanding of the foundational truths of our faith is essential for every believer.
          </p>

          <p>
            The <strong className="text-white font-sans font-semibold">MCGC Discipleship System Portal</strong> has been thoughtfully developed by <strong className="text-amber-300 font-sans font-semibold">Viz Giron</strong> to serve as an official, structured learning resource for our congregation. Following a thorough review by our pastoral leadership team, we confirm that its core teachings align faithfully with Holy Scripture and the established statement of faith of Ministry of Christ's Great Commission Church Inc.
          </p>

          <p>
            Whether you are taking your very first steps in faith, returning to establish core biblical foundations, or stepping up to disciple others, it is my sincere prayer that these modules strengthen your walk with Christ, root you deeply in God's Word, and empower you to fulfill the Great Commission with clarity and conviction.
          </p>
        </div>

        {/* 4. FORMAL SIGN-OFF & ATTESTATION BLOCK */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-end">
          
          {/* Pastor Sign-Off Block */}
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs font-sans uppercase tracking-widest text-slate-400 font-semibold">
              Given under my hand & pastoral authority,
            </p>

            {/* Overriding transparent PNG padding using scale & negative margins */}
            <div className="relative h-20 w-64 my-1">
              <div className="absolute inset-0 flex items-center justify-start scale-[2.2] sm:scale-[2.5] origin-left translate-y-1">
                <Image
                  src="/pastor-signature.png"
                  alt="Signature of Rev. Lorenzo A. Bobis"
                  fill
                  sizes="256px"
                  className="object-contain object-left drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]"
                  priority
                />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide pt-2 relative z-10">
              Rev. Lorenzo A. Bobis
            </h2>
            <p className="text-xs text-amber-400 font-sans font-semibold uppercase tracking-wider">
              Senior Pastor
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 font-sans">
              Ministry of Christ's Great Commission Church Inc.
            </p>
          </div>

          {/* Official Verification Stamp */}
          <div className="bg-slate-950/90 border border-amber-400/30 rounded-lg p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-inner">
            <div className="p-2.5 sm:p-3 bg-amber-400/10 rounded-full border border-amber-400/20 shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
            </div>
            <div className="font-sans text-left space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified & RATIFIED</span>
              </div>
              <p className="text-xs font-medium text-slate-200">
                Official Doctrinal Clearance
              </p>
              <p className="text-[10px] text-slate-400">
                Approved for Church-Wide Curriculum Integration
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}