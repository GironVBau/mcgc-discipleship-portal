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
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", course.id);

  const lessonIds = lessons?.map((l) => l.id) || [];
  const { data: progress } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  const completedCount = progress?.length || 0;
  const isAllLessonsCompleted = lessonIds.length > 0 && completedCount === lessonIds.length;

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

  // 2. CHECK SUBMISSION: If they already submitted, redirect them to the success page!
  // This acts as the permanent lock so they cannot retake it.
  const { data: existingSubmission } = await supabase
    .from("student_exam_submissions") 
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (existingSubmission) {
    redirect(`/courses/${courseSlug}/exam/success`);
  }

  // 3. Check Exam Approval Row (Only checked if they haven't submitted yet)
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

  // 4. Pending teacher approval screen
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