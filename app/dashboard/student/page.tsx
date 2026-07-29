"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BookOpen, Award, CheckCircle2, Clock, PlayCircle } from "lucide-react";

interface Enrollment {
  id: string;
  progress: number;
  status: string;
  course: {
    id: string;
    title: string;
    description: string;
  };
}

export default function StudentDashboard() {
  const [profileName, setProfileName] = useState("Student");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadStudentData() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch User Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          setProfileName(profile.full_name);
        }

        // Fetch Assigned Courses / Enrollments
        const { data: enrollmentData } = await supabase
          .from("enrollments")
          .select(`
            id,
            progress,
            status,
            courses (
              id,
              title,
              description
            )
          `)
          .eq("student_id", user.id);

        if (enrollmentData) {
          // Format response
          const formatted = enrollmentData.map((e: any) => ({
            id: e.id,
            progress: e.progress || 0,
            status: e.status || "In Progress",
            course: e.courses,
          }));
          setEnrollments(formatted);
        }
      }
      setLoading(false);
    }

    loadStudentData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-[#1e2e68] text-white px-8 py-5 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">MCGC Discipleship Portal</h1>
          <p className="text-xs text-blue-200">Student Dashboard</p>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Welcome, {profileName}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login/student";
            }}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {profileName}!
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Continue your discipleship journey and grow in your faith.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 text-[#1e2e68] px-4 py-2 rounded-lg text-sm font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>{enrollments.length} Assigned Course(s)</span>
          </div>
        </div>

        {/* Course Progress Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1e2e68]" /> Your Enrolled Courses
          </h3>

          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
              Loading your dashboard...
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
              No courses assigned yet. Please contact your administrator or church leader.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#1e2e68]">
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-gray-900">
                      {item.course?.title || "Discipleship Course"}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {item.course?.description ||
                        "Structured workbook lessons to strengthen your faith."}
                    </p>

                    {/* Progress Bar */}
                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-600">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#facc15] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                    <Link
                      href={`/courses/${item.course?.id}`}
                      className="w-full bg-[#1e2e68] hover:bg-[#162350] text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Continue Course</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Journey Step Reference / Guidance Banner */}
        <section className="bg-gradient-to-r from-[#1e2e68] to-[#2d3e7d] text-white p-6 rounded-xl shadow-md space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#facc15]" /> Steps to Complete Your Course
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/10 p-3 rounded-lg">
              <span className="font-bold text-[#facc15] block">1. Read Lessons</span>
              Study workbook modules
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <span className="font-bold text-[#facc15] block">2. Complete Activities</span>
              Submit workbook answers
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <span className="font-bold text-[#facc15] block">3. Final Exam</span>
              Take exam upon completing lessons
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <span className="font-bold text-[#facc15] block">4. Get Certified</span>
              Receive your official certificate
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}