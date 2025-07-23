import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaders, rateLimiters, InputValidator } from './security-headers';
import { logger } from '@/lib/logging/structured-logger';

/**
 * Enhanced Security Middleware
 * Comprehensive security protection for all requests
 */

export interface SecurityEvent {
  type: 'rate_limit' | 'suspicious_request' | 'blocked_request' | 'security_violation';
  details: string;
  ip: string;
  userAgent?: string;
  path: string;
  timestamp: Date;
}

export class EnhancedSecurityMiddleware {
  private static blockedIPs = new Set<string>();
  private static suspiciousPatterns = [
    /\.\./,                    // Directory traversal
    /<script/i,                // XSS attempts
    /union\s+select/i,         // SQL injection
    /javascript:/i,            // JavaScript protocol
    /vbscript:/i,             // VBScript protocol
    /onload\s*=/i,            // Event handler injection
    /onerror\s*=/i,           // Error handler injection
    /eval\s*\(/i,             // Code evaluation
    /document\.cookie/i,       // Cookie access
    /window\.location/i,       // Location manipulation
  ];

  static async handle(request: NextRequest): Promise<NextResponse | null> {
    const { pathname, search } = request.nextUrl;
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Create log context
    const logContext = {
      requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      ip,
      userAgent,
      path: pathname + search,
    };

    try {
      // 1. Check blocked IPs
      if (this.blockedIPs.has(ip)) {
        this.logSecurityEvent({
          type: 'blocked_request',
          details: 'IP address is blocked',
          ip,
          userAgent,
          path: pathname,
          timestamp: new Date(),
        });
        
        return new NextResponse('Forbidden', { status: 403 });
      }

      // 2. Rate limiting
      const rateLimitResult = this.checkRateLimit(request, ip, pathname);
      if (!rateLimitResult.allowed) {
        this.logSecurityEvent({
          type: 'rate_limit',
          details: `Rate limit exceeded: ${rateLimitResult.type}`,
          ip,
          userAgent,
          path: pathname,
          timestamp: new Date(),
        });

        const response = new NextResponse('Too Many Requests', { status: 429 });
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        
        return securityHeaders.applyHeaders(response, request);
      }

      // 3. Suspicious request detection
      const suspiciousCheck = this.detectSuspiciousRequest(request);
      if (suspiciousCheck.isSuspicious) {
        this.logSecurityEvent({
          type: 'suspicious_request',
          details: suspiciousCheck.reason,
          ip,
          userAgent,
          path: pathname,
          timestamp: new Date(),
        });

        // Don't block immediately, but log for monitoring
        logger.warn('Suspicious request detected', logContext, new Error(suspiciousCheck.reason));
      }

      // 4. Input validation for query parameters
      const validationResult = this.validateQueryParameters(request);
      if (!validationResult.isValid) {
        this.logSecurityEvent({
          type: 'security_violation',
          details: `Invalid query parameters: ${validationResult.errors.join(', ')}`,
          ip,
          userAgent,
          path: pathname,
          timestamp: new Date(),
        });

        return new NextResponse('Bad Request', { status: 400 });
      }

      // 5. Apply security headers to response
      const response = NextResponse.next();
      return securityHeaders.applyHeaders(response, request);

    } catch (error) {
      logger.error('Security middleware error', logContext, error as Error);
      
      // Fail securely - apply basic security headers
      const response = NextResponse.next();
      return securityHeaders.applyHeaders(response, request);
    }
  }

  private static getClientIP(request: NextRequest): string {
    // Try various headers for IP detection
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const real = request.headers.get('x-real-ip');
    if (real) {
      return real.trim();
    }

    const cfConnecting = request.headers.get('cf-connecting-ip');
    if (cfConnecting) {
      return cfConnecting.trim();
    }

    // Fallback to connection info (may not be available in Edge Runtime)
    return request.ip || 'unknown';
  }

  private static checkRateLimit(
    request: NextRequest,
    ip: string,
    pathname: string
  ): { allowed: boolean; type: string; limit: number; remaining: number; retryAfter: number } {
    const identifier = `${ip}:${pathname}`;

    // Check different rate limits based on path
    if (pathname.startsWith('/api/auth/')) {
      const allowed = rateLimiters.auth.isAllowed(identifier);
      return {
        allowed,
        type: 'auth',
        limit: 5,
        remaining: rateLimiters.auth.getRemainingRequests(identifier),
        retryAfter: Math.ceil((rateLimiters.auth.getResetTime(identifier) - Date.now()) / 1000),
      };
    }

    if (pathname.startsWith('/api/upload/')) {
      const allowed = rateLimiters.upload.isAllowed(identifier);
      return {
        allowed,
        type: 'upload',
        limit: 10,
        remaining: rateLimiters.upload.getRemainingRequests(identifier),
        retryAfter: Math.ceil((rateLimiters.upload.getResetTime(identifier) - Date.now()) / 1000),
      };
    }

    if (pathname.startsWith('/api/')) {
      const allowed = rateLimiters.api.isAllowed(identifier);
      return {
        allowed,
        type: 'api',
        limit: 100,
        remaining: rateLimiters.api.getRemainingRequests(identifier),
        retryAfter: Math.ceil((rateLimiters.api.getResetTime(identifier) - Date.now()) / 1000),
      };
    }

    // No rate limiting for other paths
    return {
      allowed: true,
      type: 'none',
      limit: 0,
      remaining: 0,
      retryAfter: 0,
    };
  }

  private static detectSuspiciousRequest(
    request: NextRequest
  ): { isSuspicious: boolean; reason: string } {
    const { pathname, search } = request.nextUrl;
    const userAgent = request.headers.get('user-agent') || '';
    const fullUrl = pathname + search;

    // Check for suspicious patterns in URL
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(fullUrl)) {
        return {
          isSuspicious: true,
          reason: `Suspicious pattern detected in URL: ${pattern.source}`,
        };
      }
    }

    // Check for suspicious patterns in User-Agent
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /burp/i,
      /nessus/i,
      /scanner/i,
      /bot.*bot/i,
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        return {
          isSuspicious: true,
          reason: `Suspicious user agent: ${userAgent}`,
        };
      }
    }

    // Check for empty or very short user agent
    if (userAgent.length < 10) {
      return {
        isSuspicious: true,
        reason: 'Missing or suspicious user agent',
      };
    }

    return { isSuspicious: false, reason: '' };
  }

  private static validateQueryParameters(
    request: NextRequest
  ): { isValid: boolean; errors: string[] } {
    const { searchParams } = request.nextUrl;
    const errors: string[] = [];

    for (const [key, value] of searchParams.entries()) {
      // Check parameter key
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
        errors.push(`Invalid parameter key: ${key}`);
      }

      // Check parameter value length
      if (value.length > 1000) {
        errors.push(`Parameter value too long: ${key}`);
      }

      // Check for suspicious patterns in values
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(value)) {
          errors.push(`Suspicious pattern in parameter ${key}: ${pattern.source}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static logSecurityEvent(event: SecurityEvent): void {
    logger.security(event.details, {
      action: 'security_event',
      metadata: {
        type: event.type,
        ip: event.ip,
        userAgent: event.userAgent,
        path: event.path,
        timestamp: event.timestamp.toISOString(),
      },
    });

    // If this is a repeated offense, consider blocking
    if (event.type === 'suspicious_request' || event.type === 'security_violation') {
      // In a real implementation, you might want to track repeated offenses
      // and automatically block IPs after a threshold
    }
  }

  // Admin methods for IP management
  static blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    logger.security(`IP blocked: ${ip}`, { action: 'ip_blocked' });
  }

  static unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    logger.security(`IP unblocked: ${ip}`, { action: 'ip_unblocked' });
  }

  static getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

export default EnhancedSecurityMiddleware;