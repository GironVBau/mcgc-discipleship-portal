"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// Validation rules
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PH_PHONE_REGEX = /^(09|\+639)\d{9}$/;
const DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "10minutemail.com",
  "trashmail.com",
];

export default function EnrollPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const cleanUsername = formData.username.trim().toLowerCase();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPhone = formData.phoneNumber.trim().replace(/\s+/g, "");
    const cleanPassword = formData.password;

    // Ensure all fields are filled out
    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanUsername ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanPassword
    ) {
      setErrorMessage("All fields are required. Please fill out every field.");
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@domain.com).");
      setLoading(false);
      return;
    }

    const emailDomain = cleanEmail.split("@")[1];
    if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
      setErrorMessage("Disposable/temporary email domains are not allowed.");
      setLoading(false);
      return;
    }

    if (!PH_PHONE_REGEX.test(cleanPhone)) {
      setErrorMessage("Please enter a valid PH mobile number (e.g. 09123456789 or +639123456789).");
      setLoading(false);
      return;
    }

    // Parallel DB checks for duplicate username or email
    const [profileRes, pendingRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id")
        .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`)
        .maybeSingle(),
      supabase
        .from("pending_enrollees")
        .select("id")
        .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`)
        .maybeSingle(),
    ]);

    if (profileRes.data || pendingRes.data) {
      setErrorMessage("This Username or Email is already registered or pending approval.");
      setLoading(false);
      return;
    }

    // Insert into pending_enrollees
    const { error: insertError } = await supabase.from("pending_enrollees").insert([
      {
        first_name: cleanFirstName,
        surname: cleanLastName,
        username: cleanUsername,
        email: cleanEmail,
        phone_number: cleanPhone,
        password_hash: cleanPassword,
      },
    ]);

    if (insertError) {
      if (insertError.code === "23505") {
        setErrorMessage("An application with this username or email is already pending approval.");
      } else {
        setErrorMessage(insertError.message || "Failed to submit request. Please try again.");
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden sf-text antialiased">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6 my-8">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <span className="sf-text text-[11px] font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20">
            MCGC Discipleship Portal
          </span>
          <h1 className="sf-display text-3xl font-bold text-white tracking-tight pt-2">
            Student Application
          </h1>
          <p className="sf-text text-sm text-slate-400 font-normal">
            Request account access to begin your discipleship modules
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                ⏳
              </div>
              <h2 className="sf-display text-xl font-bold text-white tracking-tight">
                Application Submitted!
              </h2>
              <p className="sf-text text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your registration request has been submitted to portal administrators. Once approved, you will be able to log in using your credentials.
              </p>
              <div className="pt-2">
                <Link
                  href="/login/student"
                  className="sf-text inline-block bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs transition-all"
                >
                  Return to Student Login →
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="sf-text p-4 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-2xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="firstName" className="sf-text text-xs font-medium text-slate-300">
                      First Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Juan"
                      required
                      className="sf-text w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="sf-text text-xs font-medium text-slate-300">
                      Last Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Dela Cruz"
                      required
                      className="sf-text w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label htmlFor="username" className="sf-text text-xs font-medium text-slate-300">
                    Desired Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value.toLowerCase().replace(/\s+/g, ""),
                      }))
                    }
                    placeholder="juandelacruz"
                    required
                    className="sf-text w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="sf-text text-xs font-medium text-slate-300">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan@example.com"
                    required
                    className="sf-text w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Mobile / Phone Number */}
                <div className="space-y-1.5">
                  <label htmlFor="phoneNumber" className="sf-text text-xs font-medium text-slate-300">
                    Mobile / Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value.replace(/[^0-9+]/g, ""),
                      }))
                    }
                    placeholder="09123456789"
                    maxLength={13}
                    required
                    className="sf-text w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="sf-text text-xs font-medium text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="sf-text w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="sf-text absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-start gap-3 my-2">
                  <div className="text-amber-400 text-base leading-none pt-0.5">🔒</div>
                  <p className="sf-text text-[11px] text-slate-300 leading-relaxed">
                    <span className="font-semibold text-amber-400">We value your privacy.</span> Your information is secured under the Philippine Data Privacy Act and will only be used for official church communications.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="sf-text w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-400/10 transition-all text-sm disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {loading ? "Submitting Application..." : "Submit Application →"}
                </button>
              </form>
            </>
          )}

          {/* Sign In Footer */}
          <div className="pt-2 text-center">
            <p className="sf-text text-xs text-slate-400">
              Already have an approved account?{" "}
              <Link href="/login/student" className="text-amber-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link href="/" className="sf-text text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}