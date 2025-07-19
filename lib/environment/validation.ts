/**
 * Environment validation using Zod schemas
 * Ensures all required environment variables are properly configured
 */

import { z } from 'zod';

// Base environment schema
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  SHADOW_DATABASE_URL: z.string().optional(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  
  // Redis (Optional but recommended for production)
  REDIS_URL: z.string().optional(),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // File upload
  UPLOAD_MAX_SIZE: z.string().regex(/^\d+$/).transform(Number).default('5242880'), // 5MB
  
  // Rate limiting
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().regex(/^\d+$/).transform(Number).default('900000'), // 15 minutes
  
  // Security
  ENCRYPTION_KEY: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Feature flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_COLLABORATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('true'),
});

// Development-specific schema
const developmentEnvSchema = baseEnvSchema.extend({
  // Less strict requirements for development
  NEXTAUTH_SECRET: z.string().min(1).default('development-secret-key-not-for-production'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
});

// Production-specific schema
const productionEnvSchema = baseEnvSchema.extend({
  // Strict requirements for production
  NEXTAUTH_SECRET: z.string().min(64, 'Production NextAuth secret must be at least 64 characters'),
  REDIS_URL: z.string().min(1, 'Redis URL is required in production'),
  SENTRY_DSN: z.string().url('Sentry DSN is required in production'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key is required in production'),
  
  // HTTPS only in production
  NEXT_PUBLIC_APP_URL: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'App URL must use HTTPS in production'
  }),
  NEXTAUTH_URL: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'NextAuth URL must use HTTPS in production'
  }),
  
  // Database must be PostgreSQL in production
  DATABASE_URL: z.string().refine(url => url.includes('postgresql://'), {
    message: 'Production database must be PostgreSQL'
  }),
});

// Test environment schema
const testEnvSchema = baseEnvSchema.extend({
  NODE_ENV: z.literal('test'),
  DATABASE_URL: z.string().default('file:./test.db'),
  NEXTAUTH_SECRET: z.string().default('test-secret'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
});

/**
 * Get the appropriate schema based on environment
 */
function getEnvSchema() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  switch (nodeEnv) {
    case 'production':
      return productionEnvSchema;
    case 'test':
      return testEnvSchema;
    default:
      return developmentEnvSchema;
  }
}

/**
 * Validate and parse environment variables
 */
export function validateEnvironment() {
  const schema = getEnvSchema();
  
  try {
    const env = schema.parse(process.env);
    return {
      success: true,
      data: env,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{ field: 'unknown', message: error.message, code: 'unknown' }]
    };
  }
}

/**
 * Environment validation result type
 */
export type EnvironmentValidationResult = ReturnType<typeof validateEnvironment>;

/**
 * Validated environment type
 */
export type ValidatedEnvironment = z.infer<typeof baseEnvSchema>;

/**
 * Create a runtime environment object with validation
 */
export function createEnvironment(): ValidatedEnvironment {
  const result = validateEnvironment();
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => {
      console.error(`  - ${error.field}: ${error.message}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production. Cannot start application.');
    }
    
    // In development, log warnings but don't crash
    console.warn('⚠️  Continuing with invalid environment in development mode');
    return process.env as any; // Fallback for development
  }
  
  return result.data;
}

/**
 * Check if we're in a specific environment
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  const env = createEnvironment();
  
  return {
    url: env.DATABASE_URL,
    shadowUrl: env.SHADOW_DATABASE_URL,
    isPostgreSQL: env.DATABASE_URL.includes('postgresql://'),
    isSQLite: env.DATABASE_URL.includes('file:') || env.DATABASE_URL.includes('sqlite:'),
  };
}

/**
 * Get Redis configuration
 */
export function getRedisConfig() {
  const env = createEnvironment();
  
  if (!env.REDIS_URL) {
    return null;
  }
  
  try {
    const url = new URL(env.REDIS_URL);
    return {
      url: env.REDIS_URL,
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      database: url.pathname ? parseInt(url.pathname.slice(1)) : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  const env = createEnvironment();
  
  return {
    nextAuthSecret: env.NEXTAUTH_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
    jwtSecret: env.JWT_SECRET,
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    uploadMaxSize: env.UPLOAD_MAX_SIZE,
  };
}

/**
 * Get feature flags
 */
export function getFeatureFlags() {
  const env = createEnvironment();
  
  return {
    analytics: env.ENABLE_ANALYTICS,
    collaboration: env.ENABLE_COLLABORATION,
    aiFeatures: env.ENABLE_AI_FEATURES,
  };
}

/**
 * Environment health check
 */
export function checkEnvironmentHealth(): {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const result = validateEnvironment();
  
  if (!result.success) {
    issues.push('Environment validation failed');
    recommendations.push('Fix environment variable validation errors');
  }
  
  // Check database configuration
  const dbConfig = getDatabaseConfig();
  if (isProduction() && dbConfig.isSQLite) {
    issues.push('Using SQLite in production');
    recommendations.push('Migrate to PostgreSQL for production');
  }
  
  // Check Redis configuration
  const redisConfig = getRedisConfig();
  if (isProduction() && !redisConfig) {
    issues.push('Redis not configured in production');
    recommendations.push('Configure Redis for session storage and caching');
  }
  
  // Check security configuration
  const securityConfig = getSecurityConfig();
  if (isProduction() && !securityConfig.encryptionKey) {
    issues.push('Encryption key not set in production');
    recommendations.push('Set ENCRYPTION_KEY for production security');
  }
  
  // Check HTTPS usage
  const env = createEnvironment();
  if (isProduction() && !env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
    issues.push('Not using HTTPS in production');
    recommendations.push('Configure HTTPS for production deployment');
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Log environment status
 */
export function logEnvironmentStatus() {
  const env = createEnvironment();
  const health = checkEnvironmentHealth();
  
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 App URL: ${env.NEXT_PUBLIC_APP_URL}`);
  console.log(`💾 Database: ${getDatabaseConfig().isPostgreSQL ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`🔴 Redis: ${getRedisConfig() ? 'Configured' : 'Not configured'}`);
  
  if (health.healthy) {
    console.log('✅ Environment is healthy');
  } else {
    console.log('⚠️  Environment issues detected:');
    health.issues.forEach(issue => console.log(`  - ${issue}`));
    
    if (health.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      health.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }
}