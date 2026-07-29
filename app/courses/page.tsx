import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function CoursesListPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Fetch courses ordered by created_at ascending (First course stays first)
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, description, status, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-red-500 font-semibold">Error loading courses.</p>
        <p className="text-xs text-gray-500 mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MCGC Discipleship Courses</h1>
          <p className="text-gray-600 text-sm mt-1">Select a course to view lessons and complete your workbook entries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course, index) => (
            <div 
              key={course.id} 
              className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Course {index + 1}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full capitalize">
                    {course.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
                <p className="text-gray-600 text-sm mt-2 line-clamp-3">{course.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={`/courses/${course.id}`}
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition"
                >
                  Start Course →
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No courses available at this time.</p>
          </div>
        )}
      </div>
    </div>
  )
}