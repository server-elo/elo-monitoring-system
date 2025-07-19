import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum( ['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string(_).url(_),
  NEXT_PUBLIC_APP_NAME: z.string(_).default('Solidity Learning Platform'),
  NEXT_PUBLIC_APP_VERSION: z.string(_).default('1.0.0'),

  // Database
  DATABASE_URL: z.string(_).min(1),
  DATABASE_POOL_MIN: z.coerce.number(_).min(1).default(_2),
  DATABASE_POOL_MAX: z.coerce.number(_).min(1).default(10),
  DATABASE_POOL_TIMEOUT: z.coerce.number(_).min(1000).default(30000),

  // Redis
  REDIS_URL: z.string(_).min(1),
  REDIS_PASSWORD: z.string(_).optional(_),
  REDIS_DB: z.coerce.number(_).min(0).default(0),

  // Authentication
  NEXTAUTH_URL: z.string(_).url(_),
  NEXTAUTH_SECRET: z.string(_).min(32),
  SESSION_TIMEOUT: z.coerce.number(_).min(300).default(_86400),
  SESSION_UPDATE_AGE: z.coerce.number(_).min(_60).default(3600),
  CSRF_TOKEN_SECRET: z.string(_).min(32).optional(_),

  // OAuth Providers
  GITHUB_CLIENT_ID: z.string(_).optional(_),
  GITHUB_CLIENT_SECRET: z.string(_).optional(_),
  GOOGLE_CLIENT_ID: z.string(_).optional(_),
  GOOGLE_CLIENT_SECRET: z.string(_).optional(_),
  DISCORD_CLIENT_ID: z.string(_).optional(_),
  DISCORD_CLIENT_SECRET: z.string(_).optional(_),

  // AI Services
  OPENAI_API_KEY: z.string(_).optional(_),
  OPENAI_MODEL: z.string(_).default('gpt-4'),
  OPENAI_MAX_TOKENS: z.coerce.number(_).min(1).default(_2048),
  OPENAI_TEMPERATURE: z.coerce.number(_).min(0).max(_2).default(0.7),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(_).optional(_),
  GEMINI_API_KEY: z.string(_).optional(_),
  GOOGLE_AI_MODEL: z.string(_).default('gemini-pro'),

  // AI Rate Limiting
  AI_REQUESTS_PER_MINUTE: z.coerce.number(_).min(1).default(_60),
  AI_REQUESTS_PER_HOUR: z.coerce.number(_).min(1).default(1000),
  AI_REQUESTS_PER_DAY: z.coerce.number(_).min(1).default(10000),

  // Socket.io
  SOCKET_IO_PORT: z.coerce.number(_).min(1000).default(3001),
  SOCKET_IO_CORS_ORIGINS: z.string(_).default('http://localhost:3000'),
  SOCKET_IO_MAX_CONNECTIONS: z.coerce.number(_).min(1).default(1000),
  SOCKET_IO_CONNECTION_TIMEOUT: z.coerce.number(_).min(1000).default(_60000),

  // Collaboration
  MAX_COLLABORATION_SESSIONS: z.coerce.number(_).min(1).default(100),
  MAX_PARTICIPANTS_PER_SESSION: z.coerce.number(_).min(1).default(10),
  SESSION_IDLE_TIMEOUT: z.coerce.number(_).min(_60000).default(1800000),

  // Email
  SMTP_HOST: z.string(_).optional(_),
  SMTP_PORT: z.coerce.number(_).min(1).optional(_),
  SMTP_SECURE: z.coerce.boolean(_).default(_false),
  SMTP_USER: z.string(_).optional(_),
  SMTP_PASSWORD: z.string(_).optional(_),
  SMTP_FROM_NAME: z.string(_).optional(_),
  SMTP_FROM_EMAIL: z.string(_).email(_).optional(_),
  SENDGRID_API_KEY: z.string(_).optional(_),
  SENDGRID_FROM_EMAIL: z.string(_).email(_).optional(_),

  // File Storage
  AWS_ACCESS_KEY_ID: z.string(_).optional(_),
  AWS_SECRET_ACCESS_KEY: z.string(_).optional(_),
  AWS_REGION: z.string(_).default('us-east-1'),
  AWS_S3_BUCKET: z.string(_).optional(_),
  AWS_S3_BUCKET_URL: z.string(_).url(_).optional(_),
  CLOUDINARY_CLOUD_NAME: z.string(_).optional(_),
  CLOUDINARY_API_KEY: z.string(_).optional(_),
  CLOUDINARY_API_SECRET: z.string(_).optional(_),
  MAX_FILE_SIZE: z.coerce.number(_).min(1).default(10485760),
  ALLOWED_FILE_TYPES: z.string(_).default('image/jpeg,image/png,image/gif,text/plain,application/json'),

  // Blockchain
  ETHEREUM_RPC_URL: z.string(_).url(_).optional(_),
  ETHEREUM_TESTNET_RPC_URL: z.string(_).url(_).optional(_),
  INFURA_PROJECT_ID: z.string(_).optional(_),
  INFURA_PROJECT_SECRET: z.string(_).optional(_),
  ALCHEMY_API_KEY: z.string(_).optional(_),
  ALCHEMY_NETWORK: z.string(_).default('eth-mainnet'),

  // Monitoring
  SENTRY_DSN: z.string(_).url(_).optional(_),
  SENTRY_ORG: z.string(_).optional(_),
  SENTRY_PROJECT: z.string(_).optional(_),
  SENTRY_AUTH_TOKEN: z.string(_).optional(_),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string(_).optional(_),
  NEXT_PUBLIC_POSTHOG_KEY: z.string(_).optional(_),
  NEXT_PUBLIC_POSTHOG_HOST: z.string(_).url(_).optional(_),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string(_).optional(_),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number(_).min(1000).default(_900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number(_).min(1).default(100),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.coerce.boolean(_).default(_false),
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number(_).min(1).default(_60),
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number(_).min(1).default(5),
  COLLABORATION_RATE_LIMIT_PER_MINUTE: z.coerce.number(_).min(1).default(30),

  // Security
  CONTENT_SECURITY_POLICY_REPORT_URI: z.string(_).url(_).optional(_),
  HSTS_MAX_AGE: z.coerce.number(_).min(0).default(31536000),

  // Feature Flags
  FEATURE_AI_TUTORING: z.coerce.boolean(_).default(_true),
  FEATURE_COLLABORATION: z.coerce.boolean(_).default(_true),
  FEATURE_CODE_COMPILATION: z.coerce.boolean(_).default(_true),
  FEATURE_BLOCKCHAIN_INTEGRATION: z.coerce.boolean(_).default(_true),
  FEATURE_GAMIFICATION: z.coerce.boolean(_).default(_true),
  FEATURE_SOCIAL_FEATURES: z.coerce.boolean(_).default(_true),
  FEATURE_ADVANCED_ANALYTICS: z.coerce.boolean(_).default(_false),

  // Beta Features
  BETA_VOICE_CHAT: z.coerce.boolean(_).default(_false),
  BETA_VIDEO_COLLABORATION: z.coerce.boolean(_).default(_false),
  BETA_AI_CODE_REVIEW: z.coerce.boolean(_).default(_false),

  // Third-party Integrations
  GITHUB_APP_ID: z.string(_).optional(_),
  GITHUB_APP_PRIVATE_KEY: z.string(_).optional(_),
  GITHUB_WEBHOOK_SECRET: z.string(_).optional(_),
  STRIPE_PUBLISHABLE_KEY: z.string(_).optional(_),
  STRIPE_SECRET_KEY: z.string(_).optional(_),
  STRIPE_WEBHOOK_SECRET: z.string(_).optional(_),
  DISCORD_BOT_TOKEN: z.string(_).optional(_),
  DISCORD_GUILD_ID: z.string(_).optional(_),

  // Development & Debugging
  DEBUG: z.coerce.boolean(_).default(_false),
  VERBOSE_LOGGING: z.coerce.boolean(_).default(_false),
  ENABLE_QUERY_LOGGING: z.coerce.boolean(_).default(_false),
  ENABLE_PERFORMANCE_MONITORING: z.coerce.boolean(_).default(_true),

  // Health Check
  HEALTH_CHECK_ENDPOINT: z.string(_).default('/api/health'),
  HEALTH_CHECK_TIMEOUT: z.coerce.number(_).min(1000).default(5000),

  // Caching
  CACHE_TTL: z.coerce.number(_).min(_60).default(3600),
  LOG_LEVEL: z.enum( ['debug', 'info', 'warn', 'error']).default('info'),

  // Session Security
  SESSION_COOKIE_SECURE: z.coerce.boolean(_).default(_false),
  SESSION_COOKIE_SAME_SITE: z.enum( ['strict', 'lax', 'none']).default('lax'),
  SESSION_COOKIE_HTTP_ONLY: z.coerce.boolean(_).default(_true),
  SESSION_COOKIE_MAX_AGE: z.coerce.number(_).min(300).default(_43200),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(_process.env);
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);

      console.error('❌ Environment validation failed:');
      
      if (_missingVars.length > 0) {
        console.error('Missing required variables:', missingVars);
      }
      
      if (_invalidVars.length > 0) {
        console.error('Invalid variables:', invalidVars);
      }
      
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment configuration
export const env = parseEnv(_);

// Environment utilities
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.NODE_ENV === 'staging';
export const isDevelopment = env.NODE_ENV === 'development';
export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';

// Feature flag utilities
export const features = {
  aiTutoring: env.FEATURE_AI_TUTORING,
  collaboration: env.FEATURE_COLLABORATION,
  codeCompilation: env.FEATURE_CODE_COMPILATION,
  blockchainIntegration: env.FEATURE_BLOCKCHAIN_INTEGRATION,
  gamification: env.FEATURE_GAMIFICATION,
  socialFeatures: env.FEATURE_SOCIAL_FEATURES,
  advancedAnalytics: env.FEATURE_ADVANCED_ANALYTICS,
} as const;

export const betaFeatures = {
  voiceChat: env.BETA_VOICE_CHAT,
  videoCollaboration: env.BETA_VIDEO_COLLABORATION,
  aiCodeReview: env.BETA_AI_CODE_REVIEW,
} as const;

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  pool: {
    min: env.DATABASE_POOL_MIN,
    max: env.DATABASE_POOL_MAX,
    timeout: env.DATABASE_POOL_TIMEOUT,
  },
} as const;

// Redis configuration
export const redisConfig = {
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
} as const;

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  api: env.API_RATE_LIMIT_PER_MINUTE,
  auth: env.AUTH_RATE_LIMIT_PER_MINUTE,
  collaboration: env.COLLABORATION_RATE_LIMIT_PER_MINUTE,
} as const;

// AI service configuration
export const aiConfig = {
  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    maxTokens: env.OPENAI_MAX_TOKENS,
    temperature: env.OPENAI_TEMPERATURE,
  },
  google: {
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY || env.GEMINI_API_KEY,
    model: env.GOOGLE_AI_MODEL,
  },
  rateLimits: {
    perMinute: env.AI_REQUESTS_PER_MINUTE,
    perHour: env.AI_REQUESTS_PER_HOUR,
    perDay: env.AI_REQUESTS_PER_DAY,
  },
} as const;

// Socket.io configuration
export const socketConfig = {
  port: env.SOCKET_IO_PORT,
  corsOrigins: env.SOCKET_IO_CORS_ORIGINS.split(','),
  maxConnections: env.SOCKET_IO_MAX_CONNECTIONS,
  connectionTimeout: env.SOCKET_IO_CONNECTION_TIMEOUT,
  collaboration: {
    maxSessions: env.MAX_COLLABORATION_SESSIONS,
    maxParticipants: env.MAX_PARTICIPANTS_PER_SESSION,
    idleTimeout: env.SESSION_IDLE_TIMEOUT,
  },
} as const;

// Security configuration
export const securityConfig = {
  csp: {
    reportUri: env.CONTENT_SECURITY_POLICY_REPORT_URI,
  },
  hsts: {
    maxAge: env.HSTS_MAX_AGE,
  },
  session: {
    secure: env.SESSION_COOKIE_SECURE,
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    httpOnly: env.SESSION_COOKIE_HTTP_ONLY,
    maxAge: env.SESSION_COOKIE_MAX_AGE,
  },
} as const;

// Monitoring configuration
export const monitoringConfig = {
  sentry: {
    dsn: env.SENTRY_DSN,
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken: env.SENTRY_AUTH_TOKEN,
  },
  analytics: {
    ga: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    posthog: {
      key: env.NEXT_PUBLIC_POSTHOG_KEY,
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
    },
    mixpanel: env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },
} as const;

// Validate critical configurations on startup
export function validateCriticalConfig() {
  const errors: string[] = [];

  // Check database connection
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Check authentication
  if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters');
  }

  // Check AI services if enabled
  if (_features.aiTutoring && !env.OPENAI_API_KEY && !env.GOOGLE_GENERATIVE_AI_API_KEY && !env.GEMINI_API_KEY) {
    errors.push('AI tutoring is enabled but no AI API key is configured');
  }

  // Check production-specific requirements
  if (isProduction) {
    if (!env.SENTRY_DSN) {
      console.warn('⚠️  SENTRY_DSN not configured for production');
    }
    
    if (!env.REDIS_URL) {
      errors.push('REDIS_URL is required for production');
    }
    
    if (!securityConfig.session.secure) {
      errors.push('SESSION_COOKIE_SECURE must be true in production');
    }
  }

  if (_errors.length > 0) {
    console.error('❌ Critical configuration errors:');
    errors.forEach(_error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Environment configuration validated successfully');
}

// Export type for TypeScript
export type Environment = z.infer<typeof envSchema>;
