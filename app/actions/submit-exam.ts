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
      console.error('Submit Error: User not authenticated', authError);
      return { success: false, error: 'User is not authenticated.' };
    }

    // 1. Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', courseSlug)
      .maybeSingle();

    if (courseError || !course) {
      console.error('Submit Error: Course not found', courseError);
      return { success: false, error: 'Target course not found.' };
    }

    const targetUrl = `/courses/${courseSlug}/exam/success`;

    // 2. Fetch latest submission to determine retake eligibility and attempt number
    const { data: latestSubmission } = await supabase
      .from('student_exam_submissions')
      .select('id, attempt_number, retake_granted')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextAttemptNumber = 1;

    if (latestSubmission) {
      if (!latestSubmission.retake_granted) {
        return {
          success: false,
          error:
            'You have already submitted this exam. A teacher must approve a retake before you can submit again.',
        };
      }
      nextAttemptNumber = (latestSubmission.attempt_number || 1) + 1;
    }

    // 3. Fetch questions for dynamic objective grading
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('question_number, part_title, correct_answer, points')
      .eq('course_slug', courseSlug);

    let totalScore = 0;
    let totalPossibleObjectivePoints = 0;
    let essayText = studentAnswers['essay'] || '';

    if (questions) {
      questions.forEach((q) => {
        const qNumStr = String(q.question_number);

        // Check if question is an essay/reflection and extract answer dynamically
        const isEssay = q.part_title?.toUpperCase().includes('ESSAY');
        if (isEssay && studentAnswers[qNumStr]) {
          essayText = studentAnswers[qNumStr];
        }

        // Grade objective questions only
        if (q.correct_answer !== null && q.correct_answer !== undefined) {
          const points = q.points ?? 1;
          totalPossibleObjectivePoints += points;

          const studentAns = studentAnswers[qNumStr]?.trim().toLowerCase();
          const correctAns = q.correct_answer.trim().toLowerCase();

          if (studentAns && studentAns === correctAns) {
            totalScore += points;
          }
        }
      });
    }

    const percentage =
      totalPossibleObjectivePoints > 0
        ? Number(((totalScore / totalPossibleObjectivePoints) * 100).toFixed(2))
        : 0;
    
    const passed = percentage >= 85;

    // 4. Save Submission
    const { data: examSub, error: subError } = await supabase
      .from('student_exam_submissions')
      .insert({
        user_id: user.id,
        course_id: course.id,
        answers: studentAnswers,
        score: totalScore,
        percentage: percentage,
        passed: passed,
        status: essayText ? 'pending_essay_review' : 'graded',
        attempt_number: nextAttemptNumber,
        retake_granted: false, // Reset retake flag on submission
      })
      .select('id')
      .single();

    if (subError) {
      console.error('SUPABASE INSERT FAILED:', subError);
      return { success: false, error: `Database Error: ${subError.message}` };
    }

    // 5. Issue Certificate automatically if passed
    if (passed) {
      try {
        const { data: existingCert } = await supabase
          .from('user_certificates')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_name', course.title)
          .maybeSingle();

        if (!existingCert) {
          await supabase.from('user_certificates').insert({
            user_id: user.id,
            course_name: course.title,
            issued_at: new Date().toISOString(),
          });
        }
      } catch (certErr) {
        console.error('Error auto-issuing certificate:', certErr);
      }
    }

    // 6. Record essay log entry if essay text is provided
    if (essayText) {
      try {
        await supabase.from('user_essay_submissions').insert({
          student_id: user.id,
          user_id: user.id,
          question_title: 'Practical Reflection / Essay',
          submission_text: essayText,
          essay_text: essayText,
          exam_result_id: examSub?.id || null,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });
      } catch (essayErr) {
        console.error('Non-blocking error logging essay:', essayErr);
      }
    }

    revalidatePath('/dashboard/student');
    revalidatePath(`/courses/${courseSlug}/exam`);

    return { success: true, redirectUrl: targetUrl };
  } catch (err: any) {
    console.error('Fatal exception in submitFRAExam:', err);
    return { success: false, error: err?.message || 'Unexpected error occurred.' };
  }
}