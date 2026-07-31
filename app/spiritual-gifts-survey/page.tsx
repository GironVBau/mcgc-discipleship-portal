import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SpiritualGiftsForm from '@/components/SpiritualGiftsForm';

export default async function SpiritualGiftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
            <p className="text-slate-600 text-sm">Please log in to access the Spiritual Gifts Survey.</p>
            <Link href="/login" className="inline-block bg-[#1e2e68] text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1. Fetch Course IDs for Level 1 and Level 2
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug')
    .in('slug', ['foundational-discipleship', 'fundamental-discipleship']);

  const foundationalId = courses?.find(c => c.slug === 'foundational-discipleship')?.id;
  const fundamentalId = courses?.find(c => c.slug === 'fundamental-discipleship')?.id;

  // 2. Verify Prerequisites: User must pass both Level 1 and Level 2 exams
  let isUnlocked = false;

  if (foundationalId && fundamentalId) {
    const { data: examResults } = await supabase
      .from('user_exam_results')
      .select('course_id, passed')
      .eq('user_id', user.id)
      .in('course_id', [foundationalId, fundamentalId]);

    const passedFoundational = examResults?.some(r => r.course_id === foundationalId && r.passed);
    const passedFundamental = examResults?.some(r => r.course_id === fundamentalId && r.passed);

    // Unlocked ONLY if both Level 1 and Level 2 are passed
    if (passedFoundational && passedFundamental) {
      isUnlocked = true;
    }
  }

  // Locked State View
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex items-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-6 w-full">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 text-2xl">
              🔒
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                Locked Bridge Assessment
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900">Spiritual Gifts Survey</h1>
              <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
                This evaluation must be completed before entering <strong>Level 3: Ministry Readiness Track</strong>. To unlock this survey, you must first finish both <strong>Level 1: Foundational</strong> and <strong>Level 2: Fundamental Discipleship</strong>.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/courses/foundational-discipleship"
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Level 1: Foundational
              </Link>
              <Link
                href="/courses/fundamental-discipleship"
                className="w-full sm:w-auto bg-[#1e2e68] hover:bg-[#162350] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Level 2: Fundamental →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fetch Questions and Previous Results if Unlocked
  const { data: questions } = await supabase
    .from('spiritual_gifts_questions')
    .select('*')
    .order('id', { ascending: true });

  const { data: existingResult } = await supabase
    .from('user_spiritual_gifts_results')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
        <header className="bg-[#1e2e68] rounded-3xl p-8 text-white space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full border border-blue-400/30">
            Prerequisite for Level 3: Ministry Readiness
          </span>
          <h1 className="text-3xl font-extrabold">Spiritual Gifts Survey</h1>
          <p className="text-blue-100 text-sm">
            Discover your primary spiritual gifts to prepare for your Level 3 Ministry Readiness track and active service.
          </p>
        </header>

        <SpiritualGiftsForm questions={questions || []} existingResult={existingResult} />
      </main>
    </div>
  );
}