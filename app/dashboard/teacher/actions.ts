"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Approve or revoke a student's exam access for a specific course.
 *
 * IMPORTANT:
 * This action should also be protected by Supabase RLS so that
 * only authenticated teachers/admins can modify exam_approvals.
 */
export async function toggleExamApproval(
  studentId: string,
  courseId: string,
  approved: boolean
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "Unable to verify your account.",
    };
  }

  if (profile.role !== "teacher" && profile.role !== "admin") {
    return {
      success: false,
      error: "You are not authorized to manage exam approvals.",
    };
  }

  const { error } = await supabase
    .from("exam_approvals")
    .upsert(
      {
        user_id: studentId,
        course_id: courseId,
        is_approved: approved,
        approved_by: user.id,
        approved_at: approved ? new Date().toISOString() : null,
      },
      {
        onConflict: "user_id,course_id",
      }
    );

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

/**
 * Update the grading/final status of a submitted exam.
 *
 * Teacher can:
 * - finalize an exam
 * - mark it passed
 * - mark it failed
 * - require a retake
 * - send it back for essay review
 */
export async function updateExamGrade(
  submissionId: string,
  courseId: string,
  studentId: string,
  status: string,
  passed: boolean
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "Unable to verify your account.",
    };
  }

  if (profile.role !== "teacher" && profile.role !== "admin") {
    return {
      success: false,
      error: "You are not authorized to grade exams.",
    };
  }

  const { error: submissionError } = await supabase
    .from("student_exam_submissions")
    .update({
      status,
      passed,
    })
    .eq("id", submissionId);

  if (submissionError) {
    return {
      success: false,
      error: submissionError.message,
    };
  }

  /*
   * If the student passed, record the course completion
   * in exam_approvals.
   */
  if (passed) {
    const { error: approvalError } = await supabase
      .from("exam_approvals")
      .upsert(
        {
          user_id: studentId,
          course_id: courseId,
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,course_id",
        }
      );

    if (approvalError) {
      return {
        success: false,
        error: approvalError.message,
      };
    }
  }

  return {
    success: true,
  };
}
