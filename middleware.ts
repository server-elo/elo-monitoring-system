import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { EnhancedSecurityMiddleware } from "./lib/security/enhanced-middleware";
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
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Use the enhanced security middleware for comprehensive protection
  const securityResponse = await EnhancedSecurityMiddleware.handle(request);
  
  if (securityResponse) {
    return securityResponse;
  }

  // Fallback to basic middleware logic (should not reach here with enhanced middleware)
  return NextResponse.next();
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes - handle separately)
     * - static/ (static directory)
     * - public/ (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|static/|public/).*)",
  ],
};
