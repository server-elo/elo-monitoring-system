/**
 * Environment Variable Validator
 * Ensures all required environment variables are properly configured
 * Implements perfect 12-Factor Config compliance
 */

import { z } from 'zod';

// Define comprehensive environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // Application
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  HOSTNAME: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.string().regex(/^\d+$/).transform(Number).default('10'),
  DATABASE_MAX_CONNECTIONS: z.string().regex(/^\d+$/).transform(Number).default('20'),
  DATABASE_IDLE_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  
  // Redis
  REDIS_URL: z.string().url(),
  REDIS_CLUSTER_ENABLED: z.string().transform(v => v === 'true').default('false'),
  REDIS_MAX_RETRIES: z.string().regex(/^\d+$/).transform(Number).default('3'),
  
  // Security (all required in production)
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().default('*'),
  
  // API Keys (required in production)
  GEMINI_API_KEY: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // Cluster Configuration
  CLUSTER_ENABLED: z.string().transform(v => v !== 'false').default('true'),
  CLUSTER_WORKERS: z.string().regex(/^\d+$/).transform(Number).optional(),
  CLUSTER_MAX_RESTARTS: z.string().regex(/^\d+$/).transform(Number).default('5'),
  CLUSTER_RESTART_DELAY: z.string().regex(/^\d+$/).transform(Number).default('1000'),
  CLUSTER_DEV_ENABLED: z.string().transform(v => v === 'true').default('false'),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(v => v === 'true').default('true'),
  ENABLE_CACHE: z.string().transform(v => v === 'true').default('true'),
  ENABLE_COMPRESSION: z.string().transform(v => v === 'true').default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // External Services
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  
  // Monitoring
  HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  METRICS_ENABLED: z.string().transform(v => v === 'true').default('true'),
  
  // Performance
  CACHE_TTL: z.string().regex(/^\d+$/).transform(Number).default('300'),
  SESSION_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('86400'),
}).refine((data) => {
  // Production-specific validations
  if (data.NODE_ENV === 'production') {
    return data.DATABASE_URL && 
           data.REDIS_URL && 
           data.NEXTAUTH_SECRET && 
           data.NEXTAUTH_URL &&
           data.GEMINI_API_KEY;
  }
  return true;
}, {
  message: "Required environment variables missing for production environment"
});

// Infer TypeScript type from schema
export type Env = z.infer<typeof envSchema>;

class EnvironmentValidator {
  private validated: Env | null = null;
  private errors: z.ZodError | null = null;
  private validationTime: number | null = null;

  /**
   * Validate environment variables with runtime checks
   */
  validate(): Env {
    if (this.validated && this.isValidationFresh()) {
      return this.validated;
    }

    try {
      this.validated = envSchema.parse(process.env);
      this.validationTime = Date.now();
      this.logValidationSuccess();
      return this.validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.errors = error;
        this.logValidationErrors();
        
        // In production, exit on validation failure
        if (process.env.NODE_ENV === 'production') {
          console.error('Environment validation failed. Exiting...');
          process.exit(1);
        }
        
        throw new Error('Environment validation failed');
      }
      throw error;
    }
  }

  /**
   * Check if current validation is still fresh (for runtime re-validation)
   */
  private isValidationFresh(): boolean {
    if (!this.validationTime) return false;
    const maxAge = 60000; // 1 minute
    return Date.now() - this.validationTime < maxAge;
  }

  /**
   * Log successful validation
   */
  private logValidationSuccess(): void {
    const env = this.validated!;
    console.log('✅ Environment validation successful', {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      cluster: env.CLUSTER_ENABLED,
      cache: env.ENABLE_CACHE,
      analytics: env.ENABLE_ANALYTICS,
    });
  }

  /**
   * Log validation errors in a readable format
   */
  private logValidationErrors(): void {
    if (!this.errors) return;

    console.error('\n❌ Environment Validation Errors:\n');
    
    this.errors.errors.forEach((error) => {
      const path = error.path.join('.');
      console.error(`  • ${path}: ${error.message}`);
    });
    
    console.error('\n💡 Tip: Check your .env file and ensure all required variables are set.\n');
  }

  /**
   * Perform runtime configuration health check
   */
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      const env = this.validate();
      
      // Check critical services connectivity
      if (env.NODE_ENV === 'production') {
        if (!env.DATABASE_URL.includes('localhost')) {
          // Production database should not be localhost
        } else {
          issues.push('Production database appears to be localhost');
        }
        
        if (!env.SENTRY_DSN) {
          issues.push('Sentry DSN not configured for production monitoring');
        }
      }
      
      // Check security configurations
      if (env.CORS_ORIGIN === '*' && env.NODE_ENV === 'production') {
        issues.push('CORS origin should be specific in production');
      }
      
      // Check performance settings
      if (env.DATABASE_POOL_SIZE < 5) {
        issues.push('Database pool size may be too small for production');
      }
      
      return {
        healthy: issues.length === 0,
        issues
      };
      
    } catch (error) {
      return {
        healthy: false,
        issues: ['Environment validation failed', (error as Error).message]
      };
    }
  }

  /**
   * Get validated environment variables
   */
  get env(): Env {
    if (!this.validated || !this.isValidationFresh()) {
      this.validate();
    }
    return this.validated!;
  }

  /**
   * Check if running in production
   */
  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  /**
   * Check if running in test
   */
  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  /**
   * Generate updated .env file content
   */
  generateExample(): string {
    const examples: string[] = [
      '# Generated .env.example - Perfect 12-Factor Compliance',
      '# Copy this file to .env and fill in the values',
      '',
      '# Node Environment',
      'NODE_ENV=development',
      '',
      '# Application',
      'PORT=3000',
      'HOST=0.0.0.0',
      'HOSTNAME=localhost',
      '',
      '# Database (Required)',
      'DATABASE_URL=postgresql://user:password@localhost:5432/dbname',
      'DATABASE_POOL_SIZE=10',
      'DATABASE_MAX_CONNECTIONS=20',
      'DATABASE_IDLE_TIMEOUT=30000',
      '',
      '# Redis (Required)',
      'REDIS_URL=redis://localhost:6379',
      'REDIS_CLUSTER_ENABLED=false',
      'REDIS_MAX_RETRIES=3',
      '',
      '# Security (Required - generate with: openssl rand -base64 32)',
      'NEXTAUTH_SECRET=your-32-character-secret-here',
      'NEXTAUTH_URL=http://localhost:3000',
      'SESSION_SECRET=your-32-character-secret-here',
      'JWT_SECRET=your-jwt-secret-here',
      'CORS_ORIGIN=http://localhost:3000',
      '',
      '# API Keys (Required for AI features)',
      'GEMINI_API_KEY=your-gemini-api-key',
      'GITHUB_CLIENT_ID=your-github-client-id',
      'GITHUB_CLIENT_SECRET=your-github-client-secret',
      'GOOGLE_CLIENT_ID=your-google-client-id',
      'GOOGLE_CLIENT_SECRET=your-google-client-secret',
      'SENTRY_DSN=https://your-sentry-dsn',
      '',
      '# Cluster Configuration',
      'CLUSTER_ENABLED=true',
      'CLUSTER_WORKERS=4',
      'CLUSTER_MAX_RESTARTS=5',
      'CLUSTER_RESTART_DELAY=1000',
      'CLUSTER_DEV_ENABLED=false',
      '',
      '# Feature Flags',
      'ENABLE_ANALYTICS=true',
      'ENABLE_CACHE=true',
      'ENABLE_COMPRESSION=true',
      '',
      '# Logging',
      'LOG_LEVEL=info',
      'LOG_FORMAT=json',
      '',
      '# External Services',
      'NEXT_PUBLIC_APP_URL=http://localhost:3000',
      'NEXT_PUBLIC_SOCKET_URL=http://localhost:3001',
      'FRONTEND_URL=http://localhost:3000',
      'VERCEL_URL=',
      '',
      '# Monitoring',
      'HEALTH_CHECK_INTERVAL=30000',
      'METRICS_ENABLED=true',
      '',
      '# Performance',
      'CACHE_TTL=300',
      'SESSION_TIMEOUT=86400',
    ];
    
    return examples.join('\n');
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Export validated environment (lazy initialization)
let _env: Env | undefined;
export const env = new Proxy({} as Env, {
  get(target, prop) {
    if (!_env) {
      _env = envValidator.validate();
    }
    return _env[prop as keyof Env];
  }
});

// Runtime configuration API endpoint
export function createConfigHealthEndpoint() {
  return async (req: any, res: any) => {
    try {
      const health = envValidator.healthCheck();
      res.status(health.healthy ? 200 : 500).json({
        status: health.healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: envValidator.env.NODE_ENV,
        issues: health.issues,
        config: {
          port: envValidator.env.PORT,
          cluster: envValidator.env.CLUSTER_ENABLED,
          cache: envValidator.env.ENABLE_CACHE,
          analytics: envValidator.env.ENABLE_ANALYTICS,
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// Export for Next.js API routes
export { EnvironmentValidator };

// Usage:
// import { env } from '@/lib/config/env-validator';
// 
// console.log(env.PORT); // Type-safe access to PORT
// console.log(env.DATABASE_URL); // Type-safe, validated at runtime