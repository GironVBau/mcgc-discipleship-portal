'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitFRAExam(studentAnswers: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Fetch answer keys for Foundational Discipleship
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('question_number, correct_answer, points, part_number')
    .eq('course_slug', 'foundational-discipleship'); // Updated slug

  let totalScore = 0;

  if (questions) {
    questions.forEach((q) => {
      // Auto-grade objective questions (Parts 1 to 5)
      if (q.part_number < 6) {
        const studentAns = studentAnswers[q.question_number]?.trim().toLowerCase();
        const correctAns = q.correct_answer?.trim().toLowerCase();

        if (studentAns && studentAns === correctAns) {
          totalScore += q.points;
        }
      }
    });
  }

  // Calculate percentage (out of 100)
  const percentage = (totalScore / 100) * 100;
  const passed = percentage >= 85; // 85% passing score requirement

  // Record submission in database
  const { error } = await supabase.from('student_exam_submissions').insert({
    user_id: user.id,
    course_slug: 'foundational-discipleship', // Updated slug
    answers: studentAnswers,
    score: totalScore,
    percentage: percentage,
    passed: passed,
    status: 'pending_essay_review',
  });

  if (error) throw new Error(error.message);

  return { success: true, score: totalScore, percentage, passed };
}