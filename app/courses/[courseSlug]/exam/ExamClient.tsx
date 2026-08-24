'use client';

import { useState, useEffect, useRef } from 'react';
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

const ExamClient = ({
  courseId,
  userId,
  courseSlug,
  courseTitle,
}: ExamClientProps) => {
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
      const essayQuestions = questions.filter((q) => q.part_title.toUpperCase().includes('ESSAY'));
      let mainEssay = '';
      for (const eq of essayQuestions) {
        const val = answersToSubmit[String(eq.question_number)];
        if (val) {
          mainEssay = val;
          break;
        }
      }
      const finalPayload = { ...answersToSubmit, essay: mainEssay || answersToSubmit['essay'] || '' };
      
      const res = await submitFRAExam(finalPayload, courseSlug);

      if (res && res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        alert("Submission Failed: " + (res?.error || "Unknown error from server"));
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(`Critical Error: ${err?.message || err}`);
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

        {questions.map((q) => {
          const isModifiedTrueFalse = q.part_title.toUpperCase().includes('MODIFIED TRUE OR FALSE');
          const isTwoStatement = q.part_title.toUpperCase().includes('TWO-STATEMENT');
          const isMultipleChoice = q.options && q.options.length > 0 && !isModifiedTrueFalse && !isTwoStatement;
          const isTextAreaOrInput = !isMultipleChoice && !isModifiedTrueFalse && !isTwoStatement;

          return (
            <div key={q.id} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex justify-between items-start opacity-70 text-xs font-bold uppercase">
                <span>{q.part_title}</span>
                <span>{q.points} {q.points === 1 ? 'Point' : 'Points'}</span>
              </div>

              <div className="text-sm font-semibold flex items-start gap-1.5">
                <span>{q.question_number}.</span>
                <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_text }} />
              </div>

              {isTwoStatement && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-xs space-y-1">
                    <p className="font-bold text-amber-300">Option Key Reference:</p>
                    <p>A - Both statements are TRUE.</p>
                    <p>B - Statement I is TRUE; Statement II is FALSE.</p>
                    <p>C - Statement I is FALSE; Statement II is TRUE.</p>
                    <p>D - Both statements are FALSE.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['A', 'B', 'C', 'D'].map((optCode) => {
                      const isSelected = answers[String(q.question_number)] === optCode;
                      return (
                        <button
                          key={optCode}
                          type="button"
                          onClick={() => handleInputChange(q.question_number, optCode)}
                          className={`py-2 rounded-xl font-bold border transition-all text-sm ${
                            isSelected
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {optCode}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isMultipleChoice && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-2">
                  {q.options.map((opt: any) => {
                    const cleanOpt = typeof opt === 'string' ? opt : String(opt);
                    const val = cleanOpt.charAt(0);
                    const isSelected = answers[String(q.question_number)] === val;

                    return (
                      <label 
                        key={cleanOpt} 
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
                          value={val} 
                          checked={isSelected} 
                          onChange={(e) => handleInputChange(q.question_number, e.target.value)} 
                        />
                        {cleanOpt}
                      </label>
                    );
                  })}
                </div>
              )}

              {isModifiedTrueFalse && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap gap-3">
                    {['TRUE', 'FALSE'].map((val) => {
                      const isSelected = answers[String(q.question_number)] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleInputChange(q.question_number, val)}
                          className={`px-6 py-2 rounded-xl font-bold border transition-all text-sm ${
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
                  
                  {answers[String(q.question_number)] === 'FALSE' && (
                    <input
                      type="text"
                      placeholder="Correction: Write the word or phrase that replaces the underlined term..."
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => handleInputChange(`${q.question_number}_correction`, e.target.value)}
                      value={answers[`${q.question_number}_correction`] || ''}
                    />
                  )}
                </div>
              )}

              {isTextAreaOrInput && (
                <textarea
                  rows={q.part_title.toUpperCase().includes('ESSAY') ? 4 : 1}
                  placeholder="Type your answer here..."
                  value={answers[String(q.question_number)] || ''}
                  onChange={(e) => handleInputChange(q.question_number, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            executeSubmission(answers);
          }}
          disabled={isSubmitting}
          className="w-full bg-amber-400 text-slate-950 font-extrabold py-4 rounded-2xl transition-all hover:bg-amber-300 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting Assessment...' : 'Submit Assessment'}
        </button>
      </main>
    </div>
  );
};

export default ExamClient;

export const dynamic = "force-dynamic";