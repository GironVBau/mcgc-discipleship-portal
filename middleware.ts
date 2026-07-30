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

  // 1. Define Public Routes (Anyone can access without logging in)
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/enroll") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("."); // Assets, favicons, images

  // 2. UNAUTHENTICATED USER LOCK
  // If the user is NOT logged in and tries to access ANY protected route
  if (!user && !isPublicRoute) {
    url.pathname = "/login/student";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // 3. AUTHENTICATED USER ROLE RESTRICTIONS
  if (user) {
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

// 4. Update matcher to run on protected areas while ignoring static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};