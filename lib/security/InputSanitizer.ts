// Input Sanitization for AI Security - Quantum-Enhanced
// Prevents LLM prompt injection and ensures safe user input processing

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Comprehensive input sanitization for AI interactions
 * Implements quantum-inspired threat detection patterns
 */
export class QuantumInputSanitizer {
  private static readonly INJECTION_PATTERNS = [
    // Direct injection attempts
    /ignore\s+(?:previous|above|all)\s+(?:instructions|prompts|context)/gi,
    /forget\s+(?:everything|all|your|previous)/gi,
    /system\s*:\s*(?:you|now|from)/gi,
    /(?:role|persona|character)\s*:\s*(?:you|now|are)/gi,
    
    // Token manipulation
    /(?:<\|(?:im_)?(?:start|end)\|>|###|!!!\s)/gi,
    /(?:\[INST\]|\[\/INST\]|\[SYS\]|\[\/SYS\])/gi,
    /(?:<system>|<\/system>|<user>|<\/user>)/gi,
    
    // Context pollution
    /(?:assistant|ai|model)\s*(?:says|responds|outputs|generates)/gi,
    /(?:previous|above|following)\s+(?:conversation|chat|message)/gi,
    
    // Instruction override
    /(?:instead|now|actually|really|truly)\s+(?:do|respond|answer|generate)/gi,
    /(?:override|bypass|ignore|skip|disable)\s+(?:safety|guidelines|rules)/gi,
    
    // Context injection
    /(?:imagine|pretend|roleplay|act as)\s+(?:you|that)/gi,
    /(?:new|different|alternative)\s+(?:instructions|context|persona)/gi,
    
    // Quantum-specific patterns
    /quantum\s+(?:override|bypass|tunnel|entangle)/gi,
    /superposition\s+(?:state|collapse|inject)/gi
  ];

  private static readonly MAX_LENGTH = 10000; // 10KB limit
  private static readonly MAX_LINES = 100;
  private static readonly SUSPICIOUS_CHARS = /[^\x20-\x7E\x0A\x0D]/g; // Non-printable chars

  /**
   * Sanitize user input for AI processing
   * @param input - Raw user input
   * @param context - Context for enhanced validation
   * @returns Sanitized and validated input
   */
  static sanitizeForAI(
    input: string,
    context?: {
      userId?: string;
      riskLevel?: 'low' | 'medium' | 'high';
      contentType?: 'code' | 'text' | 'explanation';
    }
  ): {
    sanitized: string;
    riskScore: number;
    blocked: boolean;
  } {
    if (!input || typeof input !== 'string') {
      return { sanitized: '', riskScore: 0, blocked: false };
    }

    let riskScore = 0;
    let sanitized = input;

    // 1. Length validation
    if (input.length > this.MAX_LENGTH) {
      return {
        sanitized: input.substring(0, this.MAX_LENGTH),
        riskScore: 0.8,
        blocked: true
      };
    }

    // 2. Line count validation
    const lines = input.split('\n');
    if (lines.length > this.MAX_LINES) {
      return {
        sanitized: lines.slice(0, this.MAX_LINES).join('\n'),
        riskScore: 0.7,
        blocked: true
      };
    }

    // 3. Remove suspicious characters
    const suspiciousCount = (input.match(this.SUSPICIOUS_CHARS) || []).length;
    if (suspiciousCount > 0) {
      sanitized = sanitized.replace(this.SUSPICIOUS_CHARS, '');
      riskScore += Math.min(0.3, suspiciousCount * 0.01);
    }

    // 4. Check for injection patterns
    for (const pattern of this.INJECTION_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        riskScore += matches.length * 0.4;
        // Remove or neutralize injection attempts
        sanitized = sanitized.replace(pattern, '[FILTERED]');
      }
    }

    // 5. Context-aware validation
    if (context?.contentType === 'code') {
      riskScore += this.validateCodeInput(sanitized);
    }

    // 6. HTML/XSS sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link'],
      STRIP_COMMENTS: true
    });

    // 7. Additional validation
    sanitized = validator.escape(sanitized);
    sanitized = this.neutralizeInstructions(sanitized);

    // 8. Risk level adjustment based on context
    if (context?.riskLevel === 'high') {
      riskScore *= 1.5;
    } else if (context?.riskLevel === 'low') {
      riskScore *= 0.7;
    }

    // Block high-risk inputs
    const blocked = riskScore > 0.8;

    return {
      sanitized: blocked ? '[HIGH_RISK_INPUT_BLOCKED]' : sanitized,
      riskScore: Math.min(1.0, riskScore),
      blocked
    };
  }

  /**
   * Validate code input for additional security
   */
  private static validateCodeInput(code: string): number {
    let risk = 0;

    // Check for dangerous patterns in code
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /process\./gi,
      /require\s*\(/gi,
      /import\s+.*\s+from\s+['"][^'"]*['"]/gi,
      /__proto__|prototype/gi,
      /constructor\s*\(/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        risk += 0.2;
      }
    }

    return Math.min(0.6, risk);
  }

  /**
   * Neutralize instruction-like patterns
   */
  private static neutralizeInstructions(input: string): string {
    // Replace instruction keywords with neutral alternatives
    const instructionMap: Record<string, string> = {
      'ignore': 'consider',
      'forget': 'remember',
      'override': 'respect',
      'bypass': 'follow',
      'disable': 'enable',
      'skip': 'include',
      'pretend': 'understand',
      'roleplay': 'explain',
      'imagine': 'describe'
    };

    let result = input;
    for (const [keyword, replacement] of Object.entries(instructionMap)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, replacement);
    }

    return result;
  }

  /**
   * Sanitize input for general use (non-AI)
   */
  static sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Basic sanitization
    let sanitized = validator.escape(input);
    sanitized = DOMPurify.sanitize(sanitized);

    return sanitized;
  }

  /**
   * Check if input is safe for AI processing
   */
  static async isSafeForAI(input: string): Promise<boolean> {
    const result = this.sanitizeForAI(input);
    return !result.blocked && result.riskScore < 0.5;
  }
}

/**
 * AI Rate Limiter with quantum-enhanced detection
 */
export class AIRateLimiter {
  private static readonly requests = new Map<string, number[]>();
  private static readonly WINDOW_MS = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 10;
  private static readonly BURST_THRESHOLD = 5;
  private static readonly BURST_WINDOW_MS = 10000; // 10 seconds

  /**
   * Check if user can make a request
   */
  static async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Clean old requests
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.WINDOW_MS
    );

    // Check burst protection
    const recentRequests = validRequests.filter(
      timestamp => now - timestamp < this.BURST_WINDOW_MS
    );

    if (recentRequests.length >= this.BURST_THRESHOLD) {
      return false; // Burst limit exceeded
    }

    // Check overall limit
    if (validRequests.length >= this.MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return true;
  }

  /**
   * Get remaining requests for user
   */
  static getRemainingRequests(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.WINDOW_MS
    );

    return Math.max(0, this.MAX_REQUESTS - validRequests.length);
  }

  /**
   * Reset limits for user
   */
  static resetUser(userId: string): void {
    this.requests.delete(userId);
  }

  /**
   * Clean up old entries
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [userId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        timestamp => now - timestamp < this.WINDOW_MS
      );
      
      if (validRequests.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, validRequests);
      }
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => AIRateLimiter.cleanup(), 300000);
}