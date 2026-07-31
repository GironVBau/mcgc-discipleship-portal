"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    let loginEmail = identifier.trim();

    // Check if user entered username instead of email
    const isEmail = loginEmail.includes("@");
    if (!isEmail) {
      const { data: profile, error: userLookupError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", loginEmail.toLowerCase())
        .maybeSingle();

      if (userLookupError || !profile?.email) {
        setErrorMessage("Invalid username or email. Account not found.");
        setLoading(false);
        return;
      }

      loginEmail = profile.email;
    }

    // 1. Authenticate user credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error || !data?.user) {
      setErrorMessage(error?.message || "Sign in failed. Please check your credentials.");
      setLoading(false);
      return;
    }

    // 2. Fetch user role from database profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setErrorMessage("Error retrieving user profile. Access denied.");
      setLoading(false);
      return;
    }

    // 3. Security Gate: Only allow students through this login
    if (profile.role !== "student") {
      await supabase.auth.signOut();
      setErrorMessage("Access Denied: Staff and Admin accounts must use the Staff Portal.");
      setLoading(false);
      return;
    }

    console.log("✅ Student login successful!");

    // 4. Refresh router state & redirect to student dashboard
    router.refresh();
    router.push("/dashboard/student");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-gray-900 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">
          MCGC Discipleship Portal
        </h1>

        <p className="mb-8 text-center text-gray-600">
          Student Portal — Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium"
            >
              Username or Email
            </label>

            <input
              id="identifier"
              type="text"
              placeholder="username or email@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}