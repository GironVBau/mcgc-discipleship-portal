export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";
import Link from "next/link";
import { Lock, Clock, ArrowLeft, BookOpen, ShieldAlert } from "lucide-react";

interface PageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function ExamPage({ params }: PageProps) {
  // 1. Get current course slug from URL
  const { courseSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Course Details
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", courseSlug)
    .single();

  if (!course) {
    redirect("/courses");
  }

  // 3. Verify Lesson Completion Progress
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

  // STEP 3A: Lock Screen - Lessons Not Finished
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
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs flex justify-between items-center">
            <span className="text-slate-400">Lesson Progress</span>
            <span className="text-amber-400 font-bold">
              {completedCount} / {lessonIds.length} Completed
            </span>
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

  // 4. Fetch or Register Exam Approval Row
  let { data: approval } = await supabase
    .from("exam_approvals")
    .select("is_approved")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  // If student finished lessons but no approval record exists yet, create one in 'pending' state
  if (!approval) {
    await supabase.from("exam_approvals").insert({
      user_id: user.id,
      course_id: course.id,
      is_approved: false,
    });
  }

  // STEP 4A: Lock Screen - Pending Teacher Approval
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
              Congratulations on completing all lessons! Your exam request has been logged and is pending approval from your teacher or administrator.
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-4 text-xs font-semibold">
            Status: Pending Teacher Review
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

  // 5. Approved -> Render Assessment Screen
  return (
    <ExamClient
      courseId={course.id}
      userId={user.id}
      courseSlug={courseSlug}
      courseTitle={course.title}
    />
  );
}