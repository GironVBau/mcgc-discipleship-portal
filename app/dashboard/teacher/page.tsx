"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Award,
  FileCheck
} from "lucide-react";

interface TeacherProfile {
  full_name?: string;
  username?: string;
  role?: string;
}

interface StudentExamStatus {
  studentId: string;
  studentName: string;
  username: string;
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  isApproved: boolean;
}

export default function TeacherDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [studentCount, setStudentCount] = useState<number | string>("--");
  const [examStudentStatuses, setExamStudentStatuses] = useState<StudentExamStatus[]>([]);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Live Clock & Calendar
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        // Fetch teacher profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username, role")
          .eq("id", user.id)
          .maybeSingle();

        setTeacherProfile({
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email || "Teacher",
          username: profile?.username || user.user_metadata?.username || "teacher",
          role: profile?.role || user.user_metadata?.role || "teacher",
        });

        // Count total students
        const { count: students } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");

        setStudentCount(students ?? 0);

        // Fetch students, courses, lessons, and exam approvals
        const { data: studentsData } = await supabase
          .from("profiles")
          .select("id, full_name, username, email")
          .eq("role", "student");

        const { data: coursesData } = await supabase.from("courses").select("id, title");
        const { data: lessonsData } = await supabase.from("lessons").select("id, course_id");
        const { data: progressData } = await supabase.from("user_lesson_progress").select("user_id, lesson_id").eq("completed", true);
        const { data: approvalsData } = await supabase.from("exam_approvals").select("user_id, course_id, is_approved");

        if (studentsData && coursesData) {
          const statuses: StudentExamStatus[] = [];

          studentsData.forEach((st) => {
            coursesData.forEach((crs) => {
              const courseLessons = lessonsData?.filter((l) => l.course_id === crs.id) || [];
              const totalLessons = courseLessons.length;
              
              if (totalLessons === 0) return;

              const lessonIds = new Set(courseLessons.map((l) => l.id));
              const userCompletedCount = progressData?.filter(
                (p) => p.user_id === st.id && lessonIds.has(p.lesson_id)
              ).length || 0;

              const approval = approvalsData?.find(
                (a) => a.user_id === st.id && a.course_id === crs.id
              );

              statuses.push({
                studentId: st.id,
                studentName: st.full_name || st.email,
                username: st.username || "student",
                courseId: crs.id,
                courseTitle: crs.title,
                completedLessons: userCompletedCount,
                totalLessons: totalLessons,
                isApproved: approval?.is_approved ?? false,
              });
            });
          });

          setExamStudentStatuses(statuses);
        }

      } catch (err) {
          console.error("Unexpected error loading teacher dashboard:", err);
        } finally {
          setLoading(false);
        }
    }

    loadTeacherData();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/staff";
  };

  const handleToggleExamApproval = async (studentId: string, courseId: string, currentStatus: boolean) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newStatus = !currentStatus;

      const { error } = await supabase
        .from("exam_approvals")
        .upsert(
          {
            user_id: studentId,
            course_id: courseId,
            is_approved: newStatus,
            approved_by: user?.id,
            approved_at: newStatus ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,course_id" }
        );

      if (error) throw error;

      setExamStudentStatuses((prev) =>
        prev.map((item) =>
          item.studentId === studentId && item.courseId === courseId
            ? { ...item, isApproved: newStatus }
            : item
        )
      );

      setActionSuccess(`Exam approval ${newStatus ? "granted" : "revoked"} successfully.`);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to update exam approval status.");
    }
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          <span className="text-slate-400 text-sm font-medium">Loading Teacher Dashboard...</span>
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Teacher Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-blue-400 font-semibold">{teacherProfile?.full_name}</span> 
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
        {/* Notifications */}
        {actionError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Students</p>
              <p className="text-3xl font-black text-white mt-1">{studentCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Approved for Exams</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                {examStudentStatuses.filter((s) => s.isApproved).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Pending Approvals</p>
              <p className="text-3xl font-black text-amber-400 mt-1">
                {examStudentStatuses.filter((s) => !s.isApproved && s.completedLessons === s.totalLessons).length}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Exam Approvals & Student Progress */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span>Student Exam Approvals</span>
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Double-Lock Gatekeeper
            </span>
          </div>

          {examStudentStatuses.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl">
              <p className="text-xs text-slate-400 font-medium">No student lesson progress data found.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {examStudentStatuses.map((st) => {
                const isFullyComplete = st.completedLessons === st.totalLessons && st.totalLessons > 0;

                return (
                  <div
                    key={`${st.studentId}-${st.courseId}`}
                    className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-white">{st.studentName}</p>
                        <span className="text-xs text-slate-500">(@{st.username})</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Course: <span className="text-slate-200 font-medium">{st.courseTitle}</span>
                      </p>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-400">Progress:</span>
                        <span className={isFullyComplete ? "text-emerald-400 font-bold" : "text-amber-400 font-semibold"}>
                          {st.completedLessons} / {st.totalLessons} lessons completed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {st.isApproved ? (
                        <button
                          onClick={() => handleToggleExamApproval(st.studentId, st.courseId, true)}
                          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Approved (Click to Revoke)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleExamApproval(st.studentId, st.courseId, false)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                        >
                          <Award className="w-4 h-4" />
                          <span>Approve Exam Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Schedule Calendar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <span>Teacher Class Schedule & Calendar</span>
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
            <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{monthName} {year}</h3>
                <div className="flex items-center space-x-1">
                  <button onClick={handlePrevMonth} className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNextMonth} className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
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
                  const keyStr = `${year}-${currentMonth.getMonth()}-${dayNum}`;
                  const isToday = 
                    dayNum === new Date().getDate() && 
                    currentMonth.getMonth() === new Date().getMonth() && 
                    currentMonth.getFullYear() === new Date().getFullYear();

                  const isSelected = 
                    dayNum === selectedDate.getDate() && 
                    currentMonth.getMonth() === selectedDate.getMonth() && 
                    currentMonth.getFullYear() === selectedDate.getFullYear();

                  return (
                    <button
                      key={keyStr}
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
                      {isToday && !isSelected && <span className="w-1 h-1 bg-blue-400 rounded-full mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Date</h3>
                  <span className="text-xs font-bold text-amber-400">
                    {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-400">09:00 AM - 11:00 AM</span>
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px]">Class</span>
                    </div>
                    <p className="text-xs font-bold text-white">Discipleship 101 Session</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}