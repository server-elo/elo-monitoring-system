/**
 * @fileoverview Secure Environment Validator
 * 
 * Advanced environment variable validation with security checks,
 * secret strength validation, and configuration compliance.
 * 
 * @security CRITICAL: Validates all environment configurations
 * @module lib/security/SecureEnvironmentValidator
 */

import { z } from 'zod';
import { quantumSecrets } from './QuantumSecretsManager';

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  /** Overall validation status */
  isValid: boolean;
  /** Critical security issues */
  criticalIssues: string[];
  /** Warning-level issues */
  warnings: string[];
  /** Informational messages */
  info: string[];
  /** Validated environment variables */
  validatedEnv: Record<string, unknown>;
  /** Security score (0-100) */
  securityScore: number;
}

/**
 * Enhanced Zod schema with security validations
 */
const createSecureEnvSchema = (environment: string) => {
  const isProduction = environment === 'production';
  const isStaging = environment === 'staging';
  const isProd = isProduction || isStaging;

  return z.object({
    // Core application
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
    PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
    HOST: z.string().ip().or(z.literal('0.0.0.0')).default('0.0.0.0'),
    
    // Application URLs
    NEXT_PUBLIC_APP_URL: z.string().url().refine((url) => {
      if (isProd && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        throw new Error('Production URLs cannot use localhost');
      }
      if (isProd && !url.startsWith('https://')) {
        throw new Error('Production URLs must use HTTPS');
      }
      return true;
    }),

    // Database with security validation
    DATABASE_URL: z.string()
      .min(1, 'Database URL is required')
      .refine((url) => {
        try {
          const parsed = new URL(url);
          
          // Check for secure connection in production
          if (isProd && parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
            throw new Error('Only PostgreSQL databases supported in production');
          }
          
          // Validate credentials are not default/weak
          if (isProd) {
            const weakPatterns = ['password', 'admin', 'root', 'user', 'test', '123'];
            const credentials = `${parsed.username}:${parsed.password}`;
            
            for (const pattern of weakPatterns) {
              if (credentials.toLowerCase().includes(pattern)) {
                throw new Error(`Weak database credentials detected: contains "${pattern}"`);
              }
            }
          }
          
          return true;
        } catch (error) {
          throw new Error(`Invalid database URL: ${error.message}`);
        }
      }),

    // Authentication secrets with strength validation
    NEXTAUTH_SECRET: z.string()
      .min(isProd ? 64 : 32, `NEXTAUTH_SECRET must be at least ${isProd ? 64 : 32} characters`)
      .refine((secret) => {
        const validation = quantumSecrets.validateSecretStrength(secret, 'auth');
        if (!validation.valid) {
          throw new Error(`NEXTAUTH_SECRET validation failed: ${validation.issues.join(', ')}`);
        }
        return true;
      }),

    NEXTAUTH_URL: z.string().url().optional().refine((url) => {
      if (url && isProd && !url.startsWith('https://')) {
        throw new Error('NEXTAUTH_URL must use HTTPS in production');
      }
      return true;
    }),

    JWT_SECRET: z.string()
      .min(isProd ? 64 : 32, `JWT_SECRET must be at least ${isProd ? 64 : 32} characters`)
      .refine((secret) => {
        const validation = quantumSecrets.validateSecretStrength(secret, 'auth');
        if (!validation.valid) {
          throw new Error(`JWT_SECRET validation failed: ${validation.issues.join(', ')}`);
        }
        return true;
      })
      .optional(),

    SESSION_SECRET: z.string()
      .min(isProd ? 64 : 32, `SESSION_SECRET must be at least ${isProd ? 64 : 32} characters`)
      .refine((secret) => {
        const validation = quantumSecrets.validateSecretStrength(secret, 'auth');
        if (!validation.valid) {
          throw new Error(`SESSION_SECRET validation failed: ${validation.issues.join(', ')}`);
        }
        return true;
      })
      .optional(),

    CSRF_TOKEN_SECRET: z.string()
      .min(isProd ? 64 : 32, 'CSRF token secret must be sufficiently long')
      .optional(),

    // API Keys with validation
    OPENAI_API_KEY: z.string()
      .refine((key) => {
        if (!key) return true; // Optional
        if (key.startsWith('sk-') && key.length < 48) {
          throw new Error('OPENAI_API_KEY appears to be invalid (too short)');
        }
        return true;
      })
      .optional(),

    GEMINI_API_KEY: z.string()
      .refine((key) => {
        if (!key) return true; // Optional
        if (key.length < 32) {
          throw new Error('GEMINI_API_KEY appears to be too short');
        }
        return true;
      })
      .optional(),

    // OAuth secrets
    GITHUB_CLIENT_SECRET: z.string()
      .min(isProd ? 40 : 16, 'GitHub client secret too short')
      .optional(),

    GOOGLE_CLIENT_SECRET: z.string()
      .min(isProd ? 24 : 16, 'Google client secret too short')
      .optional(),

    DISCORD_CLIENT_SECRET: z.string()
      .min(isProd ? 32 : 16, 'Discord client secret too short')
      .optional(),

    // Webhook secrets
    GITHUB_WEBHOOK_SECRET: z.string()
      .min(isProd ? 40 : 16, 'Webhook secret too short')
      .refine((secret) => {
        if (!secret) return true; // Optional
        const validation = quantumSecrets.validateSecretStrength(secret, 'webhook');
        if (!validation.valid) {
          throw new Error(`GITHUB_WEBHOOK_SECRET validation failed: ${validation.issues.join(', ')}`);
        }
        return true;
      })
      .optional(),

    STRIPE_WEBHOOK_SECRET: z.string()
      .refine((secret) => {
        if (!secret) return true; // Optional
        if (!secret.startsWith('whsec_')) {
          throw new Error('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
        }
        return true;
      })
      .optional(),

    // Payment processing
    STRIPE_SECRET_KEY: z.string()
      .refine((key) => {
        if (!key) return true; // Optional
        if (isProd && key.startsWith('sk_test_')) {
          throw new Error('Cannot use test Stripe key in production');
        }
        if (!isProd && key.startsWith('sk_live_')) {
          throw new Error('Cannot use live Stripe key in development');
        }
        return true;
      })
      .optional(),

    // External services
    SENDGRID_API_KEY: z.string()
      .refine((key) => {
        if (!key) return true; // Optional
        if (!key.startsWith('SG.')) {
          throw new Error('SENDGRID_API_KEY must start with "SG."');
        }
        return true;
      })
      .optional(),

    ALCHEMY_API_KEY: z.string().min(32, 'Alchemy API key too short').optional(),
    INFURA_PROJECT_SECRET: z.string().min(32, 'Infura project secret too short').optional(),

    // Cloud services
    AWS_ACCESS_KEY_ID: z.string().length(20, 'AWS Access Key ID must be 20 characters').optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(40, 'AWS Secret Access Key too short').optional(),

    // Monitoring
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().min(64, 'Sentry auth token too short').optional(),

    // Analytics
    NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().min(32, 'Mixpanel token too short').optional(),

    // Feature flags
    ENABLE_AI_TUTOR: z.string().transform((v) => v === 'true').default('true'),
    ENABLE_COLLABORATION: z.string().transform((v) => v === 'true').default('true'),
    ENABLE_ACHIEVEMENTS: z.string().transform((v) => v === 'true').default('true'),
    ENABLE_BLOCKCHAIN: z.string().transform((v) => v === 'true').default('false'),

    // Redis
    REDIS_URL: z.string().url().optional(),
    REDIS_PASSWORD: z.string().optional(),

    // Rate limiting
    RATELIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
    RATELIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_FORMAT: z.enum(['json', 'text']).default('json'),

    // Quantum metadata (added by rotation system)
    QUANTUM_ROTATION_ID: z.string().optional(),
    QUANTUM_ROTATION_ENV: z.string().optional(),
  });
};

/**
 * Secure Environment Validator
 */
export class SecureEnvironmentValidator {
  private readonly environment: string;
  private readonly schema: ReturnType<typeof createSecureEnvSchema>;

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.schema = createSecureEnvSchema(environment);
  }

  /**
   * Validate environment variables with comprehensive security checks
   */
  public validateEnvironment(envVars: Record<string, string | undefined> = process.env): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: false,
      criticalIssues: [],
      warnings: [],
      info: [],
      validatedEnv: {},
      securityScore: 0
    };

    try {
      // Parse and validate environment variables
      result.validatedEnv = this.schema.parse(envVars);
      result.isValid = true;
      result.info.push('✅ All environment variables validated successfully');

    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          const message = `${path}: ${issue.message}`;
          
          // Categorize issues by severity
          if (this.isCriticalIssue(path, issue.message)) {
            result.criticalIssues.push(message);
          } else {
            result.warnings.push(message);
          }
        }
      } else {
        result.criticalIssues.push(`Validation error: ${error.message}`);
      }
    }

    // Additional security checks
    this.performSecurityAudit(envVars, result);

    // Calculate security score
    result.securityScore = this.calculateSecurityScore(result);

    return result;
  }

  /**
   * Perform additional security audit checks
   */
  private performSecurityAudit(
    envVars: Record<string, string | undefined>,
    result: SecurityValidationResult
  ): void {
    const isProd = this.environment === 'production';
    const isStaging = this.environment === 'staging';

    // Check for development/test values in production
    if (isProd || isStaging) {
      const sensitiveKeys = ['NEXTAUTH_SECRET', 'JWT_SECRET', 'SESSION_SECRET'];
      
      for (const key of sensitiveKeys) {
        const value = envVars[key];
        if (value && (
          value.includes('dev') ||
          value.includes('test') ||
          value.includes('local') ||
          value.includes('development') ||
          value.length < 64
        )) {
          result.criticalIssues.push(
            `${key} appears to be a development/test value in ${this.environment} environment`
          );
        }
      }
    }

    // Check for missing production-required secrets
    if (isProd) {
      const requiredProdSecrets = [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'NEXT_PUBLIC_APP_URL'
      ];

      for (const key of requiredProdSecrets) {
        if (!envVars[key]) {
          result.criticalIssues.push(`${key} is required in production environment`);
        }
      }
    }

    // Check for insecure URLs in production
    if (isProd) {
      const urlKeys = ['NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL', 'DATABASE_URL'];
      
      for (const key of urlKeys) {
        const value = envVars[key];
        if (value) {
          if (value.includes('localhost') || value.includes('127.0.0.1')) {
            result.criticalIssues.push(`${key} cannot use localhost in production`);
          }
          
          if (key !== 'DATABASE_URL' && value.startsWith('http://')) {
            result.criticalIssues.push(`${key} must use HTTPS in production`);
          }
        }
      }
    }

    // Check for potentially exposed secrets
    const exposurePatterns = [
      { pattern: /^(test|dev|staging|example|demo|placeholder)$/i, message: 'Appears to be a placeholder value' },
      { pattern: /^(password|admin|user|guest|root)$/i, message: 'Uses common weak pattern' },
      { pattern: /^.{1,8}$/, message: 'Too short for secure use' },
      { pattern: /^(.)\1{3,}$/, message: 'Contains repeating characters' }
    ];

    const secretKeys = Object.keys(envVars).filter(key => 
      key.includes('SECRET') || 
      key.includes('KEY') || 
      key.includes('TOKEN') || 
      key.includes('PASSWORD')
    );

    for (const key of secretKeys) {
      const value = envVars[key];
      if (value) {
        for (const { pattern, message } of exposurePatterns) {
          if (pattern.test(value)) {
            result.warnings.push(`${key}: ${message}`);
            break;
          }
        }
      }
    }

    // Check for quantum rotation metadata
    if (envVars.QUANTUM_ROTATION_ID && envVars.QUANTUM_ROTATION_ENV) {
      result.info.push(`✅ Quantum secrets rotation detected: ${envVars.QUANTUM_ROTATION_ID}`);
      
      if (envVars.QUANTUM_ROTATION_ENV !== this.environment) {
        result.warnings.push(
          `Environment mismatch: rotation for ${envVars.QUANTUM_ROTATION_ENV}, running in ${this.environment}`
        );
      }
    } else if (isProd) {
      result.warnings.push('No quantum rotation metadata found - consider running secrets rotation');
    }
  }

  /**
   * Determine if an issue is critical based on key and message
   */
  private isCriticalIssue(key: string, message: string): boolean {
    const criticalKeys = [
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'SESSION_SECRET',
      'DATABASE_URL',
      'NEXT_PUBLIC_APP_URL'
    ];

    const criticalMessages = [
      'required',
      'invalid',
      'too short',
      'must use https',
      'cannot use localhost'
    ];

    if (criticalKeys.includes(key)) return true;
    
    return criticalMessages.some(pattern => 
      message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Calculate security score based on validation results
   */
  private calculateSecurityScore(result: SecurityValidationResult): number {
    let score = 100;

    // Deduct for critical issues
    score -= result.criticalIssues.length * 20;

    // Deduct for warnings
    score -= result.warnings.length * 5;

    // Bonus for quantum rotation
    if (result.info.some(info => info.includes('Quantum secrets rotation'))) {
      score += 10;
    }

    // Environment-specific adjustments
    if (this.environment === 'production') {
      // Higher standards for production
      score -= result.warnings.length * 5; // Double penalty
    } else if (this.environment === 'development') {
      // More lenient for development
      score += Math.min(20, result.warnings.length * 2);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(result: SecurityValidationResult): string {
    const lines = [
      '🔒 QUANTUM ENVIRONMENT SECURITY REPORT',
      '=====================================',
      '',
      `Environment: ${this.environment}`,
      `Security Score: ${result.securityScore}/100`,
      `Overall Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`,
      ''
    ];

    if (result.criticalIssues.length > 0) {
      lines.push('🚨 CRITICAL ISSUES');
      lines.push('==================');
      result.criticalIssues.forEach(issue => lines.push(`❌ ${issue}`));
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS');
      lines.push('=============');
      result.warnings.forEach(warning => lines.push(`⚠️  ${warning}`));
      lines.push('');
    }

    if (result.info.length > 0) {
      lines.push('ℹ️  INFORMATION');
      lines.push('==============');
      result.info.forEach(info => lines.push(`ℹ️  ${info}`));
      lines.push('');
    }

    // Recommendations
    lines.push('💡 RECOMMENDATIONS');
    lines.push('==================');

    if (result.criticalIssues.length > 0) {
      lines.push('1. Address all critical issues before deployment');
      lines.push('2. Run quantum secrets rotation: npm run secrets:rotate');
    }

    if (result.securityScore < 80) {
      lines.push('3. Security score is below recommended threshold (80)');
      lines.push('4. Review and strengthen all secrets');
    }

    if (this.environment === 'production' && result.warnings.length > 0) {
      lines.push('5. Production environment should have zero warnings');
    }

    lines.push('6. Enable quantum security monitoring for ongoing protection');
    lines.push('');

    lines.push('For detailed security guidance, see: /docs/SECURITY.md');

    return lines.join('\n');
  }
}

/**
 * Singleton validator instance
 */
export const securityValidator = new SecureEnvironmentValidator();

/**
 * Validate current environment and return result
 */
export function validateCurrentEnvironment(): SecurityValidationResult {
  return securityValidator.validateEnvironment();
}

/**
 * Validate environment and throw on critical issues
 */
export function requireSecureEnvironment(): Record<string, unknown> {
  const result = validateCurrentEnvironment();
  
  if (result.criticalIssues.length > 0) {
    console.error('🚨 Critical security issues detected:');
    result.criticalIssues.forEach(issue => console.error(`  ❌ ${issue}`));
    throw new Error('Environment validation failed due to critical security issues');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Security warnings detected:');
    result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
  }

  return result.validatedEnv;
}