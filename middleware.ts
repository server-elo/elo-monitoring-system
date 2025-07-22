import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// Type definitions for protected routes
type ProtectedRouteConfig = {
  requireAuth: boolean;
  roles?: string[];
  redirectTo: string;
};
// Define protected routes and their requirements
const PROTECTED_ROUTES: Record<string, ProtectedRouteConfig> = {
  // Admin routes - require ADMIN role
  "/admin": {
    roles: ["ADMIN"],
    requireAuth: true,
    redirectTo: "/auth/login",
  },
  // Profile routes - require authentication
  "/profile": {
    requireAuth: true,
    redirectTo: "/auth/login",
  },
  // Settings routes - require authentication
  "/settings": {
    requireAuth: true,
    redirectTo: "/auth/login",
  },
  // Instructor routes - require INSTRUCTOR or ADMIN role
  "/instructor": {
    roles: ["INSTRUCTOR", "ADMIN"],
    requireAuth: true,
    redirectTo: "/auth/login",
  },
  // Mentor routes - require MENTOR, INSTRUCTOR, or ADMIN role
  "/mentor": {
    roles: ["MENTOR", "INSTRUCTOR", "ADMIN"],
    requireAuth: true,
    redirectTo: "/auth/login",
  },
  // Dashboard - require authentication
  "/dashboard": {
    requireAuth: true,
    redirectTo: "/auth/login",
  },
  // Jobs - require authentication (temporarily disabled for demo)
  // '/jobs': {
  //   requireAuth: true,
  //   redirectTo: '/auth/login'
  // },
  // Certificates - require authentication (temporarily disabled for demo)
  // '/certificates': {
  //   requireAuth: true,
  //   redirectTo: '/auth/login'
  // },
  // Achievements - require authentication (temporarily disabled for demo)
  // '/achievements': {
  //   requireAuth: true,
  //   redirectTo: '/auth/login'
  // },
  // Collaborate - require authentication (temporarily disabled for demo)
  // '/collaborate': {
  //   requireAuth: true,
  //   redirectTo: '/auth/login'
  // },
  // Code - require authentication (temporarily disabled for demo)
  // '/code': {
  //   requireAuth: true,
  //   redirectTo: '/auth/login'
  // }
};
// API routes that require authentication
const PROTECTED_API_ROUTES = [
  "/api/user",
  "/api/profile",
  "/api/settings",
  "/api/courses",
  "/api/lessons",
  "/api/achievements",
  "/api/certificates",
  "/api/jobs",
  "/api/projects",
  "/api/collaboration",
  "/api/community",
  "/api/feedback",
  "/api/contact",
  "/api/compile",
  "/api/deployments",
  "/api/ai/assistant",
  "/api/ai/enhanced-tutor",
  "/api/ai/security-analysis",
  "/api/ai/personalized-challenges",
  "/api/learning-paths",
  "/api/performance",
  "/api/leaderboard",
  "/api/chat",
  "/api/socket",
  "/api/upload",
];
// Admin-only API routes
const ADMIN_API_ROUTES = [
  "/api/admin",
  "/api/v1/admin",
  "/api/metrics",
  "/api/monitoring",
  "/api/errors",
  "/api/test-integration",
  "/api/test-llm",
  "/api/uat",
];
// Helper function to check if a path matches a protected route
function findProtectedRoute(pathname: string): ProtectedRouteConfig | null {
  // Check exact match first
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname];
  }
  // Check if the path starts with any protected route
  for (const route in PROTECTED_ROUTES) {
    if (pathname.startsWith(route)) {
      return PROTECTED_ROUTES[route];
    }
  }
  return null;
}
// Helper function to check if a path is a protected API route
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route: unknown) =>
    pathname.startsWith(route),
  );
}
// Helper function to check if a path is an admin API route
function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route: unknown) => pathname.startsWith(route));
}
export async function middleware(request: NextRequest): void {
  const { pathname } = request.nextUrl;
  // Skip auth check for public routes
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/api/auth",
    "/api/health",
    "/api/alive",
    "/api/ready",
    "/api/config/health",
    "/learn",
    "/tutorials",
    "/examples",
    "/documentation",
    "/privacy",
    "/terms",
    "/cookies",
    "/_next",
    "/favicon.ico",
    "/images",
    "/fonts",
    "/sounds",
  ];
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route: unknown) => pathname === route || pathname.startsWith(route + "/"),
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }
  try {
    // Get session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    // Check protected routes
    const protectedRoute = findProtectedRoute(pathname);
    // Handle protected page routes
    if (protectedRoute) {
      if (!token) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Check role requirements
      if (protectedRoute.roles && protectedRoute.roles.length > 0) {
        const userRole = token.role as string;
        if (!protectedRoute.roles.includes(userRole)) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      }
    }
    // Handle protected API routes
    if (pathname.startsWith("/api/")) {
      if (isProtectedApiRoute(pathname) || isAdminApiRoute(pathname)) {
        if (!token) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 },
          );
        }
        // Check admin routes
        if (isAdminApiRoute(pathname)) {
          const userRole = token.role as string;
          if (userRole !== "ADMIN") {
            return NextResponse.json(
              { error: "Admin access required" },
              { status: 403 },
            );
          }
        }
      }
    }
    // Add security headers
    const response = NextResponse.next();
    // Security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    // CORS headers for API routes
    if (pathname.startsWith("/api/")) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        process.env.NEXT_PUBLIC_APP_URL || "*",
      );
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
    }
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login for protected routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
