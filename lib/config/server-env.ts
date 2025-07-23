import 'server-only';
import { z } from 'zod';

/**
 * Server-only environment configuration
 * This file should NEVER be imported in client components
 */

// Define comprehensive environment schema
const environmentSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Application Configuration
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  HOSTNAME: z.string().default('localhost'),
  
  // Public URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Solidity Learning Platform'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('2.0.0'),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  DATABASE_POOL_TIMEOUT: z.coerce.number().default(30000),
  
  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  
  // Security Configuration
  NEXTAUTH_SECRET: z.string().min(32, 'Auth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url(),
  SESSION_TIMEOUT: z.coerce.number().default(86400),
  SESSION_UPDATE_AGE: z.coerce.number().default(3600),
  CSRF_TOKEN_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters').optional(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),
  
  // OAuth Providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Email Configuration
  EMAIL_FROM: z.string().email().default('noreply@example.com'),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().default(587),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  
  // AI Service Keys
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY: z.string().optional(),
  
  // Monitoring and Analytics
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Rate Limiting Configuration
  ENABLE_RATE_LIMITING: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Performance Configuration
  ENABLE_PERFORMANCE_MONITORING: z.coerce.boolean().default(true),
});

// Type-safe environment variables
export type Environment = z.infer<typeof environmentSchema>;

// Validate and parse environment
let env: Environment;

try {
  env = environmentSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  console.error('🔧 Please check your environment variables in .env files');
  process.exit(1);
}

// Export validated environment
export { env };