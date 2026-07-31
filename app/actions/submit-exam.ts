'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitFRAExam(
  studentAnswers: Record<string, string>,
  courseSlug: string = 'foundational-discipleship'
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'User is not authenticated. Please log in again.',
      };
    }

    // 1. Fetch target course ID
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', courseSlug)
      .maybeSingle();

    if (courseError || !course) {
      return {
        success: false,
        error: 'Target course not found for exam submission.',
      };
    }

    // 2. Strict Security Gate: Verify Teacher/Admin Approval in exam_approvals
    const { data: approval, error: approvalError } = await supabase
      .from('exam_approvals')
      .select('is_approved')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (approvalError || !approval?.is_approved) {
      return {
        success: false,
        error:
          'Exam submission rejected: You do not have active teacher or admin approval to take this exam.',
      };
    }

    // 3. Fetch answer key for the target course
    const { data: questions, error: qError } = await supabase
      .from('exam_questions')
      .select('question_number, correct_answer, points, part_number')
      .eq('course_slug', courseSlug);

    if (qError) {
      console.error('Error fetching exam questions:', qError);
      return {
        success: false,
        error: `Failed to fetch question data: ${qError.message}`,
      };
    }

    let totalScore = 0;
    let totalPossiblePoints = 0;

    if (questions) {
      questions.forEach((q) => {
        if (q.correct_answer !== null) {
          const points = q.points ?? 1;
          totalPossiblePoints += points;

          const studentAns = studentAnswers[String(q.question_number)]
            ?.trim()
            .toLowerCase();
          const correctAns = q.correct_answer.trim().toLowerCase();

          if (studentAns && studentAns === correctAns) {
            totalScore += points;
          }
        }
      });
    }

    const percentage =
      totalPossiblePoints > 0
        ? Math.round((totalScore / totalPossiblePoints) * 100)
        : 0;

    const passed = percentage >= 85;
    const essayText = studentAnswers['essay'] || studentAnswers['6'] || '';

    // 4. Record main exam submission
    const { data: examSub, error: subError } = await supabase
      .from('student_exam_submissions')
      .insert({
        user_id: user.id,
        course_slug: courseSlug,
        answers: studentAnswers,
        score: totalScore,
        percentage: percentage,
        passed: passed,
        status: essayText ? 'pending_essay_review' : 'graded',
      })
      .select('id')
      .single();

    if (subError) {
      console.error('Failed inserting into student_exam_submissions:', subError);
      return {
        success: false,
        error: `Database Insert Error (student_exam_submissions): ${subError.message} (${subError.details || subError.code})`,
      };
    }

    // 5. Queue essay submission for review (if essay exists)
    if (essayText) {
      const { error: essayError } = await supabase
        .from('user_essay_submissions')
        .insert({
          student_id: user.id,
          user_id: user.id,
          question_title: 'Practical Reflection / Essay',
          submission_text: essayText, // Matches the required NOT NULL column
          essay_text: essayText,      // Backup in case both columns exist
          exam_result_id: examSub?.id || null,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (essayError) {
        console.error('Failed inserting into user_essay_submissions:', essayError);
        return {
          success: false,
          error: `Database Insert Error (user_essay_submissions): ${essayError.message} (${essayError.details || essayError.code})`,
        };
      }
    }

    return {
      success: true,
      score: totalScore,
      percentage,
      passed,
      message: 'Exam submitted successfully!',
    };
  } catch (err: any) {
    console.error('Fatal exception in submitFRAExam:', err);
    return {
      success: false,
      error:
        err?.message ||
        'An unexpected server error occurred during exam submission.',
    };
  }
}