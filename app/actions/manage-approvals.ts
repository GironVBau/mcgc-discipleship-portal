'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleExamApproval(studentId: string, courseId: string, isApproved: boolean) {
  try {
    const supabase = await createClient();

    // Verify current user is Admin or Teacher
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
      return { success: false, error: 'Permission denied. Teacher/Admin role required.' };
    }

    // Upsert approval status (Insert if not exists, Update if exists)
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
      console.error('Error toggling approval:', error);
      return { success: false, error: error.message };
    }

    // Refresh pages so changes reflect immediately
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/teacher');
    revalidatePath(`/courses/[courseSlug]/exam`, 'page');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' };
  }
}