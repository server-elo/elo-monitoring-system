import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Comprehensive Security Headers Implementation
 * Following OWASP security best practices
 */

export interface SecurityConfig {
  contentSecurityPolicy: string;
  enableHSTS: boolean;
  enableNoSniff: boolean;
  enableXFrameOptions: boolean;
  enableXSSProtection: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
}

const DEFAULT_CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https: wss: ws:;
  media-src 'self' data: blob:;
  frame-src 'self' https:;
  child-src 'self' blob:;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  block-all-mixed-content;
`.replace(/\s+/g, ' ').trim();

export class SecurityHeadersManager {
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      contentSecurityPolicy: DEFAULT_CSP,
      enableHSTS: true,
      enableNoSniff: true,
      enableXFrameOptions: true,
      enableXSSProtection: true,
      enableReferrerPolicy: true,
      enablePermissionsPolicy: true,
      ...config,
    };
  }

  applyHeaders(response: NextResponse, request?: NextRequest): NextResponse {
    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      response.headers.set('Content-Security-Policy', this.config.contentSecurityPolicy);
    }

    // HTTP Strict Transport Security
    if (this.config.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // X-Content-Type-Options
    if (this.config.enableNoSniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (this.config.enableXFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY');
    }

    // X-XSS-Protection
    if (this.config.enableXSSProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    if (this.config.enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy
    if (this.config.enablePermissionsPolicy) {
      const permissionsPolicy = [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'bluetooth=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', ');
      
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    // Remove potentially dangerous headers
    response.headers.delete('Server');
    response.headers.delete('X-Powered-By');

    return response;
  }
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export class RateLimiter {
  private requests = new Map<string, Array<number>>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (validRequests.length >= this.config.maxRequests) {
      // Update the map with cleaned requests
      this.requests.set(identifier, validRequests);
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.config.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > cutoff);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }

  getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  getResetTime(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    if (userRequests.length === 0) return Date.now();
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.config.windowMs;
  }
}

// Input validation and sanitization
export class InputValidator {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>\"']/g, '') // Remove potential XSS characters
      .trim()
      .slice(0, 1000); // Limit length
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 255);
  }

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// Export instances
export const securityHeaders = new SecurityHeadersManager();

export const rateLimiters = {
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }),
  
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  }),
  
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }),
};

export default { securityHeaders, rateLimiters, InputValidator };