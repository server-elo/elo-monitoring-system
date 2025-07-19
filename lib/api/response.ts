import { NextResponse } from 'next/server';
import { 
  ApiResponse, 
  ApiErrorResponse, 
  ValidationError, 
  ResponseMeta, 
  PaginationMeta,
  ApiErrorCode, 
  HttpStatus 
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class ApiResponseBuilder {
  private static generateRequestId(): string {
    return uuidv4();
  }

  private static createBaseResponse<T>(
    success: boolean,
    data?: T,
    error?: ApiErrorResponse,
    meta?: ResponseMeta
  ): ApiResponse<T> {
    return {
      success,
      data,
      error,
      meta,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  // Success Responses
  static success<T>(data: T, meta?: ResponseMeta): NextResponse<ApiResponse<T>> {
    const response = this.createBaseResponse(true, data, undefined, meta);
    return NextResponse.json(response, { status: HttpStatus.OK });
  }

  static created<T>(data: T): NextResponse<ApiResponse<T>> {
    const response = this.createBaseResponse(true, data);
    return NextResponse.json(response, { status: HttpStatus.CREATED });
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  }

  // Error Responses
  static error(
    code: ApiErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: ValidationError[] | Record<string, any>
  ): NextResponse<ApiResponse> {
    const error: ApiErrorResponse = {
      code,
      message,
      details,
      ...(process.env.NODE_ENV === 'development' && { stack: new Error().stack })
    };

    const response = this.createBaseResponse(false, undefined, error);
    return NextResponse.json(response, { status: statusCode });
  }

  static validationError(
    message: string = 'Validation failed',
    errors: ValidationError[]
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.VALIDATION_ERROR,
      message,
      HttpStatus.BAD_REQUEST,
      errors
    );
  }

  static unauthorized(
    message: string = 'Authentication required'
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.UNAUTHORIZED,
      message,
      HttpStatus.UNAUTHORIZED
    );
  }

  static forbidden(
    message: string = 'Insufficient permissions'
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.FORBIDDEN,
      message,
      HttpStatus.FORBIDDEN
    );
  }

  static notFound(
    message: string = 'Resource not found'
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.RESOURCE_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND
    );
  }

  static conflict(
    message: string = 'Resource already exists'
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.RESOURCE_CONFLICT,
      message,
      HttpStatus.CONFLICT
    );
  }

  static rateLimitExceeded(
    message: string = 'Rate limit exceeded'
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  static internalServerError(
    message: string = 'Internal server error'
  ): NextResponse<ApiResponse> {
    return this.error(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Pagination Helper
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta
  ): NextResponse<ApiResponse<T[]>> {
    const meta: ResponseMeta = {
      pagination,
      total: pagination.totalItems,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      hasNext: pagination.hasNextPage,
      hasPrevious: pagination.hasPreviousPage
    };

    return this.success(data, meta);
  }
}

// Error Classes
export class ApiException extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public details?: ValidationError[] | Record<string, any>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export class ValidationException extends ApiException {
  constructor(message: string, errors: ValidationError[]) {
    super(ApiErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, errors);
    this.name = 'ValidationException';
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string = 'Authentication required') {
    super(ApiErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends ApiException {
  constructor(message: string = 'Insufficient permissions') {
    super(ApiErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends ApiException {
  constructor(message: string = 'Resource not found') {
    super(ApiErrorCode.RESOURCE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends ApiException {
  constructor(message: string = 'Resource already exists') {
    super(ApiErrorCode.RESOURCE_CONFLICT, message, HttpStatus.CONFLICT);
    this.name = 'ConflictException';
  }
}

export class RateLimitException extends ApiException {
  constructor(message: string = 'Rate limit exceeded') {
    super(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, HttpStatus.TOO_MANY_REQUESTS);
    this.name = 'RateLimitException';
  }
}

// Utility Functions
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export function sanitizeForResponse<T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[] = ['password', 'passwordHash', 'salt', 'secret', 'token']
): Partial<T> {
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
}

export function filterByPermissions<T extends Record<string, any>>(
  data: T,
  userRole: string,
  allowedFields: Record<string, string[]>
): Partial<T> {
  const allowed = allowedFields[userRole] || [];
  const filtered: Partial<T> = {};
  
  allowed.forEach(field => {
    if (field in data) {
      filtered[field as keyof T] = data[field];
    }
  });
  
  return filtered;
}

// Response Headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

export function addCorsHeaders(
  response: NextResponse,
  origin?: string,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: string[] = ['Content-Type', 'Authorization', 'X-Requested-With']
): NextResponse {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number,
  retryAfter?: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }
  
  return response;
}
