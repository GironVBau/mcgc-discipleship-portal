import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SpiritualGiftsForm from '@/components/SpiritualGiftsForm';

export default async function SpiritualGiftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col font-sans text-slate-100">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111827] rounded-3xl p-8 border border-slate-800 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Authentication Required</h2>
            <p className="text-slate-400 text-sm">Please log in to access the Spiritual Gifts Survey.</p>
            <Link href="/login" className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
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

  // 2. Verify Prerequisites: User must have submissions in student_exam_submissions for both levels
  let isUnlocked = false;

  if (foundationalId && fundamentalId) {
    const { data: examSubmissions } = await supabase
      .from('student_exam_submissions')
      .select('course_id')
      .eq('user_id', user.id)
      .in('course_id', [foundationalId, fundamentalId]);

    const submittedFoundational = examSubmissions?.some(r => r.course_id === foundationalId);
    const submittedFundamental = examSubmissions?.some(r => r.course_id === fundamentalId);

    // Unlocked ONLY if both Level 1 and Level 2 exam submissions exist
    if (submittedFoundational && submittedFundamental) {
      isUnlocked = true;
    }
  }

  // Locked State View
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col font-sans text-slate-100">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex items-center">
          <div className="bg-[#111827] rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl text-center space-y-6 w-full">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400 text-2xl">
              🔒
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Locked Bridge Assessment
              </span>
              <h1 className="text-2xl font-extrabold text-white">Spiritual Gifts Survey</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                This evaluation must be completed before entering <strong className="text-white">Level 3: Ministry Readiness Track</strong>. To unlock this survey, you must first finish both <strong className="text-white">Level 1: Foundational</strong> and <strong className="text-white">Level 2: Fundamental Discipleship</strong>.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/courses/foundational-discipleship"
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all border border-slate-700"
              >
                Level 1: Foundational
              </Link>
              <Link
                href="/courses/fundamental-discipleship"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10"
              >
                Level 2: Fundamental →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fetch Questions (selecting id, statement, and category based on your schema) and Previous Results if Unlocked
  const { data: questions } = await supabase
    .from('spiritual_gifts_questions')
    .select('id, category, statement')
    .order('id', { ascending: true });

  const { data: existingResult } = await supabase
    .from('user_spiritual_gifts_results')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col font-sans text-slate-100">
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
        <header className="bg-[#111827] border border-slate-800 rounded-3xl p-8 text-white space-y-2 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
            Prerequisite for Level 3: Ministry Readiness
          </span>
          <h1 className="text-3xl font-extrabold text-white">Spiritual Gifts Survey</h1>
          <p className="text-slate-400 text-sm">
            Discover your primary spiritual gifts to prepare for your Level 3 Ministry Readiness track and active service.
          </p>
        </header>

        <SpiritualGiftsForm questions={questions || []} existingResult={existingResult} />
      </main>
    </div>
  );
}