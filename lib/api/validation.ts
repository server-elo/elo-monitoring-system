import { z } from 'zod';
import { ValidationError, ValidationException } from './response';
import { UserRole, UserStatus, DifficultyLevel, LessonType, ProgressStatus } from './types';

// Base Schemas
export const IdSchema = z.string().uuid('Invalid ID format');
export const EmailSchema = z.string().email('Invalid email format');
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export const SearchSchema = z.object({
  search: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

// User Schemas
export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT)
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: EmailSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional()
});

export const UpdateUserProfileSchema = z.object({
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  github: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  linkedin: z.string().max(100).optional()
});

export const UpdateUserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().length(2).optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  achievementNotifications: z.boolean().optional()
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Authentication Schemas
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false)
});

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2).max(50),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: PasswordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Lesson Schemas
export const CreateLessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  type: z.nativeEnum(LessonType),
  difficulty: z.nativeEnum(DifficultyLevel),
  estimatedDuration: z.number().int().min(1, 'Duration must be at least 1 minute').max(480, 'Duration must be less than 8 hours'),
  xpReward: z.number().int().min(10, 'XP reward must be at least 10').max(1000, 'XP reward must be less than 1000'),
  prerequisites: z.array(IdSchema).default([]),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').default([]),
  courseId: IdSchema
});

export const UpdateLessonSchema = CreateLessonSchema.partial();

export const PublishLessonSchema = z.object({
  isPublished: z.boolean()
});

// Course Schemas
export const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  shortDescription: z.string().min(10).max(300),
  thumbnail: z.string().url().optional(),
  category: z.string().min(1).max(50),
  difficulty: z.nativeEnum(DifficultyLevel),
  prerequisites: z.array(IdSchema).default([]),
  learningObjectives: z.array(z.string().min(5).max(200)).min(1, 'At least one learning objective is required').max(10),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).default([])
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

// Progress Schemas
export const CreateProgressSchema = z.object({
  lessonId: IdSchema,
  courseId: IdSchema,
  status: z.nativeEnum(ProgressStatus).default(ProgressStatus.IN_PROGRESS),
  timeSpent: z.number().int().min(0).default(0),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional()
});

export const UpdateProgressSchema = z.object({
  status: z.nativeEnum(ProgressStatus).optional(),
  timeSpent: z.number().int().min(0).optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional()
});

export const CompleteProgressSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  timeSpent: z.number().int().min(0),
  notes: z.string().max(1000).optional()
});

// Achievement Schemas
export const CreateAchievementSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  icon: z.string().min(1).max(10),
  category: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  rarity: z.string().min(1).max(50),
  xpReward: z.number().int().min(0).max(5000),
  requirements: z.array(z.object({
    type: z.string().min(1),
    value: z.number().min(0),
    description: z.string().min(1).max(200)
  })).min(1),
  isSecret: z.boolean().default(false)
});

export const UpdateAchievementSchema = CreateAchievementSchema.partial();

// Community Schemas
export const LeaderboardFiltersSchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('all-time'),
  category: z.string().default('global_xp'),
  userRole: z.enum(['student', 'instructor', 'admin', 'all']).default('all'),
  region: z.string().optional(),
  minXP: z.number().int().min(0).optional(),
  maxXP: z.number().int().min(0).optional(),
  search: z.string().max(100).optional()
});

export const StatsFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userRole: z.enum(['student', 'instructor', 'admin']).optional(),
  region: z.string().optional(),
  courseCategories: z.array(z.string()).optional(),
  difficultyLevels: z.array(z.nativeEnum(DifficultyLevel)).optional(),
  engagementTypes: z.array(z.enum(['lessons', 'quizzes', 'projects', 'community'])).optional()
});

// Validation Helper Functions
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: err.input
      }));
      
      throw new ValidationException('Validation failed', validationErrors);
    }
    throw error;
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const data: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Handle array parameters (e.g., tags[]=tag1&tags[]=tag2)
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      data[arrayKey].push(value);
    } else {
      data[key] = value;
    }
  }
  
  return validateSchema(schema, data);
}

export function validateBody<T>(schema: z.ZodSchema<T>, request: Request): Promise<T> {
  return request.json().then(data => validateSchema(schema, data));
}

// Sanitization Functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
  }
  
  return sanitized;
}

// Rate Limiting Schemas
export const RateLimitConfigSchema = z.object({
  windowMs: z.number().int().min(1000), // Minimum 1 second
  max: z.number().int().min(1),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
  keyGenerator: z.function().optional()
});

// File Upload Schemas
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().int().min(1).default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
  folder: z.string().default('uploads')
});

export const ImageUploadSchema = FileUploadSchema.extend({
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  maxWidth: z.number().int().min(1).optional(),
  maxHeight: z.number().int().min(1).optional(),
  quality: z.number().min(0.1).max(1).default(0.8)
});

// Settings Schemas
export const SettingsUpdateSchema = z.object({
  section: z.enum(['profile', 'security', 'learning', 'editor', 'collaboration', 'notifications', 'accessibility', 'privacy']),
  data: z.record(z.any())
});

export const ProfileSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  github: z.string().max(50, 'GitHub username must be less than 50 characters').optional(),
  twitter: z.string().max(50, 'Twitter username must be less than 50 characters').optional(),
  linkedin: z.string().max(100, 'LinkedIn profile must be less than 100 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
});

export const SecuritySettingsSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: PasswordSchema.optional(),
  confirmPassword: z.string().optional(),
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().min(5, 'Session timeout must be at least 5 minutes').max(1440, 'Session timeout cannot exceed 24 hours').optional(),
  loginNotifications: z.boolean().optional()
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const LearningSettingsSchema = z.object({
  learningGoals: z.array(z.string()).optional(),
  skillLevel: z.nativeEnum(DifficultyLevel).optional(),
  preferredDifficulty: z.nativeEnum(DifficultyLevel).optional(),
  dailyGoal: z.number().min(5, 'Daily goal must be at least 5 minutes').max(480, 'Daily goal cannot exceed 8 hours').optional(),
  weeklyGoal: z.number().min(30, 'Weekly goal must be at least 30 minutes').max(3360, 'Weekly goal cannot exceed 56 hours').optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  timezone: z.string().optional(),
  progressTracking: z.object({
    showDetailedStats: z.boolean().optional(),
    trackTimeSpent: z.boolean().optional(),
    showStreak: z.boolean().optional(),
    showXP: z.boolean().optional()
  }).optional()
});

export const EditorSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  fontSize: z.number().min(10, 'Font size must be at least 10px').max(24, 'Font size cannot exceed 24px').optional(),
  fontFamily: z.enum(['monospace', 'fira-code', 'source-code-pro', 'jetbrains-mono']).optional(),
  tabSize: z.number().min(2, 'Tab size must be at least 2').max(8, 'Tab size cannot exceed 8').optional(),
  wordWrap: z.boolean().optional(),
  lineNumbers: z.boolean().optional(),
  minimap: z.boolean().optional(),
  autoSave: z.boolean().optional(),
  autoSaveDelay: z.number().min(500, 'Auto-save delay must be at least 500ms').max(10000, 'Auto-save delay cannot exceed 10 seconds').optional(),
  keyBindings: z.enum(['default', 'vim', 'emacs']).optional()
});

// Search Schemas
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').max(200, 'Search query too long').trim(),
  type: z.enum(['courses', 'lessons', 'users', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  filters: z.record(z.any()).optional(),
  includeContent: z.boolean().optional().default(false)
});

// Error Reporting Schemas
export const ErrorReportSchema = z.object({
  level: z.enum(['error', 'warning', 'info']),
  message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
  stack: z.string().optional(),
  context: z.object({
    url: z.string().url('Invalid URL'),
    userAgent: z.string().min(1, 'User agent is required'),
    component: z.string().optional(),
    action: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

// Metrics Query Schema
export const MetricsQuerySchema = z.object({
  timeRange: z.string().optional().default('24h'), // 1h, 24h, 7d, 30d
  granularity: z.enum(['hour', 'day', 'week']).optional().default('hour'),
  metrics: z.array(z.enum(['errors', 'requests', 'response_time', 'status_codes'])).optional()
});

// Feature Flag Schemas
export const FeatureFlagQuerySchema = z.object({
  userRole: z.nativeEnum(UserRole).optional(),
  userId: IdSchema.optional()
});

// Validation Middleware
import { NextRequest, NextResponse } from 'next/server';
import { validationErrorResponse, generateRequestId } from './utils';

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest, handler: Function): Promise<NextResponse> => {
    const requestId = generateRequestId();

    try {
      let data: any;

      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        // Validate request body
        const contentType = request.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          data = await request.json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          data = Object.fromEntries(formData.entries());
        } else {
          return validationErrorResponse([{
            field: 'content-type',
            message: 'Unsupported content type',
            code: 'invalid_content_type'
          }], requestId);
        }
      } else {
        // Validate query parameters
        const url = new URL(request.url);
        data = Object.fromEntries(url.searchParams.entries());

        // Handle array parameters
        for (const [key, value] of url.searchParams.entries()) {
          if (key.endsWith('[]')) {
            const arrayKey = key.slice(0, -2);
            if (!data[arrayKey]) {
              data[arrayKey] = [];
            }
            if (Array.isArray(data[arrayKey])) {
              data[arrayKey].push(value);
            } else {
              data[arrayKey] = [data[arrayKey], value];
            }
          }
        }
      }

      const validation = schema.safeParse(data);

      if (!validation.success) {
        const errors = validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return validationErrorResponse(errors, requestId);
      }

      // Add validated data to request
      (request as any).validatedData = validation.data;

      return handler(request);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return validationErrorResponse([{
          field: 'body',
          message: 'Invalid JSON format',
          code: 'invalid_json'
        }], requestId);
      }

      throw error;
    }
  };
}

// Enhanced validation utilities
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{ field: string; message: string; code: string }>
} {
  try {
    // First sanitize the data if it's an object
    let sanitizedData = data;
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      sanitizedData = sanitizeObject(data as Record<string, any>);
    }

    const validation = schema.safeParse(sanitizedData);

    if (validation.success) {
      return { success: true, data: validation.data };
    }

    const errors = validation.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return { success: false, errors };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'root',
        message: 'Validation failed',
        code: 'validation_error'
      }]
    };
  }
}

// Type-safe request validation
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const requestId = generateRequestId();

  try {
    let data: any;

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      data = await request.json();
    } else {
      const url = new URL(request.url);
      data = Object.fromEntries(url.searchParams.entries());
    }

    const result = validateAndSanitize(schema, data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      response: validationErrorResponse(result.errors, requestId)
    };
  } catch (error) {
    return {
      success: false,
      response: validationErrorResponse([{
        field: 'body',
        message: 'Invalid request format',
        code: 'invalid_format'
      }], requestId)
    };
  }
}

// Schema composition utilities
export function createPaginatedSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) {
  return baseSchema.extend({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  });
}

export function createSearchableSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) {
  return baseSchema.extend({
    search: z.string().min(1).max(200).optional(),
    filters: z.record(z.any()).optional()
  });
}

// Response validation (for ensuring API contract compliance)
export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Response validation failed:', error);
    // In development, throw the error to catch contract violations
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    // In production, log the error but return the data as-is
    return data as T;
  }
}
