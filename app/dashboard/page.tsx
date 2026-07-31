import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile Fetch Error:", profileError.message);
    // If profile is missing or RLS blocks it, default or redirect to setup/error page
  }

  const role = profile?.role || "student";

  // 3. Role-based redirect
  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
    case "teacher":
    case "instructor":
      redirect("/dashboard/teacher");
    case "student":
    default:
      redirect("/dashboard/student");
  }
}