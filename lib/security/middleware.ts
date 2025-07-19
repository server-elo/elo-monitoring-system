import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONFIG, SecurityValidators, SecurityUtils } from './config';
import { rateLimit } from '@/lib/api/rateLimit';
import { logger } from '@/lib/monitoring/simple-logger';

/**
 * Comprehensive Security Middleware
 * Implements multiple layers of security protection
 */

interface SecurityMiddlewareOptions {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  rateLimitType?: 'auth' | 'api' | 'upload';
  enableInputValidation?: boolean;
  enableSecurityHeaders?: boolean;
  enableAuditLogging?: boolean;
}

/**
 * Main security middleware function
 */
export function createSecurityMiddleware(options: SecurityMiddlewareOptions = {}) {
  const {
    enableCSRF = true,
    enableRateLimit = true,
    rateLimitType = 'api',
    enableInputValidation = true,
    enableSecurityHeaders = true,
    enableAuditLogging = true,
  } = options;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || SecurityUtils.generateSecureRandom(16);

    try {
      // 1. Security Headers
      if (enableSecurityHeaders) {
        const headersCheck = validateSecurityHeaders(request);
        if (!headersCheck.valid) {
          return createSecurityErrorResponse('Invalid security headers', 400, requestId);
        }
      }

      // 2. Rate Limiting
      if (enableRateLimit) {
        const rateLimitResult = await checkRateLimit(request, rateLimitType);
        if (!rateLimitResult.allowed) {
          return createRateLimitErrorResponse(rateLimitResult.resetTime, requestId);
        }
      }

      // 3. CSRF Protection
      if (enableCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const csrfCheck = await validateCSRFToken(request);
        if (!csrfCheck.valid) {
          return createSecurityErrorResponse('CSRF token validation failed', 403, requestId);
        }
      }

      // 4. Input Validation
      if (enableInputValidation && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const inputCheck = await validateRequestInput(request);
        if (!inputCheck.valid) {
          return createSecurityErrorResponse(
            `Input validation failed: ${inputCheck.errors.join(', ')}`,
            400,
            requestId
          );
        }
      }

      // 5. Audit Logging
      if (enableAuditLogging) {
        logSecurityEvent(request, 'request_processed', {
          requestId,
          processingTime: Date.now() - startTime,
          securityChecks: {
            headers: enableSecurityHeaders,
            rateLimit: enableRateLimit,
            csrf: enableCSRF,
            inputValidation: enableInputValidation,
          },
        });
      }

      return null; // Continue to next middleware
    } catch (error) {
      logger.error('Security middleware error', error as Error, { requestId });
      return createSecurityErrorResponse('Security check failed', 500, requestId);
    }
  };
}

/**
 * Validate security headers
 */
function validateSecurityHeaders(request: NextRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const headers = request.headers;

  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-host',
    'x-rewrite-url',
  ];

  suspiciousHeaders.forEach(header => {
    if (headers.get(header)) {
      errors.push(`Suspicious header detected: ${header}`);
    }
  });

  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = headers.get('content-type');
    if (!contentType) {
      errors.push('Missing Content-Type header');
    } else if (!isAllowedContentType(contentType)) {
      errors.push(`Invalid Content-Type: ${contentType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if content type is allowed
 */
function isAllowedContentType(contentType: string): boolean {
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ];

  return allowedTypes.some(type => contentType.toLowerCase().includes(type));
}

/**
 * Rate limiting check
 */
async function checkRateLimit(
  request: NextRequest,
  type: 'auth' | 'api' | 'upload'
): Promise<{ allowed: boolean; resetTime?: number }> {
  const config = SECURITY_CONFIG.rateLimit[type];
  const identifier = getClientIdentifier(request);

  try {
    const result = await rateLimit({
      identifier,
      windowMs: config.windowMs,
      maxRequests: config.maxAttempts || config.maxRequests,
    });

    return {
      allowed: result.success,
      resetTime: result.reset,
    };
  } catch (error) {
    logger.error('Rate limit check failed', error as Error);
    return { allowed: true }; // Fail open for availability
  }
}

/**
 * CSRF token validation
 */
async function validateCSRFToken(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const config = SECURITY_CONFIG.csrf;
  
  if (!config.enabled) {
    return { valid: true };
  }

  const tokenFromHeader = request.headers.get(config.headerName);
  const tokenFromCookie = request.cookies.get(config.cookieName)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return { valid: false, error: 'Missing CSRF token' };
  }

  if (tokenFromHeader !== tokenFromCookie) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}

/**
 * Input validation
 */
async function validateRequestInput(request: NextRequest): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.clone().text();
      
      // Check for malicious patterns
      if (SecurityValidators.containsMaliciousPatterns(body)) {
        errors.push('Request contains potentially malicious content');
      }

      // Validate JSON structure
      try {
        const parsed = JSON.parse(body);
        const validationResult = validateObjectStructure(parsed);
        if (!validationResult.valid) {
          errors.push(...validationResult.errors);
        }
      } catch {
        errors.push('Invalid JSON format');
      }
    }
  } catch (error) {
    errors.push('Failed to validate request input');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate object structure for security
 */
function validateObjectStructure(
  obj: any,
  depth: number = 0
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = SECURITY_CONFIG.validation;

  if (depth > config.maxObjectDepth) {
    errors.push('Object nesting too deep');
    return { valid: false, errors };
  }

  if (Array.isArray(obj)) {
    if (obj.length > config.maxArrayLength) {
      errors.push('Array too long');
    }
    
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        const result = validateObjectStructure(item, depth + 1);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > config.maxStringLength) {
        errors.push(`String value too long for key: ${key}`);
      }
      
      if (typeof value === 'object' && value !== null) {
        const result = validateObjectStructure(value, depth + 1);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a hash of IP + User Agent for better rate limiting
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Log security events
 */
function logSecurityEvent(
  request: NextRequest,
  event: string,
  metadata: Record<string, any>
): void {
  const sanitizedMetadata = SecurityUtils.sanitizeForLogging(metadata);
  
  logger.info(`Security Event: ${event}`, {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIdentifier(request),
    ...sanitizedMetadata,
  });
}

/**
 * Create security error response
 */
function createSecurityErrorResponse(
  message: string,
  status: number,
  requestId: string
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'SECURITY_ERROR',
        message,
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );

  // Add security headers
  addSecurityHeaders(response);
  
  return response;
}

/**
 * Create rate limit error response
 */
function createRateLimitErrorResponse(resetTime: number | undefined, requestId: string): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        requestId,
        resetTime,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 429 }
  );

  if (resetTime) {
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
  }

  addSecurityHeaders(response);
  
  return response;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  const config = SECURITY_CONFIG.headers;

  // HSTS
  if (SECURITY_CONFIG.session.secure) {
    response.headers.set(
      'Strict-Transport-Security',
      `max-age=${config.hsts.maxAge}; includeSubDomains; preload`
    );
  }

  // Other security headers
  response.headers.set('X-Frame-Options', config.xFrameOptions);
  response.headers.set('X-Content-Type-Options', config.xContentTypeOptions);
  response.headers.set('X-XSS-Protection', config.xXssProtection);
  response.headers.set('Referrer-Policy', config.referrerPolicy);

  // CSP
  response.headers.set('Content-Security-Policy', SecurityUtils.createCSPHeader());

  // Permissions Policy
  const permissionsPolicy = Object.entries(config.permissionsPolicy)
    .map(([directive, allowlist]) => `${directive}=(${allowlist.join(' ')})`)
    .join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);
}

// Export specific middleware configurations
export const authSecurityMiddleware = createSecurityMiddleware({
  enableCSRF: true,
  enableRateLimit: true,
  rateLimitType: 'auth',
  enableInputValidation: true,
  enableSecurityHeaders: true,
  enableAuditLogging: true,
});

export const apiSecurityMiddleware = createSecurityMiddleware({
  enableCSRF: false, // API endpoints typically use other auth methods
  enableRateLimit: true,
  rateLimitType: 'api',
  enableInputValidation: true,
  enableSecurityHeaders: true,
  enableAuditLogging: true,
});

export const uploadSecurityMiddleware = createSecurityMiddleware({
  enableCSRF: true,
  enableRateLimit: true,
  rateLimitType: 'upload',
  enableInputValidation: false, // File uploads need special validation
  enableSecurityHeaders: true,
  enableAuditLogging: true,
});
