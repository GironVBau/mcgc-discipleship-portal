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
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2
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
  course_id: string;
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

  // All courses fetched from DB
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [level1Course, setLevel1Course] = useState<CourseData | null>(null);
  const [level2Course, setLevel2Course] = useState<CourseData | null>(null);
  const [level3Course, setLevel3Course] = useState<CourseData | null>(null);

  // Lesson tracking for all levels to determine progression
  const [level1Lessons, setLevel1Lessons] = useState<LessonData[]>([]);
  const [level1CompletedIds, setLevel1CompletedIds] = useState<Set<string>>(new Set());
  
  const [level2Lessons, setLevel2Lessons] = useState<LessonData[]>([]);
  const [level2CompletedIds, setLevel2CompletedIds] = useState<Set<string>>(new Set());

  // Active view states
  const [activeLessons, setActiveLessons] = useState<LessonData[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  const [certificates, setCertificates] = useState<CertificateData[]>([]);

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

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const savedNotes = localStorage.getItem("mcgc_student_date_notes");
      if (savedNotes) {
        try { setDateNotes(JSON.parse(savedNotes)); } catch (e) { console.error(e); }
      }

      const savedEvents = localStorage.getItem("mcgc_student_events");
      if (savedEvents) {
        try { setEvents(JSON.parse(savedEvents)); } catch (e) { console.error(e); }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      let l1: CourseData | null = null;
      let l2: CourseData | null = null;
      let l3: CourseData | null = null;

      if (coursesData && coursesData.length > 0) {
        setCourses(coursesData);
        l1 = coursesData.find((c) => c.slug === "foundational-discipleship") || coursesData[0];
        l2 = coursesData.find((c) => c.slug === "leadership-discipleship" || c.slug.includes("fundamental")) || null;
        l3 = coursesData.find((c) => c.slug === "ministry-readiness" || c.slug.includes("ministry")) || null;

        setLevel1Course(l1);
        setLevel2Course(l2);
        setLevel3Course(l3);

        // Fetch Level 1 lessons and progress
        if (l1) {
          const { data: l1Res } = await supabase
            .from("lessons")
            .select("id, lesson_number, title, course_id")
            .eq("course_id", l1.id)
            .order("lesson_number", { ascending: true });
          
          const l1List = l1Res || [];
          setLevel1Lessons(l1List);

          if (l1List.length > 0) {
            const { data: prog1 } = await supabase
              .from("user_lesson_progress")
              .select("*")
              .eq("user_id", user.id)
              .in("lesson_id", l1List.map(l => l.id));

            if (prog1) {
              const comp1 = new Set(prog1.filter(p => p.completed || p.is_completed).map(p => p.lesson_id));
              setLevel1CompletedIds(comp1);
            }
          }
        }

        // Fetch Level 2 lessons and progress
        if (l2) {
          const { data: l2Res } = await supabase
            .from("lessons")
            .select("id, lesson_number, title, course_id")
            .eq("course_id", l2.id)
            .order("lesson_number", { ascending: true });
          
          const l2List = l2Res || [];
          setLevel2Lessons(l2List);

          if (l2List.length > 0) {
            const { data: prog2 } = await supabase
              .from("user_lesson_progress")
              .select("*")
              .eq("user_id", user.id)
              .in("lesson_id", l2List.map(l => l.id));

            if (prog2) {
              const comp2 = new Set(prog2.filter(p => p.completed || p.is_completed).map(p => p.lesson_id));
              setLevel2CompletedIds(comp2);
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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadStudentData();

    const handleFocus = () => loadStudentData();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadStudentData]);

  // Determine active level dynamically based on lesson completion counts
  const activeLevelNumber = useMemo(() => {
    const l1Finished = level1Lessons.length > 0 && level1CompletedIds.size >= level1Lessons.length;
    const l2Finished = level2Lessons.length > 0 && level2CompletedIds.size >= level2Lessons.length;

    if (l1Finished && l2Finished) return 3;
    if (l1Finished) return 2;
    return 1;
  }, [level1Lessons, level1CompletedIds, level2Lessons, level2CompletedIds]);

  // Update active course details and roadmap based on active level
  useEffect(() => {
    if (activeLevelNumber === 2 && level2Lessons.length > 0) {
      setActiveLessons(level2Lessons);
      setCompletedLessonIds(level2CompletedIds);
    } else if (activeLevelNumber === 1 && level1Lessons.length > 0) {
      setActiveLessons(level1Lessons);
      setCompletedLessonIds(level1CompletedIds);
    } else if (activeLevelNumber === 3 && level3Course) {
      // Fallback configuration if level 3 content loads
      setActiveLessons([]);
      setCompletedLessonIds(new Set());
    }
  }, [activeLevelNumber, level1Lessons, level1CompletedIds, level2Lessons, level2CompletedIds, level3Course]);

  const activeCourseData = useMemo(() => {
    if (activeLevelNumber === 3) return level3Course;
    if (activeLevelNumber === 2) return level2Course;
    return level1Course;
  }, [activeLevelNumber, level1Course, level2Course, level3Course]);

  const currentStandingText = useMemo(() => {
    if (activeLevelNumber === 3) return "Level 3: Ministry Readiness Active";
    if (activeLevelNumber === 2) return "Level 2: Fundamental Active";
    return "Level 1: In Progress";
  }, [activeLevelNumber]);

  const totalLessons = activeLessons.length;
  const completedLessonsCount = completedLessonIds.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  const handleSelectDate = (date: Date) => setSelectedDate(date);

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

  // Calendar setup
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const handleJumpToToday = () => { const now = new Date(); setCalendarDate(now); setSelectedDate(now); };

  const today = currentTime || new Date();
  const todayKey = getFormattedKey(today);
  const selectedDateEvents = useMemo(() => events.filter((ev) => ev.dateStr === selectedDateKey), [events, selectedDateKey]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Syncing Student Portal...</span>
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
              <span>Level {activeLevelNumber} Unlocked & Active</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              <span>Welcome back, {userProfile?.full_name?.split(" ")[0] || "Student"}! 👋</span>
            </h1>
            
            <p className="text-slate-400 text-sm max-w-xl">
              Your dashboard has advanced automatically to match your curriculum progression.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0 relative z-10">
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">{userProfile?.full_name || "Student"}</span>
            </div>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 transition-all" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Standing</p>
              <p className="text-sm font-bold text-amber-400">{currentStandingText}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Track Progress</p>
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

        {/* Dashboard Grid Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Active Course Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeCourseData && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <span>Level {activeLevelNumber}: {activeCourseData.title}</span>
                  </h2>
                  <span className="text-xs bg-amber-400/10 text-amber-400 font-semibold px-3 py-1 rounded-full border border-amber-400/25">
                    Active Focus
                  </span>
                </div>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {activeCourseData.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Lessons Completed</span>
                    <span className="text-amber-400">{completedLessonsCount} of {totalLessons}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>

                {/* Lessons Roadmap */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lessons Roadmap</p>
                  <div className="space-y-2">
                    {activeLessons.map((lesson) => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${activeCourseData.slug}/lessons/lesson-${lesson.lesson_number}`}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:border-slate-600 ${
                            isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950/40 border-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {isCompleted ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <Clock className="w-4 h-4 shrink-0 text-slate-500" />}
                            <span className={isCompleted ? "text-slate-200 font-medium" : "text-slate-400"}>
                              Lesson {lesson.lesson_number}: {lesson.title}
                            </span>
                          </div>
                          {isCompleted ? (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Completed</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Pending</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Curriculum Track Summary Links */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white">Full Curriculum Access & Quick Switch</h3>
              <p className="text-xs text-slate-400">You can review past levels or jump straight to your curriculum overview anytime.</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/courses" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all">
                  <span>Open Curriculum Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

          {/* Interactive Sidebar Tools */}
          <div className="space-y-6">
            
            {/* CALENDAR WIDGET */}
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
                      onClick={() => handleSelectDate(iterDate)}
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

              {/* Task manager inside calendar */}
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

            {/* NOTEPAD WIDGET */}
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
    </div>
  );
}