'use client';

import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02050e]/80 backdrop-blur-sm text-slate-100 space-y-4">
      
      {/* Container for the rotating circle and logo */}
      <div className="relative flex items-center justify-center w-24 h-24">
        
        {/* Rotating Circular Spinner Ring */}
        <div className="absolute inset-0 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
        
        {/* MCGC Logo in the Center */}
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <Image
            src="/1080.png"
            alt="MCGC Logo"
            width={38}
            height={38}
            className="object-contain w-7 h-7"
          />
        </div>

      </div>

      {/* Loading Text */}
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
          Kalma lang kapatid...
        </h3>
        <p className="text-[11px] text-slate-400">
          Please wait...
        </p>
      </div>

    </div>
  );
}