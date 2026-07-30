"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setErrorMessage(authError?.message || "Login failed. Please verify credentials.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setErrorMessage("Error retrieving user profile. Access denied.");
      setLoading(false);
      return;
    }

    if (profile.role !== "teacher" && profile.role !== "admin") {
      await supabase.auth.signOut();
      setErrorMessage("Access Denied: This portal is reserved for Teachers and Admins.");
      setLoading(false);
      return;
    }

    router.refresh();

    if (profile.role === "admin") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard/teacher");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Accent Lines */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3.5 py-1.5 rounded-full border border-blue-400/20">
            Staff & Leadership Portal
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight pt-2">Instructor Access</h1>
          <p className="text-sm text-slate-400">Sign in to manage classes and evaluate students</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
          <Link
            href="/login/student"
            className="py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all text-center flex items-center justify-center"
          >
            Student Portal
          </Link>
          <button className="py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 shadow-md transition-all">
            Staff / Teacher
          </button>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
          {errorMessage && (
            <div className="p-4 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-2xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@church.org"
                required
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Staff Portal →"}
            </button>
          </form>
        </div>

        {/* Return Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Home Page
          </Link>
        </div>

      </div>
    </div>
  );
}