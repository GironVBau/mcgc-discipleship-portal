"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { 
  FileText, 
  Award, 
  AlertCircle, 
  Trophy, 
  LogOut, 
  User, 
  Sparkles,
  Calendar as CalendarIcon,
  StickyNote,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  CheckCircle2
} from "lucide-react";

interface PendingEssay {
  id: string;
  student_name: string;
  course_name: string;
  lesson_title: string;
  submission_text: string;
  submitted_at: string;
  student_id: string;
}

interface StudentPerformance {
  student_id: string;
  student_name: string;
  progress_pct: number;
  avg_score: number;
  status: "top" | "attention" | "candidate";
  notes?: string;
}

export default function TeacherDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  // Core Data States
  const [pendingEssays, setPendingEssays] = useState<PendingEssay[]>([]);
  const [topStudents, setTopStudents] = useState<StudentPerformance[]>([]);
  const [certificateCandidates, setCertificateCandidates] = useState<StudentPerformance[]>([]);
  const [studentsNeedingFocus, setStudentsNeedingFocus] = useState<StudentPerformance[]>([]);

  // Essay Scoring Modal State
  const [selectedEssay, setSelectedEssay] = useState<PendingEssay | null>(null);
  const [score, setScore] = useState<number>(100);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Notes State
  const [teacherNote, setTeacherNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // Load Teacher Dashboard Data
  const loadTeacherData = useCallback(async () => {
    try {
      setLoading(true);

      const savedNote = localStorage.getItem("mcgc_teacher_reflection_note");
      if (savedNote) setTeacherNote(savedNote);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) setUserProfile(profile);

      // 2. Fetch Pending Essays
      const { data: essaySubmissions } = await supabase
        .from("user_essay_submissions")
        .select(`
          id,
          submission_text,
          submitted_at,
          user_id,
          profiles:user_id ( full_name ),
          lessons:lesson_id ( title, course_id, courses:course_id ( title ) )
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: true });

      if (essaySubmissions) {
        const formattedEssays: PendingEssay[] = essaySubmissions.map((sub: any) => ({
          id: sub.id,
          submission_text: sub.submission_text,
          submitted_at: sub.submitted_at,
          student_id: sub.user_id,
          student_name: sub.profiles?.full_name || "Unknown Student",
          course_name: sub.lessons?.courses?.title || "Discipleship Course",
          lesson_title: sub.lessons?.title || "Lesson Submission"
        }));
        setPendingEssays(formattedEssays);
      }

      // 3. Fetch Students Analytics (Candidates, Top Performers, Needs Focus)
      const { data: studentProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student");

      if (studentProfiles) {
        const performances: StudentPerformance[] = [];

        for (const student of studentProfiles) {
          // Fetch completed lessons count
          const { count: completedCount } = await supabase
            .from("user_lesson_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", student.id)
            .or("completed.eq.true,is_completed.eq.true");

          // Fetch exam status
          const { data: examData } = await supabase
            .from("user_exam_results")
            .select("score, passed")
            .eq("user_id", student.id);

          const totalLessons = 10; // Standard level lesson count
          const progressPct = Math.min(100, Math.round(((completedCount || 0) / totalLessons) * 100));
          
          const examScores = examData?.map((e) => e.score) || [];
          const avgScore = examScores.length > 0 
            ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length) 
            : progressPct;

          const hasPassedExam = examData?.some((e) => e.passed);

          if (hasPassedExam || progressPct === 100) {
            performances.push({
              student_id: student.id,
              student_name: student.full_name || "Student",
              progress_pct: progressPct,
              avg_score: avgScore,
              status: "candidate",
              notes: "Completed course requirements"
            });
          } else if (avgScore >= 85 || progressPct >= 70) {
            performances.push({
              student_id: student.id,
              student_name: student.full_name || "Student",
              progress_pct: progressPct,
              avg_score: avgScore,
              status: "top"
            });
          } else {
            performances.push({
              student_id: student.id,
              student_name: student.full_name || "Student",
              progress_pct: progressPct,
              avg_score: avgScore,
              status: "attention",
              notes: progressPct < 30 ? "Incomplete active lessons" : "Below average scores"
            });
          }
        }

        setCertificateCandidates(performances.filter((p) => p.status === "candidate"));
        setTopStudents(performances.filter((p) => p.status === "top").slice(0, 5));
        setStudentsNeedingFocus(performances.filter((p) => p.status === "attention").slice(0, 5));
      }

    } catch (err) {
      console.error("Error loading teacher dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const now = new Date();
    setCalendarDate(now);
    setCurrentTime(now);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadTeacherData();

    return () => clearInterval(timer);
  }, [loadTeacherData]);

  // Submit Essay Score & Assessment
  const handleGradeEssay = async () => {
    if (!selectedEssay) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("user_essay_submissions")
        .update({
          score: score,
          feedback: feedback,
          status: "reviewed",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", selectedEssay.id);

      if (error) throw error;

      // Remove graded essay from state
      setPendingEssays((prev) => prev.filter((e) => e.id !== selectedEssay.id));
      setSelectedEssay(null);
      setScore(100);
      setFeedback("");
    } catch (err) {
      console.error("Error grading essay:", err);
      alert("Failed to submit score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNote = () => {
    localStorage.setItem("mcgc_teacher_reflection_note", teacherNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading Instructor Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

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
                Instructor Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">
                {userProfile?.full_name || "Instructor"}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8 relative z-10">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Teacher Focus Area</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {userProfile?.full_name?.split(" ")[0] || "Instructor"}! 📖
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Review student essay submissions, evaluate assessments, and monitor student progression across discipleship levels.
            </p>
          </div>
        </div>

        {/* Dynamic Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending Essay Reviews</p>
              <p className="text-xl font-extrabold text-amber-400">{pendingEssays.length}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Certificate Candidates</p>
              <p className="text-xl font-extrabold text-white">{certificateCandidates.length}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Students Needing Attention</p>
              <p className="text-xl font-extrabold text-white">{studentsNeedingFocus.length}</p>
            </div>
          </div>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PENDING ESSAY REVIEWS SECTION */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Pending Essay Reviews</span>
                </h2>
                <span className="text-xs bg-amber-400/10 text-amber-400 font-semibold px-3 py-1 rounded-full border border-amber-400/20">
                  {pendingEssays.length} Require Scoring
                </span>
              </div>

              {pendingEssays.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">All submissions reviewed!</p>
                  <p className="text-xs text-slate-500">There are currently no student essays awaiting feedback.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingEssays.map((essay) => (
                    <div 
                      key={essay.id}
                      className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{essay.student_name}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-amber-400 font-medium">{essay.course_name}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">{essay.lesson_title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                          "{essay.submission_text}"
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedEssay(essay)}
                        className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shrink-0 transition-all"
                      >
                        <span>Review & Score</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CANDIDATES FOR CERTIFICATES */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>Candidates for Certificates</span>
                </h3>
              </div>

              {certificateCandidates.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No students currently awaiting certificate approval.</p>
              ) : (
                <div className="space-y-2">
                  {certificateCandidates.map((cand) => (
                    <div key={cand.student_id} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{cand.student_name}</p>
                        <p className="text-[10px] text-slate-400">{cand.notes || "Completed requirements"}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        Ready for Issue
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STUDENTS NEEDING FOCUS & ATTENTION */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>Students Needing Focus</span>
                </h3>
              </div>

              {studentsNeedingFocus.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">All students are progressing smoothly!</p>
              ) : (
                <div className="space-y-2">
                  {studentsNeedingFocus.map((st) => (
                    <div key={st.student_id} className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{st.student_name}</p>
                        <p className="text-[10px] text-rose-400">{st.notes || "Lagging progress"}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Progress: {st.progress_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* TOP PERFORMING STUDENTS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Top Performing Students</span>
              </div>

              {topStudents.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No rankings available yet.</p>
              ) : (
                <div className="space-y-2">
                  {topStudents.map((tp, idx) => (
                    <div key={tp.student_id} className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 bg-amber-400/10 text-amber-400 font-extrabold text-[10px] rounded-full flex items-center justify-center border border-amber-400/20">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200">{tp.student_name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {tp.avg_score}% Avg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Calendar */}
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

            {/* Instructor Notes Widget */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span>Instructor Notes</span>
                </div>
                {noteSaved && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>

              <textarea
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="Write reminders, student observations, or class plans..."
                className="w-full h-28 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/50 resize-none"
              />

              <button
                onClick={handleSaveNote}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* ESSAY SCORING MODAL */}
      {selectedEssay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 relative shadow-2xl">
            
            <button 
              onClick={() => setSelectedEssay(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                Essay Evaluation
              </span>
              <h3 className="text-lg font-bold text-white pt-2">{selectedEssay.student_name}</h3>
              <p className="text-xs text-slate-400">{selectedEssay.course_name} — {selectedEssay.lesson_title}</p>
            </div>

            {/* Submission Body */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
              {selectedEssay.submission_text}
            </div>

            {/* Score & Feedback Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teacher Feedback & Assessment
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide encouraging assessment and spiritual growth feedback..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedEssay(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              
              <button
                disabled={isSubmitting}
                onClick={handleGradeEssay}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Assessment"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}