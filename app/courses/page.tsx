import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all courses
  const { data: courses } = await supabase.from('courses').select('*');

  const foundationalCourse = courses?.find(
    (c) => c.slug === 'foundational-discipleship'
  );
  const fundamentalCourse = courses?.find(
    (c) => c.slug === 'fundamental-discipleship'
  );
  const ministryReadinessCourse = courses?.find(
    (c) => c.slug === 'ministry-readiness'
  );

  let passedLevel1 = false;
  let passedLevel2 = false;
  let completedSurvey = false;
  let allLevel1LessonsCompleted = false;
  let isLevel1Approved = false;

  if (user && foundationalCourse) {
    // 1. Fetch Exam Submissions
    const { data: examSubmissions } = await supabase
      .from('student_exam_submissions')
      .select('course_id, passed')
      .eq('user_id', user.id);

    passedLevel1 = !!examSubmissions?.some(
      (r) => r.course_id === foundationalCourse.id && r.passed
    );
    passedLevel2 = !!examSubmissions?.some(
      (r) => r.course_id === fundamentalCourse?.id && r.passed
    );

    // 2. Check Spiritual Gifts Survey Results
    const { data: surveyResult } = await supabase
      .from('user_spiritual_gifts_results')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    completedSurvey = !!surveyResult;

    // 3. Strict Check: Fetch total Level 1 lessons vs. user completed lessons
    const { data: level1Lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', foundationalCourse.id);

    let completedProgress: any[] = [];
    if (level1Lessons && level1Lessons.length > 0) {
      const lessonIds = level1Lessons.map((l) => l.id);

      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('lesson_id', lessonIds);

      completedProgress = progress || [];
      allLevel1LessonsCompleted = completedProgress.length === level1Lessons.length;
    }

    // 4. Check Teacher/Admin Exam Approval Status
    const { data: approval } = await supabase
      .from('exam_approvals')
      .select('is_approved')
      .eq('user_id', user.id)
      .eq('course_id', foundationalCourse.id)
      .maybeSingle();

    isLevel1Approved = !!approval?.is_approved;
  }

  // Calculate Lock & Exam Access States
  const canTakeLevel1Exam = allLevel1LessonsCompleted && isLevel1Approved;
  const isLevel2Unlocked = passedLevel1;
  const isSurveyUnlocked = passedLevel1 && passedLevel2;
  const isLevel3Unlocked = isSurveyUnlocked && completedSurvey;

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 sf-text antialiased relative overflow-hidden py-16 px-4 sm:px-6">
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto space-y-12 relative z-10">
        <header className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-block sf-text text-[11px] font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20">
            MCGC Discipleship Pathway
          </span>
          <h1 className="sf-display text-3xl sm:text-4xl font-bold text-white tracking-tight pt-1">
            Discipleship &amp; Ministry Readiness
          </h1>
          <p className="sf-text text-sm text-slate-400 leading-relaxed">
            From foundational truth to mature faith. Track, guide, and fulfill every stage of your spiritual growth.
          </p>
        </header>

        <div className="relative space-y-6">
          {/* LEVEL 1 CARD */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="sf-text text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/20">
                    Level 1
                  </span>
                  {passedLevel1 ? (
                    <span className="sf-text text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-800/40">
                      ✓ Exam Passed
                    </span>
                  ) : canTakeLevel1Exam ? (
                    <span className="sf-text text-[11px] text-amber-300 font-bold bg-amber-950/50 px-2.5 py-0.5 rounded-md border border-amber-800/40">
                      ★ Exam Unlocked
                    </span>
                  ) : allLevel1LessonsCompleted && !isLevel1Approved ? (
                    <span className="sf-text text-[11px] text-amber-400 font-medium bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-800/30">
                      ⏳ Awaiting Teacher Approval
                    </span>
                  ) : (
                    <span className="sf-text text-[11px] text-slate-500 font-normal">
                      🔒 Complete all lessons to unlock exam
                    </span>
                  )}
                </div>

                <h2 className="sf-display text-xl font-bold text-white tracking-tight">
                  {foundationalCourse?.title || 'Foundational Discipleship'}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <Link
                  href="/courses/foundational-discipleship"
                  className="sf-text text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-3 rounded-xl border border-slate-700/80 transition-all shadow-sm"
                >
                  {passedLevel1 ? 'Review Track →' : 'View Lessons →'}
                </Link>

                {passedLevel1 ? (
                  <Link
                    href="/courses/foundational-discipleship/exam"
                    className="sf-text text-center bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs px-5 py-3 rounded-xl border border-slate-800 transition-all"
                  >
                    Retake Exam
                  </Link>
                ) : canTakeLevel1Exam ? (
                  <Link
                    href="/courses/foundational-discipleship/exam"
                    className="sf-text text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/10 cursor-pointer"
                  >
                    Take Exam →
                  </Link>
                ) : (
                  <button
                    disabled
                    className="sf-text bg-slate-900/80 text-slate-600 font-medium text-xs px-5 py-3 rounded-xl cursor-not-allowed border border-slate-800"
                  >
                    {allLevel1LessonsCompleted ? 'Pending Approval ⏳' : 'Exam Locked 🔒'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LEVEL 2 CARD */}
          <div
            className={`bg-slate-900/60 border backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-200 ${
              isLevel2Unlocked
                ? 'border-slate-800/80 opacity-100'
                : 'border-slate-800/30 opacity-50 bg-slate-950/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`sf-text text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                      isLevel2Unlocked
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                        : 'text-slate-500 bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    Level 2
                  </span>
                  {!isLevel2Unlocked && (
                    <span className="sf-text text-[11px] text-amber-400/80 font-medium">
                      🔒 Pass Level 1 Exam to unlock
                    </span>
                  )}
                </div>
                <h2 className="sf-display text-xl font-bold text-white tracking-tight">
                  {fundamentalCourse?.title || 'Fundamental Discipleship'}
                </h2>
              </div>
              {isLevel2Unlocked ? (
                <Link
                  href="/courses/fundamental-discipleship"
                  className="sf-text w-full sm:w-auto text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/10"
                >
                  {passedLevel2 ? 'Review Track →' : 'Start Level 2 →'}
                </Link>
              ) : (
                <button
                  disabled
                  className="sf-text w-full sm:w-auto bg-slate-900/80 text-slate-600 font-medium text-xs px-6 py-3 rounded-xl cursor-not-allowed border border-slate-800"
                >
                  Locked
                </button>
              )}
            </div>
          </div>

          {/* BRIDGE: SPIRITUAL GIFTS SURVEY CARD */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border backdrop-blur-xl shadow-2xl transition-all duration-200 ${
              isSurveyUnlocked
                ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/30'
                : 'bg-slate-900/40 border-slate-800/30 opacity-50'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`sf-text text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                      isSurveyUnlocked
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-800/40 text-slate-500 border-slate-800'
                    }`}
                  >
                    Bridge Assessment
                  </span>
                  {!isSurveyUnlocked && (
                    <span className="sf-text text-[11px] text-amber-400/80 font-medium">
                      🔒 Complete Levels 1 &amp; 2 first
                    </span>
                  )}
                </div>
                <h2 className="sf-display text-xl font-bold text-white tracking-tight">
                  Spiritual Gifts Survey
                </h2>
              </div>
              {isSurveyUnlocked ? (
                <Link
                  href="/spiritual-gifts-survey"
                  className="sf-text w-full sm:w-auto text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/10"
                >
                  {completedSurvey ? 'View / Retake Survey →' : 'Take Survey Now →'}
                </Link>
              ) : (
                <button
                  disabled
                  className="sf-text w-full sm:w-auto bg-slate-900/80 text-slate-600 font-medium text-xs px-6 py-3 rounded-xl cursor-not-allowed border border-slate-800"
                >
                  Locked
                </button>
              )}
            </div>
          </div>

          {/* LEVEL 3 CARD */}
          <div
            className={`bg-slate-900/60 border backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-200 ${
              isLevel3Unlocked
                ? 'border-slate-800/80 opacity-100'
                : 'border-slate-800/30 opacity-50 bg-slate-950/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`sf-text text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                      isLevel3Unlocked
                        ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                        : 'text-slate-500 bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    Level 3
                  </span>
                  {!isLevel3Unlocked && (
                    <span className="sf-text text-[11px] text-amber-400/80 font-medium">
                      🔒 Complete Spiritual Gifts Survey to unlock
                    </span>
                  )}
                </div>
                <h2 className="sf-display text-xl font-bold text-white tracking-tight">
                  {ministryReadinessCourse?.title || 'Ministry Readiness Track'}
                </h2>
              </div>
              {isLevel3Unlocked ? (
                <Link
                  href="/courses/ministry-readiness"
                  className="sf-text w-full sm:w-auto text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/10"
                >
                  Start Level 3 →
                </Link>
              ) : (
                <button
                  disabled
                  className="sf-text w-full sm:w-auto bg-slate-900/80 text-slate-600 font-medium text-xs px-6 py-3 rounded-xl cursor-not-allowed border border-slate-800"
                >
                  Locked
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}