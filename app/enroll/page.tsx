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

  const supabase = createClient();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Combine name fields into a single formatted string for metadata
    const formattedFullName = `${formData.firstName} ${
      formData.middleName ? formData.middleName + " " : ""
    }${formData.surname}${formData.suffix ? " " + formData.suffix : ""}`;

    const { error } = await supabase.auth.signUp({
      email: formData.email,
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

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Enrollment successful! Please sign in to continue.");
    router.push("/login/student");
  };

  return (
    <div className="min-h-screen bg-[#1e2e68] flex flex-col justify-center items-center p-4 py-8">
      <div className="bg-white text-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#1e2e68]">
            Student Enrollment Form
          </h2>
          <p className="text-sm text-gray-500">
            Fill out your personal information to join the portal
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* --- FULL NAME BREAKDOWN --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  name="surname"
                  required
                  value={formData.surname}
                  onChange={handleChange}
                  placeholder="Surname (e.g. Dela Cruz)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name (e.g. Juan)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="middleName"
                  required
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Middle Name (e.g. Santos)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                  placeholder="Suffix (e.g. Jr., III) - Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
                />
              </div>
            </div>
          </div>

          {/* --- ADDRESS FIELD --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="House No., Street, Barangay, City, Province"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
            />
          </div>

          {/* --- CONTACT NUMBER --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912 345 6789"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
            />
          </div>

          {/* --- EMAIL --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
            />
          </div>

          {/* --- PASSWORD --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e2e68] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold py-3 rounded-md transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Submitting..." : "Submit Enrollment"}
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