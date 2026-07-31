"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { approveEnrollee, rejectEnrollee, deleteStudent } from "./actions";
import { 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  UserPlus, 
  BookOpen, 
  Settings, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Check,
  UserX,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock
} from "lucide-react";

interface PendingEnrollee {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  created_at: string;
}

interface ActiveStudent {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  created_at?: string;
}

interface CourseItem {
  id: string;
  title: string;
  instructor: string;
  students_count: number;
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();

  const [adminProfile, setAdminProfile] = useState<{
    full_name?: string;
    username?: string;
    role?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Stats Counters
  const [teacherCount, setTeacherCount] = useState<number | string>("--");
  const [studentCount, setStudentCount] = useState<number | string>("--");

  // Lists State
  const [pendingRequests, setPendingRequests] = useState<PendingEnrollee[]>([]);
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Real-time Calendar & Clock State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modal States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "teacher" | "student">("teacher");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Manage Courses Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>([
    { id: "1", title: "Discipleship 101: Foundations", instructor: "Pending", students_count: 24 },
    { id: "2", title: "Leadership & Service", instructor: "Pending", students_count: 12 },
  ]);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseInstructor, setNewCourseInstructor] = useState("");

  // Security Settings Modal
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Real-time Live Clock Effect
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        // Fetch admin profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username, role")
          .eq("id", user.id)
          .maybeSingle();

        setAdminProfile({
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email || "Administrator",
          username: profile?.username || user.user_metadata?.username || "admin",
          role: profile?.role || user.user_metadata?.role || "admin",
        });

        // Fetch teacher count
        const { count: teachers } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .in("role", ["teacher", "instructor", "staff"]);

        // Fetch student count
        const { count: students } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");

        setTeacherCount(teachers ?? 0);
        setStudentCount(students ?? 0);

        // Fetch pending student enrollment requests
        const { data: pendingData } = await supabase
          .from("pending_enrollees")
          .select("*")
          .order("created_at", { ascending: false });

        setPendingRequests(pendingData || []);

        // Fetch active students list
        const { data: studentsData } = await supabase
          .from("profiles")
          .select("id, full_name, username, email, role, created_at")
          .eq("role", "student")
          .order("created_at", { ascending: false });

        setActiveStudents(studentsData || []);

      } catch (err) {
        console.error("Unexpected error loading admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/staff";
  };

  const handleApproveStudent = (requestId: string, studentName: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        await approveEnrollee(requestId);
        
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setStudentCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
        setActionSuccess(`Approved and activated account for ${studentName}!`);

        const { data: updatedStudents } = await supabase
          .from("profiles")
          .select("id, full_name, username, email, role, created_at")
          .eq("role", "student")
          .order("created_at", { ascending: false });

        setActiveStudents(updatedStudents || []);
      } catch (err: any) {
        setActionError(err.message || "Failed to activate student.");
      }
    });
  };

  const handleRejectStudent = (requestId: string) => {
    if (!confirm("Are you sure you want to reject and remove this application?")) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        await rejectEnrollee(requestId);
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setActionSuccess("Enrollment request rejected and removed.");
      } catch (err: any) {
        setActionError(err.message || "Failed to reject applicant.");
      }
    });
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${studentName}? This cannot be undone.`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        await deleteStudent(studentId);
        setActiveStudents((prev) => prev.filter((s) => s.id !== studentId));
        setStudentCount((prev) => (typeof prev === "number" && prev > 0 ? prev - 1 : 0));
        setActionSuccess(`Successfully deleted account for ${studentName}.`);
      } catch (err: any) {
        setActionError(err.message || "Failed to delete student account.");
      }
    });
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const newCourse: CourseItem = {
      id: Date.now().toString(),
      title: newCourseTitle.trim(),
      instructor: newCourseInstructor.trim() || "Unassigned",
      students_count: 0,
    };

    setCourses((prev) => [...prev, newCourse]);
    setNewCourseTitle("");
    setNewCourseInstructor("");
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
          <span className="text-slate-400 text-sm font-medium">Loading Admin Dashboard...</span>
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-blue-400 font-semibold">{adminProfile?.full_name}</span> 
            {adminProfile?.username && <span className="text-slate-500"> (@{adminProfile.username})</span>}
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
        {/* Global Notifications */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Teachers & Staff</p>
              <p className="text-3xl font-black text-white mt-1">{teacherCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Students</p>
              <p className="text-3xl font-black text-white mt-1">{studentCount}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Pending Enrollees</p>
              <p className="text-3xl font-black text-amber-400 mt-1">{pendingRequests.length}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">System Status</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">Operational</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Real-time Calendar & Clock */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <span>Portal Live Schedule & Calendar</span>
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

        {/* Pending Student Applications */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Pending Student Applications</span>
            </h2>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              {pendingRequests.length} Pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800/60 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">All clear! No pending student applications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const fullName = `${req.first_name} ${req.last_name}`;
                return (
                  <div key={req.id} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{fullName} <span className="text-xs text-slate-400">(@{req.username})</span></p>
                      <p className="text-xs text-slate-400">Email: {req.email} | Phone: {req.phone_number}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleApproveStudent(req.id, fullName)}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Activate</span>
                      </button>

                      <button
                        onClick={() => handleRejectStudent(req.id)}
                        disabled={isPending}
                        className="bg-rose-950/80 border border-rose-800/60 text-rose-300 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Quick Management</span>
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="w-full text-left px-5 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-4 h-4" />
                  <span>➕ Add New User / Staff / Student</span>
                </div>
              </button>

              <button 
                onClick={() => setIsCourseModalOpen(true)}
                className="w-full text-left px-5 py-4 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-2xl font-semibold text-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>📚 Manage Courses & Discipleship Classes</span>
                </div>
              </button>

              <button 
                onClick={() => setIsSecurityModalOpen(true)}
                className="w-full text-left px-5 py-4 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-2xl font-semibold text-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>🔒 Security Settings</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}