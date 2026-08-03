import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ContentProtection from '@/components/ContentProtection';
import MarkAsStudiedButton from './MarkAsStudiedButton';

interface PageProps {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, lessonSlug } = await params;
  const supabase = await createClient();

  // 1. Fetch Course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', courseSlug)
    .single();

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Course Not Found</h2>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center w-full bg-[#1e2e68] hover:bg-[#162350] text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all"
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch Lesson
  const numericLessonNumber = parseInt(lessonSlug.replace('lesson-', ''), 10);
  let lessonQuery = supabase.from('lessons').select('*').eq('course_id', course.id);
  
  if (!isNaN(numericLessonNumber)) {
    lessonQuery = lessonQuery.eq('lesson_number', numericLessonNumber);
  } else {
    lessonQuery = lessonQuery.eq('id', lessonSlug);
  }

  const { data: lesson, error: lessonError } = await lessonQuery.single();

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Lesson Not Found</h2>
            <Link
              href={`/courses/${course.slug}`}
              className="inline-flex items-center justify-center w-full bg-[#1e2e68] hover:bg-[#162350] text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all"
            >
              ← Back to Course Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fetch Next Lesson
  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('lesson_number')
    .eq('course_id', course.id)
    .gt('lesson_number', lesson.lesson_number)
    .order('lesson_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextLessonSlug = nextLesson ? `lesson-${nextLesson.lesson_number}` : null;

  // 4. User Progress Tracking
  const { data: { user } } = await supabase.auth.getUser();
  let initialIsStudied = false; 

  if (user) {
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    if (progress?.completed) {
      initialIsStudied = true;
    }
  }

  // 5. Smart Content Parser
  const rawPoints: string[] = lesson.teaching_points || [];

  const isTaggedFormat = rawPoints.some(p => 
    p.startsWith('LESSON SNAPSHOT:') || 
    p.startsWith('FOUNDATIONAL DOCTRINE:') ||
    p.startsWith('KEY TERMS:') ||
    p.startsWith('GOSPEL CONNECTION:') ||
    p.startsWith('MEMORY VERSE:') ||
    p.startsWith('WALKING WITH CHRIST THIS WEEK:') ||
    p.startsWith('ASSURANCE OF SALVATION:')
  );

  let snapshot, doctrine, keyTerms, gospel, memoryVerse, walkingWithChrist, assurance;
  let mainPoints: string[] = [];

  if (isTaggedFormat) {
    snapshot = rawPoints.find(p => p.startsWith('LESSON SNAPSHOT:'))?.replace('LESSON SNAPSHOT:', '').trim();
    doctrine = rawPoints.find(p => p.startsWith('FOUNDATIONAL DOCTRINE:'))?.replace('FOUNDATIONAL DOCTRINE:', '').trim();
    keyTerms = rawPoints.find(p => p.startsWith('KEY TERMS:'))?.replace('KEY TERMS:', '').trim();
    gospel = rawPoints.find(p => p.startsWith('GOSPEL CONNECTION:'))?.replace('GOSPEL CONNECTION:', '').trim();
    memoryVerse = rawPoints.find(p => p.startsWith('MEMORY VERSE:'))?.replace('MEMORY VERSE:', '').trim();
    walkingWithChrist = rawPoints.find(p => p.startsWith('WALKING WITH CHRIST THIS WEEK:'))?.replace('WALKING WITH CHRIST THIS WEEK:', '').trim();
    assurance = rawPoints.find(p => p.startsWith('ASSURANCE OF SALVATION:'))?.replace('ASSURANCE OF SALVATION:', '').trim();

    mainPoints = rawPoints.filter(p => 
      !p.startsWith('LESSON SNAPSHOT:') &&
      !p.startsWith('FOUNDATIONAL DOCTRINE:') &&
      !p.startsWith('KEY TERMS:') &&
      !p.startsWith('GOSPEL CONNECTION:') &&
      !p.startsWith('MEMORY VERSE:') &&
      !p.startsWith('WALKING WITH CHRIST THIS WEEK:') &&
      !p.startsWith('ASSURANCE OF SALVATION:')
    );
  } else {
    mainPoints = rawPoints;
  }

  return (
    <ContentProtection>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/courses" className="hover:text-[#1e2e68] transition-colors">Courses</Link>
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            <Link href={`/courses/${course.slug}`} className="hover:text-[#1e2e68] transition-colors truncate max-w-[180px]">{course.title}</Link>
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-900">Lesson {lesson.lesson_number}</span>
          </nav>

          <header className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1e2e68] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              Lesson {lesson.lesson_number}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {lesson.title}
            </h1>
          </header>

          {(snapshot || doctrine) && (
            <section className="bg-indigo-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
              {snapshot && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-800 text-indigo-200 px-2.5 py-0.5 rounded-full">Lesson Snapshot</span>
                  <p className="text-sm sm:text-base font-medium leading-relaxed pt-1 text-indigo-100 whitespace-pre-line">{snapshot}</p>
                </div>
              )}
              {doctrine && (
                <div className="space-y-1 pt-3 border-t border-indigo-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-800 text-indigo-200 px-2.5 py-0.5 rounded-full">Foundational Doctrine</span>
                  <p className="text-sm sm:text-base font-normal leading-relaxed pt-1 text-indigo-100 whitespace-pre-line">{doctrine}</p>
                </div>
              )}
            </section>
          )}

          <section className="bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white border border-blue-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            {lesson.objective && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e2e68] bg-blue-100 px-2.5 py-0.5 rounded-full">Lesson Objective</span>
                <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed pt-1 whitespace-pre-line">{lesson.objective}</p>
              </div>
            )}
            {lesson.key_scriptures && Array.isArray(lesson.key_scriptures) && lesson.key_scriptures.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">Key Scriptures</span>
                <div className="flex flex-wrap gap-2 pt-2">
                  {lesson.key_scriptures.map((scripture: string, index: number) => (
                    <span key={index} className="inline-flex items-center text-xs font-bold text-slate-800 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl">📖 {scripture}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {keyTerms && (
            <section className="bg-slate-100 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full">Key Terms</span>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal whitespace-pre-line">{keyTerms}</p>
            </section>
          )}

          {mainPoints.length > 0 && (
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-4">Teaching Material</h2>
              <div className="space-y-4">
                {mainPoints.map((point: string, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-[#1e2e68] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                    <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line">{point}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {assurance && (
            <section className="bg-blue-50 border border-blue-200 rounded-3xl p-6 sm:p-8 space-y-2">
              <h3 className="text-base font-bold text-[#1e2e68]">Assurance of Salvation</h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">{assurance}</p>
            </section>
          )}

          {(gospel || memoryVerse) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gospel && (
                <section className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">Gospel Connection</span>
                  <p className="text-sm text-slate-800 leading-relaxed pt-2 whitespace-pre-line">{gospel}</p>
                </section>
              )}
              {memoryVerse && (
                <section className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">Memory Verse</span>
                  <p className="text-sm font-semibold italic text-slate-800 leading-relaxed pt-2 whitespace-pre-line">{memoryVerse}</p>
                </section>
              )}
            </div>
          )}

          {walkingWithChrist && (
            <section className="bg-teal-50/60 border border-teal-200 rounded-3xl p-6 sm:p-8 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">Walking With Christ This Week</span>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line">{walkingWithChrist}</p>
            </section>
          )}

          {lesson.discussion_questions && Array.isArray(lesson.discussion_questions) && lesson.discussion_questions.length > 0 && (
            <section className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">Discussion Questions</div>
              <ul className="space-y-3">
                {lesson.discussion_questions.map((q: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lesson.reflection_prompts && Array.isArray(lesson.reflection_prompts) && lesson.reflection_prompts.length > 0 && (
            <section className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">Personal Reflection & Application</div>
              <ul className="space-y-3">
                {lesson.reflection_prompts.map((prompt: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2"></span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="pt-4 flex justify-end">
            <MarkAsStudiedButton
              lessonId={lesson.id}
              courseSlug={courseSlug}
              nextLessonSlug={nextLessonSlug}
              initialIsStudied={initialIsStudied}
            />
          </div>
        </main>
      </div>
    </ContentProtection>
  );
}