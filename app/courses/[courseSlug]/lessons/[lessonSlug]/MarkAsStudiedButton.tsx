"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, Loader2, Award, WifiOff } from "lucide-react";

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
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

  const STORAGE_KEY = `mcgc_offline_progress_${lessonId}`;

  // Helper to sync pending offline data to Supabase
  const syncOfflineQueue = async (userId: string) => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData && navigator.onLine) {
        const { completed, updatedAt } = JSON.parse(savedData);
        
        const { error } = await supabase.from("user_lesson_progress").upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            completed: completed,
            updated_at: updatedAt,
          },
          { onConflict: "user_id,lesson_id" }
        );

        if (!error) {
          localStorage.removeItem(STORAGE_KEY);
          setIsOfflineSaved(false);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Background sync failed:", err);
    }
  };

  useEffect(() => {
    async function checkStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if there is an unsynced offline state saved first
        const localSaved = localStorage.getItem(STORAGE_KEY);
        if (localSaved && !navigator.onLine) {
          const parsed = JSON.parse(localSaved);
          setIsCompleted(parsed.completed);
          setIsOfflineSaved(true);
          setLoading(false);
          return;
        }

        // If online, try syncing any past offline actions first
        if (navigator.onLine) {
          await syncOfflineQueue(user.id);
        }

        // Fetch from Supabase
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

    // Listen for when the browser comes back online
    const handleOnline = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await syncOfflineQueue(user.id);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
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
    const updatedAt = new Date().toISOString();

    // Check if user is offline
    if (!navigator.onLine) {
      // Save locally to localStorage queue
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completed: nextState, updatedAt })
      );
      setIsCompleted(nextState);
      setIsOfflineSaved(true);
      setSaving(false);
      return;
    }

    // Direct UPSERT online
    const { error } = await supabase.from("user_lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: nextState,
        updated_at: updatedAt,
      },
      { onConflict: "user_id,lesson_id" }
    );

    if (error) {
      console.error("Error updating lesson progress details:", error.message);
      alert(`Failed to update progress: ${error.message}`);
    } else {
      setIsCompleted(nextState);
      setIsOfflineSaved(false);
      // Clean up any old local cache if successful
      localStorage.removeItem(STORAGE_KEY);
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
    <div className="space-y-2">
      {/* Offline notification badge */}
      {isOfflineSaved && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/30 border border-amber-500/20 px-3 py-1.5 rounded-xl">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>You are offline. Progress saved locally and will auto-sync when connected.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        
        {/* Complete / Unmark Toggle Button */}
        <button
          onClick={handleToggleComplete}
          disabled={saving}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border shadow-sm cursor-pointer ${
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
    </div>
  );
}