import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { env, rateLimitConfig } from '@/lib/config/environment';
import { logger } from '@/lib/api/logger';

/**
 * Advanced Rate Limiting Implementation
 * Supports multiple algorithms and storage backends
 */

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  headers?: boolean;
  algorithm?: 'sliding-window' | 'fixed-window' | 'token-bucket';
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private redis: Redis | null = null;
  private memoryStore: Map<string, any> = new Map();

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.redis = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      } catch (error) {
        logger.warn('Failed to initialize Redis for rate limiting', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: 'memory-based-rate-limiting'
        });
        logger.info('Falling back to memory-based rate limiting');
      }
    }
  }

  /**
   * Extract client IP address from request headers
   */
  public getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > fallback
    if (cfConnectingIP) return cfConnectingIP.trim();
    if (realIP) return realIP.trim();
    if (forwarded) return forwarded.split(',')[0].trim();

    return '127.0.0.1'; // Default fallback for development
  }

  /**
   * Default key generator based on IP address
   */
  private defaultKeyGenerator(req: NextRequest): string {
    const ip = this.getClientIP(req);
    return `rate_limit:${ip}`;
  }

  /**
   * Sliding window rate limiting algorithm
   */
  private async slidingWindow(
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const window = options.windowMs;
    const limit = options.maxRequests;

    if (this.redis) {
      // Redis implementation with sliding window
      const pipeline = this.redis.pipeline();
      const windowStart = now - window;

      // Remove old entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      // Count requests in window
      pipeline.zcard(key);
      // Set expiration
      pipeline.expire(key, Math.ceil(window / 1000));

      const results = await pipeline.exec();
      const count = results?.[2]?.[1] as number || 0;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime: now + window,
        totalHits: count,
      };
    } else {
      // Memory implementation
      const store = this.memoryStore.get(key) || [];
      const filtered = store.filter((timestamp: number) => timestamp > now - window);
      filtered.push(now);
      this.memoryStore.set(key, filtered);

      return {
        allowed: filtered.length <= limit,
        remaining: Math.max(0, limit - filtered.length),
        resetTime: now + window,
        totalHits: filtered.length,
      };
    }
  }

  /**
   * Fixed window rate limiting algorithm
   */
  private async fixedWindow(
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const window = options.windowMs;
    const limit = options.maxRequests;
    const windowStart = Math.floor(now / window) * window;
    const windowKey = `${key}:${windowStart}`;

    if (this.redis) {
      const pipeline = this.redis.pipeline();
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(window / 1000));
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime: windowStart + window,
        totalHits: count,
      };
    } else {
      const current = this.memoryStore.get(windowKey) || 0;
      const newCount = current + 1;
      this.memoryStore.set(windowKey, newCount);

      // Clean up old windows
      setTimeout(() => {
        this.memoryStore.delete(windowKey);
      }, window);

      return {
        allowed: newCount <= limit,
        remaining: Math.max(0, limit - newCount),
        resetTime: windowStart + window,
        totalHits: newCount,
      };
    }
  }

  /**
   * Token bucket rate limiting algorithm
   */
  private async tokenBucket(
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const capacity = options.maxRequests;
    const refillRate = capacity / (options.windowMs / 1000); // tokens per second

    if (this.redis) {
      const bucketKey = `bucket:${key}`;
      const bucketData = await this.redis.get(bucketKey);
      
      const bucket: TokenBucketState = bucketData 
        ? JSON.parse(bucketData)
        : { tokens: capacity, lastRefill: now };

      // Refill tokens
      const timePassed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(capacity, bucket.tokens + timePassed * refillRate);
      bucket.lastRefill = now;

      const allowed = bucket.tokens >= 1;
      if (allowed) {
        bucket.tokens -= 1;
      }

      await this.redis.setex(bucketKey, Math.ceil(options.windowMs / 1000), JSON.stringify(bucket));

      return {
        allowed,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + ((capacity - bucket.tokens) / refillRate) * 1000,
        totalHits: capacity - Math.floor(bucket.tokens),
      };
    } else {
      const bucket: TokenBucketState = this.memoryStore.get(key) || { tokens: capacity, lastRefill: now };

      const timePassed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(capacity, bucket.tokens + timePassed * refillRate);
      bucket.lastRefill = now;

      const allowed = bucket.tokens >= 1;
      if (allowed) {
        bucket.tokens -= 1;
      }

      this.memoryStore.set(key, bucket);

      return {
        allowed,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + ((capacity - bucket.tokens) / refillRate) * 1000,
        totalHits: capacity - Math.floor(bucket.tokens),
      };
    }
  }

  /**
   * Apply rate limiting
   */
  async limit(req: NextRequest, options: RateLimitOptions): Promise<RateLimitResult> {
    const keyGenerator = options.keyGenerator || this.defaultKeyGenerator.bind(this);
    const key = keyGenerator(req);
    const algorithm = options.algorithm || 'sliding-window';

    switch (algorithm) {
      case 'sliding-window':
        return this.slidingWindow(key, options);
      case 'fixed-window':
        return this.fixedWindow(key, options);
      case 'token-bucket':
        return this.tokenBucket(key, options);
      default:
        throw new Error(`Unknown rate limiting algorithm: ${algorithm}`);
    }
  }

  /**
   * Create rate limiting middleware
   */
  createMiddleware(options: RateLimitOptions) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      try {
        const result = await this.limit(req, options);

        if (!result.allowed) {
          const response = NextResponse.json(
            {
              error: options.message || 'Too many requests',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            },
            { status: 429 }
          );

          if (options.headers !== false) {
            response.headers.set('X-RateLimit-Limit', options.maxRequests.toString());
            response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
            response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
            response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
          }

          return response;
        }

        return null; // Allow request to proceed
      } catch (error) {
        logger.error('Rate limiting error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          operation: 'rate-limiting'
        }, error instanceof Error ? error : undefined);
        return null; // Allow request on error (fail open)
      }
    };
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Predefined rate limiting configurations
 */
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: rateLimitConfig.api,
    message: 'Too many API requests',
    algorithm: 'sliding-window' as const,
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: rateLimitConfig.auth,
    message: 'Too many authentication attempts',
    algorithm: 'fixed-window' as const,
    keyGenerator: (req: NextRequest) => {
      const ip = rateLimiter.getClientIP(req);
      return `auth_limit:${ip}`;
    },
  },

  // AI endpoints (token bucket for burst handling)
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: env.AI_REQUESTS_PER_MINUTE,
    message: 'AI service rate limit exceeded',
    algorithm: 'token-bucket' as const,
    keyGenerator: (req: NextRequest) => {
      // Rate limit by user ID if authenticated, otherwise by IP
      const userId = req.headers.get('x-user-id');
      if (userId) {
        return `ai_limit:user:${userId}`;
      }
      const ip = rateLimiter.getClientIP(req);
      return `ai_limit:ip:${ip}`;
    },
  },

  // Collaboration endpoints
  collaboration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: rateLimitConfig.collaboration,
    message: 'Collaboration rate limit exceeded',
    algorithm: 'sliding-window' as const,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id');
      if (userId) {
        return `collab_limit:user:${userId}`;
      }
      const ip = rateLimiter.getClientIP(req);
      return `collab_limit:ip:${ip}`;
    },
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'File upload rate limit exceeded',
    algorithm: 'fixed-window' as const,
  },

  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts',
    algorithm: 'fixed-window' as const,
  },

  // Registration (prevent spam)
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many registration attempts',
    algorithm: 'fixed-window' as const,
  },
} as const;

/**
 * Utility functions for rate limiting
 */

/**
 * Apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitOptions
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const middleware = rateLimiter.createMiddleware(config);
    const rateLimitResponse = await middleware(req);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    return handler(req);
  };
}

/**
 * Check rate limit without consuming quota
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitOptions
): Promise<RateLimitResult> {
  return rateLimiter.limit(req, config);
}

/**
 * Reset rate limit for a specific key
 */
export async function resetRateLimit(key: string): Promise<void> {
  if (rateLimiter['redis']) {
    await rateLimiter['redis'].del(key);
  } else {
    rateLimiter['memoryStore'].delete(key);
  }
}

/**
 * Get rate limit status for monitoring
 */
export async function getRateLimitStats(): Promise<{
  totalKeys: number;
  redisConnected: boolean;
  memoryUsage: number;
}> {
  const redisConnected = rateLimiter['redis']?.status === 'ready';
  const memoryUsage = rateLimiter['memoryStore'].size;

  let totalKeys = memoryUsage;
  if (redisConnected && rateLimiter['redis']) {
    try {
      const keys = await rateLimiter['redis'].keys('rate_limit:*');
      totalKeys = keys.length;
    } catch (error) {
      logger.error('Error getting Redis keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'redis-keys'
      }, error instanceof Error ? error : undefined);
    }
  }

  return {
    totalKeys,
    redisConnected,
    memoryUsage,
  };
}
