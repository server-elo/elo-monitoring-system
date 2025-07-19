import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';
import { getRateLimitManager } from './rateLimit';
import { ApiResponseBuilder, addSecurityHeaders, addCorsHeaders, addRateLimitHeaders } from './response';
;
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { UserRole } from './types';

// Middleware Types
export interface MiddlewareContext {
  requestId: string;
  startTime: number;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  };
}

export interface MiddlewareOptions {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  rateLimitType?: string;
  skipRateLimit?: boolean;
  cors?: boolean;
  logging?: boolean;
}

// Request Logger
export class RequestLogger {
  static log(
    request: NextRequest,
    response: NextResponse,
    context: MiddlewareContext,
    error?: Error
  ): void {
    const duration = Date.now() - context.startTime;
    const logData = {
      requestId: context.requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: this.getClientIP(request),
      userId: context.user?.id,
      statusCode: response.status,
      duration,
      error: error?.message,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logger.error('API Request Error', logData, error);
    } else {
      logger.info('API Request', logData);
    }
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }
}

// CORS Middleware
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://solidity-learning-platform.vercel.app'
  ];

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (origin && allowedOrigins.includes(origin)) {
      addCorsHeaders(response, origin);
    }
    
    return response;
  }

  return null;
}

// Authentication Middleware
export async function authMiddleware(
  request: NextRequest,
  options: MiddlewareOptions
): Promise<MiddlewareContext> {
  const context: MiddlewareContext = {
    requestId: uuidv4(),
    startTime: Date.now()
  };

  if (options.requireAuth) {
    try {
      const payload = await AuthService.authenticateRequest(request);
      context.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      };

      // Check required permissions
      if (options.requiredPermissions) {
        for (const permission of options.requiredPermissions) {
          if (!AuthService.hasPermission(payload.permissions, permission)) {
            throw new Error(`Missing permission: ${permission}`);
          }
        }
      }

      // Check required roles
      if (options.requiredRoles) {
        if (!AuthService.hasRole(payload.role, options.requiredRoles as UserRole[])) {
          throw new Error(`Missing role: ${options.requiredRoles.join(' or ')}`);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  return context;
}

// Rate Limiting Middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  context: MiddlewareContext,
  options: MiddlewareOptions
): Promise<void> {
  if (options.skipRateLimit) {
    return;
  }

  const rateLimitType = options.rateLimitType || 'general';
  const manager = getRateLimitManager();

  try {
    const result = await manager.checkLimit(rateLimitType, request);
    context.rateLimitInfo = result;

    if (!result.allowed) {
      throw new Error('Rate limit exceeded');
    }
  } catch (error) {
    throw error;
  }
}

// Main API Middleware
export async function apiMiddleware(
  request: NextRequest,
  options: MiddlewareOptions = {}
): Promise<{ context: MiddlewareContext; response?: NextResponse }> {
  let context: MiddlewareContext;
  
  try {
    // Handle CORS preflight
    const corsResponse = corsMiddleware(request);
    if (corsResponse) {
      return { context: { requestId: uuidv4(), startTime: Date.now() }, response: corsResponse };
    }

    // Authentication
    context = await authMiddleware(request, options);

    // Rate Limiting
    await rateLimitMiddleware(request, context, options);

    return { context };
  } catch (error) {
    const errorContext: MiddlewareContext = {
      requestId: uuidv4(),
      startTime: Date.now()
    };

    let response: NextResponse;

    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('token')) {
        response = ApiResponseBuilder.unauthorized(error.message);
      } else if (error.message.includes('permission') || error.message.includes('role')) {
        response = ApiResponseBuilder.forbidden(error.message);
      } else if (error.message.includes('rate limit')) {
        response = ApiResponseBuilder.rateLimitExceeded(error.message);
      } else {
        response = ApiResponseBuilder.internalServerError(error.message);
      }
    } else {
      response = ApiResponseBuilder.internalServerError('Unknown error occurred');
    }

    // Add security headers
    addSecurityHeaders(response);

    // Add CORS headers if needed
    if (options.cors) {
      const origin = request.headers.get('origin');
      if (origin) {
        addCorsHeaders(response, origin);
      }
    }

    // Log error
    if (options.logging !== false) {
      RequestLogger.log(request, response, errorContext, error as Error);
    }

    return { context: errorContext, response };
  }
}

// Response Middleware
export function responseMiddleware(
  request: NextRequest,
  response: NextResponse,
  context: MiddlewareContext,
  options: MiddlewareOptions = {}
): NextResponse {
  // Add security headers
  addSecurityHeaders(response);

  // Add CORS headers
  if (options.cors !== false) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://solidity-learning-platform.vercel.app'
    ];

    if (origin && allowedOrigins.includes(origin)) {
      addCorsHeaders(response, origin);
    }
  }

  // Add rate limit headers
  if (context.rateLimitInfo) {
    addRateLimitHeaders(
      response,
      context.rateLimitInfo.limit,
      context.rateLimitInfo.remaining,
      context.rateLimitInfo.reset,
      context.rateLimitInfo.retryAfter
    );
  }

  // Add request ID header
  response.headers.set('X-Request-ID', context.requestId);

  // Log request
  if (options.logging !== false) {
    RequestLogger.log(request, response, context);
  }

  return response;
}

// Utility function to wrap API handlers
export function withMiddleware(
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { context, response } = await apiMiddleware(request, options);
    
    if (response) {
      return response;
    }

    try {
      const handlerResponse = await handler(request, context);
      return responseMiddleware(request, handlerResponse, context, options);
    } catch (error) {
      let errorResponse: NextResponse;

      if (error instanceof Error) {
        errorResponse = ApiResponseBuilder.internalServerError(error.message);
      } else {
        errorResponse = ApiResponseBuilder.internalServerError('Unknown error occurred');
      }

      return responseMiddleware(request, errorResponse, context, options);
    }
  };
}

// Specific middleware combinations
export const publicEndpoint = (
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<NextResponse>
) => withMiddleware(handler, {
  requireAuth: false,
  cors: true,
  logging: true
});

export const protectedEndpoint = (
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<NextResponse>,
  permissions?: string[]
) => withMiddleware(handler, {
  requireAuth: true,
  requiredPermissions: permissions,
  cors: true,
  logging: true
});

export const adminEndpoint = (
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<NextResponse>
) => withMiddleware(handler, {
  requireAuth: true,
  requiredRoles: ['ADMIN'],
  cors: true,
  logging: true
});

export const authEndpoint = (
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<NextResponse>
) => withMiddleware(handler, {
  requireAuth: false,
  rateLimitType: 'auth',
  cors: true,
  logging: true
});

export const uploadEndpoint = (
  handler: (request: NextRequest, context: MiddlewareContext) => Promise<NextResponse>
) => withMiddleware(handler, {
  requireAuth: true,
  rateLimitType: 'upload',
  cors: true,
  logging: true
});

// Error handling middleware
export function errorHandler(error: Error, request: NextRequest): NextResponse {
  logger.error('Unhandled API Error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  }, error);

  return ApiResponseBuilder.internalServerError(
    process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred'
  );
}

// Re-export commonly used middleware functions from other modules
export { withErrorHandling } from './utils';
export { withSecurity } from './security';
export { withRateLimit } from './rate-limiting';
export { createValidationMiddleware } from './validation';
