/**
 * Environment Variable Validator
 * Ensures all required environment variables are properly configured
 */

import { z } from 'zod';

// Define environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // Application
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  DATABASE_POOL_SIZE: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_CLUSTER_ENABLED: z.string().transform(v => v === 'true').default('false'),
  
  // Security
  SESSION_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().default('*'),
  
  // API Keys (optional for development)
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(v => v === 'true').default('true'),
  ENABLE_CACHE: z.string().transform(v => v === 'true').default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // External Services
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
});

// Infer TypeScript type from schema
export type Env = z.infer<typeof envSchema>;

class EnvironmentValidator {
  private validated: Env | null = null;
  private errors: z.ZodError | null = null;

  /**
   * Validate environment variables
   */
  validate(): Env {
    if (this.validated) return this.validated;

    try {
      this.validated = envSchema.parse(process.env);
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
   * Log validation errors in a readable format
   */
  private logValidationErrors(): void {
    if (!this.errors) return;

    console.error('\\n❌ Environment Validation Errors:\\n');
    
    this.errors.errors.forEach((error) => {
      const path = error.path.join('.');
      console.error(`  • ${path}: ${error.message}`);
    });
    
    console.error('\\n💡 Tip: Check your .env file and ensure all required variables are set.\\n');
  }

  /**
   * Get validated environment variables
   */
  get env(): Env {
    if (!this.validated) {
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
   * Generate example .env file content
   */
  generateExample(): string {
    const examples: string[] = [
      '# Generated .env.example',
      '# Copy this file to .env and fill in the values',
      '',
      '# Node Environment',
      'NODE_ENV=development',
      '',
      '# Application',
      'PORT=3000',
      'HOST=0.0.0.0',
      '',
      '# Database',
      'DATABASE_URL=postgresql://user:password@localhost:5432/dbname',
      'DATABASE_POOL_SIZE=10',
      '',
      '# Redis',
      'REDIS_URL=redis://localhost:6379',
      'REDIS_CLUSTER_ENABLED=false',
      '',
      '# Security (generate with: openssl rand -base64 32)',
      'SESSION_SECRET=your-32-character-secret-here',
      'JWT_SECRET=your-jwt-secret-here',
      'CORS_ORIGIN=http://localhost:3000',
      '',
      '# API Keys',
      'OPENAI_API_KEY=sk-...',
      'GOOGLE_AI_API_KEY=...',
      'SENTRY_DSN=https://...',
      '',
      '# Feature Flags',
      'ENABLE_ANALYTICS=true',
      'ENABLE_CACHE=true',
      '',
      '# Logging',
      'LOG_LEVEL=info',
      '',
      '# External Services',
      'NEXT_PUBLIC_APP_URL=http://localhost:3000',
      'VERCEL_URL=',
    ];
    
    return examples.join('\\n');
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Export validated environment
export const env = envValidator.env;

// Usage:
// import { env } from '@/lib/config/env-validator';
// 
// console.log(env.PORT); // Type-safe access to PORT
// console.log(env.DATABASE_URL); // Type-safe, might be undefined