import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();

  // Create server-side Supabase instance
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handled in middleware
          }
        },
      },
    }
  );

  // 1. Verify user authentication session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/staff");
  }

  // 2. Query database for user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 3. Kick out non-admin users
  if (profile?.role !== "admin") {
    redirect("/login/staff");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
            <p className="text-sm text-gray-500 mt-1">MCGC Discipleship Portal System Administration</p>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 font-semibold rounded-full text-xs">
            Superuser Access
          </span>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-gray-800">User & Role Management</h3>
            <p className="text-sm text-gray-500 mt-1">
              Promote staff members, update student accounts, and modify roles.
            </p>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-gray-800">Curriculum & Lessons</h3>
            <p className="text-sm text-gray-500 mt-1">
              Create, publish, and structure discipleship lesson modules.
            </p>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-gray-800">System Analytics</h3>
            <p className="text-sm text-gray-500 mt-1">
              Review active student enrollments and system activity logs.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}