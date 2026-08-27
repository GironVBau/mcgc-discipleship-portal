import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";
import Link from "next/link";
import { Lock, Clock, ArrowLeft, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function ExamPage({ params }: PageProps) {
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

  // 1. CHECK LESSON COMPLETION FIRST
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", course.id);

  const { count: completedCount } = await supabase
    .from("lessons")
    .select("id, user_lesson_progress!inner(completed)", {
      count: "exact",
      head: true,
    })
    .eq("course_id", course.id)
    .eq("user_lesson_progress.user_id", user.id)
    .eq("user_lesson_progress.completed", true);

  const total = totalLessons ?? 0;
  const completed = completedCount ?? 0;
  const isAllLessonsCompleted = total > 0 && completed === total;

  if (!isAllLessonsCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Exam Locked</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You must complete all course lessons before unlocking the exam requirement.
            </p>
          </div>
          <Link
            href={`/courses/${courseSlug}`}
            className="inline-flex items-center justify-center space-x-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Continue Lessons</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. CHECK SUBMISSIONS & RETAKE PERMISSIONS
  const { data: latestSubmission } = await supabase
    .from("student_exam_submissions")
    .select("id, attempt_number, retake_granted")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSubmission && !latestSubmission.retake_granted) {
    redirect(`/courses/${courseSlug}/exam/success`);
  }

  // 3. CHECK EXAM APPROVAL ROW
  let { data: approval } = await supabase
    .from("exam_approvals")
    .select("is_approved")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!approval) {
    await supabase.from("exam_approvals").insert({
      user_id: user.id,
      course_id: course.id,
      is_approved: false,
    });
    approval = { is_approved: false };
  }

  // 4. PENDING TEACHER APPROVAL SCREEN
  if (!approval?.is_approved) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Awaiting Teacher Approval</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your exam request has been logged and is pending approval from your teacher to take the test.
            </p>
          </div>
          <Link
            href={`/courses/${courseSlug}`}
            className="inline-flex items-center justify-center space-x-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Course Overview</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ExamClient
      courseId={course.id}
      userId={user.id}
      courseSlug={courseSlug}
      courseTitle={course.title}
    />
  );
}

export const dynamic = "force-dynamic";