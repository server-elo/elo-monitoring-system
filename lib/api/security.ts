/**
 * Security middleware and utilities for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders, errorResponse, generateRequestId } from './utils';
import { ApiErrorCode, HttpStatus } from './types';

// Security configuration
export interface SecurityConfig {
  cors: {
    origins: string[];
    methods: string[];
    headers: string[];
    credentials: boolean;
    maxAge: number;
  };
  headers: {
    contentSecurityPolicy?: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
    permissionsPolicy?: string;
    strictTransportSecurity?: string;
  };
  requestLimits: {
    maxBodySize: number; // in bytes
    maxUrlLength: number;
    maxHeaderSize: number;
    timeout: number; // in milliseconds
  };
  validation: {
    allowedContentTypes: string[];
    requireContentType: boolean;
    validateOrigin: boolean;
    validateReferer: boolean;
  };
}

// Default security configuration
const defaultSecurityConfig: SecurityConfig = {
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-User-ID',
      'X-Session-ID'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  headers: {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' 
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
      : undefined,
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
    strictTransportSecurity: process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload'
      : undefined
  },
  requestLimits: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    maxUrlLength: 2048,
    maxHeaderSize: 8192,
    timeout: 30000 // 30 seconds
  },
  validation: {
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ],
    requireContentType: true,
    validateOrigin: true,
    validateReferer: false
  }
};

// Security middleware class
export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config };
  }

  /**
   * Apply CORS headers and validation
   */
  applyCors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    const corsHeaders = createCorsHeaders(origin || undefined);
    
    // Validate origin if required
    if (this.config.validation.validateOrigin && origin) {
      const isAllowed = this.config.cors.origins.includes(origin) || 
                       this.config.cors.origins.includes('*');
      
      if (!isAllowed) {
        console.warn('CORS: Origin not allowed:', origin);
        // Still set CORS headers but with null origin
        corsHeaders['Access-Control-Allow-Origin'] = 'null';
      }
    }
    
    // Apply CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  /**
   * Apply security headers
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    const { headers } = this.config;
    
    // Content Security Policy
    if (headers.contentSecurityPolicy) {
      response.headers.set('Content-Security-Policy', headers.contentSecurityPolicy);
    }
    
    // X-Frame-Options
    response.headers.set('X-Frame-Options', headers.xFrameOptions);
    
    // X-Content-Type-Options
    response.headers.set('X-Content-Type-Options', headers.xContentTypeOptions);
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', headers.referrerPolicy);
    
    // Permissions Policy
    if (headers.permissionsPolicy) {
      response.headers.set('Permissions-Policy', headers.permissionsPolicy);
    }
    
    // Strict Transport Security (HTTPS only)
    if (headers.strictTransportSecurity) {
      response.headers.set('Strict-Transport-Security', headers.strictTransportSecurity);
    }
    
    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    return response;
  }

  /**
   * Validate request security
   */
  validateRequest(request: NextRequest): { valid: boolean; error?: string } {
    // Check URL length
    if (request.url.length > this.config.requestLimits.maxUrlLength) {
      return { valid: false, error: 'URL too long' };
    }
    
    // Check content type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      
      if (this.config.validation.requireContentType && !contentType) {
        return { valid: false, error: 'Content-Type header required' };
      }
      
      if (contentType) {
        const baseContentType = contentType.split(';')[0].trim();
        if (!this.config.validation.allowedContentTypes.includes(baseContentType)) {
          return { valid: false, error: `Content-Type '${baseContentType}' not allowed` };
        }
      }
    }
    
    // Validate headers size
    const headersSize = Array.from(request.headers.entries())
      .reduce((size, [key, value]) => size + key.length + value.length, 0);
    
    if (headersSize > this.config.requestLimits.maxHeaderSize) {
      return { valid: false, error: 'Headers too large' };
    }
    
    // Validate referer if required
    if (this.config.validation.validateReferer) {
      const referer = request.headers.get('referer');
      const origin = request.headers.get('origin');
      
      if (referer && origin) {
        try {
          const refererUrl = new URL(referer);
          const originUrl = new URL(origin);
          
          if (refererUrl.origin !== originUrl.origin) {
            return { valid: false, error: 'Invalid referer' };
          }
        } catch {
          return { valid: false, error: 'Invalid referer format' };
        }
      }
    }
    
    return { valid: true };
  }

  /**
   * Handle OPTIONS preflight requests
   */
  handlePreflight(request: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 204 });
    
    // Apply CORS headers
    this.applyCors(request, response);
    
    // Add preflight-specific headers
    response.headers.set('Access-Control-Max-Age', this.config.cors.maxAge.toString());
    
    const requestedMethod = request.headers.get('access-control-request-method');
    if (requestedMethod && this.config.cors.methods.includes(requestedMethod)) {
      response.headers.set('Access-Control-Allow-Methods', this.config.cors.methods.join(', '));
    }
    
    const requestedHeaders = request.headers.get('access-control-request-headers');
    if (requestedHeaders) {
      const headers = requestedHeaders.split(',').map(h => h.trim());
      const allowedHeaders = headers.filter(h => 
        this.config.cors.headers.includes(h) || h.toLowerCase().startsWith('x-')
      );
      
      if (allowedHeaders.length > 0) {
        response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      }
    }
    
    return response;
  }

  /**
   * Create security middleware
   */
  createMiddleware() {
    return async (request: NextRequest, handler: Function): Promise<NextResponse> => {
      const requestId = generateRequestId();
      
      // Handle OPTIONS preflight requests
      if (request.method === 'OPTIONS') {
        return this.handlePreflight(request);
      }
      
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        return errorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          validation.error || 'Request validation failed',
          HttpStatus.BAD_REQUEST,
          undefined,
          requestId
        );
      }
      
      try {
        // Execute the handler
        const response = await handler(request);
        
        // Apply security headers
        this.applySecurityHeaders(response);
        
        // Apply CORS headers
        this.applyCors(request, response);
        
        return response;
      } catch (error) {
        // Create error response
        const errorResponse = new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error'
            },
            requestId
          }),
          { status: 500 }
        );
        
        // Apply security headers to error response
        this.applySecurityHeaders(errorResponse);
        this.applyCors(request, errorResponse);
        
        return errorResponse;
      }
    };
  }
}

// Input sanitization utilities
export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(input: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.toLowerCase().trim();
    
    return emailRegex.test(sanitized) ? sanitized : null;
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      
      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitize filename for uploads
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  }
}

// Create default security middleware instance
export const securityMiddleware = new SecurityMiddleware();

// Utility function to apply security to API routes
export function withSecurity(config?: Partial<SecurityConfig>) {
  const middleware = config ? new SecurityMiddleware(config) : securityMiddleware;
  return middleware.createMiddleware();
}

// Request timeout utility
export function withTimeout(timeoutMs: number = 30000) {
  return async (request: NextRequest, handler: Function): Promise<NextResponse> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    try {
      return await Promise.race([handler(request), timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        return errorResponse(
          ApiErrorCode.REQUEST_TIMEOUT,
          'Request timeout',
          HttpStatus.REQUEST_TIMEOUT,
          { timeout: timeoutMs }
        );
      }
      throw error;
    }
  };
}
