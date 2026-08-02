"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  Award, 
  ArrowRight, 
  LogOut, 
  User, 
  Sparkles,
  Lock,
  StickyNote,
  Calendar as CalendarIcon,
  Save,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  CalendarDays
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

interface EventItem {
  id: string;
  dateStr: string; // YYYY-MM-DD
  title: string;
  type: "exam" | "assignment" | "reminder";
}

// Helper: Format Date to YYYY-MM-DD key for storage/lookups
const getFormattedKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Instantiate client once outside component to prevent re-instantiation on renders
const supabase = createClient();

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  // Dynamic Course & Progress state
  const [level1Course, setLevel1Course] = useState<CourseData | null>(null);
  const [level2Course, setLevel2Course] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Exam & Progression status
  const [hasPassedLevel1Exam, setHasPassedLevel1Exam] = useState(false);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);

  // Real-time Clock & Interactive Calendar state
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Interactive Calendar Events & Date-specific Notes
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "1",
      dateStr: getFormattedKey(new Date()),
      title: "Level 1 Review Session",
      type: "reminder"
    }
  ]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"exam" | "assignment" | "reminder">("reminder");

  // General & Date Reflection Notes state
  const [dateNotes, setDateNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const selectedDateKey = useMemo(() => getFormattedKey(selectedDate), [selectedDate]);

  // Keep note input synced with the active selected date
  useEffect(() => {
    setCurrentNote(dateNotes[selectedDateKey] || "");
  }, [selectedDateKey, dateNotes]);

  // Fetch Supabase data & load cached local items (Runs ONLY once on mount / focus)
  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Load saved notes and events from localStorage
      const savedNotes = localStorage.getItem("mcgc_student_date_notes");
      if (savedNotes) {
        try {
          setDateNotes(JSON.parse(savedNotes));
        } catch (e) {
          console.error("Failed to parse saved notes", e);
        }
      }

      const savedEvents = localStorage.getItem("mcgc_student_events");
      if (savedEvents) {
        try {
          setEvents(JSON.parse(savedEvents));
        } catch (e) {
          console.error("Failed to parse saved events", e);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primary parallel fetch
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
        const l1 = coursesData.find((c) => c.slug === "foundational-discipleship") || coursesData[0];
        const l2 = coursesData.find((c) => c.slug === "leadership-discipleship") || null;

        setLevel1Course(l1);
        setLevel2Course(l2);

        if (l1) {
          const [lessonsRes, examRes] = await Promise.all([
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

          const l1Lessons = lessonsRes.data || [];
          setLessons(l1Lessons);

          if (examRes.data?.passed) {
            setHasPassedLevel1Exam(true);
          }

          const lessonIds = l1Lessons.map((l) => l.id);

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
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setErrorMessage("Unable to sync dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentTime(now);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadStudentData();

    const handleFocus = () => loadStudentData();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadStudentData]);

  // Date selection handler
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  // Save Note for currently selected date
  const handleSaveNote = () => {
    const updatedNotes = {
      ...dateNotes,
      [selectedDateKey]: currentNote
    };
    setDateNotes(updatedNotes);
    localStorage.setItem("mcgc_student_date_notes", JSON.stringify(updatedNotes));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  // Add event/task to currently selected date
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv: EventItem = {
      id: Date.now().toString(),
      dateStr: selectedDateKey,
      title: newEventTitle.trim(),
      type: newEventType
    };

    const updatedEvents = [...events, newEv];
    setEvents(updatedEvents);
    localStorage.setItem("mcgc_student_events", JSON.stringify(updatedEvents));
    setNewEventTitle("");
  };

  // Delete event from calendar
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    setEvents(updated);
    localStorage.setItem("mcgc_student_events", JSON.stringify(updated));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/student";
  };

  // Calculations
  const totalLessons = lessons.length;
  const completedLessonsCount = completedLessonIds.size;
  
  const progressPercentage = useMemo(() => {
    return totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  }, [completedLessonsCount, totalLessons]);

  const allLessonsCompleted = useMemo(() => {
    return completedLessonsCount === totalLessons && totalLessons > 0;
  }, [completedLessonsCount, totalLessons]);

  const nextLesson = useMemo(() => {
    return lessons.find((l) => !completedLessonIds.has(l.id)) || lessons[0];
  }, [lessons, completedLessonIds]);

  const courseStatus = useMemo(() => {
    if (hasPassedLevel1Exam) return "Level 1 Completed";
    if (completedLessonsCount === 0) return "Not Started";
    return "In Progress";
  }, [hasPassedLevel1Exam, completedLessonsCount]);

  // Interactive Calendar Math & Helpers
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const handleJumpToToday = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDate(now);
  };

  const today = currentTime || new Date();
  const todayKey = getFormattedKey(today);

  // Selected date events filter
  const selectedDateEvents = useMemo(() => {
    return events.filter((ev) => ev.dateStr === selectedDateKey);
  }, [events, selectedDateKey]);

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

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans space-y-4">
        <p className="text-red-400 text-sm font-semibold">{errorMessage}</p>
        <button
          onClick={loadStudentData}
          className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8 relative z-10">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Begin Your Journey</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-3">
              <span>Welcome, {userProfile?.full_name?.split(" ")[0] || "Student"}! 👋</span>
            </h1>
            
            <p className="text-slate-400 text-sm max-w-xl">
              Finish Level 1 lessons, pass your examination to receive your certificate, and unlock Level 2.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 relative z-10 self-start sm:self-center">
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">
                {userProfile?.full_name || "Student"}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Dashboard Grid Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Course Content Column */}
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

                {/* Next Action */}
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

                {/* Lessons Roadmap */}
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
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            ) : (
                              <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                            )}
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

            {/* LEVEL 1 MILESTONE & EXAM */}
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

          {/* Interactive Sidebar Tools */}
          <div className="space-y-6">
            
            {/* FULLY INTERACTIVE CALENDAR WIDGET */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
              
              {/* Header Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>{calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={handleJumpToToday}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded-md transition-colors mr-1"
                    title="Jump to Today"
                  >
                    Today
                  </button>
                  <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
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

              {/* Interactive Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const iterDate = new Date(year, month, dayNum);
                  const iterKey = getFormattedKey(iterDate);

                  const isToday = iterKey === todayKey;
                  const isSelected = iterKey === selectedDateKey;

                  // Check if this date has events or notes attached
                  const hasEvents = events.some((ev) => ev.dateStr === iterKey);
                  const hasNote = Boolean(dateNotes[iterKey]?.trim());

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDate(iterDate)}
                      className={`h-8 flex flex-col items-center justify-center rounded-xl font-medium transition-all relative ${
                        isSelected
                          ? "bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-400/20 scale-105 z-10"
                          : isToday
                          ? "bg-slate-800 text-amber-400 border border-amber-400/40 font-bold"
                          : "text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      <span>{dayNum}</span>

                      {/* Event / Note Indicators */}
                      {!isSelected && (hasEvents || hasNote) && (
                        <div className="flex space-x-0.5 mt-0.5">
                          {hasEvents && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                          {hasNote && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Date Selected Header Banner */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                  {selectedDate.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {selectedDateKey === todayKey && (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Today
                  </span>
                )}
              </div>

              {/* Schedule & Event Manager for Selected Date */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tasks for {selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })}
                </p>
                
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDateEvents.map((ev) => (
                      <div 
                        key={ev.id} 
                        className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            ev.type === "exam" ? "bg-red-400" : ev.type === "assignment" ? "bg-amber-400" : "bg-blue-400"
                          }`} />
                          <span className="text-slate-200 truncate">{ev.title}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                          title="Remove Event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No tasks set for this date.</p>
                )}

                {/* Inline Add Event Form */}
                <form onSubmit={handleAddEvent} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Add task/event..."
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50"
                  />
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg px-1.5 text-[10px] text-slate-400 focus:outline-none"
                  >
                    <option value="reminder">Task</option>
                    <option value="assignment">Due</option>
                    <option value="exam">Exam</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
                    title="Add Event"
                  >
                    <Plus className="w-4 h-4 font-bold" />
                  </button>
                </form>
              </div>

            </div>

            {/* DATE-SPECIFIC REFLECTIONS NOTEPAD WIDGET */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span>Notes ({selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })})</span>
                </div>
                {noteSaved && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>

              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder={`Write reflections or takeaways for ${selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })}...`}
                className="w-full h-28 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 resize-none"
              />

              <button
                type="button"
                onClick={handleSaveNote}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Date Note</span>
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}