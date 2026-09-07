import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

// Skeleton fallback to prevent Cumulative Layout Shift (CLS)
function BibleReaderSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-16 bg-slate-900 rounded-xl border border-slate-800" />
      <div className="h-[500px] bg-slate-900/60 rounded-2xl border border-slate-800" />
    </div>
  );
}

const BibleReader = dynamic(() => import('@/components/BibleReader'), {
  loading: () => <BibleReaderSkeleton />,
  ssr: true, // Keep SSR active if your component handles initial state cleanly
});

export const metadata: Metadata = {
  title: 'KJV Holy Bible | MCGC Portal',
  description: 'Read and search the King James Version Holy Bible online.',
  openGraph: {
    title: 'KJV Holy Bible | MCGC Portal',
    description: 'Read and search the King James Version Holy Bible online.',
    type: 'website',
  },
};

export default function BiblePage() {
  return (
    <main className="min-h-screen bg-[#02050e] py-8 sm:py-12" aria-label="Bible Reader Section">
      <h1 className="sr-only">King James Version Bible Reader</h1>
      <BibleReader />
    </main>
  );
}