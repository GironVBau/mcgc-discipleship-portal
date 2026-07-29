import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve current user session
  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Unauthenticated users trying to access dashboards
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    url.pathname = "/login/student";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch user role from metadata or profiles table
    const userRole = user.user_metadata?.role || "student";

    // RESTRICTION 1: Students cannot enter Teacher or Admin routes
    if (userRole === "student" && (pathname.startsWith("/dashboard/teacher") || pathname.startsWith("/admin"))) {
      url.pathname = "/dashboard/student";
      return NextResponse.redirect(url);
    }

    // RESTRICTION 2: Teachers cannot enter Admin-only routes
    if (userRole === "teacher" && pathname.startsWith("/admin")) {
      url.pathname = "/dashboard/teacher";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/enroll"],
};