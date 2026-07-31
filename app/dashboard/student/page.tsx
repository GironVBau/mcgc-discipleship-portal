"use client";

import { useEffect, useState, useMemo } from "react";
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
  level: number;
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

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCalendarDate(now);
    setCurrentTime(now);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    async function loadStudentData() {
      try {
        const savedNote = localStorage.getItem("mcgc_student_reflection_note");
        if (savedNote) setStudentNote(savedNote);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Run primary independent requests in parallel
        const [
          { data: profile },
          { data: coursesData },
          { data: certsData }
        ] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
          supabase.from("courses").select("*").order("level", { ascending: true }),
          supabase.from("user_certificates").select("id, course_name, issued_at").eq("user_id", user.id)
        ]);

        if (profile) setUserProfile(profile);
        if (certsData) setCertificates(certsData);

        if (coursesData && coursesData.length > 0) {
          const l1 = coursesData.find((c) => c.level === 1) || coursesData[0];
          const l2 = coursesData.find((c) => c.level === 2) || null;

          setLevel1Course(l1);
          setLevel2Course(l2);

          if (l1) {
            // Run Level 1 dependent queries in parallel
            const [
              { data: lessonsData },
              { data: progressData },
              { data: examData }
            ] = await Promise.all([
              supabase
                .from("lessons")
                .select("id, lesson_number, title")
                .eq("course_id", l1.id)
                .order("lesson_number", { ascending: true }),
              supabase
                .from("user_lesson_progress")
                .select("lesson_id")
                .eq("user_id", user.id)
                .eq("completed", true),
              supabase
                .from("user_exam_results")
                .select("passed")
                .eq("user_id", user.id)
                .eq("course_id", l1.id)
                .eq("passed", true)
                .maybeSingle()
            ]);

            if (lessonsData) setLessons(lessonsData);
            if (progressData) {
              setCompletedLessonIds(new Set(progressData.map((p) => p.lesson_id)));
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
    }

    loadStudentData();
    return () => clearInterval(timer);
  }, []);

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

        {/* Dynamic Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Level 1 Status</p>
              <p className="text-base font-bold text-amber-400">{courseStatus}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Lesson Progress</p>
              <p className="text-base font-bold text-white">{progressPercentage}% Completed</p>
            </div>
          </div>

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
                        <div
                          key={lesson.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
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
                        </div>
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
                    className="inline-flex items-center gap-2 bg-slate-800 text-slate-500 font-semibold text-xs px-5 py-2.5 rounded-xl cursor-not-allowed border border-slate-700"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Exam Locked</span>
                  </button>
                )}
              </div>
            </div>

            {/* LEVEL 2: Fundamental Course (GATED) */}
            <div className={`rounded-3xl p-6 sm:p-8 border backdrop-blur-xl transition-all ${
              hasPassedLevel1Exam 
                ? "bg-slate-900/60 border-slate-800 shadow-xl" 
                : "bg-slate-950/40 border-slate-900/80 opacity-60"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                    Level 2
                  </span>
                  <h3 className="text-lg font-bold text-white pt-2">
                    {level2Course ? level2Course.title : "Fundamental Course"}
                  </h3>
                </div>

                {!hasPassedLevel1Exam && (
                  <span className="text-xs bg-slate-800/80 text-slate-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-slate-700">
                    <Lock className="w-3.5 h-3.5" /> Pass Level 1 Exam First
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                {level2Course?.description || "Deepen your faith and study essential doctrines after completing Level 1."}
              </p>

              <div className="pt-4">
                {hasPassedLevel1Exam && level2Course ? (
                  <Link
                    href={`/courses/${level2Course.slug}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    <span>Start Level 2 Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 bg-slate-900 text-slate-600 font-semibold text-xs px-5 py-2.5 rounded-xl cursor-not-allowed border border-slate-800"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Locked</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reflection Pad */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span>My Discipleship Reflection Pad</span>
                </h3>
                <button
                  onClick={handleSaveNote}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1.5"
                >
                  {noteSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{noteSaved ? "Saved!" : "Save Note"}</span>
                </button>
              </div>

              <textarea
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                placeholder="Write your study notes, scripture reflections, or questions for your instructor..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none transition-all"
              />
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Interactive Dynamic Calendar & Real-Time Clock */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-5 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>Interactive Calendar</span>
                </h3>

                {currentTime && (
                  <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-200">
                  {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 text-center text-xs gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                    <div key={`empty-${index}`} className="py-2 text-transparent">-</div>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const dayNum = index + 1;
                    const isToday = isCurrentMonth && dayNum === today.getDate();

                    return (
                      <div
                        key={dayNum}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${
                          isToday
                            ? "bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-400/20 scale-105"
                            : "text-slate-300 hover:bg-slate-800/80"
                        }`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-center">
                <span className="text-[11px] text-slate-400">
                  Today is <strong className="text-slate-200">{today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</strong>
                </span>
              </div>

            </div>

            {/* Certificates Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Certificates & Badges</span>
              </h3>

              {hasPassedLevel1Exam || certificates.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Level 1: Foundational Certificate</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">Passed Examination</p>
                    </div>
                    <Link 
                      href="/certificates/level-1"
                      className="text-amber-400 hover:text-amber-300 p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 transition-colors"
                      title="View Certificate"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No certificates unlocked yet. Complete Level 1 lessons and pass the final exam!</p>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}