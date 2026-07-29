"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (profile?.role !== "student") {
      await supabase.auth.signOut();
      alert("Access Denied: This portal is for students only. Please use Staff Sign In.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/student");
  };

  return (
    <div className="min-h-screen bg-[#1e2e68] flex flex-col justify-center items-center p-4">
      <div className="bg-white text-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#1e2e68]">Student Portal</h2>
          <p className="text-sm text-gray-500">Sign in to access your courses</p>
        </div>

        <form onSubmit={handleStudentLogin} className="space-y-4">
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
            className="w-full bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold py-2.5 rounded-md transition-colors"
          >
            {loading ? "Signing in..." : "Log In as Student"}
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