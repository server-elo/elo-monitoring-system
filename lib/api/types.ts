// Enum Types
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  meta?: ResponseMeta;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: ValidationError[] | Record<string, unknown>;
  stack?: string; // Only in development
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Request Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterQuery {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Re-export ApiError from errors module
export { ApiError } from './errors';

// API Error Codes
export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  BAD_REQUEST = 'BAD_REQUEST',

  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // File Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Feature Flag Errors
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',

  // Business Logic
  INSUFFICIENT_XP = 'INSUFFICIENT_XP',
  LESSON_NOT_COMPLETED = 'LESSON_NOT_COMPLETED',
  COURSE_NOT_ACCESSIBLE = 'COURSE_NOT_ACCESSIBLE',
  ACHIEVEMENT_ALREADY_EARNED = 'ACHIEVEMENT_ALREADY_EARNED'
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  REQUEST_TIMEOUT = 408
}


export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// User Types
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordHash?: string;
  tokenVersion?: number;
}

export interface UserProfile {
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  xpTotal: number;
  level: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  achievementsCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  achievementNotifications: boolean;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

// Lesson Types
export interface ApiLesson {
  id: string;
  title: string;
  description: string;
  content: string;
  type: LessonType;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in minutes
  xpReward: number;
  prerequisites: string[];
  tags: string[];
  courseId: string;
  instructorId: string;
  status: LessonStatus;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  completionCount: number;
  averageRating: number;
  ratingCount: number;
}

export enum LessonType {
  THEORY = 'THEORY',
  PRACTICAL = 'PRACTICAL',
  QUIZ = 'QUIZ',
  PROJECT = 'PROJECT',
  CHALLENGE = 'CHALLENGE'
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum LessonStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// Progress Types
export interface ApiProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  status: ProgressStatus;
  completedAt?: string;
  startedAt: string;
  timeSpent: number; // in seconds
  score?: number;
  attempts: number;
  xpEarned: number;
  achievements: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Course Types
export interface ApiCourse {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  category: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in minutes
  totalLessons: number;
  totalXp: number;
  prerequisites: string[];
  learningObjectives: string[];
  instructorId: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  status: CourseStatus;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  completionCount: number;
  averageRating: number;
  ratingCount: number;
  price?: number;
  currency?: string;
  tags: string[];
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// Achievement Types
export interface ApiAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  type: AchievementType;
  rarity: AchievementRarity;
  xpReward: number;
  requirements: AchievementRequirement[];
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum AchievementCategory {
  LEARNING = 'LEARNING',
  STREAK = 'STREAK',
  COMPLETION = 'COMPLETION',
  COMMUNITY = 'COMMUNITY',
  SPECIAL = 'SPECIAL'
}

export enum AchievementType {
  MILESTONE = 'MILESTONE',
  PROGRESSIVE = 'PROGRESSIVE',
  CHALLENGE = 'CHALLENGE'
}

export enum AchievementRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export interface AchievementRequirement {
  type: string;
  value: number;
  description: string;
}

// Request/Response Logging
export interface ApiLog {
  id: string;
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  statusCode: number;
  responseTime: number; // in milliseconds
  requestBody?: any;
  responseBody?: any;
  error?: string;
  timestamp: string;
}

// Rate Limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // seconds
}

// Health Check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    external?: Record<string, ServiceHealth>;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

// Metrics Types
export interface MetricsResponseData {
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
  errors?: {
    total: number;
    rate: number;
    topErrors: Array<{ type: string; count: number; message: string }>;
    errorsByPage: Record<string, number>;
    errorsByBrowser: Record<string, number>;
  };
  performance?: {
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
  traffic?: {
    totalRequests: number;
    requestsPerMinute: number;
    statusCodes: Record<number, number>;
    topPages: Array<{ page: string; requests: number }>;
  };
  timeSeries?: Array<{
    timestamp: string;
    requests: number;
    errors: number;
    responseTime: number;
  }>;
  system?: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    nodeVersion: string;
    platform: NodeJS.Platform;
    environment: string;
  };
  // Additional top-level properties for filtered responses
  statusCodes?: Record<number, number>;
}

// Activity Feed Types
export interface ActivityItem {
  id: string;
  type: 'lesson' | 'achievement' | 'social';
  description: string;
  timestamp: Date | null;
  metadata: Record<string, unknown>;
}

// LLM Integration Types
export interface LLMModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export interface LLMModelsResponse {
  data?: LLMModel[];
  object?: string;
}

// File Upload Types
export interface FileUploadRequest {
  file: any; // File type not available in server context
  type: 'avatar' | 'course-thumbnail' | 'lesson-video' | 'course-material';
  metadata?: Record<string, any>;
}

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

// Search Types
export interface SearchRequest extends PaginationQuery {
  q: string;
  type?: 'courses' | 'lessons' | 'users' | 'all';
  filters?: Record<string, any>;
  includeContent?: boolean;
}

export interface SearchResult {
  id: string;
  type: 'course' | 'lesson' | 'user';
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
  totalResults: number;
  searchTime: number;
}

// Feature Flag Types
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

// Error Tracking Types
export interface ErrorReportRequest {
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: {
    url: string;
    userAgent: string;
    component?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
}

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
}

// Settings Types
export interface SettingsUpdateRequest {
  section: 'profile' | 'security' | 'learning' | 'editor' | 'collaboration' | 'notifications' | 'accessibility' | 'privacy';
  data: Record<string, any>;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// API Configuration
export interface ApiConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  baseUrl: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  database: {
    url: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
    includeRequestBody: boolean;
    includeResponseBody: boolean;
    sensitiveFields: string[];
  };
}
