"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    // 1. Authenticate user credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setErrorMessage(authError?.message || "Login failed. Please check your credentials.");
      setLoading(false);
      return;
    }

    // 2. Fetch ground-truth role from the profiles table
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

    // 3. Security Gate: Strictly reject student accounts attempting staff sign-in
    if (profile.role !== "teacher" && profile.role !== "admin") {
      await supabase.auth.signOut();
      setErrorMessage("Access Denied: This portal is reserved for Teachers and Admins.");
      setLoading(false);
      return;
    }

    // 4. Refresh router state and redirect based on exact role
    router.refresh();

    if (profile.role === "admin") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard/teacher");
    }
  };

  return (
    <div className="min-h-screen bg-[#1e2e68] flex flex-col justify-center items-center p-4">
      <div className="bg-white text-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#1e2e68]">Staff & Teacher Portal</h2>
          <p className="text-sm text-gray-500">Sign in with your instructor or admin account</p>
        </div>

        {errorMessage && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleStaffLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e2e68] hover:bg-[#162350] text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In to Portal"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}