import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Comprehensive Input Validation and Sanitization
 * Protects against XSS, injection attacks, and malformed data
 */

// Common validation schemas
export const commonSchemas = {
  // User input schemas
  email: z.string().email().max(254),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  ),
  username: z.string().min(3).max(30).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  ),
  displayName: z.string().min(1).max(50).regex(
    /^[a-zA-Z0-9\s\-_.]+$/,
    'Display name contains invalid characters'
  ),

  // Content schemas
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  content: z.string().max(10000),
  
  // Code-related schemas
  solidityCode: z.string().max(50000).refine(
    (code) => !containsMaliciousPatterns(code),
    'Code contains potentially malicious patterns'
  ),
  
  // Chat and collaboration schemas
  chatMessage: z.string().min(1).max(1000),
  sessionName: z.string().min(1).max(100),
  
  // File upload schemas
  fileName: z.string().min(1).max(255).regex(
    /^[a-zA-Z0-9\s\-_.()]+$/,
    'File name contains invalid characters'
  ),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  
  // URL and ID schemas
  url: z.string().url().max(2048),
  uuid: z.string().uuid(),
  objectId: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(50),
  
  // Numeric schemas
  positiveInt: z.number().int().positive(),
  pageNumber: z.number().int().min(1).max(1000),
  pageSize: z.number().int().min(1).max(100),
  
  // Date schemas
  dateString: z.string().datetime(),
  timestamp: z.number().int().positive(),
};

/**
 * Check for malicious patterns in code
 */
function containsMaliciousPatterns(code: string): boolean {
  const maliciousPatterns = [
    // Potential system calls or dangerous functions
    /system\s*\(/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /require\s*\(/i,
    /import\s+.*from\s+['"]fs['"]|import\s+.*from\s+['"]child_process['"]/i,
    
    // Potential network requests
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /axios\./i,
    
    // Potential file system access
    /readFile|writeFile|unlink|rmdir/i,
    
    // Potential dangerous Solidity patterns
    /selfdestruct\s*\(/i,
    /delegatecall\s*\(/i,
    /\.call\s*\(/i,
    
    // Potential script injection
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  return maliciousPatterns.some(pattern => pattern.test(code));
}

/**
 * Sanitization functions
 */
export const sanitize = {
  /**
   * Sanitize HTML content
   */
  html: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false,
    });
  },

  /**
   * Sanitize plain text (remove HTML tags)
   */
  text: (input: string): string => {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  /**
   * Sanitize code content
   */
  code: (input: string): string => {
    // Remove null bytes and control characters except newlines and tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  },

  /**
   * Sanitize file names
   */
  fileName: (input: string): string => {
    return input
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  },

  /**
   * Sanitize URLs
   */
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitize SQL-like input (for search queries)
   */
  searchQuery: (input: string): string => {
    return input
      .replace(/['"`;\\]/g, '') // Remove SQL injection characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  },
};

/**
 * Advanced validation functions
 */
export const validate = {
  /**
   * Validate email with additional checks
   */
  email: (email: string): { isValid: boolean; error?: string } => {
    if (!validator.isEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    if (email.length > 254) {
      return { isValid: false, error: 'Email too long' };
    }
    
    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return { isValid: false, error: 'Disposable email addresses are not allowed' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate password strength
   */
  password: (password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 25;
    } else {
      score += 15;
    }

    // Character variety
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    const varietyCount = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    score += varietyCount * 15;

    if (!hasLower) feedback.push('Add lowercase letters');
    if (!hasUpper) feedback.push('Add uppercase letters');
    if (!hasNumbers) feedback.push('Add numbers');
    if (!hasSpecial) feedback.push('Add special characters (@$!%*?&)');

    // Common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters');
      score -= 10;
    }

    if (/123|abc|qwe|password/i.test(password)) {
      feedback.push('Avoid common patterns');
      score -= 20;
    }

    return {
      isValid: feedback.length === 0 && score >= 60,
      score: Math.max(0, Math.min(100, score)),
      feedback,
    };
  },

  /**
   * Validate Solidity code
   */
  solidityCode: (code: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check for malicious patterns
    if (containsMaliciousPatterns(code)) {
      errors.push('Code contains potentially malicious patterns');
    }

    // Check code length
    if (code.length > 50000) {
      errors.push('Code is too long (max 50,000 characters)');
    }

    // Basic Solidity syntax checks
    if (code.includes('pragma solidity') && !code.match(/pragma solidity\s+[\^~>=<]*\d+\.\d+\.\d+/)) {
      errors.push('Invalid pragma directive');
    }

    // Check for balanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces in code');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate file upload
   */
  fileUpload: (file: { name: string; size: number; type: string }): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'application/json', 'text/markdown'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    if (file.size > maxSize) {
      errors.push('File size exceeds limit (10MB)');
    }

    if (file.name.length > 255) {
      errors.push('File name too long');
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(extension)) {
      errors.push('Dangerous file extension detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Request validation middleware
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        return { success: false, errors };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  };
}

/**
 * Sanitize and validate user input
 */
export function sanitizeAndValidate<T>(
  input: unknown,
  schema: z.ZodSchema<T>,
  sanitizer?: (input: any) => any
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Apply sanitization if provided
    const sanitizedInput = sanitizer ? sanitizer(input) : input;
    
    // Validate with schema
    const validatedData = schema.parse(sanitizedInput);
    
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Create validation schemas for API endpoints
 */
export const apiSchemas = {
  // User management
  createUser: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    username: commonSchemas.username,
    displayName: commonSchemas.displayName.optional(),
  }),

  updateProfile: z.object({
    displayName: commonSchemas.displayName.optional(),
    bio: z.string().max(500).optional(),
    website: commonSchemas.url.optional(),
  }),

  // Authentication
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1),
  }),

  resetPassword: z.object({
    email: commonSchemas.email,
  }),

  // Code and learning
  submitCode: z.object({
    code: commonSchemas.solidityCode,
    language: z.enum(['solidity', 'javascript', 'typescript']),
    title: commonSchemas.title.optional(),
  }),

  // Chat and collaboration
  sendMessage: z.object({
    content: commonSchemas.chatMessage,
    sessionId: commonSchemas.uuid,
    type: z.enum(['text', 'code', 'system']).default('text'),
  }),

  createSession: z.object({
    name: commonSchemas.sessionName,
    description: commonSchemas.description.optional(),
    maxParticipants: z.number().int().min(1).max(50).default(10),
  }),

  // File upload
  uploadFile: z.object({
    fileName: commonSchemas.fileName,
    fileSize: commonSchemas.fileSize,
    fileType: z.string().min(1),
  }),

  // Search and pagination
  search: z.object({
    query: z.string().min(1).max(100),
    page: commonSchemas.pageNumber.default(1),
    limit: commonSchemas.pageSize.default(20),
    filters: z.record(z.string()).optional(),
  }),
};

/**
 * Export validation utilities
 */
export { z } from 'zod';
