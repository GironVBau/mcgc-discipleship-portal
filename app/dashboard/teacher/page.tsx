"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users, 
  LogOut, 
  GraduationCap, 
  ChevronRight,
  Send,
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface SubmissionReview {
  id: string;
  student_name: string;
  course_title: string;
  lesson_title: string;
  submitted_at: string;
  essay_text: string;
  status: string;
}

export default function TeacherDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<{ full_name: string } | null>(null);

  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionReview | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [pendingReviews, setPendingReviews] = useState<SubmissionReview[]>([]);

  useEffect(() => {
    async function loadTeacherData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch Teacher Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        setTeacherProfile(profile);

        // Fetch Pending Essay/Activity Submissions awaiting Teacher Review (Step 8)
        const { data: reviews } = await supabase
          .from("essay_submissions")
          .select(`
            id,
            essay_text,
            created_at,
            status,
            profiles!essay_submissions_student_id_fkey (full_name),
            lessons (
              title,
              courses (title)
            )
          `)
          .eq("status", "pending_teacher_review")
          .order("created_at", { ascending: true });

        if (reviews) {
          const formattedReviews: SubmissionReview[] = reviews.map((item: any) => ({
            id: item.id,
            student_name: item.profiles?.full_name || "Unknown Student",
            course_title: item.lessons?.courses?.title || "Discipleship Course",
            lesson_title: item.lessons?.title || "Workbook Lesson",
            submitted_at: new Date(item.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            }),
            essay_text: item.essay_text,
            status: item.status
          }));
          setPendingReviews(formattedReviews);
        }
      }
      setLoading(false);
    }

    loadTeacherData();
  }, []);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSubmitting(true);

    // Update submission status to 'pending_admin_approval' (Transition from Step 8 -> Step 9)
    const { error } = await supabase
      .from("essay_submissions")
      .update({
        score: scoreInput,
        teacher_feedback: feedbackInput,
        status: "pending_admin_approval", // Passes control to Admin Workflow
        reviewed_at: new Date().toISOString()
      })
      .eq("id", selectedSubmission.id);

    if (!error) {
      setPendingReviews((prev) => prev.filter((item) => item.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setScoreInput("");
      setFeedbackInput("");
    } else {
      alert("Error submitting score: " + error.message);
    }

    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/teacher";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-emerald-400">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading Instructor Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/1080.png"
              alt="MCGC Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <span className="text-sm font-bold text-white tracking-wide block">
                MCGC Discipleship Portal
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <GraduationCap className="w-3 h-3 inline mr-1" />
                Instructor Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">
                {teacherProfile?.full_name || "Instructor"}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10 space-y-8 relative z-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Instructor Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Review student workbook submissions, evaluate essays, and submit scores for admin approval.
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending Reviews</p>
              <p className="text-xl font-bold text-amber-400">{pendingReviews.length} Submissions</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status</p>
              <p className="text-xl font-bold text-white">Step 8 Active</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Target Flow</p>
              <p className="text-xl font-bold text-white">Step 9 Hand-off</p>
            </div>
          </div>
        </div>

        {/* Interactive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pending Essay Submissions Queue (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Pending Essay & Activity Reviews</span>
              </h2>
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full">
                {pendingReviews.length} Remaining
              </span>
            </div>

            <div className="space-y-3">
              {pendingReviews.length > 0 ? (
                pendingReviews.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-slate-900/60 border rounded-2xl p-5 backdrop-blur-xl transition-all ${
                      selectedSubmission?.id === item.id 
                        ? "border-emerald-400/60 bg-slate-900/90 shadow-lg shadow-emerald-400/5" 
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div>
                        <p className="text-sm font-bold text-white">{item.student_name}</p>
                        <p className="text-xs text-amber-400 font-medium">{item.course_title}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Submitted: {item.submitted_at}</span>
                    </div>

                    <div className="py-3">
                      <p className="text-xs font-semibold text-slate-300 mb-1">{item.lesson_title}</p>
                      <p className="text-xs text-slate-400 line-clamp-3 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                        "{item.essay_text}"
                      </p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setSelectedSubmission(item);
                          setScoreInput("");
                          setFeedbackInput("");
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
                      >
                        <span>Review & Score Submission</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">All Caught Up!</p>
                  <p className="text-xs text-slate-400">There are no pending student activity or essay submissions to review right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Evaluation & Grading Panel (1/3 width) */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-5 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Grading Panel</span>
              </h3>

              {selectedSubmission ? (
                <form onSubmit={handleSubmitScore} className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Evaluating Student</p>
                    <p className="text-sm font-bold text-white">{selectedSubmission.student_name}</p>
                    <p className="text-xs text-slate-400">{selectedSubmission.lesson_title}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Score / Percentage (%)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 92%"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Teacher Comments / Feedback
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Provide encouraging feedback or areas for growth..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-500/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? "Submitting..." : "Submit Score to Admin"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Select a student submission from the queue to start evaluating and grading.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}