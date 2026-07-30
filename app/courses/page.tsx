import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all 3 courses from DB
  const { data: courses } = await supabase
    .from('courses')
    .select('*');

  const foundationalCourse = courses?.find(c => c.slug === 'foundational-discipleship');
  const fundamentalCourse = courses?.find(c => c.slug === 'fundamental-discipleship');
  const ministryReadinessCourse = courses?.find(c => c.slug === 'ministry-readiness');

  // Track progress if logged in
  let passedLevel1 = false;
  let passedLevel2 = false;
  let completedSurvey = false;

  if (user) {
    // 1. Check Level 1 & Level 2 Exam Results
    const { data: examResults } = await supabase
      .from('user_exam_results')
      .select('course_id, passed')
      .eq('user_id', user.id);

    passedLevel1 = !!examResults?.some(
      r => r.course_id === foundationalCourse?.id && r.passed
    );
    passedLevel2 = !!examResults?.some(
      r => r.course_id === fundamentalCourse?.id && r.passed
    );

    // 2. Check Spiritual Gifts Survey Results
    const { data: surveyResult } = await supabase
      .from('user_spiritual_gifts_results')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    completedSurvey = !!surveyResult;
  }

  // Calculate Lock States
  const isLevel2Unlocked = passedLevel1;
  const isSurveyUnlocked = passedLevel1 && passedLevel2;
  const isLevel3Unlocked = isSurveyUnlocked && completedSurvey;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-10">
        <header className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1e2e68] bg-blue-100/80 px-3 py-1 rounded-full border border-blue-200">
            MCGC Standard On-boarding Process
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Discipleship and Ministry Readiness
          </h1>
          <p className="text-slate-600 text-sm max-w-lg mx-auto">
            From foundational truth to mature faith. Every step of your spiritual formation is tracked, guided, and celebrated.
          </p>
        </header>

        <div className="space-y-6">
          {/* LEVEL 1 CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Level 1
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {foundationalCourse?.title || 'Foundational Discipleship'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                {foundationalCourse?.description || 'A foundational study for new believers covering the essential starting points of the Christian walk.'}
              </p>
            </div>
            <Link
              href="/courses/foundational-discipleship"
              className="w-full sm:w-auto text-center bg-[#1e2e68] hover:bg-[#162350] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm"
            >
              {passedLevel1 ? 'Review Track →' : 'Start Level 1 →'}
            </Link>
          </div>

          {/* LEVEL 2 CARD */}
          <div className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all ${
            isLevel2Unlocked ? 'border-slate-200 opacity-100' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isLevel2Unlocked ? 'text-blue-800 bg-blue-100' : 'text-slate-600 bg-slate-200'
                }`}>
                  Level 2
                </span>
                {!isLevel2Unlocked && <span className="text-xs text-amber-700 font-semibold">🔒 Complete Level 1 to unlock</span>}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {fundamentalCourse?.title || 'Fundamental Discipleship'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                {fundamentalCourse?.description || 'A systematic study of core Christian doctrine grounded in Scripture.'}
              </p>
            </div>
            {isLevel2Unlocked ? (
              <Link
                href="/courses/fundamental-discipleship"
                className="w-full sm:w-auto text-center bg-[#1e2e68] hover:bg-[#162350] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                {passedLevel2 ? 'Review Track →' : 'Start Level 2 →'}
              </Link>
            ) : (
              <button disabled className="w-full sm:w-auto bg-slate-200 text-slate-400 font-semibold text-sm px-6 py-3 rounded-xl cursor-not-allowed">
                Locked
              </button>
            )}
          </div>

          {/* BRIDGE: SPIRITUAL GIFTS SURVEY CARD */}
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all ${
            isSurveyUnlocked 
              ? 'bg-gradient-to-br from-[#1e2e68] to-[#121c40] text-white border-blue-900' 
              : 'bg-white border-slate-200 opacity-60'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isSurveyUnlocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  Bridge Assessment
                </span>
                {!isSurveyUnlocked && <span className="text-xs text-amber-700 font-semibold">🔒 Complete Levels 1 & 2 first</span>}
              </div>
              <h2 className={`text-xl font-bold ${isSurveyUnlocked ? 'text-white' : 'text-slate-900'}`}>
                Spiritual Gifts Survey
              </h2>
              <p className={`text-xs leading-relaxed max-w-md ${isSurveyUnlocked ? 'text-blue-100' : 'text-slate-600'}`}>
                Discover your primary ministry gifts and strengths. Required before unlocking Level 3: Ministry Readiness.
              </p>
            </div>
            {isSurveyUnlocked ? (
              <Link
                href="/spiritual-gifts-survey"
                className="w-full sm:w-auto text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                {completedSurvey ? 'View / Retake Survey →' : 'Take Survey Now →'}
              </Link>
            ) : (
              <button disabled className="w-full sm:w-auto bg-slate-200 text-slate-400 font-semibold text-sm px-6 py-3 rounded-xl cursor-not-allowed">
                Locked
              </button>
            )}
          </div>

          {/* LEVEL 3 CARD */}
          <div className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all ${
            isLevel3Unlocked ? 'border-slate-200 opacity-100' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isLevel3Unlocked ? 'text-purple-800 bg-purple-100' : 'text-slate-600 bg-slate-200'
                }`}>
                  Level 3
                </span>
                {!isLevel3Unlocked && <span className="text-xs text-amber-700 font-semibold">🔒 Complete Spiritual Gifts Survey to unlock</span>}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {ministryReadinessCourse?.title || 'Ministry Readiness Track'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                {ministryReadinessCourse?.description || 'Discover spiritual gifts, understand biblical ministry, and find your place of service in the church.'}
              </p>
            </div>
            {isLevel3Unlocked ? (
              <Link
                href="/courses/ministry-readiness"
                className="w-full sm:w-auto text-center bg-[#1e2e68] hover:bg-[#162350] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                Start Level 3 →
              </Link>
            ) : (
              <button disabled className="w-full sm:w-auto bg-slate-200 text-slate-400 font-semibold text-sm px-6 py-3 rounded-xl cursor-not-allowed">
                Locked
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}