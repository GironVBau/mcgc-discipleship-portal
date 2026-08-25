'use client';

import { useState } from 'react';
import ScriptureDrawer from '@/components/ScriptureDrawer';

interface KeyScripturePillsProps {
  scriptures: string[];
}

export default function KeyScripturePills({ scriptures }: KeyScripturePillsProps) {
  const [activeScripture, setActiveScripture] = useState<string | null>(null);

  if (!scriptures || scriptures.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-2">
        {scriptures.map((scripture, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveScripture(scripture)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-amber-400/80 hover:bg-amber-50/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer group"
          >
            <span className="group-hover:scale-110 transition-transform">📖</span> 
            <span>{scripture}</span>
          </button>
        ))}
      </div>

      {/* Scripture Side Panel */}
      <ScriptureDrawer 
        reference={activeScripture} 
        onClose={() => setActiveScripture(null)} 
      />
    </>
  );
}