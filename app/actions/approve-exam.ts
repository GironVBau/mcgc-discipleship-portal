'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveStudentForExam(studentUserId: string, courseSlug: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('exam_permissions')
    .update({ status: 'approved' })
    .eq('user_id', studentUserId)
    .eq('course_slug', courseSlug);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/teacher/dashboard`);
  revalidatePath(`/courses/${courseSlug}/exam`);
  return { success: true };
}