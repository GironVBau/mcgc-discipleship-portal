"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  AlertCircle 
} from "lucide-react";

export default function AdminDashboard() {
  const supabase = createClient();

  const [adminProfile, setAdminProfile] = useState<{
    full_name?: string;
    username?: string;
    role?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Stats Counters
  const [teacherCount, setTeacherCount] = useState<number | string>("--");
  const [studentCount, setStudentCount] = useState<number | string>("--");

  // Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "teacher" | "student">("teacher");
  
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        // Fetch admin profile details
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

        // Fetch counts for dashboard stats
        const { count: teachers } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .in("role", ["teacher", "instructor", "staff"]);

        const { count: students } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");

        setTeacherCount(teachers ?? 0);
        setStudentCount(students ?? 0);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      // 1. Sign up user via Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: newPassword,
        options: {
          data: {
            full_name: newFullName.trim(),
            username: newUsername.trim().toLowerCase(),
            role: newRole,
          },
        },
      });

      if (signUpError || !signUpData.user) {
        throw new Error(signUpError?.message || "Failed to create user account.");
      }

      // 2. Insert into profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: signUpData.user.id,
          full_name: newFullName.trim(),
          username: newUsername.trim().toLowerCase(),
          role: newRole,
        });

      if (profileError) {
        console.warn("Profile table upsert warning:", profileError.message);
      }

      setModalSuccess(`Successfully created ${newRole} account for ${newFullName}!`);
      
      // Reset Form
      setNewFullName("");
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("teacher");

      // Refresh Stats
      if (newRole === "student") {
        setStudentCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
      } else {
        setTeacherCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
      }

    } catch (err: any) {
      setModalError(err.message || "An unexpected error occurred.");
    } finally {
      setModalLoading(false);
    }
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
      
      {/* Top Header */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">System Status</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">Operational</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Actions Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Quick Management</span>
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setModalError(null);
                  setModalSuccess(null);
                  setIsAddUserOpen(true);
                }}
                className="w-full text-left px-5 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center justify-between transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-4 h-4" />
                  <span>➕ Add New User / Staff / Student</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Action</span>
              </button>

              <button className="w-full text-left px-5 py-4 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>📚 Manage Courses & Discipleship Classes</span>
                </div>
              </button>

              <button className="w-full text-left px-5 py-4 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-2xl font-semibold text-xs flex items-center justify-between transition-all">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>⚙️ System Permissions & Security Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Recent System Log</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium">Admin authenticated successfully</span>
                </div>
                <span className="text-slate-500 text-[10px]">Just now</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-slate-300 font-medium">Database profiles RLS active</span>
                </div>
                <span className="text-slate-500 text-[10px]">Today</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Close Button */}
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Provision New Account</h3>
              <p className="text-slate-400 text-xs mt-1">
                Create credentials for staff, instructors, or students
              </p>
            </div>

            {/* Banners */}
            {modalError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="johndoe@church.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="teacher">Teacher / Staff</option>
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {modalLoading ? "Provisioning User..." : "Create User Account"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}