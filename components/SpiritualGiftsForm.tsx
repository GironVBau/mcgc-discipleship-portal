'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question_text: string;
  category: string;
}

interface SpiritualGiftsFormProps {
  questions: Question[];
  existingResult: any;
}

const SCALE_OPTIONS = [
  { value: 1, label: 'Almost Never' },
  { value: 2, label: 'Seldom' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Frequently' },
  { value: 5, label: 'Almost Always' },
];

export default function SpiritualGiftsForm({ questions, existingResult }: SpiritualGiftsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle rating radio selection
  const handleSelect = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit assessment answers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ensure all questions are answered
    if (Object.keys(answers).length < questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Authentication session lost. Please log in again.');
        setSubmitting(false);
        return;
      }

      // Tally totals by category/gift
      const scoresByCategory: Record<string, number> = {};

      questions.forEach((q) => {
        const score = answers[q.id] || 0;
        const category = q.category || 'General';
        scoresByCategory[category] = (scoresByCategory[category] || 0) + score;
      });

      // Save or update scores in Supabase
      const payload = {
        user_id: user.id,
        scores: scoresByCategory,
        answers: answers,
        completed_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('user_spiritual_gifts_results')
        .upsert(payload, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setError(err.message || 'An error occurred while saving your results.');
    } finally {
      setSubmitting(false);
    }
  };

  // View Existing Results if survey was already completed
  if (existingResult && !success) {
    const scores = existingResult.scores || {};
    const sortedGifts = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));

    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Spiritual Gifts Profile</h2>
            <p className="text-slate-500 text-sm">Assessment completed on {new Date(existingResult.completed_at).toLocaleDateString()}</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            Completed
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Top Gift Categories</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedGifts.map(([gift, score], index) => (
              <div
                key={gift}
                className={`p-4 rounded-2xl border ${
                  index < 3 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800 capitalize">{gift}</span>
                  <span className="text-sm font-extrabold text-[#1e2e68]">{score as number} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => setSuccess(false)}
            className="text-sm text-[#1e2e68] font-semibold hover:underline"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  // Submission Success State
  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Survey Completed!</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Your spiritual gifts assessment scores have been saved. You are now prepared to advance to <strong>Level 3: Ministry Readiness</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <p className="text-slate-800 font-medium leading-snug">
              <span className="text-[#1e2e68] font-bold mr-2">{idx + 1}.</span>
              {q.question_text}
            </p>

            <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-2">
              {SCALE_OPTIONS.map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(q.id, opt.value)}
                    className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#1e2e68] text-white border-[#1e2e68] shadow-md scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{opt.value}</span>
                    <span className="hidden sm:inline text-[10px] font-normal opacity-80 mt-1">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#1e2e68] hover:bg-[#162350] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Survey'}
        </button>
      </div>
    </form>
  );
}