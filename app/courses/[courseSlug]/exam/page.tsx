export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";

interface PageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function ExamPage({ params }: PageProps) {
  // 1. Get the current course slug from the URL (e.g., 'fundamentals-foundation' or 'foundational-discipleship')
  const { courseSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Course ID automatically based on URL
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", courseSlug)
    .single();

  if (!course) {
    redirect("/courses");
  }

  // 3. Verify all lessons are completed
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
    redirect(`/courses/${courseSlug}`);
  }

  // 4. Verify teacher approval
  const { data: approval } = await supabase
    .from("exam_approvals")
    .select("is_approved")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!approval?.is_approved) {
    redirect(`/courses/${courseSlug}`);
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