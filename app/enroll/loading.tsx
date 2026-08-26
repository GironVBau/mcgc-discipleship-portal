'use client';

import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02050e]/85 backdrop-blur-md text-slate-100 space-y-4">
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <Image
            src="/1080.png"
            alt="MCGC Logo"
            width={28}
            height={28}
            className="object-contain w-7 h-7"
          />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
          Loading Lessons...
        </h3>
        <p className="text-[11px] text-slate-400">
          Please wait...
        </p>
      </div>
    </div>
  );
}