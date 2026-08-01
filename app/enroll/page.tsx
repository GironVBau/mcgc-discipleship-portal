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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
    const cleanPassword = password.trim();

    // STRICT CHECK: Ensure ALL fields have content
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

    // 1. Minimum password length check
    if (cleanPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    // 2. Valid Email Format Check
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@domain.com).");
      setLoading(false);
      return;
    }

    // 3. Disposable Email Filter
    const emailDomain = cleanEmail.split("@")[1];
    if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
      setErrorMessage("Disposable/temporary email domains are not allowed.");
      setLoading(false);
      return;
    }

    // 4. Philippine Phone Format Check
    if (!PH_PHONE_REGEX.test(cleanPhone)) {
      setErrorMessage("Please enter a valid PH mobile number (e.g. 09123456789 or +639123456789).");
      setLoading(false);
      return;
    }

    // 5. Check if username or email exists in active profiles OR pending table
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`)
      .maybeSingle();

    const { data: existingPending } = await supabase
      .from("pending_enrollees")
      .select("id")
      .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`)
      .maybeSingle();

    if (existingProfile || existingPending) {
      setErrorMessage("This Username or Email is already registered or pending approval.");
      setLoading(false);
      return;
    }

    // 6. Insert application record into pending_enrollees
    const { error: insertError } = await supabase.from("pending_enrollees").insert([
      {
        first_name: cleanFirstName,
        surname: cleanLastName, // 👈 Matched with SQL table schema ('surname')
        username: cleanUsername,
        email: cleanEmail,
        phone_number: cleanPhone, // 👈 Matched with SQL table schema ('phone_number')
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6 my-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20">
            MCGC Discipleship Portal
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight pt-2">Student Application</h1>
          <p className="text-sm text-slate-400">Request account access to begin your discipleship modules</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                ⏳
              </div>
              <h2 className="text-xl font-bold text-white">Application Submitted!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your registration request has been submitted to portal administrators. Once approved, you will be able to log in using your credentials.
              </p>
              <div className="pt-2">
                <Link
                  href="/login/student"
                  className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition-all"
                >
                  Return to Student Login →
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-4 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-2xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      First Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Last Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dela Cruz"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Desired Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="juandelacruz"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@example.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Mobile / Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ""))}
                    placeholder="09123456789"
                    maxLength={13}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
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

                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-start gap-3 my-2">
                  <div className="text-amber-400 text-base leading-none pt-0.5">🔒</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <span className="font-semibold text-amber-400">We value your privacy.</span> Your information is secured under the Philippine Data Privacy Act and will only be used for official church communications. We never sell or share your data.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-400/10 transition-all text-sm disabled:opacity-50 mt-2"
                >
                  {loading ? "Submitting Application..." : "Submit Application →"}
                </button>
              </form>
            </>
          )}

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400">
              Already have an approved account?{" "}
              <Link href="/login/student" className="text-amber-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}