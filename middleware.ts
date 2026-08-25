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
          // Update response cookies directly without re-instantiating response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 1. PUBLIC ROUTES
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/enroll") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("."); // Static assets

  // 2. UNAUTHENTICATED USER PROTECTION
  if (!user && !isPublicRoute) {
    url.pathname = "/login/student";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // 3. ROLE-BASED ACCESS CONTROL
  if (user) {
    const userRole = user.user_metadata?.role || "student";

    // RESTRICTION 1: Students cannot access Teacher or Admin routes
    if (
      userRole === "student" &&
      (pathname.startsWith("/dashboard/teacher") ||
        pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/admin"))
    ) {
      url.pathname = "/dashboard/student";
      return NextResponse.redirect(url);
    }

    // RESTRICTION 2: Teachers cannot access Admin routes
    // (Note: Admins are NOT restricted from /dashboard/teacher!)
    if (
      userRole === "teacher" &&
      (pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/admin"))
    ) {
      url.pathname = "/dashboard/teacher";
      return NextResponse.redirect(url);
    }

    // RESTRICTION 3: Teachers cannot access Courses or Lessons routes
    if (
      userRole === "teacher" &&
      (pathname.startsWith("/courses") || pathname.startsWith("/lessons"))
    ) {
      url.pathname = "/dashboard/teacher";
      return NextResponse.redirect(url);
    }

    // REDIRECT logged-in users away from auth/login pages
    if (pathname.startsWith("/login")) {
      switch (userRole) {
        case "admin":
          url.pathname = "/dashboard/admin";
          break;
        case "teacher":
          url.pathname = "/dashboard/teacher";
          break;
        case "student":
        default:
          url.pathname = "/dashboard/student";
          break;
      }
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};