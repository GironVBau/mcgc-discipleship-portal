import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trophy, Sparkles, Award } from "lucide-react";

interface SuccessPageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function ExamSuccessPage({ params }: SuccessPageProps) {
  const { courseSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", courseSlug)
    .single();

  if (!course) {
    redirect("/courses");
  }

  // Fetch the latest submission safely using order and maybeSingle to prevent crashes
  const { data: submission } = await supabase
    .from("student_exam_submissions")
    .select("score, percentage, passed, submitted_at, answers")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .order("submitted_at", { ascending: false })
    .maybeSingle();

  if (!submission) {
    redirect(`/courses/${courseSlug}/exam`);
  }

  const scoreNum = submission.score ?? 0;
  const percentageNum = submission.percentage ?? 0;
  const isPassed = submission.passed ?? percentageNum >= 85;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative z-10">
        
        {/* Church Logo / Branding */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center p-2 shadow-inner">
            <Image 
              src="/1080.png" 
              alt="MCGC Logo" 
              width={80} 
              height={80} 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[10px] tracking-widest uppercase text-slate-400 font-extrabold">
            MCGC Discipleship System
          </span>
        </div>

        {/* Celebration Header Icon */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 bg-amber-400/20 rounded-2xl animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assessment Successfully Completed</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fantastic Job!</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your objective answers have been evaluated successfully. Your responses are recorded for your records.
          </p>
        </div>

        {/* Big Score Celebration Card */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-inner">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total Objective Score
          </div>

          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-5xl font-black text-amber-400 tracking-tight">
              {scoreNum}
            </span>
            <span className="text-xl font-bold text-slate-500">Points</span>
          </div>

          {/* Percentage Pill */}
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 font-extrabold text-sm">
            {percentageNum}% Overall Score
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-left text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Passing Mark</span>
              <span className="text-slate-200 font-bold">85% Required</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Status</span>
              <span className={isPassed ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {isPassed ? "Passed Target ✓" : "Pending Review"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start space-x-3 text-left">
          <Award className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Screenshot Tip:</strong> Please take a photo or screenshot of this page now for your personal records before returning.
          </p>
        </div>

        <Link
          href={`/courses`}
          className="inline-flex items-center justify-center space-x-2 w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-amber-400/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Courses</span>
        </Link>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";