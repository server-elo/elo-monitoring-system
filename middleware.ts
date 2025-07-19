import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { shouldAutoRedirect } from '@/lib/utils/redirects';
import { logger } from '@/lib/api/logger';

// Type definitions for protected routes
type ProtectedRouteConfig = {
  requireAuth: boolean;
  roles?: string[];
} & (
  | { isApi: true }
  | { redirectTo: string }
);

// Define protected routes and their requirements
const PROTECTED_ROUTES = {
  // Admin routes - require ADMIN role
  '/admin': {
    roles: ['ADMIN'],
    requireAuth: true,
    redirectTo: '/auth/login'
  },
  
  // Profile routes - require authentication
  '/profile': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Settings routes - require authentication
  '/settings': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Instructor routes - require INSTRUCTOR or ADMIN role
  '/instructor': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Mentor routes - require MENTOR, INSTRUCTOR, or ADMIN role
  '/mentor': {
    roles: ['MENTOR', 'INSTRUCTOR', 'ADMIN'],
    requireAuth: true,
    redirectTo: '/auth/login'
  },
  
  // Dashboard - require authentication
  '/dashboard': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Profile - require authentication
  '/profile': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Jobs - require authentication
  '/jobs': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Certificates - require authentication
  '/certificates': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },

  // Achievements - require authentication
  '/achievements': {
    requireAuth: true,
    redirectTo: '/auth/login'
  },
  
  // Course management - require INSTRUCTOR or ADMIN
  '/courses/create': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    requireAuth: true,
    redirectTo: '/auth/login'
  },
  '/courses/manage': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    requireAuth: true,
    redirectTo: '/auth/login'
  },
  
  // API routes protection
  '/api/admin': {
    roles: ['ADMIN'],
    requireAuth: true,
    isApi: true
  },
  '/api/instructor': {
    roles: ['INSTRUCTOR', 'ADMIN'],
    requireAuth: true,
    isApi: true
  },
  '/api/mentor': {
    roles: ['MENTOR', 'INSTRUCTOR', 'ADMIN'],
    requireAuth: true,
    isApi: true
  },
  '/api/user': {
    requireAuth: true,
    isApi: true
  }
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/about',
  '/contact',
  '/pricing',
  '/features',
  '/docs',
  '/blog',
  '/legal',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/health',
  '/api/public'
];

// Routes that should redirect authenticated users away
const AUTH_ROUTES = ['/auth', '/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check for automatic redirects before authentication
  const redirectPath = shouldAutoRedirect(pathname);
  if (redirectPath && redirectPath !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = redirectPath;

    // Use 301 redirect for permanent redirects
    return NextResponse.redirect(url, 301);
  }

  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token;
    const userRole = token?.role as string;

    // Check if route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );

    // Handle auth routes (redirect authenticated users)
    if (AUTH_ROUTES.includes(pathname) && isAuthenticated) {
      const returnUrl = request.nextUrl.searchParams.get('returnUrl');
      const redirectUrl = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Find matching protected route
    const protectedRoute = findProtectedRoute(pathname);
    
    if (!protectedRoute) {
      // Route not explicitly protected, allow access
      return NextResponse.next();
    }

    // Check authentication requirement
    if (protectedRoute.requireAuth && !isAuthenticated) {
      if ('isApi' in protectedRoute && protectedRoute.isApi) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'UNAUTHENTICATED'
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Redirect to auth with return URL
      const redirectTo = ('redirectTo' in protectedRoute ? protectedRoute.redirectTo : null) || '/auth';
      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(
        new URL(`${redirectTo}?returnUrl=${returnUrl}`, request.url)
      );
    }

    // Check role requirements
    if (protectedRoute.roles && protectedRoute.roles.length > 0) {
      if (!userRole || !protectedRoute.roles.includes(userRole)) {
        if ('isApi' in protectedRoute && protectedRoute.isApi) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
              required: protectedRoute.roles,
              current: userRole || 'none'
            }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // For web routes, let the client-side handle the error display
        // but add headers to indicate the issue
        const response = NextResponse.next();
        response.headers.set('X-Auth-Error', 'insufficient_permissions');
        response.headers.set('X-Required-Roles', protectedRoute.roles.join(','));
        response.headers.set('X-Current-Role', userRole || 'none');
        return response;
      }
    }

    // Add user info to headers for client-side use
    if (isAuthenticated && token) {
      const response = NextResponse.next();
      response.headers.set('X-User-Id', token.id as string || '');
      response.headers.set('X-User-Role', userRole || '');
      response.headers.set('X-User-Email', token.email || '');
      return response;
    }

    return NextResponse.next();

  } catch (error) {
    logger.error('Middleware error:', {}, error as Error);
    
    // In case of error, allow the request to proceed
    // The client-side protection will handle it
    return NextResponse.next();
  }
}

// Helper function to find matching protected route
function findProtectedRoute(pathname: string): ProtectedRouteConfig | null {
  // Check exact matches first
  if (PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES]) {
    return PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES];
  }

  // Check pattern matches (routes that start with the pattern)
  for (const [pattern, config] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(pattern + '/') || pathname === pattern) {
      return config;
    }
  }

  return null;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// Types for better TypeScript support
export interface RouteConfig {
  roles?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
  isApi?: boolean;
}

export interface MiddlewareContext {
  pathname: string;
  isAuthenticated: boolean;
  userRole?: string;
  token?: any;
}

// Helper function to check if user has required role
export function hasRequiredRole(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole || !requiredRoles.length) return false;
  
  // Role hierarchy: ADMIN > INSTRUCTOR > MENTOR > STUDENT
  const roleHierarchy: Record<string, number> = {
    STUDENT: 0,
    MENTOR: 1,
    INSTRUCTOR: 2,
    ADMIN: 3,
  };

  const userLevel = roleHierarchy[userRole] ?? 0;
  
  // Check if user has any of the required roles or higher
  return requiredRoles.some(role => {
    const requiredLevel = roleHierarchy[role] ?? 0;
    return userLevel >= requiredLevel;
  });
}

// Helper function to get route protection info
export function getRouteProtection(pathname: string): RouteConfig | null {
  return findProtectedRoute(pathname);
}

// Helper function to check if route is public
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Helper function to check if route is auth-related
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}
