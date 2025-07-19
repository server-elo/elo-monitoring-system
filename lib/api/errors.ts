/**
 * Custom error classes and standardized error handling for the API
 */

import { ApiErrorCode, HttpStatus } from './types';

// Enhanced type definitions for error handling
export interface ErrorDetails {
  [key: string]: unknown;
}

export interface RequestContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

export interface FileUploadErrorDetails extends ErrorDetails {
  maxSize?: number;
  actualSize?: number;
  allowedTypes?: string[];
  actualType?: string;
}

export interface RateLimitErrorDetails extends ErrorDetails {
  retryAfter?: number;
  limit?: number;
  windowMs?: number;
  remaining?: number;
}

export interface BusinessLogicErrorDetails extends ErrorDetails {
  required?: number;
  current?: number;
  lessonId?: string;
  courseId?: string;
  achievementId?: string;
  reason?: string;
  resource?: string;
  field?: string;
  value?: string;
}

// Base API Error class
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly details?: ErrorDetails;
  public readonly field?: string;
  public readonly isOperational: boolean;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: ErrorDetails,
    field?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Authentication & Authorization Errors
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', details?: ErrorDetails) {
    super(ApiErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Insufficient permissions', details?: ErrorDetails) {
    super(ApiErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN, details);
  }
}

export class InvalidTokenError extends ApiError {
  constructor(message: string = 'Invalid or expired token', details?: ErrorDetails) {
    super(ApiErrorCode.TOKEN_INVALID, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message: string = 'Token has expired', details?: ErrorDetails) {
    super(ApiErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

// Validation Errors
export class ValidationError extends ApiError {
  constructor(message: string, field?: string, details?: ErrorDetails) {
    super(ApiErrorCode.VALIDATION_ERROR, message, HttpStatus.UNPROCESSABLE_ENTITY, details, field);
  }
}

export class InvalidInputError extends ApiError {
  constructor(message: string, field?: string, details?: ErrorDetails) {
    super(ApiErrorCode.INVALID_INPUT, message, HttpStatus.BAD_REQUEST, details, field);
  }
}

export class MissingFieldError extends ApiError {
  constructor(field: string, details?: ErrorDetails) {
    super(
      ApiErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${field}`,
      HttpStatus.BAD_REQUEST,
      details,
      field
    );
  }
}

// Resource Errors
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: ErrorDetails) {
    super(
      ApiErrorCode.RESOURCE_NOT_FOUND,
      `${resource} not found`,
      HttpStatus.NOT_FOUND,
      details
    );
  }
}

export class AlreadyExistsError extends ApiError {
  constructor(resource: string = 'Resource', field?: string, details?: ErrorDetails) {
    super(
      ApiErrorCode.RESOURCE_ALREADY_EXISTS,
      `${resource} already exists`,
      HttpStatus.CONFLICT,
      details,
      field
    );
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: ErrorDetails) {
    super(ApiErrorCode.RESOURCE_CONFLICT, message, HttpStatus.CONFLICT, details);
  }
}

// Rate Limiting Errors
export class RateLimitError extends ApiError {
  constructor(retryAfter: number, details?: RateLimitErrorDetails) {
    super(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      HttpStatus.TOO_MANY_REQUESTS,
      { retryAfter, ...details }
    );
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too many requests', retryAfter?: number, details?: RateLimitErrorDetails) {
    super(
      ApiErrorCode.TOO_MANY_REQUESTS,
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      { retryAfter, ...details }
    );
  }
}

// Server Errors
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: ErrorDetails) {
    super(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      undefined,
      false // Not operational - indicates a programming error
    );
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: ErrorDetails) {
    super(
      ApiErrorCode.DATABASE_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      undefined,
      false
    );
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service temporarily unavailable', details?: ErrorDetails) {
    super(
      ApiErrorCode.SERVICE_UNAVAILABLE,
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      details
    );
  }
}

// File Upload Errors
export class FileTooLargeError extends ApiError {
  constructor(maxSize: number, actualSize: number, details?: FileUploadErrorDetails) {
    super(
      ApiErrorCode.FILE_TOO_LARGE,
      `File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      HttpStatus.BAD_REQUEST,
      { maxSize, actualSize, ...details }
    );
  }
}

export class InvalidFileTypeError extends ApiError {
  constructor(allowedTypes: string[], actualType: string, details?: FileUploadErrorDetails) {
    super(
      ApiErrorCode.INVALID_FILE_TYPE,
      `File type ${actualType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      HttpStatus.BAD_REQUEST,
      { allowedTypes, actualType, ...details }
    );
  }
}

export class UploadFailedError extends ApiError {
  constructor(message: string = 'File upload failed', details?: ErrorDetails) {
    super(
      ApiErrorCode.UPLOAD_FAILED,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details
    );
  }
}

// Feature Flag Errors
export class FeatureDisabledError extends ApiError {
  constructor(feature: string, details?: ErrorDetails) {
    super(
      ApiErrorCode.FEATURE_DISABLED,
      `Feature '${feature}' is currently disabled`,
      HttpStatus.FORBIDDEN,
      { feature, ...details }
    );
  }
}

export class FeatureNotAvailableError extends ApiError {
  constructor(feature: string, userRole?: string, details?: ErrorDetails) {
    super(
      ApiErrorCode.FEATURE_NOT_AVAILABLE,
      `Feature '${feature}' is not available for your account`,
      HttpStatus.FORBIDDEN,
      { feature, userRole, ...details }
    );
  }
}

// Business Logic Errors
export class InsufficientXPError extends ApiError {
  constructor(required: number, current: number, details?: BusinessLogicErrorDetails) {
    super(
      ApiErrorCode.INSUFFICIENT_XP,
      `Insufficient XP. Required: ${required}, Current: ${current}`,
      HttpStatus.FORBIDDEN,
      { required, current, ...details }
    );
  }
}

export class LessonNotCompletedError extends ApiError {
  constructor(lessonId: string, details?: BusinessLogicErrorDetails) {
    super(
      ApiErrorCode.LESSON_NOT_COMPLETED,
      `Lesson ${lessonId} must be completed first`,
      HttpStatus.FORBIDDEN,
      { lessonId, ...details }
    );
  }
}

export class CourseNotAccessibleError extends ApiError {
  constructor(courseId: string, reason: string, details?: BusinessLogicErrorDetails) {
    super(
      ApiErrorCode.COURSE_NOT_ACCESSIBLE,
      `Course ${courseId} is not accessible: ${reason}`,
      HttpStatus.FORBIDDEN,
      { courseId, reason, ...details }
    );
  }
}

export class AchievementAlreadyEarnedError extends ApiError {
  constructor(achievementId: string, details?: BusinessLogicErrorDetails) {
    super(
      ApiErrorCode.ACHIEVEMENT_ALREADY_EARNED,
      `Achievement ${achievementId} has already been earned`,
      HttpStatus.CONFLICT,
      { achievementId, ...details }
    );
  }
}

// Error factory functions
export function createValidationErrors(errors: ValidationErrorDetail[]): ValidationError[] {
  return errors.map(error => new ValidationError(error.message, error.field, { code: error.code }));
}

export function createNotFoundError(resource: string, id?: string): NotFoundError {
  const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
  return new NotFoundError(message, { resource, id });
}

export function createAlreadyExistsError(resource: string, field: string, value: string): AlreadyExistsError {
  const message = `${resource} with ${field} '${value}' already exists`;
  return new AlreadyExistsError(message, field, { resource, field, value });
}

// Error type guards
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

export function isOperationalError(error: any): boolean {
  return isApiError(error) && error.isOperational;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: any): boolean {
  return error instanceof UnauthorizedError || 
         error instanceof InvalidTokenError || 
         error instanceof TokenExpiredError;
}

export function isAuthorizationError(error: any): boolean {
  return error instanceof ForbiddenError;
}

export function isRateLimitError(error: any): boolean {
  return error instanceof RateLimitError || error instanceof TooManyRequestsError;
}

export function isServerError(error: any): boolean {
  return error instanceof InternalServerError || 
         error instanceof DatabaseError || 
         error instanceof ServiceUnavailableError;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export function getErrorSeverity(error: ApiError): ErrorSeverity {
  if (isServerError(error) || error.statusCode >= 500) {
    return ErrorSeverity.CRITICAL;
  }
  
  if (isAuthenticationError(error) || isAuthorizationError(error)) {
    return ErrorSeverity.HIGH;
  }
  
  if (isRateLimitError(error) || error.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
    return ErrorSeverity.MEDIUM;
  }
  
  return ErrorSeverity.LOW;
}

// Error context for logging
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  timestamp: string;
  severity: ErrorSeverity;
  fingerprint?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export function createErrorContext(
  error: ApiError,
  request?: RequestContext,
  additionalContext?: Partial<ErrorContext>
): ErrorContext {
  const severity = getErrorSeverity(error);
  const timestamp = new Date().toISOString();
  
  // Create a fingerprint for grouping similar errors
  const fingerprint = createErrorFingerprint(error);
  
  // Generate tags for categorization
  const tags = createErrorTags(error);
  
  return {
    requestId: request?.requestId,
    userId: request?.userId,
    ip: request?.ip,
    userAgent: request?.userAgent,
    url: request?.url,
    method: request?.method,
    timestamp,
    severity,
    fingerprint,
    tags,
    metadata: {
      code: error.code,
      statusCode: error.statusCode,
      field: error.field,
      details: error.details,
      isOperational: error.isOperational
    },
    ...additionalContext
  };
}

function createErrorFingerprint(error: ApiError): string {
  const parts = [
    error.constructor.name,
    error.code,
    error.field || 'no-field'
  ];
  
  return Buffer.from(parts.join('|')).toString('base64').substring(0, 16);
}

function createErrorTags(error: ApiError): string[] {
  const tags = [`error:${error.code}`, `status:${error.statusCode}`];
  
  if (error.field) {
    tags.push(`field:${error.field}`);
  }
  
  if (isAuthenticationError(error)) {
    tags.push('category:authentication');
  } else if (isAuthorizationError(error)) {
    tags.push('category:authorization');
  } else if (isValidationError(error)) {
    tags.push('category:validation');
  } else if (isRateLimitError(error)) {
    tags.push('category:rate-limit');
  } else if (isServerError(error)) {
    tags.push('category:server');
  }
  
  return tags;
}
