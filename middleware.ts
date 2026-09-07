import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. PUBLIC ROUTES IDENTIFICATION
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/enroll") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/public");

  // Create initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Initialize Supabase Client with standard Next.js Cookie handling
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
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              // Fixes Safari SameSite cookie restrictions in WebKit/Messenger
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            })
          );
        },
      },
    }
  );

  // 2. OPTIMIZATION: On public routes, do NOT block rendering with a network auth call
  // If the user visits / or /login, allow instant rendering
  if (isPublicRoute && !pathname.startsWith("/login")) {
    return response;
  }

  // Retrieve current user session only for protected routes or login redirection
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 3. UNAUTHENTICATED USER PROTECTION
  if (!user && !isPublicRoute) {
    url.pathname = "/login/student";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // 4. ROLE-BASED ACCESS CONTROL FOR AUTHENTICATED USERS
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};