"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Approve or revoke a student's exam access for a specific course.
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

/**
 * Grade a student's essay, pass the exam, and issue a course certificate.
 */
export async function gradeEssayAndIssueCertificate({
  submissionId,
  studentId,
  studentName,
  courseId,
  courseTitle,
  essayScore,
  feedback,
}: {
  submissionId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  essayScore: number;
  feedback: string;
}) {
  const supabase = await createClient();

  // 1. Authenticate user
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

  // 2. Role authorization check
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "Unable to verify your account status.",
    };
  }

  if (profile.role !== "teacher" && profile.role !== "admin") {
    return {
      success: false,
      error: "You are not authorized to grade essays or issue certificates.",
    };
  }

  // 3. Update the exam submission with the essay grade, feedback, and pass status
  const { error: updateError } = await supabase
    .from("student_exam_submissions")
    .update({
      essay_grade: essayScore,
      feedback: feedback,
      status: "passed",
      passed: true,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update grade: ${updateError.message}`,
    };
  }

  // 4. Update exam approval status so student retains completed access
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
      error: `Grade recorded, but approval update failed: ${approvalError.message}`,
    };
  }

  // 5. Generate a unique certificate code (e.g. MCGC-2026-X89A)
  const certCode = `MCGC-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  // 6. Insert certificate record for student's dashboard
  const { error: certError } = await supabase
    .from("user_certificates")
    .insert({
      user_id: studentId,
      course_id: courseId,
      course_title: courseTitle,
      student_name: studentName,
      issued_by: user.id,
      certificate_code: certCode,
    });

  if (certError) {
    return {
      success: false,
      error: `Grade saved, but certificate generation failed: ${certError.message}`,
    };
  }

  return {
    success: true,
    certificateCode: certCode,
  };
}