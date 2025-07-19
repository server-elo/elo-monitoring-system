import { isProduction } from '@/lib/config/environment';

/**
 * Security Configuration
 * Centralized security settings and constants
 */

export const SECURITY_CONFIG = {
  // JWT Configuration
  jwt: {
    minSecretLength: 32,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256' as const,
    issuer: 'solidity-learning-platform',
    audience: 'solidity-learners',
  },

  // Password Security
  password: {
    minLength: 8,
    maxLength: 128,
    saltRounds: isProduction ? 14 : 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Session Security
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    maxConcurrentSessions: 5,
    rotateOnAuth: true,
    secure: isProduction,
    httpOnly: true,
    sameSite: 'strict' as const,
  },

  // Rate Limiting
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    },
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    tokenLength: 32,
    cookieName: '__csrf-token',
    headerName: 'x-csrf-token',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: isProduction,
  },

  // Security Headers
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
    },
  },

  // Input Validation
  validation: {
    maxStringLength: 10000,
    maxArrayLength: 1000,
    maxObjectDepth: 10,
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/json',
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },

  // Audit Logging
  audit: {
    enabled: true,
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
    ],
    retentionDays: 90,
    logLevel: isProduction ? 'warn' : 'info',
  },
} as const;

/**
 * Security validation functions
 */
export const SecurityValidators = {
  /**
   * Validate JWT secret strength
   */
  validateJwtSecret(secret: string): boolean {
    return secret.length >= SECURITY_CONFIG.jwt.minSecretLength;
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.password;

    if (password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }

    if (password.length > config.maxLength) {
      errors.push(`Password must be no more than ${config.maxLength} characters long`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Check if input contains potentially malicious patterns
   */
  containsMaliciousPatterns(input: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /expression\s*\(/gi,
      /import\s*\(/gi,
      /eval\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  },

  /**
   * Validate file upload
   */
  validateFileUpload(file: { type: string; size: number }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.validation;

    if (!config.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    if (file.size > config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${config.maxFileSize} bytes`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomArray);
    } else {
      // Fallback for Node.js
      const nodeCrypto = await import('crypto');
      const buffer = nodeCrypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        randomArray[i] = buffer[i];
      }
    }
    
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    return result;
  },

  /**
   * Sanitize sensitive data from logs
   */
  sanitizeForLogging(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveFields = SECURITY_CONFIG.audit.sensitiveFields;

    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }

    return sanitized;
  },

  /**
   * Create Content Security Policy header value
   */
  createCSPHeader(): string {
    const csp = SECURITY_CONFIG.csp;
    const directives: string[] = [];

    Object.entries(csp).forEach(([directive, values]) => {
      if (directive === 'upgradeInsecureRequests') {
        if (values) {
          directives.push('upgrade-insecure-requests');
        }
      } else if (Array.isArray(values)) {
        const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        directives.push(`${kebabDirective} ${values.join(' ')}`);
      }
    });

    return directives.join('; ');
  },
};

export type SecurityConfig = typeof SECURITY_CONFIG;
