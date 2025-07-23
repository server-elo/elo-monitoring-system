import { NextRequest, NextResponse } from 'next/server'
/**;
 * Simplified Rate Limiting Implementation
 * Basic memory-based rate limiting to get the site working
 */
interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
  message?: string
  headers?: boolean
}
interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}
class RateLimiter {
  private memoryStore: Map<string, number[]> = new Map()
  /**
   * Extract client IP address from request headers
   */
  public getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    if (cfConnectingIP) return cfConnectingIP.trim()
    if (realIP) return realIP.trim()
    if (forwarded) return forwarded.split(',')[0].trim()
    return '127.0.0.1' // Default fallback
  }
  /**
   * Default key generator based on IP address
   */
  private defaultKeyGenerator(req: NextRequest): string {
    const ip = this.getClientIP(req)
    return `rate_limit:${ip}`
  }
  /**
   * Apply rate limiting
   */
  async limit(
    req: NextRequest,
    options: RateLimitOptions,
  ): Promise<RateLimitResult> {
    const keyGenerator =
      options.keyGenerator || this.defaultKeyGenerator.bind(this)
    const key = keyGenerator(req)
    const now = Date.now()
    const window = options.windowMs
    const limit = options.maxRequests
    // Get existing requests for this key
    const requests = this.memoryStore.get(key) || []
    // Filter out old requests outside the window
    const filtered = requests.filter(
      (timestamp: unknown) => timestamp > now - window,
    )
    // Add current request
    filtered.push(now)
    // Update store
    this.memoryStore.set(key, filtered)
    return {
      allowed: filtered.length <= limit,
      remaining: Math.max(0, limit - filtered.length),
      resetTime: now + window,
      totalHits: filtered.length,
    }
  }
  /**
   * Create rate limiting middleware
   */
  createMiddleware(options: RateLimitOptions) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      try {
        const result = await this.limit(req, options)
        if (!result.allowed) {
          const response = NextResponse.json(
            {
              error: options.message || 'Too many requests',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            },
            { status: 429 },
          )
          if (options.headers! === false) {
            response.headers.set(
              'X-RateLimit-Limit',
              options.maxRequests.toString(),
            )
            response.headers.set(
              'X-RateLimit-Remaining',
              result.remaining.toString(),
            )
            response.headers.set(
              'X-RateLimit-Reset',
              Math.ceil(result.resetTime / 1000).toString(),
            )
            response.headers.set(
              'Retry-After',
              Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            )
          }
          return response
        }
        return null // Allow request to proceed
      } catch (error) {
        console.error('Rate limiting error:', error)
        return null // Allow request on error (fail open)
      }
    }
  }
}
// Create singleton instance
export const rateLimiter = new RateLimiter()
/**
 * Predefined rate limiting configurations
 */
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000,
    // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests',
  },
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts',
  },
  // AI endpoints
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'AI service rate limit exceeded',
  },
} as const
/**
 * Apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitOptions,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const middleware = rateLimiter.createMiddleware(config)
    const rateLimitResponse = await middleware(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(req)
  }
}
/**
 * Check rate limit without consuming quota
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitOptions,
): Promise<RateLimitResult> {
  return rateLimiter.limit(req, config)
}
/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(): Promise<{
  totalKeys: number
  redisConnected: boolean
  memoryUsage: number
}> {
  const memoryUsage = (rateLimiter as any).memoryStore?.size || 0
  return {
    totalKeys: memoryUsage,
    redisConnected: false, // Simplified - no Redis for now
    memoryUsage,
  }
}
