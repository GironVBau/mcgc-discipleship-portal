'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { submitFRAExam } from '@/app/actions/submit-exam';

const EXAM_DURATION_SECONDS = 90 * 60;

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

interface ExamClientProps {
  courseId: string;
  userId: string;
  courseSlug: string;
  courseTitle: string;
}

export default function ExamClient({
  courseId,
  userId,
  courseSlug,
  courseTitle,
}: ExamClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(EXAM_DURATION_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    async function loadQuestions() {
      const { data: questionData, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('course_slug', courseSlug)
        .order('question_number', { ascending: true });

      if (error) console.error('Error loading questions:', error);
      else if (questionData) setQuestions(questionData as QuestionItem[]);
      setLoading(false);
    }
    loadQuestions();
  }, [supabase, courseSlug]);

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting) executeSubmission(answersRef.current);
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

  const executeSubmission = async (answersToSubmit: Record<string, string>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const essayQuestions = questions.filter((q) => [5, 6].includes(q.part_number));
      let mainEssay = '';
      for (const eq of essayQuestions) {
        const val = answersToSubmit[String(eq.question_number)];
        if (val) { mainEssay = val; break; }
      }
      const finalPayload = { ...answersToSubmit, essay: mainEssay || answersToSubmit['essay'] || '' };
      const res = await submitFRAExam(finalPayload, courseSlug);

      if (!res?.success) throw new Error(res?.error || 'Submission failed');
      alert(`Exam Submitted Successfully!\nScore: ${res.score} points`);
      router.push('/courses');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-20">
      <div className="sticky top-0 z-50 bg-[#1e2e68] text-white px-6 py-3 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-sm">{courseTitle} Assessment</h1>
        <div className="bg-amber-400 text-slate-950 font-extrabold px-4 py-1 rounded-full text-sm">
          ⏳ {formatTime(timeLeft)}
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-sm space-y-2">
          <h2 className="text-xl font-black">Ministry of Christ&apos;s Great Commission Church Inc.</h2>
          <p className="text-xs opacity-60">Passing Score: 85% | Total Time: 90 Minutes</p>
        </div>

        {questions.map((q) => (
          <div key={q.id} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-start opacity-70 text-xs font-bold uppercase">
              <span>{q.part_title}</span>
              <span>{q.points} Points</span>
            </div>

            <p className="text-sm font-semibold">{q.question_number}. {q.question_text}</p>

            {/* Multiple Choice Section */}
            {q.part_number === 1 && q.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-2">
                {q.options.map((opt: any) => {
                  const val = typeof opt === 'string' ? opt : (opt.value ?? opt.id ?? opt);
                  const label = typeof opt === 'string' ? opt : (opt.label ?? opt.text ?? opt);
                  const isSelected = answers[String(q.question_number)] === String(val);

                  return (
                    <label 
                      key={String(val)} 
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-400 text-white' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <input 
                        type="radio" 
                        className="hidden" 
                        name={`q_${q.question_number}`}
                        value={String(val)} 
                        checked={isSelected} 
                        onChange={(e) => handleInputChange(q.question_number, e.target.value)} 
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            )}

            {/* Part 2: Modified True or False Section */}
            {q.part_number === 2 && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap gap-3">
                  {(q.options && q.options.length > 0 ? q.options : ['TRUE', 'FALSE']).map((opt: any) => {
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const isSelected = answers[String(q.question_number)] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleInputChange(q.question_number, val)}
                        className={`px-4 py-2 rounded-xl font-bold border transition-all text-sm ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
                
                {/* Conditional Correction Input for False answers */}
                {answers[String(q.question_number)] === 'FALSE' && (
                  <input
                    type="text"
                    placeholder="Correction: Write the word that makes this statement false..."
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => handleInputChange(`${q.question_number}_correction`, e.target.value)}
                    value={answers[`${q.question_number}_correction`] || ''}
                  />
                )}
              </div>
            )}

            {/* Inputs & Textareas */}
            {[3, 4, 5, 6].includes(q.part_number) && (
              <textarea
                rows={q.part_number > 4 ? 4 : 1}
                placeholder="Type your answer here..."
                value={answers[String(q.question_number)] || ''}
                onChange={(e) => handleInputChange(q.question_number, e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>
        ))}

        <button
          onClick={() => executeSubmission(answers)}
          disabled={isSubmitting}
          className="w-full bg-amber-400 text-slate-950 font-extrabold py-4 rounded-2xl transition-all hover:bg-amber-300 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </main>
    </div>
  );
}