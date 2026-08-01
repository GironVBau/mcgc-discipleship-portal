'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleExamApproval(
  studentId: string,
  courseId: string,
  isApproved: boolean
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Use UPSERT so it creates a row if one doesn't exist, or updates if it does
  const { error } = await supabase
    .from('exam_approvals')
    .upsert(
      {
        user_id: studentId,
        course_id: courseId,
        is_approved: isApproved,
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );

  if (error) {
    console.error('Failed to update approval:', error);
    return { success: false, error: error.message };
  }

  // Clear cache for instant UI refresh across the app
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/courses');

  return { success: true };
}