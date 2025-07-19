/**
 * Comprehensive rate limiting system with Redis backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { 
  rateLimitResponse, 
  getClientIP, 
  generateRequestId 
} from './utils';
;

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean; // Include rate limit headers
  legacyHeaders?: boolean; // Include legacy X-RateLimit headers
  store?: RateLimitStore;
}

// Rate limit store interface
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  decrement?(key: string): Promise<void>;
  resetKey?(key: string): Promise<void>;
  shutdown?(): Promise<void>;
}

// Redis-based rate limit store
export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('error', (error) => {
      console.error('Redis rate limit store error:', error);
    });
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `rate_limit:${key}:${window}`;
    
    try {
      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 1;
      
      const resetTime = (window + 1) * windowMs;
      
      return { count, resetTime };
    } catch (error) {
      console.error('Redis increment error:', error);
      // Fallback to allowing the request if Redis is down
      return { count: 1, resetTime: now + windowMs };
    }
  }

  async decrement(key: string): Promise<void> {
    const now = Date.now();
    const window = Math.floor(now / 60000); // 1 minute window for decrement
    const redisKey = `rate_limit:${key}:${window}`;
    
    try {
      await this.redis.decr(redisKey);
    } catch (error) {
      console.error('Redis decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      const pattern = `rate_limit:${key}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis reset key error:', error);
    }
  }

  async shutdown(): Promise<void> {
    await this.redis.quit();
  }
}

// In-memory rate limit store (fallback)
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime <= now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const storeKey = `${key}:${window}`;
    
    const existing = this.store.get(storeKey);
    const resetTime = (window + 1) * windowMs;
    
    if (existing && existing.resetTime > now) {
      existing.count++;
      return { count: existing.count, resetTime: existing.resetTime };
    } else {
      const newEntry = { count: 1, resetTime };
      this.store.set(storeKey, newEntry);
      return newEntry;
    }
  }

  async decrement(key: string): Promise<void> {
    const now = Date.now();
    const window = Math.floor(now / 60000);
    const storeKey = `${key}:${window}`;
    
    const existing = this.store.get(storeKey);
    if (existing && existing.count > 0) {
      existing.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    for (const storeKey of this.store.keys()) {
      if (storeKey.startsWith(key + ':')) {
        this.store.delete(storeKey);
      }
    }
  }

  async shutdown(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Rate limiter class
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (request: NextRequest) => getClientIP(request),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests',
      standardHeaders: true,
      legacyHeaders: false,
      store: new MemoryRateLimitStore(),
      ...config
    };
    
    this.store = this.config.store;
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator(request);
    const { count, resetTime } = await this.store.increment(key, this.config.windowMs);
    
    const allowed = count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - count);
    const retryAfter = allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000);
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
      retryAfter
    };
  }

  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkLimit(request);
      
      if (!result.allowed) {
        const requestId = generateRequestId();
        const response = rateLimitResponse(result.retryAfter || 60, requestId);
        
        // Add rate limit headers
        if (this.config.standardHeaders) {
          response.headers.set('RateLimit-Limit', result.limit.toString());
          response.headers.set('RateLimit-Remaining', result.remaining.toString());
          response.headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString());
        }
        
        if (this.config.legacyHeaders) {
          response.headers.set('X-RateLimit-Limit', result.limit.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
        }
        
        return response;
      }
      
      return null; // Allow request to proceed
    };
  }

  async decrementKey(key: string): Promise<void> {
    if (this.store.decrement) {
      await this.store.decrement(key);
    }
  }

  async resetKey(key: string): Promise<void> {
    if (this.store.resetKey) {
      await this.store.resetKey(key);
    }
  }

  async shutdown(): Promise<void> {
    if (this.store.shutdown) {
      await this.store.shutdown();
    }
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Public endpoints (no authentication required)
  public: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later'
  },
  
  // Authenticated endpoints
  authenticated: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id');
      return userId || getClientIP(request);
    },
    message: 'Too many requests, please try again later'
  },
  
  // Admin endpoints
  admin: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10000,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id');
      return userId || getClientIP(request);
    },
    message: 'Too many admin requests, please try again later'
  },
  
  // Login attempts
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (request: NextRequest) => {
      const ip = getClientIP(request);
      return `login:${ip}`;
    },
    message: 'Too many login attempts, please try again later'
  },
  
  // Registration attempts
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (request: NextRequest) => {
      const ip = getClientIP(request);
      return `register:${ip}`;
    },
    message: 'Too many registration attempts, please try again later'
  },
  
  // Password reset attempts
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (request: NextRequest) => {
      const ip = getClientIP(request);
      return `password_reset:${ip}`;
    },
    message: 'Too many password reset attempts, please try again later'
  },
  
  // File upload
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id');
      const ip = getClientIP(request);
      return `upload:${userId || ip}`;
    },
    message: 'Too many upload attempts, please try again later'
  },
  
  // Search requests
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id');
      const ip = getClientIP(request);
      return `search:${userId || ip}`;
    },
    message: 'Too many search requests, please slow down'
  }
};

// Create rate limiter instances
const redisStore = process.env.REDIS_URL ? new RedisRateLimitStore() : new MemoryRateLimitStore();

export const rateLimiters = {
  public: new RateLimiter({ ...rateLimitConfigs.public, store: redisStore }),
  authenticated: new RateLimiter({ ...rateLimitConfigs.authenticated, store: redisStore }),
  admin: new RateLimiter({ ...rateLimitConfigs.admin, store: redisStore }),
  login: new RateLimiter({ ...rateLimitConfigs.login, store: redisStore }),
  registration: new RateLimiter({ ...rateLimitConfigs.registration, store: redisStore }),
  passwordReset: new RateLimiter({ ...rateLimitConfigs.passwordReset, store: redisStore }),
  upload: new RateLimiter({ ...rateLimitConfigs.upload, store: redisStore }),
  search: new RateLimiter({ ...rateLimitConfigs.search, store: redisStore })
};

// Utility function to apply rate limiting to API routes
export function withRateLimit(rateLimiter: RateLimiter) {
  return async (request: NextRequest, handler: Function) => {
    const rateLimitResult = await rateLimiter.createMiddleware()(request);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    return handler(request);
  };
}

// Cleanup function for graceful shutdown
export async function shutdownRateLimiters(): Promise<void> {
  await Promise.all(Object.values(rateLimiters).map(limiter => limiter.shutdown()));
}
