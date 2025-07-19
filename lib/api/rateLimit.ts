import { NextRequest } from 'next/server';
import { RateLimitException } from './response';

// Rate Limit Store Interface
interface RateLimitStore {
  get(_key: string): Promise<number | null>;
  set( key: string, value: number, ttl: number): Promise<void>;
  increment( key: string, ttl: number): Promise<number>;
  delete(_key: string): Promise<void>;
}

// In-Memory Store (_for development/testing)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { value: number; expires: number }>(_);

  async get(_key: string): Promise<number | null> {
    const item = this.store.get(_key);
    if (!item || item.expires < Date.now()) {
      this.store.delete(_key);
      return null;
    }
    return item.value;
  }

  async set( key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: Date.now(_) + ttl * 1000
    });
  }

  async increment( key: string, ttl: number): Promise<number> {
    const current = await this.get(_key);
    const newValue = (_current || 0) + 1;
    await this.set( key, newValue, ttl);
    return newValue;
  }

  async delete(_key: string): Promise<void> {
    this.store.delete(_key);
  }

  // Cleanup expired entries
  cleanup(_): void {
    const now = Date.now(_);
    for ( const [key, item] of this.store.entries()) {
      if (_item.expires < now) {
        this.store.delete(_key);
      }
    }
  }
}

// Redis Store (_for production)
class RedisStore implements RateLimitStore {
  private redis: any; // Redis client

  constructor(_redisClient: any) {
    this.redis = redisClient;
  }

  async get(_key: string): Promise<number | null> {
    const value = await this.redis.get(_key);
    return value ? parseInt( value, 10) : null;
  }

  async set( key: string, value: number, ttl: number): Promise<void> {
    await this.redis.setex( key, ttl, value);
  }

  async increment( key: string, ttl: number): Promise<number> {
    const multi = this.redis.multi(_);
    multi.incr(_key);
    multi.expire( key, ttl);
    const results = await multi.exec(_);
    return results[0][1];
  }

  async delete(_key: string): Promise<void> {
    await this.redis.del(_key);
  }
}

// Rate Limit Configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  standardHeaders?: boolean; // Include rate limit headers
  legacyHeaders?: boolean; // Include legacy headers
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (_request: NextRequest) => string; // Custom key generator
  skip?: (_request: NextRequest) => boolean; // Skip rate limiting for certain requests
  onLimitReached?: ( request: NextRequest, key: string) => void; // Callback when limit is reached
}

// Default Rate Limit Configurations
export const RATE_LIMIT_CONFIGS = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later'
  },

  // Authentication endpoints (_more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  },

  // Password reset (_very restrictive)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset attempts, please try again later'
  },

  // File upload
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many file uploads, please try again later'
  },

  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 searches per minute
    message: 'Too many search requests, please try again later'
  },

  // Community features
  community: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many community requests, please try again later'
  }
};

// Rate Limiter Class
export class RateLimiter {
  private store: RateLimitStore;
  private config: Required<RateLimitConfig>;

  constructor( config: RateLimitConfig, store?: RateLimitStore) {
    this.store = store || new MemoryStore(_);
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message || 'Too many requests',
      standardHeaders: config.standardHeaders ?? true,
      legacyHeaders: config.legacyHeaders ?? false,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skip: config.skip || (() => false),
      onLimitReached: config.onLimitReached || (() => {})
    };
  }

  private defaultKeyGenerator(_request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `rate_limit:${ip}`;
  }

  async checkLimit(_request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    // Check if request should be skipped
    if (_this.config.skip(request)) {
      return {
        allowed: true,
        limit: this.config.max,
        remaining: this.config.max,
        reset: Date.now(_) + this.config.windowMs
      };
    }

    const key = this.config.keyGenerator(_request);
    const windowStart = Date.now(_);
    const windowEnd = windowStart + this.config.windowMs;

    // Get current count
    const current = await this.store.get(_key) || 0;

    // Check if limit exceeded
    if (_current >= this.config.max) {
      this.config.onLimitReached( request, key);
      
      return {
        allowed: false,
        limit: this.config.max,
        remaining: 0,
        reset: windowEnd,
        retryAfter: Math.ceil(_this.config.windowMs / 1000)
      };
    }

    // Increment counter
    const newCount = await this.store.increment( key, Math.ceil(this.config.windowMs / 1000));

    return {
      allowed: true,
      limit: this.config.max,
      remaining: Math.max(0, this.config.max - newCount),
      reset: windowEnd
    };
  }

  async middleware(_request: NextRequest): Promise<void> {
    const result = await this.checkLimit(_request);

    if (!result.allowed) {
      throw new RateLimitException(_this.config.message);
    }

    // Add rate limit headers to response (_handled in response middleware)
    (_request as any).rateLimitInfo = result;
  }
}

// Rate Limit Manager
export class RateLimitManager {
  private limiters = new Map<string, RateLimiter>(_);
  private store: RateLimitStore;

  constructor(_store?: RateLimitStore) {
    this.store = store || new MemoryStore(_);
    this.initializeDefaultLimiters(_);
  }

  private initializeDefaultLimiters(_): void {
    // Initialize default rate limiters
    for ( const [name, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
      this.addLimiter( name, config);
    }
  }

  addLimiter( name: string, config: RateLimitConfig): void {
    this.limiters.set( name, new RateLimiter(config, this.store));
  }

  getLimiter(_name: string): RateLimiter | undefined {
    return this.limiters.get(_name);
  }

  async checkLimit( name: string, request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    const limiter = this.getLimiter(_name);
    if (!limiter) {
      throw new Error(_`Rate limiter '${name}' not found`);
    }

    return limiter.checkLimit(_request);
  }

  async middleware( name: string, request: NextRequest): Promise<void> {
    const limiter = this.getLimiter(_name);
    if (!limiter) {
      throw new Error(_`Rate limiter '${name}' not found`);
    }

    await limiter.middleware(_request);
  }

  // User-specific rate limiting
  async checkUserLimit(
    userId: string, 
    action: string, 
    config: RateLimitConfig
  ): Promise<boolean> {
    const key = `user_rate_limit:${userId}:${action}`;
    const current = await this.store.get(_key) || 0;

    if (_current >= config.max) {
      return false;
    }

    await this.store.increment( key, Math.ceil(config.windowMs / 1000));
    return true;
  }

  // IP-based rate limiting with different tiers
  async checkTieredLimit(
    request: NextRequest,
    tiers: { authenticated: RateLimitConfig; anonymous: RateLimitConfig }
  ): Promise<{ allowed: boolean; tier: 'authenticated' | 'anonymous' }> {
    const isAuthenticated = request.headers.get('authorization') !== null;
    const config = isAuthenticated ? tiers.authenticated : tiers.anonymous;
    const limiter = new RateLimiter( config, this.store);

    const result = await limiter.checkLimit(_request);
    
    return {
      allowed: result.allowed,
      tier: isAuthenticated ? 'authenticated' : 'anonymous'
    };
  }

  // Cleanup expired entries (_for memory store)
  cleanup(_): void {
    if (_this.store instanceof MemoryStore) {
      this.store.cleanup(_);
    }
  }
}

// Singleton instance
let rateLimitManager: RateLimitManager;

export function getRateLimitManager(): RateLimitManager {
  if (!rateLimitManager) {
    rateLimitManager = new RateLimitManager(_);
  }
  return rateLimitManager;
}

// Helper functions for specific endpoints
export async function checkAuthRateLimit(_request: NextRequest): Promise<void> {
  const manager = getRateLimitManager(_);
  await manager.middleware( 'auth', request);
}

export async function checkGeneralRateLimit(_request: NextRequest): Promise<void> {
  const manager = getRateLimitManager(_);
  await manager.middleware( 'general', request);
}

export async function checkUploadRateLimit(_request: NextRequest): Promise<void> {
  const manager = getRateLimitManager(_);
  await manager.middleware( 'upload', request);
}

export async function checkSearchRateLimit(_request: NextRequest): Promise<void> {
  const manager = getRateLimitManager(_);
  await manager.middleware( 'search', request);
}

export async function checkCommunityRateLimit(_request: NextRequest): Promise<void> {
  const manager = getRateLimitManager(_);
  await manager.middleware( 'community', request);
}

// Advanced rate limiting strategies
export class AdaptiveRateLimiter extends RateLimiter {
  private baseConfig: RateLimitConfig;
  private adaptiveMultiplier: number = 1;

  constructor( config: RateLimitConfig, store?: RateLimitStore) {
    super( config, store);
    this.baseConfig = { ...config };
  }

  // Adjust rate limit based on system load
  adjustForLoad(_systemLoad: number): void {
    if (_systemLoad > 0.8) {
      this.adaptiveMultiplier = 0.5; // Reduce limit by 50%
    } else if (_systemLoad > 0.6) {
      this.adaptiveMultiplier = 0.75; // Reduce limit by 25%
    } else {
      this.adaptiveMultiplier = 1; // Normal limit
    }

    this.config.max = Math.floor(_this.baseConfig.max * this.adaptiveMultiplier);
  }

  // Adjust rate limit based on user behavior
  adjustForUser( _userId: string, trustScore: number): void {
    if (_trustScore > 0.8) {
      this.adaptiveMultiplier = 1.5; // Increase limit by 50%
    } else if (_trustScore < 0.3) {
      this.adaptiveMultiplier = 0.5; // Reduce limit by 50%
    } else {
      this.adaptiveMultiplier = 1; // Normal limit
    }

    this.config.max = Math.floor(_this.baseConfig.max * this.adaptiveMultiplier);
  }
}

// Rate limit monitoring
export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedUsers: Array<{ userId: string; count: number }>;
}

export class RateLimitMonitor {
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    blockRate: 0,
    topBlockedIPs: [],
    topBlockedUsers: []
  };

  recordRequest(blocked: boolean, _ip?: string, _userId?: string): void {
    this.metrics.totalRequests++;
    
    if (blocked) {
      this.metrics.blockedRequests++;
      // Record blocked IPs and users for analysis
    }

    this.metrics.blockRate = this.metrics.blockedRequests / this.metrics.totalRequests;
  }

  getMetrics(_): RateLimitMetrics {
    return { ...this.metrics };
  }

  reset(_): void {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      blockRate: 0,
      topBlockedIPs: [],
      topBlockedUsers: []
    };
  }
}
