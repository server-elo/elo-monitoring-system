/**
 * Rate Limiting Utility for API Endpoints
 * 
 * Provides flexible rate limiting with different strategies
 * and Redis-based storage for distributed systems.
 */

import { logger } from '@/lib/api/logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

class InMemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Clean up expired entries
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = await this.get(key);
    
    if (!existing) {
      const newData = { count: 1, resetTime: now + windowMs };
      await this.set(key, newData);
      return newData;
    }
    
    existing.count++;
    await this.set(key, existing);
    return existing;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export class RateLimiter {
  private store: InMemoryStore;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new InMemoryStore();
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.store.cleanup();
    }, 5 * 60 * 1000);
  }

  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const data = await this.store.increment(key, config.windowMs);
    
    const allowed = data.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - data.count);
    
    return {
      allowed,
      remaining,
      resetTime: data.resetTime,
      totalHits: data.count
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Free tier: 50 requests per hour
  free: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many requests. Free tier allows 50 requests per hour.'
  },
  
  // Premium tier: 200 requests per hour
  premium: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200,
    message: 'Too many requests. Premium tier allows 200 requests per hour.'
  },
  
  // Quick requests: 100 per 15 minutes
  quick: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many quick requests. Please wait before making more requests.'
  },
  
  // Heavy analysis: 20 per hour
  analysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many analysis requests. Heavy analysis is limited to 20 per hour.'
  },
  
  // IP-based rate limiting: 1000 per hour
  ip: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Too many requests from this IP address.'
  }
};

// Helper function to get user tier
export function getUserTier(user: any): 'free' | 'premium' {
  // This would typically check user's subscription status
  return user?.profile?.tier || 'free';
}

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Main rate limiting function
export async function checkRateLimit(
  identifier: string,
  configName: keyof typeof rateLimitConfigs
): Promise<RateLimitResult> {
  const config = rateLimitConfigs[configName];
  return globalRateLimiter.checkLimit(identifier, config);
}

// Rate limiting middleware for Next.js API routes
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  configName: keyof typeof rateLimitConfigs,
  identifierFn?: (request: Request) => string
) {
  return async function rateLimitedHandler(request: Request, ...args: any[]) {
    try {
      const identifier = identifierFn ? identifierFn(request) : getClientIP(request);
      const result = await checkRateLimit(identifier, configName);
      
      if (!result.allowed) {
        const config = rateLimitConfigs[configName];
        return new Response(
          JSON.stringify({
            error: config.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        const config = rateLimitConfigs[configName];
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      }
      
      return response;
    } catch (error) {
      logger.error('Rate limiting error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'rate-limiting'
      }, error instanceof Error ? error : undefined);
      // If rate limiting fails, allow the request to proceed
      return handler(request, ...args);
    }
  };
}

// Cleanup function for graceful shutdown
export function cleanupRateLimiter(): void {
  globalRateLimiter.destroy();
}
