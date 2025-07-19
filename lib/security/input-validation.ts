/**
 * Comprehensive input validation and sanitization utilities
 * Implements defense against XSS, injection attacks, and malicious input
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  stripHtml?: boolean;
  allowDataAttributes?: boolean;
}

/**
 * Sanitize HTML content using DOMPurify
 */
export function sanitizeHtml(
  input: string,
  options: SanitizationOptions = {}
): string {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowedTags = ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br'],
    allowedAttributes = ['href', 'title', 'alt'],
    maxLength = 10000,
    stripHtml = false,
    allowDataAttributes = false
  } = options;
  
  // Truncate if too long
  let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input;
  
  if (stripHtml) {
    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Sanitize HTML but keep allowed tags
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOW_DATA_ATTR: allowDataAttributes,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe', 'svg'],
      FORBID_ATTR: [
        'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
        'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
        'onkeydown', 'onkeyup', 'onkeypress', 'style'
      ],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true
    });
  }
  
  // Additional security checks
  if (sanitized.includes('javascript:') || sanitized.includes('data:text/html')) {
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');
  }
  
  // Remove any remaining event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/[<>\"']/g, '') // Remove basic HTML/script chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Sanitize code input (for Solidity code editor)
 */
export function sanitizeCode(input: string, maxLength = 50000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove most control chars but keep \n, \r, \t
    .trim();
}

/**
 * Context-specific sanitizers
 */
export const sanitizers = {
  username: (input: string) => sanitizeText(input, 50)
    .replace(/[^a-zA-Z0-9_-]/g, ''), // Only alphanumeric, underscore, dash
  
  email: (input: string) => sanitizeText(input, 254)
    .toLowerCase(),
  
  url: (input: string) => {
    const sanitized = sanitizeText(input, 2048);
    // Basic URL validation
    try {
      new URL(sanitized);
      return sanitized;
    } catch {
      return '';
    }
  },
  
  message: (input: string) => sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'code'],
    maxLength: 1000
  }),
  
  description: (input: string) => sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'code', 'pre'],
    maxLength: 5000
  }),
  
  code: (input: string) => sanitizeCode(input),
  
  filename: (input: string) => sanitizeText(input, 255)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove filesystem unsafe chars
    .replace(/^\.+/, '') // Remove leading dots
    .trim()
};

/**
 * Validation schemas with sanitization
 */
export const validationSchemas = {
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore and dash')
    .transform(sanitizers.username),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .transform(sanitizers.email),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[!@#$%^&*])/, 'Password must contain at least one special character'),
  
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long')
    .transform(sanitizers.message),
  
  code: z.string()
    .max(50000, 'Code too long')
    .transform(sanitizers.code),
  
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .transform(sanitizers.url)
};

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isLimited(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      // Reset or initialize
      this.attempts.set(identifier, {
        count: 0,
        resetTime: now + this.windowMs
      });
      return false;
    }
    
    return userAttempts.count >= this.maxAttempts;
  }
  
  recordAttempt(identifier: string): void {
    const userAttempts = this.attempts.get(identifier);
    if (userAttempts) {
      userAttempts.count++;
    }
  }
  
  getRemainingAttempts(identifier: string): number {
    const userAttempts = this.attempts.get(identifier);
    if (!userAttempts || Date.now() > userAttempts.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - userAttempts.count);
  }
  
  getResetTime(identifier: string): number {
    const userAttempts = this.attempts.get(identifier);
    return userAttempts?.resetTime || 0;
  }
}

/**
 * CSRF token utilities
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  if (token.length !== expectedToken.length) return false;
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * File upload validation
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  scanForMalware?: boolean;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`
    };
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed`
    };
  }
  
  // Check extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} not allowed`
    };
  }
  
  // Additional filename validation
  const sanitizedName = sanitizers.filename(file.name);
  if (sanitizedName !== file.name || sanitizedName.length === 0) {
    return {
      valid: false,
      error: 'Invalid filename'
    };
  }
  
  return { valid: true };
}

/**
 * IP address utilities
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}