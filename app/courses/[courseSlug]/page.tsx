import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseSlug } = await params;
  const supabase = await createClient();

  // 1. Fetch Course details
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", courseSlug)
    .single();

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 text-center space-y-6">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Course Not Found</h2>
              <p className="text-sm text-slate-500">
                We couldn't locate <span className="font-semibold text-slate-700">"{courseSlug}"</span>.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-sm"
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch Lessons for this course
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", course.id)
    .order("lesson_number", { ascending: true });

  const totalLessons = lessons?.length || 0;

  // 3. Fetch User Progress
  const { data: { user } } = await supabase.auth.getUser();
  const completedLessonIds = new Set<string>();

  if (user && lessons && lessons.length > 0) {
    const lessonIds = lessons.map((l) => l.id);
    const { data: progressData } = await supabase
      .from("user_lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .in("lesson_id", lessonIds);

    progressData?.forEach((p) => completedLessonIds.add(p.lesson_id));
  }

  const completedCount = completedLessonIds.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans antialiased">
      {/* 2. Added Navbar render */}
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/courses" className="hover:text-blue-600 transition-colors">
            Courses
          </Link>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 truncate max-w-xs">{course.title}</span>
        </nav>

        {/* Hero Banner Card */}
        <header className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden space-y-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50/80 border border-blue-100 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Discipleship Journey
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Dynamic Progress Card */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Course Progress
              </span>
              <span className="text-blue-600 font-bold">{progressPercentage}%</span>
            </div>
            
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 font-medium text-right">
              {completedCount} of {totalLessons} lessons completed
            </p>
          </div>
        </header>

        {/* Lessons Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Course Content
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {totalLessons} {totalLessons === 1 ? "Lesson" : "Lessons"}
            </span>
          </div>

          {!lessons || lessons.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-slate-800 font-semibold text-sm">No lessons published yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                This course doesn't have any attached lessons. Check your database seeds.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {lessons.map((lesson) => {
                const isCompleted = completedLessonIds.has(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600"
                      }`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          lesson.lesson_number
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.objective && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {lesson.objective}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/courses/${course.slug}/lessons/lesson-${lesson.lesson_number}`}
                      className={`inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 ${
                        isCompleted
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-slate-900 hover:bg-blue-600 text-white"
                      }`}
                    >
                      <span>{isCompleted ? "Review Lesson" : "Start Lesson"}</span>
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Final Assessment Card */}
        <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              Milestone Assessment
            </span>
            <h3 className="text-lg font-bold text-slate-900 pt-1">
              {course.title} Examination
            </h3>
            <p className="text-xs text-slate-600 max-w-md">
              Complete all lessons above to unlock your final knowledge check and earn your certificate.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-slate-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm shrink-0">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {completedCount === totalLessons && totalLessons > 0 ? "Unlocked" : "Locked"}
          </div>
        </section>
      </main>
    </div>
  );
}