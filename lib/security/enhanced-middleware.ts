/**
 * Enhanced Security Middleware
 * Comprehensive security implementation for Next.js 15
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { corsManager } from "./cors-config";

// Security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-eval'", // Required for Monaco Editor
      "'unsafe-inline'", // Required for inline scripts (use with caution)
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://cdn.jsdelivr.net" // For CDN resources
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      "https://fonts.googleapis.com"
    ],
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com",
      "data:" // For base64 fonts
    ],
    "img-src": [
      "'self'",
      "data:",
      "https:",
      "blob:" // For generated images
    ],
    "connect-src": [
      "'self'",
      "https://api.github.com",
      "https://api.openai.com",
      "wss://localhost:*", // WebSocket connections
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ].filter(Boolean),
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"] // For web workers
  },

  // Security headers
  headers: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "speaker=()",
      "fullscreen=(self)"
    ].join(", "),
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site"
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // requests per window
    apiWindowMs: 1 * 60 * 1000, // 1 minute for API
    apiMaxRequests: 30, // API requests per minute
    authWindowMs: 5 * 60 * 1000, // 5 minutes for auth
    authMaxRequests: 5 // Auth attempts per 5 minutes
  }
};

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Enhanced security middleware with comprehensive protection
 */
export class EnhancedSecurityMiddleware {
  /**
   * Main middleware function
   */
  static async handle(request: NextRequest): Promise<NextResponse | undefined> {
    const { pathname, origin } = request.nextUrl;
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    try {
      // 1. Security validation
      const securityCheck = this.validateRequest(request, clientIP, userAgent);
      if (!securityCheck.valid) {
        return this.createSecurityResponse(securityCheck.reason, 403);
      }

      // 2. Rate limiting
      const rateLimitCheck = this.checkRateLimit(request, clientIP);
      if (!rateLimitCheck.allowed) {
        return this.createRateLimitResponse(rateLimitCheck.resetTime);
      }

      // 3. Authentication check
      const authResult = await this.handleAuthentication(request);
      if (authResult.response) {
        return authResult.response;
      }

      // 4. Create response with security headers
      const response = NextResponse.next();
      this.applySecurityHeaders(response, request);
      this.applyCorsHeaders(response, request);

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return this.createSecurityResponse('Internal security error', 500);
    }
  }

  /**
   * Validate request for security threats
   */
  private static validateRequest(
    request: NextRequest, 
    clientIP: string, 
    userAgent: string
  ): { valid: boolean; reason?: string } {
    // Check for suspicious patterns in URL
    const suspiciousPatterns = [
      /\.\./,           // Directory traversal
      /<script/i,       // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i,   // JavaScript protocol
      /data:/i,         // Data URI (in URL)
      /vbscript:/i,     // VBScript
      /onload=/i,       // Event handlers
      /onerror=/i,      // Error handlers
    ];

    const url = request.url;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        console.warn(`Suspicious request blocked from ${clientIP}: ${url}`);
        return { valid: false, reason: 'Suspicious request pattern detected' };
      }
    }

    // Check User-Agent for common attack patterns
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /masscan/i,
      /nmap/i,
      /dirb/i,
      /gobuster/i,
      /curl.*python/i
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        console.warn(`Suspicious User-Agent blocked from ${clientIP}: ${userAgent}`);
        return { valid: false, reason: 'Suspicious user agent detected' };
      }
    }

    // Check for excessively long headers (potential buffer overflow)
    for (const [name, value] of request.headers.entries()) {
      if (value && value.length > 8192) { // 8KB limit
        console.warn(`Oversized header blocked from ${clientIP}: ${name}`);
        return { valid: false, reason: 'Request header too large' };
      }
    }

    return { valid: true };
  }

  /**
   * Check rate limiting
   */
  private static checkRateLimit(
    request: NextRequest, 
    clientIP: string
  ): { allowed: boolean; resetTime?: number } {
    const { pathname } = request.nextUrl;
    const now = Date.now();

    // Determine rate limit configuration based on path
    let windowMs: number;
    let maxRequests: number;

    if (pathname.startsWith('/api/auth/')) {
      windowMs = SECURITY_CONFIG.rateLimit.authWindowMs;
      maxRequests = SECURITY_CONFIG.rateLimit.authMaxRequests;
    } else if (pathname.startsWith('/api/')) {
      windowMs = SECURITY_CONFIG.rateLimit.apiWindowMs;
      maxRequests = SECURITY_CONFIG.rateLimit.apiMaxRequests;
    } else {
      windowMs = SECURITY_CONFIG.rateLimit.windowMs;
      maxRequests = SECURITY_CONFIG.rateLimit.maxRequests;
    }

    const key = `${clientIP}:${pathname.split('/')[1] || 'root'}`;
    const record = rateLimitStore.get(key);
    const resetTime = now + windowMs;

    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, { count: 1, resetTime });
      return { allowed: true };
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      console.warn(`Rate limit exceeded for ${clientIP} on ${pathname}`);
      return { allowed: false, resetTime: record.resetTime };
    }

    // Increment counter
    record.count++;
    return { allowed: true };
  }

  /**
   * Handle authentication and authorization
   */
  private static async handleAuthentication(
    request: NextRequest
  ): Promise<{ response?: NextResponse }> {
    const { pathname } = request.nextUrl;

    // Skip auth check for public routes
    const publicRoutes = [
      '/',
      '/auth/',
      '/api/auth/',
      '/api/health',
      '/learn',
      '/tutorials',
      '/examples',
      '/_next/',
      '/favicon.ico',
      '/images/',
      '/fonts/',
    ];

    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    );

    if (isPublicRoute) {
      return {};
    }

    // Define protected routes
    const protectedRoutes = {
      '/admin': ['ADMIN'],
      '/profile': [],
      '/settings': [],
      '/dashboard': [],
      '/instructor': ['INSTRUCTOR', 'ADMIN'],
      '/mentor': ['MENTOR', 'INSTRUCTOR', 'ADMIN'],
    };

    // Check if route requires authentication
    const protectedRoute = Object.keys(protectedRoutes).find(route =>
      pathname.startsWith(route)
    );

    if (protectedRoute) {
      try {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('callbackUrl', pathname);
          return { response: NextResponse.redirect(loginUrl) };
        }

        // Check role requirements
        const requiredRoles = protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
        if (requiredRoles.length > 0) {
          const userRole = token.role as string;
          if (!requiredRoles.includes(userRole)) {
            return { response: NextResponse.redirect(new URL('/unauthorized', request.url)) };
          }
        }
      } catch (error) {
        console.error('Auth middleware error:', error);
        return { response: NextResponse.redirect(new URL('/auth/login', request.url)) };
      }
    }

    // Handle API routes
    if (pathname.startsWith('/api/')) {
      const protectedApiRoutes = [
        '/api/user',
        '/api/profile',
        '/api/settings',
        '/api/admin',
      ];

      const needsAuth = protectedApiRoutes.some(route => pathname.startsWith(route));
      
      if (needsAuth) {
        try {
          const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
          });

          if (!token) {
            return {
              response: NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
              )
            };
          }

          // Check admin routes
          if (pathname.startsWith('/api/admin/')) {
            const userRole = token.role as string;
            if (userRole !== 'ADMIN') {
              return {
                response: NextResponse.json(
                  { error: 'Admin access required' },
                  { status: 403 }
                )
              };
            }
          }
        } catch (error) {
          console.error('API auth error:', error);
          return {
            response: NextResponse.json(
              { error: 'Authentication error' },
              { status: 500 }
            )
          };
        }
      }
    }

    return {};
  }

  /**
   * Apply comprehensive security headers
   */
  private static applySecurityHeaders(response: NextResponse, request: NextRequest): void {
    // Apply basic security headers
    Object.entries(SECURITY_CONFIG.headers).forEach(([name, value]) => {
      response.headers.set(name, value);
    });

    // Generate and set CSP
    const csp = this.generateCSP(request);
    response.headers.set('Content-Security-Policy', csp);

    // Set additional security headers
    response.headers.set('X-Request-ID', this.generateRequestId());
    response.headers.set('X-Security-Version', '2.0');
    
    // Only set HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
      );
    }
  }

  /**
   * Apply CORS headers using secure CORS manager
   */
  private static applyCorsHeaders(response: NextResponse, request: NextRequest): void {
    const { pathname } = request.nextUrl;

    // Only apply CORS headers to API routes
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');
      const corsHeaders = corsManager.getCorsHeaders(origin);

      Object.entries(corsHeaders).forEach(([name, value]) => {
        response.headers.set(name, value);
      });

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const { allowed } = corsManager.handlePreflight(origin);
        if (!allowed) {
          response.headers.set('Access-Control-Allow-Origin', 'null');
        }
      }
    }
  }

  /**
   * Generate Content Security Policy
   */
  private static generateCSP(request: NextRequest): string {
    const { csp } = SECURITY_CONFIG;
    const nonce = this.generateNonce();

    // Add nonce to script-src
    const scriptSrc = [...csp["script-src"], `'nonce-${nonce}'`];

    const policies = [
      `default-src ${csp["default-src"].join(' ')}`,
      `script-src ${scriptSrc.join(' ')}`,
      `style-src ${csp["style-src"].join(' ')}`,
      `font-src ${csp["font-src"].join(' ')}`,
      `img-src ${csp["img-src"].join(' ')}`,
      `connect-src ${csp["connect-src"].join(' ')}`,
      `frame-ancestors ${csp["frame-ancestors"].join(' ')}`,
      `base-uri ${csp["base-uri"].join(' ')}`,
      `form-action ${csp["form-action"].join(' ')}`,
      `object-src ${csp["object-src"].join(' ')}`,
      `worker-src ${csp["worker-src"].join(' ')}`,
    ];

    return policies.join('; ');
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
    // Try various headers for real IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');

    if (cfIP) return cfIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();

    return 'unknown';
  }

  /**
   * Generate secure nonce
   */
  private static generateNonce(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  }

  /**
   * Generate request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create security response
   */
  private static createSecurityResponse(message: string, status: number): NextResponse {
    return NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status }
    );
  }

  /**
   * Create rate limit response
   */
  private static createRateLimitResponse(resetTime: number): NextResponse {
    const response = NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        resetTime: new Date(resetTime).toISOString()
      },
      { status: 429 }
    );

    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());

    return response;
  }

  /**
   * Clean up expired rate limit entries
   */
  static cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Cleanup rate limit store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    EnhancedSecurityMiddleware.cleanupRateLimitStore();
  }, 5 * 60 * 1000);
}