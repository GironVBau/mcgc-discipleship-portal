import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: Props) {
  const resolvedParams = await params
  const courseId = resolvedParams?.id

  if (!courseId) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-red-500 font-semibold">Invalid Course ID.</p>
        <Link href="/courses" className="text-blue-600 underline mt-4 inline-block font-medium">
          ← Back to Courses
        </Link>
      </div>
    )
  }

  // 1. Initialize Supabase Client
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 2. Verify Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 3. Fetch Course & Related Lessons
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      status,
      lessons (
        id,
        title,
        workbook_content
      )
    `)
    .eq('id', courseId)
    .single()

  // 4. Fetch Exam for this course
  const { data: exams, error: examError } = await supabase
    .from('exams')
    .select('id, title, course_id')
    .eq('course_id', courseId)

  // 🔍 DEBUG LOGS in terminal
  console.log('--- EXAM DEBUG ---')
  console.log('Course ID:', courseId)
  console.log('Exams found:', exams)
  console.log('Exam Error:', examError)
  console.log('------------------')

  if (error || !course) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-red-500 font-semibold">Course not found.</p>
        <p className="text-xs text-gray-500 mt-1">{error?.message}</p>
        <Link href="/courses" className="text-blue-600 underline mt-4 inline-block font-medium">
          ← Back to Courses List
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header Navigation */}
      <Link href="/courses" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1">
        ← Back to Courses List
      </Link>

      {/* Course Banner */}
      <div className="border-b border-gray-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full capitalize">
              {course.status}
            </span>
          </div>
          <p className="text-gray-600 mt-2 text-base">{course.description}</p>
        </div>

        {/* Take Exam Button */}
        {exams && exams.length > 0 && (
          <Link
            href={`/courses/${course.id}/exam/${exams[0].id}`}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition whitespace-nowrap text-center"
          >
            📝 Take Course Exam
          </Link>
        )}
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 h-fit">
          <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Lessons Overview</h2>
          <ul className="space-y-2">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson: any, index: number) => (
                <li key={lesson.id}>
                  <a
                    href={`#lesson-${lesson.id}`}
                    className="block p-3 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:border-blue-300 transition"
                  >
                    Lesson {index + 1}: {lesson.title}
                  </a>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No lessons available yet.</p>
            )}
          </ul>

          {exams && exams.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href={`/courses/${course.id}/exam/${exams[0].id}`}
                className="block text-center bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-semibold p-3 rounded-lg text-sm transition"
              >
                📝 Final Exam
              </Link>
            </div>
          )}
        </div>

        {/* Lesson Display */}
        <div className="md:col-span-2 space-y-8">
          {course.lessons && course.lessons.length > 0 ? (
            course.lessons.map((lesson: any, index: number) => (
              <div 
                key={lesson.id} 
                id={`lesson-${lesson.id}`} 
                className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm"
              >
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                  Lesson {index + 1}
                </span>
                <h2 className="text-2xl font-bold text-gray-800 mt-1 mb-4">{lesson.title}</h2>
                
                <div className="prose max-w-none text-gray-700 space-y-4 border-t border-gray-100 pt-4">
                  {lesson.workbook_content ? (
                    <p className="whitespace-pre-line leading-relaxed">{lesson.workbook_content}</p>
                  ) : (
                    <p className="text-gray-400 italic">No content uploaded for this lesson.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
              This course does not have any lessons assigned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}