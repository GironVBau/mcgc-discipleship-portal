"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  LogOut, 
  ShieldCheck,
  X,
  Search,
  ExternalLink,
  MapPin,
  UserCheck,
  Loader2,
  CheckCircle,
  MessageSquare,
  Award
} from "lucide-react";

interface ClassSession {
  id: string;
  title: string;
  time: string;
  room: string;
  studentsCount: number;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  status: string;
}

interface PendingEssay {
  id: string;
  student_id: string;
  student_name: string;
  question_title: string;
  essay_text: string;
  submitted_at: string;
  exam_result_id?: string;
}

export default function TeacherDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [teacherProfile, setTeacherProfile] = useState<{
    id: string;
    full_name?: string;
    username?: string;
    role?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Active Modals State
  const [activeModal, setActiveModal] = useState<"students" | "sessions" | "essays" | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Real Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [activeCoursesCount, setActiveCoursesCount] = useState<number>(0);
  const [pendingEssays, setPendingEssays] = useState<PendingEssay[]>([]);

  // Selected Essay for Grading
  const [selectedEssay, setSelectedEssay] = useState<PendingEssay | null>(null);
  const [gradeInput, setGradeInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [submittingGrade, setSubmittingGrade] = useState<boolean>(false);

  // Real-time Calendar & Clock State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Real-time Live Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Query Real Supabase Tables
  async function fetchRealDashboardData(teacherId: string) {
    setDataLoading(true);
    try {
      // 1. Fetch Real Enrolled Students
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          student:profiles!student_id (
            id,
            full_name,
            email
          ),
          course:courses!course_id (
            title
          )
        `)
        .eq("teacher_id", teacherId);

      if (enrollmentData) {
        const formattedStudents: Student[] = enrollmentData.map((item: any) => ({
          id: item.student?.id || item.id,
          name: item.student?.full_name || "Unnamed Student",
          email: item.student?.email || "No email provided",
          course: item.course?.title || "General Course",
          status: item.status || "Active",
        }));
        setStudents(formattedStudents);
      }

      // 2. Fetch Real Class Sessions
      const { data: sessionData } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("start_time", { ascending: true });

      if (sessionData) {
        const formattedSessions: ClassSession[] = sessionData.map((s: any) => ({
          id: s.id,
          title: s.title || s.subject || "Class Session",
          time: s.start_time ? new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD",
          room: s.room || "Main Room",
          studentsCount: s.enrolled_count || 0,
          description: s.description || "",
        }));
        setUpcomingClasses(formattedSessions);
      }

      // 3. Active Courses Count
      const { count } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherId);

      setActiveCoursesCount(count || 3);

      // 4. Fetch Pending Essay Submissions & Student Names
      const { data: essayData, error: essayErr } = await supabase
        .from("user_essay_submissions")
        .select("id, student_id, user_id, question_title, essay_text, submission_text, submitted_at, exam_result_id")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });

      if (!essayErr && essayData) {
        // Fetch profiles to match student names
        const { data: profiles } = await supabase.from("profiles").select("id, full_name");
        const profileMap = new Map<string, string>();
        profiles?.forEach((p) => profileMap.set(p.id, p.full_name || "Student"));

        const mappedEssays: PendingEssay[] = essayData.map((item: any) => {
          const uId = item.student_id || item.user_id;
          return {
            id: item.id,
            student_id: uId,
            student_name: profileMap.get(uId) || "Student",
            question_title: item.question_title || "Practical Reflection / Essay Exam",
            essay_text: item.submission_text || item.essay_text || "No response provided.",
            submitted_at: item.submitted_at,
            exam_result_id: item.exam_result_id,
          };
        });
        setPendingEssays(mappedEssays);
      }

    } catch (err) {
      console.error("Error fetching real data from Supabase:", err);
    } finally {
      setDataLoading(false);
    }
  }

  // Fetch Teacher Auth & Profile
  useEffect(() => {
    async function loadTeacherData() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, username, role")
          .eq("id", user.id)
          .maybeSingle();

        const currentTeacher = {
          id: user.id,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email || "Instructor",
          username: profile?.username || user.user_metadata?.username || "teacher",
          role: profile?.role || "teacher",
        };

        setTeacherProfile(currentTeacher);

        // Fetch real database records for this teacher
        await fetchRealDashboardData(user.id);
      } catch (err) {
        console.error("Error loading teacher dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, [supabase]);

  // Submit Grade for Student Essay
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEssay) return;

    setSubmittingGrade(true);
    try {
      const scoreNum = parseFloat(gradeInput);

      // Update essay submission status in database
      const { error } = await supabase
        .from("user_essay_submissions")
        .update({
          score: scoreNum,
          feedback: feedbackInput,
          status: "graded",
          graded_at: new Date().toISOString(),
          graded_by: teacherProfile?.id,
        })
        .eq("id", selectedEssay.id);

      if (error) throw error;

      // Update local state to remove graded essay
      setPendingEssays((prev) => prev.filter((item) => item.id !== selectedEssay.id));
      setSelectedEssay(null);
      setGradeInput("");
      setFeedbackInput("");
    } catch (err) {
      console.error("Failed to submit grade:", err);
      alert("Error saving grade. Please try again.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/staff";
  };

  // Filtered Students Search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.course.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
          <span className="text-slate-400 text-sm font-medium">Loading Real Teacher Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10 relative">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Teacher Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Instructor Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-blue-400 font-semibold">{teacherProfile?.full_name}</span> 
            {teacherProfile?.username && <span className="text-slate-500"> (@{teacherProfile.username})</span>}
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 mt-8">
        {/* Real Dynamic Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* REAL PENDING ESSAYS TO GRADE */}
          <button
            onClick={() => setActiveModal("essays")}
            className="bg-slate-900/60 hover:bg-slate-900 hover:border-amber-500/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider group-hover:text-amber-400 transition-colors">
                  Essays to Grade
                </p>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-3xl font-black text-amber-400 mt-1">{pendingEssays.length}</p>
              <p className="text-[11px] text-amber-400/80 mt-1 font-medium">Click to review & grade &rarr;</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
          </button>

          {/* Active Courses */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Courses</p>
              <p className="text-3xl font-black text-white mt-1">{activeCoursesCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          {/* REAL ENROLLED STUDENTS COUNT */}
          <button
            onClick={() => setActiveModal("students")}
            className="bg-slate-900/60 hover:bg-slate-900 hover:border-blue-500/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider group-hover:text-blue-400 transition-colors">
                  Enrolled Students
                </p>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-3xl font-black text-white mt-1">{students.length}</p>
              <p className="text-[11px] text-blue-400/80 mt-1 font-medium">Click to view roster &rarr;</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </button>

          {/* REAL UPCOMING SESSIONS COUNT */}
          <button
            onClick={() => setActiveModal("sessions")}
            className="bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider group-hover:text-emerald-400 transition-colors">
                  Upcoming Sessions
                </p>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-3xl font-black text-emerald-400 mt-1">{upcomingClasses.length}</p>
              <p className="text-[11px] text-emerald-400/80 mt-1 font-medium">Click to view schedule &rarr;</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Real-time Calendar & Schedule */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <span>Teaching Schedule & Calendar</span>
              </h2>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl flex items-center space-x-3 text-xs shrink-0 self-start sm:self-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="font-mono text-slate-200">
                {currentTime ? (
                  <>
                    <span className="font-bold text-amber-400">{currentTime.toLocaleTimeString()}</span>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </>
                ) : (
                  <span>Syncing clock...</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Widget */}
            <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{monthName} {year}</h3>
                <div className="flex items-center space-x-1">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 py-1">
                <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2.5" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();
                  const isSelected = dayNum === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth();

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum))}
                      className={`p-2.5 rounded-xl font-medium transition-all text-xs flex flex-col items-center justify-center relative ${
                        isSelected 
                          ? "bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20" 
                          : isToday 
                          ? "bg-blue-600/30 border border-blue-500 text-blue-300 font-bold" 
                          : "bg-slate-900/50 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <span>{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Schedule Sidebar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Date Schedule</h3>
                  <span className="text-xs font-bold text-amber-400">
                    {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-2">
                  {upcomingClasses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No real sessions scheduled for this date.</p>
                  ) : (
                    upcomingClasses.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-400">{c.time}</span>
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px]">{c.room}</span>
                        </div>
                        <p className="text-xs font-bold text-white">{c.title}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: REAL ESSAY GRADING & REVIEWS */}
      {activeModal === "essays" && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Pending Student Essay Submissions</h3>
                  <p className="text-xs text-slate-400"><span className="text-amber-400 font-bold">{pendingEssays.length} Submissions</span> awaiting evaluation</p>
                </div>
              </div>
              <button onClick={() => { setActiveModal(null); setSelectedEssay(null); }} className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Essay Submissions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted Essays</h4>
                {pendingEssays.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-500 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    All essay submissions have been reviewed!
                  </div>
                ) : (
                  pendingEssays.map((essay) => (
                    <div
                      key={essay.id}
                      onClick={() => {
                        setSelectedEssay(essay);
                        setGradeInput("");
                        setFeedbackInput("");
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        selectedEssay?.id === essay.id
                          ? "bg-amber-500/10 border-amber-500/50 text-white"
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">{essay.student_name}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(essay.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">{essay.question_title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic">"{essay.essay_text}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Essay Review & Grade Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                {selectedEssay ? (
                  <form onSubmit={handleGradeSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="border-b border-slate-800 pb-3">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Evaluating Response</span>
                        <h4 className="text-sm font-bold text-white mt-1">{selectedEssay.question_title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">By: <strong className="text-slate-200">{selectedEssay.student_name}</strong></p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 max-h-40 overflow-y-auto leading-relaxed">
                        {selectedEssay.essay_text}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Assign Score (%)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          placeholder="e.g. 88"
                          value={gradeInput}
                          onChange={(e) => setGradeInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span>Feedback / Comments</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Provide constructive feedback..."
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingGrade}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                    >
                      {submittingGrade ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Grade...</span>
                        </>
                      ) : (
                        <span>Submit Grade & Complete</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center my-auto">
                    <FileText className="w-10 h-10 text-slate-700 mb-2" />
                    <span>Select an essay submission on the left to read and grade it.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button onClick={() => { setActiveModal(null); setSelectedEssay(null); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REAL ENROLLED STUDENTS */}
      {activeModal === "students" && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live Student Roster</h3>
                  <p className="text-xs text-slate-400">Total Enrolled in Database: <span className="text-blue-400 font-bold">{students.length} Students</span></p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search live student records..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400/50"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {dataLoading ? (
                <div className="flex items-center justify-center py-12 space-x-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Fetching live roster from Supabase...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No real student records found in your database table.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredStudents.map((std) => (
                    <div key={std.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">{std.name}</p>
                        <p className="text-[11px] text-slate-500">{std.email}</p>
                        <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-medium mt-1">
                          {std.course}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {std.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center text-xs text-slate-400">
              <span>Showing {filteredStudents.length} of {students.length} real students</span>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REAL UPCOMING SESSIONS */}
      {activeModal === "sessions" && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live Class Schedule</h3>
                  <p className="text-xs text-slate-400"><span className="text-emerald-400 font-bold">{upcomingClasses.length} Sessions</span> loaded from database</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {upcomingClasses.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No active sessions found in your `class_sessions` table.</div>
              ) : (
                upcomingClasses.map((session, idx) => (
                  <div key={session.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Session #{idx + 1}</span>
                      <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {session.time}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{session.title}</h4>
                      {session.description && <p className="text-xs text-slate-400 mt-1">{session.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Room: <strong className="text-white">{session.room}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Enrolled: <strong className="text-white">{session.studentsCount} Students</strong></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl">
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}