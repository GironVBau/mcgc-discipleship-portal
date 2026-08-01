"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function StudentLoginForm() {
  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/courses";

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    let loginEmail = identifier.trim().toLowerCase();

    // 1. Look up email by username if input is not formatted as an email
    const isEmail = loginEmail.includes("@");
    if (!isEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", loginEmail)
        .maybeSingle();

      if (profile?.email) {
        loginEmail = profile.email;
      }
    }

    // 2. Check if user is pending admin approval before checking auth
    const { data: pendingUser } = await supabase
      .from("pending_enrollees")
      .select("id")
      .or(`email.eq.${loginEmail},username.eq.${loginEmail}`)
      .maybeSingle();

    if (pendingUser) {
      setErrorMessage(
        "Your enrollment request is pending approval by an administrator."
      );
      setLoading(false);
      return;
    }

    // 3. Authenticate user credentials
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

    if (authError || !authData.user) {
      setErrorMessage(
        authError?.message || "Invalid credentials. Please try again."
      );
      setLoading(false);
      return;
    }

    // 4. Verify role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role !== "student") {
      await supabase.auth.signOut();
      setErrorMessage(
        "Access Denied: This portal is for students only. Please use Staff Sign In."
      );
      setLoading(false);
      return;
    }

    router.refresh();
    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20">
            MCGC Discipleship Platform
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight pt-2">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-400">
            Sign in to continue your spiritual learning journey
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
          <button className="py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 shadow-md transition-all">
            Student Portal
          </button>
          <Link
            href="/login/staff"
            className="py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all text-center flex items-center justify-center"
          >
            Staff / Teacher
          </Link>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
          {errorMessage && (
            <div className="p-4 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-2xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleStudentLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="student_username or student@church.org"
                required
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-amber-400 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
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
              className="w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-400/10 transition-all text-sm disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Log In as Student →"}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400">
              Need an account?{" "}
              <Link
                href="/enroll"
                className="text-amber-400 font-bold hover:underline"
              >
                Enroll Now
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading login...
        </div>
      }
    >
      <StudentLoginForm />
    </Suspense>
  );
}