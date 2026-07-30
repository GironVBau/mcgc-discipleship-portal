import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ContentProtection from '@/components/ContentProtection';
import MarkAsStudiedButton from './MarkAsStudiedButton';
import Navbar from '@/components/Navbar';

interface PageProps {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, lessonSlug } = await params;
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', courseSlug)
    .single();

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
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
        <Navbar />
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

  const { data: { user } } = await supabase.auth.getUser();
  let initialIsStudied = false;
  if (user) {
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .single();

    if (progress?.completed) {
      initialIsStudied = true;
    }
  }

  return (
    <ContentProtection>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Breadcrumb Header */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/courses" className="hover:text-[#1e2e68] transition-colors">
              Courses
            </Link>
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/courses/${course.slug}`} className="hover:text-[#1e2e68] transition-colors truncate max-w-[180px]">
              {course.title}
            </Link>
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-900">Lesson {lesson.lesson_number}</span>
          </nav>

          {/* Lesson Header Card */}
          <header className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1e2e68] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              Lesson {lesson.lesson_number}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {lesson.title}
            </h1>
          </header>

          {/* Lesson Objective & Key Scriptures */}
          <section className="bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white border border-blue-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            {lesson.objective && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e2e68] bg-blue-100 px-2.5 py-0.5 rounded-full">
                  Lesson Objective
                </span>
                <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed pt-1">
                  {lesson.objective}
                </p>
              </div>
            )}

            {lesson.key_scriptures && Array.isArray(lesson.key_scriptures) && lesson.key_scriptures.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Key Scriptures
                </span>
                <div className="flex flex-wrap gap-2 pt-2">
                  {lesson.key_scriptures.map((scripture: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center text-xs font-bold text-slate-800 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl"
                    >
                      📖 {scripture}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Teaching Points */}
          {lesson.teaching_points && Array.isArray(lesson.teaching_points) && lesson.teaching_points.length > 0 && (
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-4">
                Teaching Points
              </h2>
              <div className="space-y-4">
                {lesson.teaching_points.map((point: string, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-[#1e2e68] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Discussion Questions */}
          {lesson.discussion_questions && Array.isArray(lesson.discussion_questions) && lesson.discussion_questions.length > 0 && (
            <section className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                Discussion Questions
              </div>
              <ul className="space-y-3">
                {lesson.discussion_questions.map((q: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-800 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reflection Prompts */}
          {lesson.reflection_prompts && Array.isArray(lesson.reflection_prompts) && lesson.reflection_prompts.length > 0 && (
            <section className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                Personal Reflection & Application
              </div>
              <ul className="space-y-3">
                {lesson.reflection_prompts.map((prompt: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-800 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2"></span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Footer */}
          <div className="pt-4 flex justify-end">
            <MarkAsStudiedButton
              lessonId={lesson.id}
              courseSlug={courseSlug}
              initialIsStudied={initialIsStudied}
            />
          </div>
        </main>
      </div>
    </ContentProtection>
  );
}