"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, 
  Clock, 
  Award, 
  ArrowRight, 
  FileText, 
  LogOut, 
  User, 
  Sparkles,
  Lock,
  StickyNote,
  Calendar as CalendarIcon,
  Save,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface CourseData {
  id: string;
  title: string;
  description: string;
  slug: string;
}

interface LessonData {
  id: string;
  lesson_number: number;
  title: string;
}

interface CertificateData {
  id: string;
  course_name: string;
  issued_at: string;
}

export default function StudentDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  // Dynamic Course & Progress state
  const [level1Course, setLevel1Course] = useState<CourseData | null>(null);
  const [level2Course, setLevel2Course] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Exam & Progression status
  const [hasPassedLevel1Exam, setHasPassedLevel1Exam] = useState(false);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);

  // Real-time Clock & Calendar state
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Notes state
  const [studentNote, setStudentNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);

      const savedNote = localStorage.getItem("mcgc_student_reflection_note");
      if (savedNote) setStudentNote(savedNote);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primary parallel fetches
      const [
        { data: profile },
        { data: coursesData },
        { data: certsData }
      ] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("courses").select("id, title, description, slug"),
        supabase.from("user_certificates").select("id, course_name, issued_at").eq("user_id", user.id)
      ]);

      if (profile) setUserProfile(profile);
      if (certsData) setCertificates(certsData);

      if (coursesData && coursesData.length > 0) {
        // Query courses dynamically by slug
        const l1 = coursesData.find((c) => c.slug === "foundational-discipleship") || coursesData[0];
        const l2 = coursesData.find((c) => c.slug === "leadership-discipleship") || null;

        setLevel1Course(l1);
        setLevel2Course(l2);

        if (l1) {
          // Level 1 dependent queries
          const [
            { data: lessonsData },
            { data: examData }
          ] = await Promise.all([
            supabase
              .from("lessons")
              .select("id, lesson_number, title")
              .eq("course_id", l1.id)
              .order("lesson_number", { ascending: true }),

            supabase
              .from("user_exam_results")
              .select("passed")
              .eq("user_id", user.id)
              .eq("course_id", l1.id)
              .eq("passed", true)
              .maybeSingle()
          ]);

          const l1Lessons = lessonsData || [];
          setLessons(l1Lessons);

          const lessonIds = l1Lessons.map((l) => l.id);

          // Fetch exact user progress for Level 1 lessons
          if (lessonIds.length > 0) {
            const { data: progressData } = await supabase
              .from("user_lesson_progress")
              .select("*")
              .eq("user_id", user.id)
              .in("lesson_id", lessonIds);

            if (progressData) {
              const completedIds = progressData
                .filter((p) => p.completed === true || p.is_completed === true)
                .map((p) => p.lesson_id);

              setCompletedLessonIds(new Set(completedIds));
            }
          }

          if (examData?.passed) {
            setHasPassedLevel1Exam(true);
          }
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCalendarDate(now);
    setCurrentTime(now);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadStudentData();

    // Re-fetch data whenever user navigates back to tab
    const handleFocus = () => loadStudentData();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadStudentData]);

  const handleSaveNote = () => {
    localStorage.setItem("mcgc_student_reflection_note", studentNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/student";
  };

  // Calculations
  const totalLessons = lessons.length;
  const completedLessonsCount = completedLessonIds.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  const allLessonsCompleted = completedLessonsCount === totalLessons && totalLessons > 0;
  const nextLesson = lessons.find((l) => !completedLessonIds.has(l.id)) || lessons[0];

  const courseStatus = hasPassedLevel1Exam
    ? "Level 1 Completed"
    : completedLessonsCount === 0 
    ? "Not Started" 
    : "In Progress";

  // Calendar Helpers
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const today = currentTime || new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading Discipleship Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/1080.png"
              alt="MCGC Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <span className="text-sm font-bold text-white tracking-wide block">
                MCGC Discipleship Portal
              </span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Student Journey
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">
                {userProfile?.full_name || "Student"}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8 relative z-10">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Begin Your Journey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {userProfile?.full_name?.split(" ")[0] || "Student"}! 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Finish Level 1 lessons, pass your examination to receive your certificate, and unlock Level 2.
            </p>
          </div>
        </div>

        {/* Dynamic Quick Stats (Interactive Links) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Level 1 Status Card */}
          <Link 
            href={level1Course ? `/courses/${level1Course.slug}` : "#"} 
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4 hover:border-amber-400/50 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Level 1 Status</p>
              <p className="text-base font-bold text-amber-400">{courseStatus}</p>
            </div>
          </Link>

          {/* Lesson Progress Card */}
          <Link 
            href={nextLesson && level1Course ? `/courses/${level1Course.slug}/lessons/lesson-${nextLesson.lesson_number}` : "#"} 
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4 hover:border-blue-500/50 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Lesson Progress</p>
              <p className="text-base font-bold text-white">{progressPercentage}% Completed</p>
            </div>
          </Link>

          {/* Certificates Card */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Certificates Unlocked</p>
              <p className="text-base font-bold text-white">{certificates.length}</p>
            </div>
          </div>
        </div>

        {/* Main Grid Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* LEVEL 1: Foundational Course */}
            {level1Course && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <span>Level 1: {level1Course.title}</span>
                  </h2>
                  <span className="text-xs bg-amber-400/10 text-amber-400 font-semibold px-3 py-1 rounded-full border border-amber-400/20">
                    Active Course
                  </span>
                </div>

                <div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {level1Course.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Lessons Completed</span>
                    <span className="text-amber-400">{completedLessonsCount} of {totalLessons}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Next Up Action Box */}
                {!hasPassedLevel1Exam && nextLesson && (
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Next Step</span>
                        <p className="text-base font-bold text-white">
                          {allLessonsCompleted 
                            ? "All Lessons Done! Ready for Exam" 
                            : `Lesson ${nextLesson.lesson_number}: ${nextLesson.title}`}
                        </p>
                      </div>

                      {!allLessonsCompleted ? (
                        <Link
                          href={`/courses/${level1Course.slug}/lessons/lesson-${nextLesson.lesson_number}`}
                          className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-400/10"
                        >
                          <span>Continue Lesson</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/courses/${level1Course.slug}/exam`}
                          className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-400/10"
                        >
                          <span>Take Level 1 Exam</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Roadmap List */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Level 1 Lessons Roadmap</p>
                  <div className="space-y-2">
                    {lessons.map((lesson) => {
                      const isCompleted = completedLessonIds.has(lesson.id);

                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${level1Course.slug}/lessons/lesson-${lesson.lesson_number}`}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:border-slate-600 ${
                            isCompleted
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-slate-950/40 border-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Clock className={`w-4 h-4 shrink-0 ${isCompleted ? "text-emerald-400" : "text-slate-500"}`} />
                            <span className={isCompleted ? "text-slate-200 font-medium" : "text-slate-400"}>
                              Lesson {lesson.lesson_number}: {lesson.title}
                            </span>
                          </div>
                          
                          {isCompleted ? (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Completed
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              Pending
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* LEVEL 1 MILESTONE & EXAM GATE */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                    Milestone Assessment
                  </span>
                  <h3 className="text-lg font-bold text-white pt-2">Level 1 Examination</h3>
                </div>

                {hasPassedLevel1Exam ? (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Passed
                  </span>
                ) : allLessonsCompleted ? (
                  <span className="text-xs bg-amber-400/10 text-amber-400 font-bold px-3 py-1.5 rounded-xl border border-amber-400/20">
                    Ready for Exam
                  </span>
                ) : (
                  <span className="text-xs bg-slate-800 text-slate-500 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {hasPassedLevel1Exam
                  ? "You passed the Level 1 Examination! Your certificate is issued and Level 2 (Fundamental) is now unlocked."
                  : allLessonsCompleted
                  ? "You have completed all Level 1 lessons! Pass this exam to unlock Level 2 and receive your Foundational Certificate."
                  : "Complete all Level 1 lessons above to unlock your examination."}
              </p>

              <div>
                {hasPassedLevel1Exam ? (
                  <Link
                    href="/certificates/level-1"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Level 1 Certificate</span>
                  </Link>
                ) : allLessonsCompleted ? (
                  <Link
                    href={`/courses/${level1Course?.slug}/exam`}
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-400/10"
                  >
                    <span>Take Level 1 Exam</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 bg-slate-800 text-slate-500 font-bold text-xs px-5 py-2.5 rounded-xl cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Complete Lessons to Unlock</span>
                  </button>
                )}
              </div>
            </div>

            {/* LEVEL 2: Locked Gated Card */}
            {level2Course && (
              <div className={`border rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl ${
                hasPassedLevel1Exam
                  ? "bg-slate-900/60 border-slate-800"
                  : "bg-slate-950/40 border-slate-800/40 opacity-70"
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Level 2: {level2Course.title}</span>
                  </h3>

                  {hasPassedLevel1Exam ? (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-900 text-slate-500 font-bold px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {level2Course.description}
                </p>

                {hasPassedLevel1Exam && (
                  <Link
                    href={`/courses/${level2Course.slug}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    <span>Start Level 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

          </div>

          {/* Sidebar Tools Column */}
          <div className="space-y-6">
            
            {/* Interactive Calendar Widget */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>{calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
                {daysOfWeek.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = isCurrentMonth && today.getDate() === dayNum;

                  return (
                    <div
                      key={dayNum}
                      className={`h-7 flex items-center justify-center rounded-lg font-medium transition-colors ${
                        isToday
                          ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal Reflections Notepad Widget */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span>Discipleship Notes</span>
                </div>
                {noteSaved && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>

              <textarea
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                placeholder="Write your prayers, reflections, or takeaways here..."
                className="w-full h-28 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 resize-none"
              />

              <button
                onClick={handleSaveNote}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Reflections</span>
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}