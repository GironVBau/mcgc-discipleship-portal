export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FoundationalExamPage from "./ExamClient";

export default async function ExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Course ID
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "foundational-discipleship")
    .single();

  if (!course) {
    redirect("/courses");
  }

  // 2. Verify all lessons are completed
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
  if (completedCount < lessonIds.length || lessonIds.length === 0) {
    redirect("/courses/foundational-discipleship");
  }

  // 3. Verify teacher approval
  const { data: approval } = await supabase
    .from("exam_approvals")
    .select("is_approved")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!approval?.is_approved) {
    redirect("/courses/foundational-discipleship");
  }

  return <FoundationalExamPage courseId={course.id} userId={user.id} />;
}