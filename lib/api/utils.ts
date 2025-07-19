/**
 * Core API utilities and response helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, ApiErrorCode, HttpStatus, ResponseMeta } from './types';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return uuidv4();
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  meta?: ResponseMeta,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId()
  };
}

/**
 * Create a standardized API error response
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: any,
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined
    },
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId()
  };
}

/**
 * Create a Next.js response with proper headers
 */
export function createResponse<T>(
  data: ApiResponse<T>,
  status: HttpStatus = HttpStatus.OK,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add standard headers
  response.headers.set('Content-Type', 'application/json');
  response.headers.set('X-Request-ID', data.requestId);
  response.headers.set('X-API-Version', process.env.API_VERSION || '1.0.0');
  
  // Add custom headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data?: T,
  meta?: ResponseMeta,
  status: HttpStatus = HttpStatus.OK,
  requestId?: string
): NextResponse {
  const apiResponse = createApiResponse(data, meta, requestId);
  return createResponse(apiResponse, status);
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: HttpStatus = HttpStatus.BAD_REQUEST,
  details?: any,
  requestId?: string
): NextResponse {
  const apiResponse = createApiError(code, message, details, requestId);
  return createResponse(apiResponse, status);
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: Array<{ field: string; message: string; code: string }>,
  requestId?: string
): NextResponse {
  return errorResponse(
    ApiErrorCode.VALIDATION_ERROR,
    'Validation failed',
    HttpStatus.UNPROCESSABLE_ENTITY,
    errors,
    requestId
  );
}

/**
 * Create a not found error response
 */
export function notFoundResponse(
  resource: string = 'Resource',
  requestId?: string
): NextResponse {
  return errorResponse(
    ApiErrorCode.RESOURCE_NOT_FOUND,
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    undefined,
    requestId
  );
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(
  message: string = 'Authentication required',
  requestId?: string
): NextResponse {
  return errorResponse(
    ApiErrorCode.UNAUTHORIZED,
    message,
    HttpStatus.UNAUTHORIZED,
    undefined,
    requestId
  );
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(
  message: string = 'Insufficient permissions',
  requestId?: string
): NextResponse {
  return errorResponse(
    ApiErrorCode.FORBIDDEN,
    message,
    HttpStatus.FORBIDDEN,
    undefined,
    requestId
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(
  retryAfter: number,
  requestId?: string
): NextResponse {
  const response = errorResponse(
    ApiErrorCode.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded',
    HttpStatus.TOO_MANY_REQUESTS,
    { retryAfter },
    requestId
  );
  
  response.headers.set('Retry-After', retryAfter.toString());
  return response;
}

/**
 * Create an internal server error response
 */
export function internalErrorResponse(
  message: string = 'Internal server error',
  requestId?: string
): NextResponse {
  return errorResponse(
    ApiErrorCode.INTERNAL_SERVER_ERROR,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    undefined,
    requestId
  );
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '20', 10),
    100 // Maximum limit
  );
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    sortBy,
    sortOrder,
    offset: (Math.max(1, page) - 1) * Math.max(1, limit)
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ResponseMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    total,
    page,
    limit,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  };
}

/**
 * Sanitize sensitive data from objects
 */
export function sanitizeData(data: any, sensitiveFields: string[] = ['password', 'token', 'secret']): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, sensitiveFields));
  }
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveFields);
    }
  });
  
  return sanitized;
}

/**
 * Extract user agent information
 */
export function parseUserAgent(userAgent: string) {
  const browser = (() => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  })();
  
  const os = (() => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  })();
  
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  return { browser, os, isMobile };
}

/**
 * Validate request method
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): boolean {
  return allowedMethods.includes(request.method);
}

/**
 * Create method not allowed response
 */
export function methodNotAllowedResponse(
  allowedMethods: string[],
  requestId?: string
): NextResponse {
  const response = errorResponse(
    ApiErrorCode.VALIDATION_ERROR,
    `Method ${allowedMethods.join(', ')} allowed`,
    HttpStatus.BAD_REQUEST,
    { allowedMethods },
    requestId
  );
  
  response.headers.set('Allow', allowedMethods.join(', '));
  return response;
}

/**
 * Handle async API route with error catching
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();
    
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Log error to monitoring system
      if (process.env.NODE_ENV === 'production') {
        // Send to error tracking service
        // errorTracker.captureError(error, { requestId, url: request.url });
      }
      
      return internalErrorResponse(
        process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : 'Internal server error',
        requestId
      );
    }
  };
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  return { result, duration };
}

/**
 * Create CORS headers
 */
export function createCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const isAllowed = !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}
