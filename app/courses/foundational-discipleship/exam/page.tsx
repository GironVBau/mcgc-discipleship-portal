'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { submitFRAExam } from '@/app/actions/submit-exam';

const COURSE_SLUG = 'foundational-discipleship';
const EXAM_DURATION_SECONDS = 90 * 60; // 90 minutes

interface QuestionItem {
  id: number;
  course_slug: string;
  part_number: number;
  part_title: string;
  question_number: number;
  question_text: string;
  options: any[] | null;
  points: number;
  correct_answer: string | null;
}

export default function FoundationalExamPage() {
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(EXAM_DURATION_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Questions from Supabase
  useEffect(() => {
    async function loadQuestions() {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('course_slug', COURSE_SLUG)
        .order('question_number', { ascending: true });

      if (error) {
        console.error('Error loading questions:', error);
      } else if (data) {
        setQuestions(data as QuestionItem[]);
      }
      setLoading(false);
    }
    loadQuestions();
  }, []);

  // 90-Minute Timer with auto-submit
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitting]);

  const handleInputChange = (qNum: number | string, value: string) => {
    setAnswers((prev) => ({ ...prev, [String(qNum)]: value }));
  };

  // Direct invocation of submitFRAExam Server Action
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await submitFRAExam(answers, COURSE_SLUG);

      if (!res || !res.success) {
        alert(`Submission Error: ${res?.error || 'Unable to submit exam.'}`);
        return;
      }

      alert(
        `Exam Submitted Successfully!\n\n` +
          `Score: ${res.score}/100 (${res.percentage}%)\n` +
          `Status: ${res.passed ? 'PASSED' : 'PENDING ESSAY REVIEW'}`
      );

      router.push('/courses');
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(`Client Error: ${err?.message || 'Failed to submit exam.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Loading Assessment...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
     
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-50 bg-[#1e2e68] text-white px-6 py-3 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-sm sm:text-base">
          Foundational Readiness Assessment (FRA)
        </h1>
        <div className="bg-amber-400 text-slate-950 font-extrabold px-4 py-1 rounded-full text-sm">
          ⏳ Time Remaining: {formatTime(timeLeft)}
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
            Level 1 Course Assessment
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Ministry of Christ's Great Commission Church Inc.
          </h2>
          <p className="text-xs text-slate-500">
            Passing Score: 85% | Total Time: 90 Minutes | 100 Points
          </p>
        </div>

        {/* Dynamic Question List */}
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {q.part_title}
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                {q.points} {q.points === 1 ? 'Point' : 'Points'}
              </span>
            </div>

            {/* Rendered Question Text with Underlines / Formatting */}
            <p
              className="text-sm font-semibold text-slate-900 whitespace-pre-line [&>u]:underline [&>u]:decoration-2 [&>u]:underline-offset-4 [&>u]:font-bold [&>u]:text-[#1e2e68]"
              dangerouslySetInnerHTML={{
                __html: `${q.question_number}. ${q.question_text}`,
              }}
            />

            {/* Part 1: Multiple Choice Options */}
            {q.part_number === 1 && q.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-2">
                {q.options.map((opt: any) => {
                  const val =
                    typeof opt === 'string' ? opt[0] : opt.value || opt.id || '';
                  const label =
                    typeof opt === 'string' ? opt : opt.label || opt.text || '';

                  return (
                    <label
                      key={label}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        answers[String(q.question_number)] === val
                          ? 'border-[#1e2e68] bg-blue-50/50 font-bold text-[#1e2e68]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.question_number}`}
                        value={val}
                        checked={answers[String(q.question_number)] === val}
                        onChange={(e) =>
                          handleInputChange(q.question_number, e.target.value)
                        }
                        className="hidden"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            )}

            {/* Part 2: Two Statement Code Buttons */}
            {q.part_number === 2 && (
              <div className="flex gap-3 pt-2">
                {['A', 'B', 'C', 'D'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleInputChange(q.question_number, code)}
                    className={`w-10 h-10 rounded-xl font-bold border transition-all ${
                      answers[String(q.question_number)] === code
                        ? 'bg-[#1e2e68] text-white border-[#1e2e68]'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            {/* Parts 3, 4, 5: Single Text Input */}
            {[3, 4, 5].includes(q.part_number) && (
              <input
                type="text"
                placeholder="Type your answer here..."
                value={answers[String(q.question_number)] || ''}
                onChange={(e) =>
                  handleInputChange(q.question_number, e.target.value)
                }
                className="w-full border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e2e68]"
              />
            )}

            {/* Part 6: Textarea for Essays */}
            {q.part_number === 6 && (
              <textarea
                rows={4}
                placeholder="Type your comprehensive, biblically grounded answer..."
                value={answers[String(q.question_number)] || ''}
                onChange={(e) => {
                  handleInputChange(q.question_number, e.target.value);
                  // Keeps essay alias in sync if server expects 'essay'
                  handleInputChange('essay', e.target.value);
                }}
                className="w-full border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e2e68]"
              />
            )}
          </div>
        ))}

        {/* Submit Action Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-extrabold py-4 rounded-2xl shadow-lg transition-all text-base mt-6 disabled:opacity-60"
        >
          {isSubmitting
            ? 'Submitting Assessment...'
            : 'Submit Foundational Assessment →'}
        </button>
      </main>
    </div>
  );
}