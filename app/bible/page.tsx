import dynamic from 'next/dynamic';

const BibleReader = dynamic(() => import('@/components/BibleReader'));

export const metadata = {
  title: 'KJV Holy Bible | MCGC Portal',
  description: 'Read the KJV Bible online.',
};

export default function BiblePage() {
  return (
    <main className="min-h-screen bg-[#02050e] py-8 sm:py-12">
      <BibleReader />
    </main>
  );
}