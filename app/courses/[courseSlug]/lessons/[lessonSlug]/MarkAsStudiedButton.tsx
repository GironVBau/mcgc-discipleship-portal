"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, Loader2, Award } from "lucide-react";

interface MarkAsStudiedButtonProps {
  lessonId: string;
  courseSlug: string;
  nextLessonSlug?: string | null;
  isLastLesson?: boolean;
  initialIsStudied?: boolean;
}

export default function MarkAsStudiedButton({
  lessonId,
  courseSlug,
  nextLessonSlug,
  isLastLesson = false,
  initialIsStudied = false,
}: MarkAsStudiedButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialIsStudied);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("user_lesson_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .maybeSingle();

        if (data?.completed !== undefined) {
          setIsCompleted(data.completed);
        }
      }
      setLoading(false);
    }

    checkStatus();
  }, [lessonId, supabase]);

  const handleToggleComplete = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please sign in to save your lesson progress.");
      setSaving(false);
      return;
    }

    const nextState = !isCompleted;

    // Direct UPSERT so database triggers (for admin/teacher counts) execute correctly
    const { error } = await supabase.from("user_lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: nextState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

    if (error) {
      console.error("Error updating lesson progress details:", error.message);
      alert(`Failed to update progress: ${error.message}`);
    } else {
      setIsCompleted(nextState);
      // Refresh current route to sync layout progress indicators and dashboards
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        <span>Loading status...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
      
      {/* Complete / Unmark Toggle Button */}
      <button
        onClick={handleToggleComplete}
        disabled={saving}
        className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border shadow-sm ${
          isCompleted
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600"
        }`}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        ) : isCompleted ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Completed (Click to undo)</span>
          </>
        ) : (
          <span>Mark as Studied</span>
        )}
      </button>

      {/* Navigation or Exam Action */}
      <div className="flex items-center justify-end">
        {isLastLesson || !nextLessonSlug ? (
          /* Final Lesson Action: Route to Exam */
          <Link
            href={`/courses/${courseSlug}/exam`}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md ${
              isCompleted
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/10"
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Finish & Go to Exam</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          /* Standard Next Lesson Action */
          <Link
            href={`/courses/${courseSlug}/lessons/${nextLessonSlug}`}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-400/10"
          >
            <span>Next Lesson</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

    </div>
  );
}