/**
 * Standardized API Response Builder
 * 
 * Provides consistent response formatting across all API endpoints
 * with proper typing, pagination, and metadata support.
 */

import { NextResponse } from 'next/server';

// Base response interfaces
export interface BaseResponse {
  success: boolean;
  requestId?: string;
  timestamp: string;
}

export interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    field?: string;
    statusCode: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  timing?: {
    requestTime: number;
    processingTime: number;
  };
  cache?: {
    hit: boolean;
    ttl?: number;
  };
  [key: string]: unknown;
}

/**
 * Standardized API Response Builder
 */
export class ApiResponseBuilder {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    options: {
      meta?: ResponseMeta;
      requestId?: string;
      status?: number;
      headers?: Record<string, string>;
    } = {}
  ): NextResponse {
    const { meta, requestId, status = 200, headers = {} } = options;

    const response: SuccessResponse<T> = {
      success: true,
      data,
      meta,
      requestId,
      timestamp: new Date().toISOString(),
    };

    const responseHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requestId) {
      responseHeaders['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status,
      headers: responseHeaders,
    });
  }

  /**
   * Create a paginated success response
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    options: {
      meta?: Omit<ResponseMeta, 'pagination'>;
      requestId?: string;
      headers?: Record<string, string>;
    } = {}
  ): NextResponse {
    const { meta = {}, requestId, headers = {} } = options;

    return this.success(data, {
      meta: {
        ...meta,
        pagination,
      },
      requestId,
      headers,
    });
  }

  /**
   * Create an empty success response (for DELETE, PUT operations)
   */
  static noContent(options: {
    requestId?: string;
    headers?: Record<string, string>;
  } = {}): NextResponse {
    const { requestId, headers = {} } = options;

    const responseHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requestId) {
      responseHeaders['X-Request-ID'] = requestId;
    }

    return new NextResponse(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  /**
   * Create an accepted response (for async operations)
   */
  static accepted<T>(
    data: T,
    options: {
      meta?: ResponseMeta;
      requestId?: string;
      headers?: Record<string, string>;
    } = {}
  ): NextResponse {
    return this.success(data, {
      ...options,
      status: 202,
    });
  }

  /**
   * Create a created response
   */
  static created<T>(
    data: T,
    options: {
      meta?: ResponseMeta;
      requestId?: string;
      location?: string;
      headers?: Record<string, string>;
    } = {}
  ): NextResponse {
    const { location, headers = {}, ...restOptions } = options;

    if (location) {
      headers['Location'] = location;
    }

    return this.success(data, {
      ...restOptions,
      status: 201,
      headers,
    });
  }

  /**
   * Validation error response
   */
  static validationError(
    message: string,
    details: Array<{
      field: string;
      message: string;
      code?: string;
      value?: unknown;
    }>,
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details,
        statusCode: 400,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 400,
      headers,
    });
  }

  /**
   * Unauthorized error response
   */
  static unauthorized(
    message = 'Authentication required',
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
        statusCode: 401,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 401,
      headers,
    });
  }

  /**
   * Forbidden error response
   */
  static forbidden(
    message = 'Access denied',
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
        statusCode: 403,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 403,
      headers,
    });
  }

  /**
   * Not found error response
   */
  static notFound(
    message = 'Resource not found',
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
        statusCode: 404,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 404,
      headers,
    });
  }

  /**
   * Conflict error response
   */
  static conflict(
    message = 'Resource conflict',
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        statusCode: 409,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 409,
      headers,
    });
  }

  /**
   * Rate limit exceeded error response
   */
  static rateLimitExceeded(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        details: retryAfter ? { retryAfter } : undefined,
        statusCode: 429,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 429,
      headers,
    });
  }

  /**
   * Internal server error response
   */
  static internalServerError(
    message = 'Internal server error',
    requestId?: string,
    details?: unknown
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        statusCode: 500,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 500,
      headers,
    });
  }

  /**
   * Service unavailable error response
   */
  static serviceUnavailable(
    message = 'Service temporarily unavailable',
    retryAfter?: number,
    requestId?: string
  ): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message,
        details: retryAfter ? { retryAfter } : undefined,
        statusCode: 503,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status: 503,
      headers,
    });
  }
}

/**
 * Utility functions for pagination
 */
export class PaginationHelper {
  /**
   * Create pagination metadata
   */
  static createMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Calculate offset for database queries
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Parse pagination parameters from URL
   */
  static parseParams(
    searchParams: URLSearchParams,
    defaults: { page?: number; limit?: number } = {}
  ): { page: number; limit: number } {
    const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 10))));
    
    return { page, limit };
  }
}

/**
 * Response timing utilities
 */
export class TimingHelper {
  /**
   * Create timing metadata
   */
  static create(startTime: number): ResponseMeta['timing'] {
    const endTime = Date.now();
    return {
      requestTime: startTime,
      processingTime: endTime - startTime,
    };
  }
}

/**
 * Cache metadata utilities
 */
export class CacheHelper {
  /**
   * Create cache metadata
   */
  static create(hit: boolean, ttl?: number): ResponseMeta['cache'] {
    return {
      hit,
      ttl,
    };
  }
}

export default ApiResponseBuilder;