import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExamForm from './ExamForm'

type Props = {
  params: Promise<{ id: string; examId: string }>
}

export default async function ExamPage({ params }: Props) {
  const resolvedParams = await params
  const { id: courseId, examId } = resolvedParams

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Exam Info
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, description')
    .eq('id', examId)
    .single()

  // Fetch Questions
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('id, question_text, question_type, options')
    .eq('exam_id', examId)
    .order('display_order', { ascending: true })

  if (!exam || !questions) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p className="text-red-500 font-semibold">Exam not found.</p>
        <Link href={`/courses/${courseId}`} className="text-blue-600 underline mt-4 inline-block">
          ← Back to Course
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href={`/courses/${courseId}`} className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Back to Course
      </Link>

      <div className="border-b border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
        {exam.description && <p className="text-gray-600 mt-2">{exam.description}</p>}
      </div>

      <ExamForm
        examId={exam.id}
        courseId={courseId}
        questions={questions}
        userId={user.id}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
        supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
      />
    </div>
  )
}