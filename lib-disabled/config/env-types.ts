/** * Environment variable type definitions *  * This file provides comprehensive TypeScript types for all environment variables * used in the Solidity Learning Platform. *  * @module lib/config/env-types */ /** * Client-safe environment variables (NEXT_PUBLIC_*) */
export interface ClientEnvironment {
  NODE_ENV: 'development' | 'staging' | 'production';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_MIXPANEL_TOKEN?: string;
} /** * Server-only environment variables */
export interface ServerEnvironment extends ClientEnvironment { // Database
DATABASE_URL: string;
DATABASE_POOL_MIN: number;
DATABASE_POOL_MAX: number;
DATABASE_POOL_TIMEOUT: number; // Redis
REDIS_URL: string; REDIS_PASSWORD?: string;
REDIS_DB: number; // Authentication
NEXTAUTH_URL: string;
NEXTAUTH_SECRET: string;
SESSION_TIMEOUT: number;
SESSION_UPDATE_AGE: number; CSRF_TOKEN_SECRET?: string; // OAuth Providers GITHUB_CLIENT_ID?: string; GITHUB_CLIENT_SECRET?: string; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; DISCORD_CLIENT_ID?: string; DISCORD_CLIENT_SECRET?: string; // AI Services OPENAI_API_KEY?: string;
OPENAI_MODEL: string;
OPENAI_MAX_TOKENS: number;
OPENAI_TEMPERATURE: number; GOOGLE_GENERATIVE_AI_API_KEY?: string; GEMINI_API_KEY?: string;
GOOGLE_AI_MODEL: string; // AI Rate Limiting
AI_REQUESTS_PER_MINUTE: number;
AI_REQUESTS_PER_HOUR: number;
AI_REQUESTS_PER_DAY: number; // Socket.io
SOCKET_IO_PORT: number;
SOCKET_IO_CORS_ORIGINS: string;
SOCKET_IO_MAX_CONNECTIONS: number;
SOCKET_IO_CONNECTION_TIMEOUT: number; // Collaboration
MAX_COLLABORATION_SESSIONS: number;
MAX_PARTICIPANTS_PER_SESSION: number;
SESSION_IDLE_TIMEOUT: number; // Email SMTP_HOST?: string; SMTP_PORT?: number;
SMTP_SECURE: boolean; SMTP_USER?: string; SMTP_PASSWORD?: string; SMTP_FROM_NAME?: string; SMTP_FROM_EMAIL?: string; SENDGRID_API_KEY?: string; SENDGRID_FROM_EMAIL?: string; // File Storage AWS_ACCESS_KEY_ID?: string; AWS_SECRET_ACCESS_KEY?: string;
AWS_REGION: string; AWS_S3_BUCKET?: string; AWS_S3_BUCKET_URL?: string; CLOUDINARY_CLOUD_NAME?: string; CLOUDINARY_API_KEY?: string; CLOUDINARY_API_SECRET?: string;
MAX_FILE_SIZE: number;
ALLOWED_FILE_TYPES: string; // Blockchain
ETHEREUM_RPC_URL?: string; ETHEREUM_TESTNET_RPC_URL?: string; INFURA_PROJECT_ID?: string; INFURA_PROJECT_SECRET?: string; ALCHEMY_API_KEY?: string;
ALCHEMY_NETWORK: string; // Monitoring SENTRY_DSN?: string; SENTRY_ORG?: string; SENTRY_PROJECT?: string; SENTRY_AUTH_TOKEN?: string; // Rate Limiting
RATE_LIMIT_WINDOW_MS: number;
RATE_LIMIT_MAX_REQUESTS: number;
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: boolean;
API_RATE_LIMIT_PER_MINUTE: number;
AUTH_RATE_LIMIT_PER_MINUTE: number;
COLLABORATION_RATE_LIMIT_PER_MINUTE: number; // Security CONTENT_SECURITY_POLICY_REPORT_URI?: string;
HSTS_MAX_AGE: number; // Feature Flags
FEATURE_AI_TUTORING: boolean;
FEATURE_COLLABORATION: boolean;
FEATURE_CODE_COMPILATION: boolean;
FEATURE_BLOCKCHAIN_INTEGRATION: boolean;
FEATURE_GAMIFICATION: boolean;
FEATURE_SOCIAL_FEATURES: boolean;
FEATURE_ADVANCED_ANALYTICS: boolean; // Beta Features
BETA_VOICE_CHAT: boolean;
BETA_VIDEO_COLLABORATION: boolean;
BETA_AI_CODE_REVIEW: boolean; // Third-party Integrations GITHUB_APP_ID?: string; GITHUB_APP_PRIVATE_KEY?: string; GITHUB_WEBHOOK_SECRET?: string; STRIPE_PUBLISHABLE_KEY?: string; STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string; DISCORD_BOT_TOKEN?: string; DISCORD_GUILD_ID?: string; // Development & Debugging
DEBUG: boolean;
VERBOSE_LOGGING: boolean;
ENABLE_QUERY_LOGGING: boolean;
ENABLE_PERFORMANCE_MONITORING: boolean; // Health Check
HEALTH_CHECK_ENDPOINT: string;
HEALTH_CHECK_TIMEOUT: number; // Caching
CACHE_TTL: number;
LOG_LEVEL = 'debug' | 'info' | 'warn' | 'error'; // Session Security
SESSION_COOKIE_SECURE: boolean;
SESSION_COOKIE_SAME_SITE = 'strict' | 'lax' | 'none';
SESSION_COOKIE_HTTP_ONLY: boolean;
SESSION_COOKIE_MAX_AGE: number;
} /** * Feature flags configuration
*/
export interface FeatureFlags {
  aiTutoring: boolean;
  collaboration: boolean;
  codeCompilation: boolean;
  blockchainIntegration: boolean;
  gamification: boolean;
  socialFeatures: boolean;
  advancedAnalytics: boolean;
} /** * Beta features configuration
*/
export interface BetaFeatures {
  voiceChat: boolean;
  videoCollaboration: boolean;
  aiCodeReview: boolean;
} /** * Database configuration
*/
export interface DatabaseConfig {
  url: string;
  const pool: {
    min: number;
    max: number;
    timeout: number;
  };
} /** * Redis configuration
*/
export interface RedisConfig {
  url: string;
  password?: string;
  db: number;
} /** * Rate limiting configuration
*/
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  api: number;
  auth: number;
  collaboration: number;
} /** * AI service configuration
*/
export interface AIConfig {
  const openai: { apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}; const google = {
  apiKey?: string;
  model: string;
}; const rateLimits = {
  perMinute: number;
  perHour: number;
  perDay: number;
};
} /** * Socket.io configuration
*/
export interface SocketConfig {
  port: number;
  corsOrigins: string[];
  maxConnections: number;
  connectionTimeout: number;
  const collaboration: {
    maxSessions: number;
    maxParticipants: number;
    idleTimeout: number;
  };
} /** * Security configuration
*/
export interface SecurityConfig {
  const csp: { reportUri?: string;
}; const hsts = {
  maxAge: number;
}; const session = {
  secure: boolean;
  sameSite = 'strict' | 'lax' | 'none';
  httpOnly: boolean;
  maxAge: number;
};
} /** * Monitoring configuration
*/
export interface MonitoringConfig {
  const sentry: { dsn?: string;
  org?: string;
  project?: string;
  authToken?: string;
} | null; const analytics = {
  ga?: string; posthog: {
    key: string; host?: string;
  } | null; mixpanel?: string; };
} /** * Universal environment interface */
export interface UniversalEnvironment {
  env: ClientEnvironment | ServerEnvironment;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  isClient: boolean;
  features: FeatureFlags;
  betaFeatures: BetaFeatures;
  dbConfig: DatabaseConfig | null;
  redisConfig: RedisConfig | null;
  rateLimitConfig: RateLimitConfig | null;
  aiConfig: AIConfig | null;
  socketConfig: SocketConfig | null;
  securityConfig: SecurityConfig | null;
  monitoringConfig: MonitoringConfig;
}
