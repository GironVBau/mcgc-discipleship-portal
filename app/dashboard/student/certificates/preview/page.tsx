"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CertificateTemplate from "@/components/CertificateTemplate";
import { ArrowLeft, Printer, ShieldAlert } from "lucide-react";

export default function ViewCertificatePage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [loading, setLoading] = useState(true);
  const [hasPassed, setHasPassed] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [credentialId, setCredentialId] = useState("");

  useEffect(() => {
    async function loadCertificateData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // 1. Automatically fetch real student profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, username")
          .eq("id", user.id)
          .maybeSingle();

        const name = profile?.full_name || user.user_metadata?.full_name || user.email || "Student";
        setStudentName(name);

        // 2. Automatically fetch course title based on the URL courseId
        const { data: course } = await supabase
          .from("courses")
          .select("title")
          .eq("id", courseId)
          .maybeSingle();

        setCourseTitle(course?.title || "Discipleship Track");

        // 3. Automatically check if student passed exam & get submission date
        const { data: submission } = await supabase
          .from("student_exam_submissions")
          .select("passed, submitted_at, id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();

        if (submission && submission.passed) {
          setHasPassed(true);
          
          // Automatically format issue date
          const dateStr = submission.submitted_at 
            ? new Date(submission.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          
          setIssueDate(dateStr);
          
          // Automatically generate credential registry ID from database ID hash
          setCredentialId(`MCGC-${submission.id.slice(0, 8).toUpperCase()}`);
        } else {
          setHasPassed(false);
        }
      } catch (err) {
        console.error("Error loading certificate data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      loadCertificateData();
    }
  }, [supabase, courseId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="animate-pulse">Loading academic certificate...</p>
      </div>
    );
  }

  if (!hasPassed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Certificate Locked</h1>
        <p className="text-slate-400 max-w-md mb-6">
          You have not yet satisfied all requirements or passed the final examination for this academic level.
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center gap-8">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="w-full max-w-[1100px] flex justify-between items-center print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* Certificate Display Area */}
      <div className="w-full overflow-x-auto flex justify-center pb-8">
        <CertificateTemplate
          studentName={studentName}
          courseTitle={courseTitle}
          issueDate={issueDate}
          credentialId={credentialId}
          logoUrl="/1080.png"
        />
      </div>
    </div>
  );
}