/**
 * TypeScript types generated from Zod schemas for end-to-end type safety
 */

import { z } from 'zod';
import { IdSchema, EmailSchema, PasswordSchema, PaginationSchema, SearchSchema, CreateUserSchema, UpdateUserSchema, UpdateUserProfileSchema, UpdateUserPreferencesSchema, ChangePasswordSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema, RefreshTokenSchema, CreateLessonSchema, UpdateLessonSchema, PublishLessonSchema, UpdateCourseSchema, UpdateProgressSchema, CompleteProgressSchema, UpdateAchievementSchema, StatsFiltersSchema, ImageUploadSchema, ProfileSettingsSchema, SecuritySettingsSchema, LearningSettingsSchema, EditorSettingsSchema } from './validation';

// Base types
export type Id = z.infer<typeof IdSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type SearchQuery = z.infer<typeof SearchSchema>;

// User types
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type UpdateUserPreferencesRequest = z.infer<typeof UpdateUserPreferencesSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;

// Authentication types
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;

// Lesson types
export type CreateLessonRequest = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonRequest = z.infer<typeof UpdateLessonSchema>;
export type PublishLessonRequest = z.infer<typeof PublishLessonSchema>;

// Course types
export type CreateCourseRequest = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseRequest = z.infer<typeof UpdateCourseSchema>;

// Progress types
export type CreateProgressRequest = z.infer<typeof CreateProgressSchema>;
export type UpdateProgressRequest = z.infer<typeof UpdateProgressSchema>;
export type CompleteProgressRequest = z.infer<typeof CompleteProgressSchema>;

// Achievement types
export type CreateAchievementRequest = z.infer<typeof CreateAchievementSchema>;
export type UpdateAchievementRequest = z.infer<typeof UpdateAchievementSchema>;

// Community types
export type LeaderboardFilters = z.infer<typeof LeaderboardFiltersSchema>;
export type StatsFilters = z.infer<typeof StatsFiltersSchema>;

// Rate limiting types
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

// File upload types
export type FileUploadRequest = z.infer<typeof FileUploadSchema>;
export type ImageUploadRequest = z.infer<typeof ImageUploadSchema>;

// Settings types
export type SettingsUpdateRequest = z.infer<typeof SettingsUpdateSchema>;
export type ProfileSettingsRequest = z.infer<typeof ProfileSettingsSchema>;
export type SecuritySettingsRequest = z.infer<typeof SecuritySettingsSchema>;
export type LearningSettingsRequest = z.infer<typeof LearningSettingsSchema>;
export type EditorSettingsRequest = z.infer<typeof EditorSettingsSchema>;

// Search types
export type SearchRequest = z.infer<typeof SearchQuerySchema>;

// Error reporting types
export type ErrorReportRequest = z.infer<typeof ErrorReportSchema>;

// Metrics types
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;

// Feature flag types
export type FeatureFlagQuery = z.infer<typeof FeatureFlagQuerySchema>;

// API Response types (matching the API response format)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  meta?: {
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
  timestamp: string;
  requestId: string;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Request context type for middleware
export interface ValidatedRequest<T = any> extends Request {
  validatedData: T;
}

// Generic paginated response type
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Search response type
export interface SearchResponse<T> {
  results: T[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
  filters?: Record<string, any>;
}

// Error metrics response type
export interface ErrorMetricsResponse {
  totalErrors: number;
  errorRate: number;
  topErrors: Array<{
    fingerprint: string;
    count: number;
    message: string;
    lastSeen: string;
  }>;
  errorsByPage: Record<string, number>;
  errorsByBrowser: Record<string, number>;
  errorsByUser: Record<string, number>;
}

// API metrics response type
export interface ApiMetricsResponse {
  summary: {
    timeRange: string;
    granularity: string;
    totalRequests: number;
    totalErrors: number;
    totalWarnings: number;
    errorRate: number;
    averageResponseTime: number;
    uptime: number;
    lastUpdated: string;
  };
  errors: ErrorMetricsResponse;
  performance: {
    averageResponseTime: number;
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      requestCount: number;
      maxTime: number;
      minTime: number;
    }>;
    responseTimePercentiles: {
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  traffic: {
    totalRequests: number;
    requestsPerMinute: number;
    statusCodes: Record<string, number>;
    topPages: Array<{
      page: string;
      requests: number;
    }>;
  };
  timeSeries: Array<{
    timestamp: string;
    requests: number;
    errors: number;
    averageResponseTime: number;
    statusCodes: Record<string, number>;
  }>;
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    nodeVersion: string;
    platform: string;
    environment: string;
  };
}

// Feature flag response type
export interface FeatureFlagResponse {
  key: string;
  name: string;
  description: string;
  state: 'disabled' | 'coming_soon' | 'beta' | 'development' | 'enabled';
  enabledForRoles?: string[];
  enabledForUsers?: string[];
  releaseDate?: string;
  metadata?: Record<string, any>;
}

// Rate limit info type
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// File upload response type
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

// Type guards for runtime type checking
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.success === 'boolean' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.requestId === 'string'
  );
}

export function isValidationError(obj: any): obj is ValidationError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.field === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.code === 'string'
  );
}

export function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray(obj.items) &&
    typeof obj.pagination === 'object' &&
    obj.pagination !== null &&
    typeof obj.pagination.currentPage === 'number' &&
    typeof obj.pagination.totalPages === 'number'
  );
}

// Utility types for API endpoints
export type ApiEndpoint<TRequest = any, TResponse = any> = (
  request: TRequest
) => Promise<ApiResponse<TResponse>>;

export type ValidatedApiEndpoint<TRequest = any, TResponse = any> = (
  request: ValidatedRequest<TRequest>
) => Promise<ApiResponse<TResponse>>;

// Schema registry for dynamic validation
export const SchemaRegistry = {
  // Base
  id: IdSchema,
  email: EmailSchema,
  password: PasswordSchema,
  pagination: PaginationSchema,
  search: SearchSchema,
  
  // User
  createUser: CreateUserSchema,
  updateUser: UpdateUserSchema,
  updateUserProfile: UpdateUserProfileSchema,
  updateUserPreferences: UpdateUserPreferencesSchema,
  changePassword: ChangePasswordSchema,
  
  // Authentication
  login: LoginSchema,
  register: RegisterSchema,
  forgotPassword: ForgotPasswordSchema,
  resetPassword: ResetPasswordSchema,
  refreshToken: RefreshTokenSchema,
  
  // Lesson
  createLesson: CreateLessonSchema,
  updateLesson: UpdateLessonSchema,
  publishLesson: PublishLessonSchema,
  
  // Course
  createCourse: CreateCourseSchema,
  updateCourse: UpdateCourseSchema,
  
  // Progress
  createProgress: CreateProgressSchema,
  updateProgress: UpdateProgressSchema,
  completeProgress: CompleteProgressSchema,
  
  // Achievement
  createAchievement: CreateAchievementSchema,
  updateAchievement: UpdateAchievementSchema,
  
  // Community
  leaderboardFilters: LeaderboardFiltersSchema,
  statsFilters: StatsFiltersSchema,
  
  // File upload
  fileUpload: FileUploadSchema,
  imageUpload: ImageUploadSchema,
  
  // Settings
  settingsUpdate: SettingsUpdateSchema,
  profileSettings: ProfileSettingsSchema,
  securitySettings: SecuritySettingsSchema,
  learningSettings: LearningSettingsSchema,
  editorSettings: EditorSettingsSchema,
  
  // Search
  searchQuery: SearchQuerySchema,
  
  // Error reporting
  errorReport: ErrorReportSchema,
  
  // Metrics
  metricsQuery: MetricsQuerySchema,
  
  // Feature flags
  featureFlagQuery: FeatureFlagQuerySchema
} as const;

export type SchemaKey = keyof typeof SchemaRegistry;
