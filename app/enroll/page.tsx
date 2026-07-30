"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentEnroll() {
  const [formData, setFormData] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    suffix: "",
    address: "",
    phone: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const nameParts = [
      formData.firstName,
      formData.middleName,
      formData.surname,
      formData.suffix,
    ].filter(Boolean);
    const formattedFullName = nameParts.join(" ");

    // 1. Auth Registration
    const { error: authError } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formattedFullName,
          surname: formData.surname,
          first_name: formData.firstName,
          middle_name: formData.middleName,
          suffix: formData.suffix,
          address: formData.address,
          phone: formData.phone,
          role: "student",
        },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("user already registered")) {
        setErrorMessage("An account with this email address already exists. Please sign in instead.");
      } else {
        setErrorMessage(authError.message);
      }
      setLoading(false);
      return;
    }

    // Redirect straight to login page after successful signup
    router.push("/login/student?registered=true");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      <div className="w-full max-w-xl relative z-10 bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Card Header */}
        <div className="bg-slate-900/80 border-b border-slate-800 p-6 sm:p-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20">
            Discipleship Portal
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight pt-3">
            Student Registration
          </h1>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl text-rose-400 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Juan"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Surname <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="surname"
                  required
                  value={formData.surname}
                  onChange={handleChange}
                  placeholder="e.g. Dela Cruz"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
              Account Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 mt-4"
          >
            {loading ? "Registering..." : "Complete Registration →"}
          </button>
        </form>

        <div className="bg-slate-900/80 border-t border-slate-800 p-4 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{" "}
            <Link href="/login/student" className="font-bold text-amber-400 hover:underline">
              Sign in to your student portal
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}