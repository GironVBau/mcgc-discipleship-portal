import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );

  // 1. Verify Authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  // 2. Verify Role Authorization
  const role = user.user_metadata?.role;
  
  if (role !== "student") {
    return NextResponse.json({ error: "Forbidden: Only students can submit exams" }, { status: 403 });
  }

  // 3. Process request safely
  const body = await request.json();
  
  return NextResponse.json({ success: true, message: "Exam submitted safely" });
}