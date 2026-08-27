"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Helper to verify teacher/admin authorization.
 */
async function verifyTeacherRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, error: "You must be logged in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    return { supabase, user, error: "Unauthorized operation." };
  }

  return { supabase, user, error: null };
}

/**
 * Approve or revoke a student's exam access for a specific course.
 */
export async function toggleExamApproval(
  studentId: string,
  courseId: string,
  approved: boolean
) {
  const { supabase, user, error } = await verifyTeacherRole();
  if (error || !user) return { success: false, error };

  const { error: upsertError } = await supabase
    .from("exam_approvals")
    .upsert(
      {
        user_id: studentId,
        course_id: courseId,
        is_approved: approved,
        approved_by: user.id,
        approved_at: approved ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,course_id" }
    );

  if (upsertError) return { success: false, error: upsertError.message };

  revalidatePath("/dashboard/teacher");
  return { success: true };
}

/**
 * Grant a retake to a student submission.
 */
export async function approveExamRetake(submissionId: string) {
  const { supabase, error } = await verifyTeacherRole();
  if (error) return { success: false, error };

  const { error: updateError } = await supabase
    .from("student_exam_submissions")
    .update({ retake_granted: true })
    .eq("id", submissionId);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/dashboard/teacher");
  return { success: true };
}

/**
 * Issue a certificate to a student.
 */
export async function issueStudentCertificate(
  studentId: string,
  courseId: string,
  courseTitle: string
) {
  const { supabase, user, error } = await verifyTeacherRole();
  if (error || !user) return { success: false, error };

  const certCode = `MCGC-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  const { error: certError } = await supabase
    .from("user_certificates")
    .upsert(
      {
        user_id: studentId,
        course_id: courseId,
        course_name: courseTitle,
        issued_at: new Date().toISOString(),
        issued_by: user.id,
        certificate_code: certCode,
      },
      { onConflict: "user_id,course_id" }
    );

  if (certError) return { success: false, error: certError.message };

  revalidatePath("/dashboard/teacher");
  return { success: true };
}

/**
 * Grade a student's essay and update both essay and exam submission tables.
 */
export async function gradeEssaySubmission({
  essayId,
  examSubmissionId,
  status,
  score,
  feedback,
}: {
  essayId: string;
  examSubmissionId?: string | null;
  status: string;
  score: number | null;
  feedback: string;
}) {
  const { supabase, user, error } = await verifyTeacherRole();
  if (error || !user) return { success: false, error };

  // 1. Update Essay Table
  const { error: essayError } = await supabase
    .from("user_essay_submissions")
    .update({
      status,
      score,
      feedback,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", essayId);

  if (essayError) return { success: false, error: essayError.message };

  // 2. Roll up status to Exam Submissions table if linked
  if (examSubmissionId) {
    const isPassed = status === "reviewed" || status === "passed";
    await supabase
      .from("student_exam_submissions")
      .update({
        status: isPassed ? "passed" : "rejected",
        passed: isPassed,
        feedback: feedback,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
      })
      .eq("id", examSubmissionId);
  }

  revalidatePath("/dashboard/teacher");
  return { success: true };
}