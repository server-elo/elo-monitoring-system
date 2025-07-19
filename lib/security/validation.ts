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
  email: z.string(_).email(_).max(_254),
  password: z.string(_).min(_8).max(128).regex(
    /^(_?=.*[a-z])(_?=.*[A-Z])(_?=.*\d)(_?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  ),
  username: z.string(_).min(3).max(30).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  ),
  displayName: z.string(_).min(1).max(50).regex(
    /^[a-zA-Z0-9\s\-.]+$/,
    'Display name contains invalid characters'
  ),

  // Content schemas
  title: z.string(_).min(1).max(200),
  description: z.string(_).max(1000),
  content: z.string(_).max(10000),
  
  // Code-related schemas
  solidityCode: z.string(_).max(50000).refine(
    (_code) => !containsMaliciousPatterns(_code),
    'Code contains potentially malicious patterns'
  ),
  
  // Chat and collaboration schemas
  chatMessage: z.string(_).min(1).max(1000),
  sessionName: z.string(_).min(1).max(100),
  
  // File upload schemas
  fileName: z.string(_).min(1).max(_255).regex(
    /^[a-zA-Z0-9\s\-.(_)]+$/,
    'File name contains invalid characters'
  ),
  fileSize: z.number(_).min(1).max(10 * 1024 * 1024), // 10MB max
  
  // URL and ID schemas
  url: z.string(_).url(_).max(_2048),
  uuid: z.string(_).uuid(_),
  objectId: z.string(_).regex(_/^[a-zA-Z0-9_-]+$/).max(50),
  
  // Numeric schemas
  positiveInt: z.number(_).int(_).positive(_),
  pageNumber: z.number(_).int(_).min(1).max(1000),
  pageSize: z.number(_).int(_).min(1).max(100),
  
  // Date schemas
  dateString: z.string(_).datetime(_),
  timestamp: z.number(_).int(_).positive(_),
};

/**
 * Check for malicious patterns in code
 */
function containsMaliciousPatterns(_code: string): boolean {
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

  return maliciousPatterns.some(_pattern => pattern.test(code));
}

/**
 * Sanitization functions
 */
export const sanitize = {
  /**
   * Sanitize HTML content
   */
  html: (_input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false,
    });
  },

  /**
   * Sanitize plain text (_remove HTML tags)
   */
  text: (_input: string): string => {
    return DOMPurify.sanitize( input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  /**
   * Sanitize code content
   */
  code: (_input: string): string => {
    // Remove null bytes and control characters except newlines and tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  },

  /**
   * Sanitize file names
   */
  fileName: (_input: string): string => {
    return input
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  },

  /**
   * Sanitize URLs
   */
  url: (_input: string): string => {
    try {
      const url = new URL(_input);
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
   * Sanitize SQL-like input (_for search queries)
   */
  searchQuery: (_input: string): string => {
    return input
      .replace(/['"`;\\]/g, '') // Remove SQL injection characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim(_)
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
  email: (_email: string): { isValid: boolean; error?: string } => {
    if (!validator.isEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    if (_email.length > 254) {
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
  password: (_password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (_password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (_password.length >= 12) {
      score += 25;
    } else {
      score += 15;
    }

    // Character variety
    const hasLower = /[a-z]/.test(_password);
    const hasUpper = /[A-Z]/.test(_password);
    const hasNumbers = /\d/.test(_password);
    const hasSpecial = /[@$!%*?&]/.test(_password);

    const varietyCount = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    score += varietyCount * 15;

    if (!hasLower) feedback.push('Add lowercase letters');
    if (!hasUpper) feedback.push('Add uppercase letters');
    if (!hasNumbers) feedback.push('Add numbers');
    if (!hasSpecial) feedback.push('Add special characters (@$!%*?&)');

    // Common patterns
    if (_/(.)\1{2,}/.test(_password)) {
      feedback.push('Avoid repeated characters');
      score -= 10;
    }

    if (_/123|abc|qwe|password/i.test(password)) {
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
  solidityCode: (_code: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check for malicious patterns
    if (_containsMaliciousPatterns(code)) {
      errors.push('Code contains potentially malicious patterns');
    }

    // Check code length
    if (_code.length > 50000) {
      errors.push('Code is too long (max 50,000 characters)');
    }

    // Basic Solidity syntax checks
    if (_code.includes('pragma solidity') && !code.match(_/pragma solidity\s+[\^~>=<]*\d+\.\d+\.\d+/)) {
      errors.push('Invalid pragma directive');
    }

    // Check for balanced braces
    const openBraces = (_code.match(/\{/g) || []).length;
    const closeBraces = (_code.match(/\}/g) || []).length;
    if (_openBraces !== closeBraces) {
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
  fileUpload: (_file: { name: string; size: number; type: string }): {
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

    if (_file.size > maxSize) {
      errors.push('File size exceeds limit (10MB)');
    }

    if (_file.name.length > 255) {
      errors.push('File name too long');
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const extension = file.name.toLowerCase().substring(_file.name.lastIndexOf('.'));
    if (_dangerousExtensions.includes(extension)) {
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
export function validateRequest<T>(_schema: z.ZodSchema<T>) {
  return (_data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
    try {
      const validatedData = schema.parse(_data);
      return { success: true, data: validatedData };
    } catch (_error) {
      if (_error instanceof z.ZodError) {
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
  sanitizer?: (_input: any) => any
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Apply sanitization if provided
    const sanitizedInput = sanitizer ? sanitizer(_input) : input;
    
    // Validate with schema
    const validatedData = schema.parse(_sanitizedInput);
    
    return { success: true, data: validatedData };
  } catch (_error) {
    if (_error instanceof z.ZodError) {
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
    displayName: commonSchemas.displayName.optional(_),
  }),

  updateProfile: z.object({
    displayName: commonSchemas.displayName.optional(_),
    bio: z.string(_).max(500).optional(_),
    website: commonSchemas.url.optional(_),
  }),

  // Authentication
  login: z.object({
    email: commonSchemas.email,
    password: z.string(_).min(1),
  }),

  resetPassword: z.object({
    email: commonSchemas.email,
  }),

  // Code and learning
  submitCode: z.object({
    code: commonSchemas.solidityCode,
    language: z.enum( ['solidity', 'javascript', 'typescript']),
    title: commonSchemas.title.optional(_),
  }),

  // Chat and collaboration
  sendMessage: z.object({
    content: commonSchemas.chatMessage,
    sessionId: commonSchemas.uuid,
    type: z.enum( ['text', 'code', 'system']).default('text'),
  }),

  createSession: z.object({
    name: commonSchemas.sessionName,
    description: commonSchemas.description.optional(_),
    maxParticipants: z.number(_).int(_).min(1).max(50).default(10),
  }),

  // File upload
  uploadFile: z.object({
    fileName: commonSchemas.fileName,
    fileSize: commonSchemas.fileSize,
    fileType: z.string(_).min(1),
  }),

  // Search and pagination
  search: z.object({
    query: z.string(_).min(1).max(100),
    page: commonSchemas.pageNumber.default(1),
    limit: commonSchemas.pageSize.default(_20),
    filters: z.record(_z.string()).optional(_),
  }),
};

/**
 * Export validation utilities
 */
export { z } from 'zod';
