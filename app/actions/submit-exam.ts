'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

    // 2. Security Check (Optional/Permissive Check)
    const { data: approval, error: approvalError } = await supabase
      .from('exam_approvals')
      .select('is_approved')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    // If your app requires explicit prior admin permission, keep this strict check.
    // If students are allowed to take exams upon finishing lessons, we check if approval exists or proceed.
    if (approvalError) {
      console.warn('Exam approval query warning:', approvalError);
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
          submission_text: essayText,
          essay_text: essayText,
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

    // --- 6. AUTOMATIC LEVEL UNLOCK & APPROVAL UPDATE ---
    if (passed) {
      // Upsert into exam_approvals to register permanent passed status
      await supabase
        .from('exam_approvals')
        .upsert(
          {
            user_id: user.id,
            course_id: course.id,
            is_approved: true,
            approved_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id' }
        );

      // Invalidate Next.js Server Caches so Level 2 automatically renders unlocked!
      revalidatePath('/dashboard/student');
      revalidatePath('/dashboard/admin');
      revalidatePath('/courses');
    }

    return {
      success: true,
      score: totalScore,
      percentage,
      passed,
      message: passed
        ? 'Congratulations! Exam passed and next level unlocked!'
        : 'Exam submitted successfully.',
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