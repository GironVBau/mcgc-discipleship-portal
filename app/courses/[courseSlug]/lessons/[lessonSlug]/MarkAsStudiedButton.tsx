'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MarkAsStudiedButtonProps {
  lessonId: string;
  courseSlug: string;
  initialIsStudied: boolean;
}

export default function MarkAsStudiedButton({
  lessonId,
  courseSlug,
  initialIsStudied,
}: MarkAsStudiedButtonProps) {
  const [isStudied, setIsStudied] = useState(initialIsStudied);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggleStudied = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in to track your progress.');
        setLoading(false);
        return;
      }

      const nextStatus = isStudied ? 'in_progress' : 'studied';

      // Upsert record into student_lesson_progress
      const { error } = await supabase.from('student_lesson_progress').upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      );

      if (error) throw error;

      setIsStudied(!isStudied);
      router.refresh(); // Refresh Server Components to update progress UI
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-6 border-t flex justify-end">
      <button
        onClick={handleToggleStudied}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-bold transition-all shadow-md flex items-center gap-2 ${
          isStudied
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span>Updating...</span>
        ) : isStudied ? (
          <>
            <span>✓</span>
            <span>Marked as Studied</span>
          </>
        ) : (
          <span>Mark as Studied</span>
        )}
      </button>
    </div>
  );
}