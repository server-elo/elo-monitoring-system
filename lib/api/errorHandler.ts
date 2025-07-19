/**
 * Centralized API Error Handling System
 * 
 * Provides consistent error handling, logging, and response formatting
 * across all API endpoints in the Solidity Learning Platform.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { logger } from './logger';
;

// Enhanced error context interface
export interface ErrorContext {
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  url: string;
  method: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Standard error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    field?: string;
    statusCode: number;
  };
  requestId: string;
  timestamp: string;
}

// Validation error response for form fields
export interface ValidationErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    statusCode: 400;
    details: Array<{
      field: string;
      message: string;
      code?: string;
      value?: unknown;
    }>;
  };
  requestId: string;
  timestamp: string;
}

/**
 * Custom API Error Classes
 */
export abstract class BaseApiError extends Error {
  abstract statusCode: number;
  abstract code: string;
  public details?: unknown;
  public field?: string;

  constructor(message: string, details?: unknown, field?: string) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseApiError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}

export class AuthenticationError extends BaseApiError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
}

export class AuthorizationError extends BaseApiError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
}

export class NotFoundError extends BaseApiError {
  statusCode = 404;
  code = 'NOT_FOUND';
}

export class ConflictError extends BaseApiError {
  statusCode = 409;
  code = 'CONFLICT';
}

export class RateLimitError extends BaseApiError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
}

export class InternalServerError extends BaseApiError {
  statusCode = 500;
  code = 'INTERNAL_SERVER_ERROR';
}

export class ServiceUnavailableError extends BaseApiError {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';
}

/**
 * Error Detection and Classification
 */
export class ErrorClassifier {
  static classify(error: unknown): BaseApiError {
    // Handle known API errors
    if (error instanceof BaseApiError) {
      return error;
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: err.path.length > 0 ? err.path.reduce((obj, key) => obj?.[key], error as any) : undefined
      }));
      return new ValidationError('Validation failed', details);
    }

    // Handle Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    if (error instanceof PrismaClientValidationError) {
      return new ValidationError('Database validation error', { 
        type: 'prisma_validation',
        message: error.message 
      });
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
      // Check for specific error types by message
      if (error.message.includes('auth') || error.message.includes('token')) {
        return new AuthenticationError(error.message);
      }
      
      if (error.message.includes('permission') || error.message.includes('forbidden')) {
        return new AuthorizationError(error.message);
      }
      
      if (error.message.includes('not found')) {
        return new NotFoundError(error.message);
      }
      
      if (error.message.includes('rate limit')) {
        return new RateLimitError(error.message);
      }

      return new InternalServerError(error.message, { 
        stack: error.stack,
        name: error.name 
      });
    }

    // Unknown error type
    return new InternalServerError('An unexpected error occurred', { 
      errorType: typeof error,
      error: String(error) 
    });
  }

  private static handlePrismaError(error: PrismaClientKnownRequestError): BaseApiError {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const targetField = error.meta?.target as string[] | undefined;
        return new ConflictError(
          `Resource already exists${targetField ? ` (${targetField.join(', ')})` : ''}`,
          { 
            field: targetField?.[0],
            constraint: 'unique',
            prismaCode: error.code 
          }
        );
        
      case 'P2025': // Record not found
        return new NotFoundError('Resource not found', { 
          prismaCode: error.code,
          cause: error.meta?.cause 
        });
        
      case 'P2003': // Foreign key constraint violation
        return new ValidationError('Invalid reference to related resource', { 
          field: error.meta?.field_name,
          constraint: 'foreign_key',
          prismaCode: error.code 
        });
        
      case 'P2014': // Required relation missing
        return new ValidationError('Required relationship is missing', { 
          relation: error.meta?.relation_name,
          prismaCode: error.code 
        });
        
      default:
        return new InternalServerError('Database operation failed', { 
          prismaCode: error.code,
          message: error.message 
        });
    }
  }
}

/**
 * Centralized Error Handler
 */
export class ApiErrorHandler {
  /**
   * Create error context from request
   */
  static createErrorContext(request: NextRequest, requestId: string): ErrorContext {
    return {
      requestId,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle error and return standardized response
   */
  static handle(
    error: unknown,
    request: NextRequest,
    requestId: string,
    userId?: string
  ): NextResponse {
    const context = this.createErrorContext(request, requestId);
    if (userId) context.userId = userId;

    const apiError = ErrorClassifier.classify(error);
    
    // Log error with appropriate level
    const logLevel = apiError.statusCode >= 500 ? 'error' : 'warn';
    const logMessage = `API ${apiError.constructor.name}`;
    const logContext = {
      ...context,
      errorCode: apiError.code,
      statusCode: apiError.statusCode,
      details: apiError.details,
      field: apiError.field,
    };

    if (logLevel === 'error') {
      logger.error(logMessage, logContext, apiError);
    } else {
      logger.warn(logMessage, logContext);
    }

    // Handle validation errors specially
    if (apiError instanceof ValidationError && Array.isArray(apiError.details)) {
      return this.createValidationErrorResponse(apiError, requestId);
    }

    // Create standard error response
    return this.createErrorResponse(apiError, requestId);
  }

  /**
   * Create standard error response
   */
  private static createErrorResponse(error: BaseApiError, requestId: string): NextResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        field: error.field,
        statusCode: error.statusCode,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { 
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      }
    });
  }

  /**
   * Create validation error response
   */
  private static createValidationErrorResponse(
    error: ValidationError, 
    requestId: string
  ): NextResponse {
    const response: ValidationErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        statusCode: 400,
        details: error.details as ValidationErrorResponse['error']['details'],
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      }
    });
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
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
}

/**
 * HOF to wrap API handlers with error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request and requestId from args
      const request = args[0] as NextRequest;
      const requestId = request.headers.get('x-request-id') || 
                       crypto.randomUUID();
      
      return ApiErrorHandler.handle(error, request, requestId);
    }
  };
}

/**
 * Utility functions for common errors
 */
export const ErrorHelpers = {
  validation: (message: string, field?: string, details?: unknown) =>
    new ValidationError(message, details, field),
    
  notFound: (resource: string, id?: string) =>
    new NotFoundError(`${resource}${id ? ` with id '${id}'` : ''} not found`),
    
  unauthorized: (message = 'Authentication required') =>
    new AuthenticationError(message),
    
  forbidden: (message = 'Access denied') =>
    new AuthorizationError(message),
    
  conflict: (message: string, field?: string) =>
    new ConflictError(message, undefined, field),
    
  internal: (message = 'Internal server error', details?: unknown) =>
    new InternalServerError(message, details),
    
  rateLimit: (message = 'Rate limit exceeded') =>
    new RateLimitError(message),
};

/**
 * Express-style error handling middleware for API routes
 */
export function createErrorHandlingMiddleware() {
  return (
    handler: (request: NextRequest) => Promise<NextResponse>
  ) => {
    return withErrorHandler(handler);
  };
}

export default ApiErrorHandler;