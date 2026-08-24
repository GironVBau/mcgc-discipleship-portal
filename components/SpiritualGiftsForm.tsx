'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  statement: string;
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
  const [newlyCalculatedTopGifts, setNewlyCalculatedTopGifts] = useState<string[]>([]);
  
  // State to track active sparkles for buttons: key = `${questionId}-${value}`
  const [sparkles, setSparkles] = useState<Record<string, boolean>>({});

  // Handle rating radio selection with fairy sparkles!
  const handleSelect = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Trigger sparkle animation effect
    const sparkleKey = `${questionId}-${value}`;
    setSparkles((prev) => ({ ...prev, [sparkleKey]: true }));
    setTimeout(() => {
      setSparkles((prev) => ({ ...prev, [sparkleKey]: false }));
    }, 800);
  };

  // Submit assessment answers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      // Find all categories that match the highest score (handling ties)
      const entries = Object.entries(scoresByCategory);
      const maxScore = Math.max(...entries.map(([, score]) => score), 0);
      const topGiftsList = entries
        .filter(([, score]) => score === maxScore)
        .map(([gift]) => gift);

      setNewlyCalculatedTopGifts(topGiftsList);

      // Save or update scores in Supabase
      const payload = {
        user_id: user.id,
        scores: scoresByCategory,
        answers: answers,
        top_gifts: topGiftsList,
        completed_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('user_spiritual_gifts_results')
        .upsert(payload, { onConflict: 'user_id' });

      if (dbError) {
        console.error('Detailed Supabase Error:', JSON.stringify(dbError, null, 2));
        throw new Error(dbError.message || 'Failed to save results to database.');
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setError(err.message || 'An error occurred while saving your results.');
    } finally {
      setSubmitting(false);
    }
  };

  if (existingResult && !success) {
    const scores = existingResult.scores || {};
    const entries = Object.entries(scores);
    const maxScore = Math.max(...entries.map(([, score]) => (score as number)), 0);
    const topGiftsList = existingResult.top_gifts || entries.filter(([, score]) => score === maxScore).map(([gift]) => gift);

    return (
      <div className="bg-[#111827] rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Your Spiritual Gifts Profile</h2>
            <p className="text-slate-400 text-sm">Assessment completed on {new Date(existingResult.completed_at).toLocaleDateString()}</p>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-full">
            Completed
          </span>
        </div>

        {/* Primary Top Gifts Highlight Banner (handles ties) */}
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            {topGiftsList.length > 1 ? 'Top Tied Spiritual Gifts' : 'Primary Spiritual Gift'}
          </span>
          <div className="flex flex-wrap gap-2">
            {topGiftsList.map((gift: string) => (
              <span key={gift} className="text-2xl font-black text-white capitalize bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30">
                {gift} ({maxScore} pts)
              </span>
            ))}
          </div>
          <p className="text-slate-300 text-sm pt-1">
            These are your highest-scoring category/categories based on your responses, highlighting your unique design for ministry and service.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">All Gift Categories</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {entries.sort(([, a], [, b]) => (b as number) - (a as number)).map(([gift, score], index) => (
              <div
                key={gift}
                className={`p-4 rounded-2xl border ${
                  (score as number) === maxScore ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 capitalize">{gift}</span>
                  <span className="text-sm font-extrabold text-amber-400">{score as number} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => setSuccess(false)}
            className="text-sm text-amber-400 font-semibold hover:underline"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    const topGiftsList = newlyCalculatedTopGifts;

    return (
      <div className="bg-[#111827] rounded-3xl p-8 border border-slate-800 text-center space-y-6 text-slate-100 shadow-xl">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✨
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Survey Successfully Completed!</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Your spiritual gifts assessment scores have been saved.
          </p>
        </div>

        {/* Display Top Gifts upon completion with tie support */}
        <div className="max-w-lg mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            {topGiftsList.length > 1 ? 'Your Top Tied Spiritual Gifts' : 'Your Primary Spiritual Gift'}
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {topGiftsList.map((gift) => (
              <span key={gift} className="text-xl font-black text-amber-300 capitalize bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30">
                {gift}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-300 pt-1">
            You are well-prepared to advance to <strong className="text-white">Level 3: Ministry Readiness</strong> utilizing these core giftings!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fairySparkle {
          0% {
            transform: scale(0.8) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(1.4) translateY(-25px);
            opacity: 0;
          }
        }
        .animate-fairy {
          animation: fairySparkle 0.75s ease-out forwards;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <p className="text-slate-200 font-medium leading-snug">
                <span className="text-amber-400 font-bold mr-2">{idx + 1}.</span>
                {q.statement}
              </p>

              <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-2">
                {SCALE_OPTIONS.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  const sparkleKey = `${q.id}-${opt.value}`;
                  const isSparkling = sparkles[sparkleKey];

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(q.id, opt.value)}
                      className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10 scale-105'
                          : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      {isSparkling && (
                        <span className="absolute -top-3 pointer-events-none flex items-center justify-center w-full animate-fairy text-amber-300 text-sm drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]">
                          ✨ 🌟 ✨
                        </span>
                      )}

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
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Survey ✨'}
          </button>
        </div>
      </form>
    </>
  );
}