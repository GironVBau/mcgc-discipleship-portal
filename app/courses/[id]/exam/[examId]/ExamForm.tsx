'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
}

interface ExamProps {
  examId: string
  courseId: string
  questions: Question[]
  userId: string
  supabaseUrl: string
  supabaseKey: string
}

export default function ExamForm({ examId, courseId, questions, userId }: ExamProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleOptionChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          userId,
          answers,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Failed to submit exam. Please try again.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      alert('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-green-800 mb-2">Exam Submitted Successfully! 🎉</h2>
        <p className="text-green-700 mb-6">Your answers have been recorded for evaluation.</p>
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Return to Course
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {questions.map((q, index) => (
        <div key={q.id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase mb-1">Question {index + 1}</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{q.question_text}</h3>

          {q.question_type === 'multiple_choice' && q.options && (
            <div className="space-y-3">
              {q.options.map((option, optIdx) => (
                <label
                  key={optIdx}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    answers[q.id] === option
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => handleOptionChange(q.id, option)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                    required
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {q.question_type === 'essay' && (
            <textarea
              rows={5}
              value={answers[q.id] || ''}
              onChange={(e) => handleOptionChange(q.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              required
            />
          )}
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
    </form>
  )
}