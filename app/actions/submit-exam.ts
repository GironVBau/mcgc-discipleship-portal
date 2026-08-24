'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitFRAExam(
  studentAnswers: Record<string, string>,
  courseSlug: string = 'foundational-discipleship'
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Submit Error: User not authenticated', authError);
      return { success: false, error: 'User is not authenticated.' };
    }

    // Fetch course ID and title using the slug
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

    // Prevent duplicate active submissions
    const { data: existingSub } = await supabase
      .from('student_exam_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (existingSub) {
      return { success: true, redirectUrl: targetUrl };
    }

    // Fetch exam questions for grading
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('question_number, correct_answer, points')
      .eq('course_slug', courseSlug);

    let totalScore = 0;
    let totalPossiblePoints = 0;

    if (questions) {
      questions.forEach((q) => {
        if (q.correct_answer !== null) {
          const points = q.points ?? 1;
          totalPossiblePoints += points;
          const studentAns = studentAnswers[String(q.question_number)]?.trim().toLowerCase();
          const correctAns = q.correct_answer.trim().toLowerCase();
          if (studentAns && studentAns === correctAns) {
            totalScore += points;
          }
        }
      });
    }

    const percentage = totalPossiblePoints > 0 ? Number(((totalScore / totalPossiblePoints) * 100).toFixed(2)) : 0;
    const passed = percentage >= 85;
    const essayText = studentAnswers['essay'] || studentAnswers['6'] || '';

    // Insert into student_exam_submissions matching your database schema
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
      })
      .select('id')
      .single();

    if (subError) {
      console.error('SUPABASE INSERT FAILED:', subError);
      return { success: false, error: `Database Error: ${subError.message}` };
    }

    // --- AUTOMATIC CERTIFICATE ISSUANCE ---
    // If they passed the exam, automatically award their certificate
    if (passed) {
      try {
        // Check if certificate already exists to avoid duplicates
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

    // Optional essay log insertion wrapped in a safe try/catch block
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
      } catch (e) {
        // Safe fallback if table structure differs
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