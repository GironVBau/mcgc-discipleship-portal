"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  Award, 
  LogOut, 
  User, 
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Printer,
  ExternalLink,
  Lock,
  AlertCircle
} from "lucide-react";

interface LessonData {
  id: string;
  lesson_number: number;
  title: string;
  isCompleted: boolean;
}

interface CourseProgress {
  id: string;
  title: string;
  description: string;
  slug: string;
  sequenceOrder: number;
  totalLessons: number;
  completedLessonsCount: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  lessons: LessonData[];
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

const getFormattedKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const supabase = createClient();

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Dynamic courses and active track
  const [coursesProgress, setCoursesProgress] = useState<CourseProgress[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseProgress | null>(null);

  // Certificates
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);

  // Real-time Clock & Interactive Calendar state
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "1",
      dateStr: getFormattedKey(new Date()),
      title: "Discipleship Review Session",
      type: "reminder"
    }
  ]);
  const [newEventTitle, setNewEventTitle] = useState("");

  const [dateNotes, setDateNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const selectedDateKey = useMemo(() => getFormattedKey(selectedDate), [selectedDate]);

  useEffect(() => {
    setCurrentNote(dateNotes[selectedDateKey] || "");
  }, [selectedDateKey, dateNotes]);

  // Automated Fetching Engine matching `user_lesson_progress` and `user_certificates` schemas
  const loadStudentData = useCallback(async () => {
  try {
    setErrorMessage(null);

    // 1. Fetch user FIRST so it is defined for everything below
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    console.log("ACTIVE USER ID:", user?.id);

    if (!user || userErr) {
      setIsAuthenticated(false);
      setCertificates([]);
      return; // Stop execution if no user is logged in
    } else {
      setIsAuthenticated(true);
    }

    // Local storage sync
    const savedNotes = localStorage.getItem("mcgc_student_date_notes");
    if (savedNotes) {
      try { setDateNotes(JSON.parse(savedNotes)); } catch (e) { console.error(e); }
    }

    // ... continue with your Promise.all queries using `user.id` ...

      // ADD THIS CHECK:
console.log("ACTIVE USER ID:", user?.id);

if (!user) {
  setIsAuthenticated(false);
  return; // Stop here if user isn't loaded yet
      } else {
        setIsAuthenticated(true);
      }

      // Query database using optimized parallelized schema fetching
      const [
  { data: profile },
  { data: coursesData, error: coursesErr },
  { data: certsData, error: certsErr },
  { data: progressData }
] = await Promise.all([
  supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  supabase.from("courses").select("id, title, description, slug, sequence_order").order("sequence_order", { ascending: true }),
  supabase.from("user_certificates").select("id, course_name, issued_at").eq("user_id", user.id),
  supabase.from("user_lesson_progress").select("lesson_id, completed").eq("user_id", user.id).eq("completed", true)
]);

// ADD THIS CONSOLE LOG HERE:
console.log("SUPABASE CERTIFICATES DEBUG:", { certsData, certsErr });

      if (coursesErr) throw coursesErr;
      if (certsErr) console.error("Certificate fetch error (check RLS policies):", certsErr);
      
      if (profile) setUserProfile(profile);

      // Robust certificate mapper handling string column OR foreign key course title
      if (certsData && certsData.length > 0) {
        const parsedCertificates = certsData.map((c: any) => {
          const courseTitle = c.course_name || (c.courses && c.courses.title) || "Course Completion Certificate";
          return {
            id: c.id,
            course_name: courseTitle,
            issued_at: c.issued_at ? new Date(c.issued_at).toLocaleDateString() : "N/A"
          };
        });
        setCertificates(parsedCertificates);
      } else {
        setCertificates([]);
      }

      // Collect completed lesson IDs directly from user_lesson_progress
      const completedLessonIds = new Set(
        progressData?.map((p) => p.lesson_id) || []
      );

      if (coursesData && coursesData.length > 0) {
        // Fetch all lessons in parallel instead of a serial loop
        const lessonsPromises = coursesData.map(course => 
          supabase
            .from("lessons")
            .select("id, lesson_number, title, course_id")
            .eq("course_id", course.id)
            .order("lesson_number", { ascending: true })
        );

        const lessonsResults = await Promise.all(lessonsPromises);

        const processedCourses: CourseProgress[] = [];
        let previousCourseFinished = true; // Level 1 unlocked by default

        coursesData.forEach((course, index) => {
          const courseLessons = lessonsResults[index].data || [];
          const mappedLessons: LessonData[] = courseLessons.map((l) => ({
            id: l.id,
            lesson_number: l.lesson_number,
            title: l.title,
            isCompleted: completedLessonIds.has(l.id)
          }));

          const completedCount = mappedLessons.filter((l) => l.isCompleted).length;
          const isCourseFinished = courseLessons.length > 0 && completedCount === courseLessons.length;
          const isUnlocked = previousCourseFinished;

          processedCourses.push({
            id: course.id,
            title: course.title,
            description: course.description,
            slug: course.slug,
            sequenceOrder: course.sequence_order || index + 1,
            totalLessons: courseLessons.length,
            completedLessonsCount: completedCount,
            isCompleted: isCourseFinished,
            isUnlocked,
            lessons: mappedLessons
          });

          previousCourseFinished = isCourseFinished;
        });

        setCoursesProgress(processedCourses);

        // Keep or dynamically update active focus track
        setActiveCourse((prevActive) => {
          if (prevActive) {
            const updated = processedCourses.find((c) => c.id === prevActive.id);
            if (updated) return updated;
          }
          return (
            processedCourses.find((c) => c.isUnlocked && !c.isCompleted) ||
            processedCourses[processedCourses.length - 1] ||
            null
          );
        });
      }

    } catch (err) {
      console.error("Error fetching dynamic student data:", err);
      setErrorMessage("Unable to sync dashboard data directly from Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    loadStudentData();

    // Listen to real-time changes on user_lesson_progress and user_certificates
    const channel = supabase
      .channel("realtime-student-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_lesson_progress" },
        () => loadStudentData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_certificates" },
        () => loadStudentData()
      )
      .subscribe();

    const handleSync = () => loadStudentData();
    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [loadStudentData]);

  // Derived progress stats
  const activeProgressPercentage = useMemo(() => {
    if (!activeCourse || activeCourse.totalLessons === 0) return 0;
    return Math.round((activeCourse.completedLessonsCount / activeCourse.totalLessons) * 100);
  }, [activeCourse]);

  // Calendar logic
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const handleJumpToToday = () => { const now = new Date(); setCalendarDate(now); setSelectedDate(now); };

  const todayKey = getFormattedKey(currentTime || new Date());
  const selectedDateEvents = useMemo(() => events.filter((ev) => ev.dateStr === selectedDateKey), [events, selectedDateKey]);

  const handleSaveNote = () => {
    const updatedNotes = { ...dateNotes, [selectedDateKey]: currentNote };
    setDateNotes(updatedNotes);
    localStorage.setItem("mcgc_student_date_notes", JSON.stringify(updatedNotes));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const newEv: EventItem = { id: Date.now().toString(), dateStr: selectedDateKey, title: newEventTitle.trim(), type: "reminder" };
    const updatedEvents = [...events, newEv];
    setEvents(updatedEvents);
    localStorage.setItem("mcgc_student_events", JSON.stringify(updatedEvents));
    setNewEventTitle("");
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    setEvents(updated);
    localStorage.setItem("mcgc_student_events", JSON.stringify(updated));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/student";
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Syncing Student Portal directly from database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8 relative z-10">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Level {activeCourse?.sequenceOrder || 1} Active</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {userProfile?.full_name?.split(" ")[0] || "Student"}! 👋
            </h1>
            
            <p className="text-slate-400 text-sm max-w-xl">
              Your dashboard dynamically updates from your database as you complete lessons.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 relative z-10">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">{userProfile?.full_name || "Student"}</span>
                </div>
                <button onClick={handleSignOut} className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 transition-all" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/login/student" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
                Sign In to View Issued Certificates
              </Link>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-2xl text-xs font-semibold flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              You are currently viewing as a guest. Please log in to access your earned certificates and course progress.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Level</p>
              <p className="text-sm font-bold text-amber-400">
                {activeCourse ? `Level ${activeCourse.sequenceOrder}: ${activeCourse.title}` : "No Active Course"}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Track Progress</p>
              <p className="text-base font-bold text-white">{activeProgressPercentage}% Completed</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Certificates</p>
              <p className="text-base font-bold text-white">{certificates.length} Earned</p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Track Focus */}
            {activeCourse && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <span>Level {activeCourse.sequenceOrder}: {activeCourse.title}</span>
                  </h2>
                  <span className="text-xs bg-amber-400/10 text-amber-400 font-semibold px-3 py-1 rounded-full border border-amber-400/25">
                    Active Focus
                  </span>
                </div>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {activeCourse.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Lessons Completed</span>
                    <span className="text-amber-400">{activeCourse.completedLessonsCount} of {activeCourse.totalLessons}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${activeProgressPercentage}%` }} />
                  </div>
                </div>

                {/* Lessons Roadmap */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lessons Roadmap</p>
                  <div className="space-y-2">
                    {activeCourse.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${activeCourse.slug}/lessons/lesson-${lesson.lesson_number}`}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:border-slate-600 ${
                          lesson.isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950/40 border-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {lesson.isCompleted ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <Clock className="w-4 h-4 shrink-0 text-slate-500" />}
                          <span className={lesson.isCompleted ? "text-slate-200 font-medium" : "text-slate-400"}>
                            Lesson {lesson.lesson_number}: {lesson.title}
                          </span>
                        </div>
                        {lesson.isCompleted ? (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Completed</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Pending</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Curriculum Overview Cards */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white">Curriculum Progression</h3>
              <div className="space-y-3">
                {coursesProgress.map((course) => (
                  <div
                    key={course.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      course.id === activeCourse?.id
                        ? "bg-amber-400/10 border-amber-400/40"
                        : course.isUnlocked
                        ? "bg-slate-950/60 border-slate-800"
                        : "bg-slate-950/20 border-slate-900 opacity-60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-amber-400">Level {course.sequenceOrder}</span>
                        <h4 className="text-sm font-bold text-white">{course.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        {course.completedLessonsCount} / {course.totalLessons} Lessons Completed
                      </p>
                    </div>

                    <div>
                      {!course.isUnlocked ? (
                        <div className="flex items-center space-x-1 text-xs text-slate-500 font-semibold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveCourse(course)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                            course.id === activeCourse?.id
                              ? "bg-amber-400 text-slate-950"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {course.id === activeCourse?.id ? "Viewing" : "Switch View"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issued Certificates */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Earned Certificates</h3>
              </div>

              {certificates.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No certificates issued yet. Certificates automatically render once awarded by your instructor upon course completion.

                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      onClick={() => setSelectedCertificate(cert)}
                      className="bg-slate-950/60 border border-emerald-500/30 hover:border-emerald-400/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {cert.course_name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400">Issued: {cert.issued_at}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            
            {/* CALENDAR */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>{calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={handleJumpToToday} className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-1 rounded-md mr-1">Today</button>
                  <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
                {daysOfWeek.map((day) => <div key={day}>{day}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const iterDate = new Date(year, month, dayNum);
                  const iterKey = getFormattedKey(iterDate);
                  const isToday = iterKey === todayKey;
                  const isSelected = iterKey === selectedDateKey;
                  const hasEvents = events.some((ev) => ev.dateStr === iterKey);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedDate(iterDate)}
                      className={`h-8 flex flex-col items-center justify-center rounded-xl font-medium transition-all relative ${
                        isSelected ? "bg-amber-400 text-slate-950 font-extrabold shadow-lg z-10" : isToday ? "bg-slate-800 text-amber-400 border border-amber-400/40 font-bold" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{dayNum}</span>
                      {!isSelected && hasEvents && <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Task manager */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Tasks for {selectedDate.toLocaleDateString("default", { month: "short", day: "numeric" })}
                </p>
                {selectedDateEvents.map((ev) => (
                  <div key={ev.id} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-200 truncate">{ev.title}</span>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <form onSubmit={handleAddEvent} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Add task..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <button type="submit" className="bg-amber-400 text-slate-950 p-1.5 rounded-lg"><Plus className="w-4 h-4 font-bold" /></button>
                </form>
              </div>
            </div>

            {/* NOTEPAD */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">Reflections Note</span>
                {noteSaved && <span className="text-[10px] text-emerald-400 font-semibold">Saved</span>}
              </div>
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Write reflections..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 resize-none focus:outline-none"
              />
              <button onClick={handleSaveNote} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 rounded-xl">Save Note</button>
            </div>

          </div>

        </div>

      </main>

      {/* CERTIFICATE MODAL */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          
          {/* Injecting Fonts */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@400;600;700;900&display=swap" />

          {/* Modal Container */}
          <div className="relative flex flex-col items-center max-w-4xl w-full my-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCertificate(null)}
              className="absolute -top-12 right-0 text-slate-300 hover:text-white p-2 bg-white/10 hover:bg-white/25 rounded-full transition-colors z-50 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Certificate Card - Clean, Elegant Designer Frame */}
            <div id="certificate-container" className="relative w-full aspect-[1.4] bg-[#FDFBF7] shadow-2xl rounded-sm border-[16px] border-[#0A192F] p-10 sm:p-14 overflow-hidden text-neutral-900 flex flex-col justify-between">
              
              {/* Inner Gold Fine Line Border */}
              <div className="absolute inset-3 border-2 border-[#C5A059]/60 pointer-events-none" />

              {/* Corner Ornaments */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#C5A059]" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#C5A059]" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#C5A059]" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#C5A059]" />

              {/* Header Section */}
              <div className="relative z-10 text-center space-y-2 mt-2">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#C5A080]" style={{ fontFamily: "'Cinzel', serif" }}>
                  Ministry of Christ's Great Commission Church Inc.
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-[#0A192F] tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                  CERTIFICATE OF COMPLETION
                </h1>
                <div className="w-32 h-0.5 bg-[#C5A059] mx-auto mt-2" />
              </div>

              {/* Body Presentation */}
              <div className="relative z-10 text-center space-y-4 my-auto">
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-semibold italic">
                  This proudly certifies that
                </p>

                {/* Student Name */}
                <div>
                  <p style={{ fontFamily: "'Great Vibes', cursive" }} className="text-6xl sm:text-7xl text-[#0A192F] pb-1">
                    {userProfile?.full_name || "Student Name"}
                  </p>
                  <div className="w-64 h-px bg-neutral-300 mx-auto mt-1" />
                </div>

                {/* Course details */}
                <div className="space-y-2 max-w-xl mx-auto pt-2">
                  <p className="text-base sm:text-lg font-bold text-[#C5A059] uppercase tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                    {selectedCertificate.course_name}
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed px-4">
                    Has successfully completed all requirements, coursework, and spiritual milestones. &ldquo;Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom.&rdquo; &mdash; Colossians 3:16
                  </p>
                </div>
              </div>

              {/* Footer Section: Signatures, Seal & Badge */}
              <div className="relative z-10 flex justify-between items-end pt-6 border-t border-neutral-200 mt-2">
                
                {/* Date Issued */}
                <div className="w-40 text-center space-y-1">
                  <p className="text-[11px] font-bold text-[#0A192F]" style={{ fontFamily: "'Cinzel', serif" }}>{selectedCertificate.issued_at}</p>
                  <div className="w-full h-px bg-neutral-400" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Date Issued</p>
                </div>

                {/* Center Gold Seal / Crest */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-amber-200 flex items-center justify-center bg-gradient-to-b from-amber-300 to-amber-600 text-[#0A192F] font-black text-xs tracking-tighter shadow-inner">
                      MCGC
                    </div>
                  </div>
                </div>

                {/* Director / Developer Note */}
                <div className="w-40 text-center space-y-1">
                  <p className="text-[11px] font-bold text-amber-800 italic" style={{ fontFamily: "'Great Vibes', cursive", fontSize: "16px" }}>Keep growing! 🚀</p>
                  <div className="w-full h-px bg-neutral-400" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Authorized Signature</p>
                </div>

              </div>

            </div>

            {/* Print Action Button */}
            <div className="mt-6">
              <button 
                onClick={() => window.print()}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all hover:scale-105 flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Certificate</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}