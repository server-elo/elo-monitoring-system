/**
 * API caching middleware for Next.js API routes
 * Implements intelligent caching strategies with Redis backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiCache, courseCacheMiddleware, userCacheMiddleware } from './api-cache';

interface CacheConfig {
  ttl?: number;
  tags?: string[];
  revalidateOnStale?: boolean;
  cacheKey?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
  bypassCache?: (req: NextRequest) => boolean;
}

type ApiHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse;

export function withApiCache(config: CacheConfig = {}) {
  return function <T extends ApiHandler>(handler: T): T {
    return (async (req: NextRequest) => {
      const {
        ttl = 300, // 5 minutes default
        tags = [],
        revalidateOnStale = true,
        cacheKey = defaultCacheKey,
        shouldCache = defaultShouldCache,
        bypassCache = defaultBypassCache
      } = config;

      // Skip caching for non-GET requests or when bypassed
      if (req.method !== 'GET' || bypassCache(req)) {
        return handler(req);
      }

      const key = cacheKey(req);
      
      try {
        // Try to get from cache first
        const cached = await apiCache.get<{
          status: number;
          data: any;
          headers: Record<string, string>;
          timestamp: number;
        }>(key, { ttl, tags });

        if (cached) {
          const age = Math.floor((Date.now() - cached.timestamp) / 1000);
          const isStale = age > ttl * 0.8; // Consider stale at 80% of TTL

          // Return cached response with cache headers
          const response = NextResponse.json(cached.data, { 
            status: cached.status,
            headers: {
              ...cached.headers,
              'X-Cache': 'HIT',
              'X-Cache-Age': age.toString(),
              'X-Cache-Status': isStale ? 'STALE' : 'FRESH',
              'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl}`
            }
          });

          // Revalidate in background if stale
          if (isStale && revalidateOnStale) {
            // Don't await this - let it run in background
            revalidateInBackground(key, handler, req, { ttl, tags });
          }

          return response;
        }

        // Not in cache, execute handler
        const response = await handler(req);
        const responseData = await response.clone().json();

        // Cache the response if it should be cached
        if (shouldCache(req, response) && response.status < 400) {
          const cacheData = {
            status: response.status,
            data: responseData,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: Date.now()
          };

          await apiCache.set(key, cacheData, { ttl, tags });
        }

        // Add cache headers to response
        const enhancedResponse = NextResponse.json(responseData, {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl}`
          }
        });

        return enhancedResponse;

      } catch (error) {
        console.error('Cache middleware error:', error);
        // Fallback to handler on cache error
        return handler(req);
      }
    }) as T;
  };
}

// Default cache key generator
function defaultCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  const pathWithQuery = url.pathname + url.search;
  return `api:${pathWithQuery}`;
}

// Default should cache predicate
function defaultShouldCache(req: NextRequest, res: NextResponse): boolean {
  // Cache successful GET responses
  return req.method === 'GET' && res.status >= 200 && res.status < 300;
}

// Default bypass cache predicate
function defaultBypassCache(req: NextRequest): boolean {
  const url = new URL(req.url);
  
  // Skip cache for auth endpoints
  if (url.pathname.includes('/auth/')) return true;
  
  // Skip cache when no-cache header is present
  if (req.headers.get('cache-control') === 'no-cache') return true;
  
  // Skip cache for admin endpoints
  if (url.pathname.includes('/admin/')) return true;
  
  return false;
}

// Background revalidation
async function revalidateInBackground(
  key: string,
  handler: ApiHandler,
  req: NextRequest,
  options: { ttl: number; tags: string[] }
): Promise<void> {
  try {
    const response = await handler(req);
    const responseData = await response.json();

    if (response.status < 400) {
      const cacheData = {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: Date.now()
      };

      await apiCache.set(key, cacheData, options);
      console.log(`Background revalidation completed for ${key}`);
    }
  } catch (error) {
    console.error(`Background revalidation failed for ${key}:`, error);
  }
}

// Specialized caching configurations for different endpoints
export const cacheConfigs = {
  // User data - medium TTL, invalidate on user updates
  user: {
    ttl: 600, // 10 minutes
    tags: ['user'],
    cacheKey: (req: NextRequest) => {
      const url = new URL(req.url);
      const userId = url.pathname.split('/').pop();
      return `user:${userId}`;
    }
  },

  // Course data - long TTL, invalidate on course updates
  courses: {
    ttl: 1800, // 30 minutes
    tags: ['courses'],
    cacheKey: (req: NextRequest) => {
      const url = new URL(req.url);
      const params = url.searchParams.toString();
      return `courses:list:${params}`;
    }
  },

  // Course details - long TTL with course-specific tags
  courseDetails: {
    ttl: 1800, // 30 minutes
    tags: ['course-details'],
    cacheKey: (req: NextRequest) => {
      const url = new URL(req.url);
      const courseId = url.pathname.split('/').pop();
      return `course:${courseId}:details`;
    }
  },

  // Leaderboard - short TTL, frequently updated
  leaderboard: {
    ttl: 300, // 5 minutes
    tags: ['leaderboard'],
    cacheKey: (req: NextRequest) => {
      const url = new URL(req.url);
      const params = url.searchParams.toString();
      return `leaderboard:${params}`;
    }
  },

  // Progress data - short TTL, user-specific
  progress: {
    ttl: 180, // 3 minutes
    tags: ['progress'],
    cacheKey: (req: NextRequest) => {
      const url = new URL(req.url);
      const userId = req.headers.get('user-id') || 'anonymous';
      const courseId = url.searchParams.get('courseId') || '';
      return `progress:${userId}:${courseId}`;
    }
  },

  // Static content - very long TTL
  static: {
    ttl: 86400, // 24 hours
    tags: ['static'],
    shouldCache: () => true
  }
};

// Helper function to invalidate caches by tag
export async function invalidateApiCache(tags: string | string[]): Promise<number> {
  const tagArray = Array.isArray(tags) ? tags : [tags];
  let totalInvalidated = 0;

  for (const tag of tagArray) {
    const count = await apiCache.invalidateByTag(tag);
    totalInvalidated += count;
  }

  return totalInvalidated;
}

// Cache warming utilities
export class ApiCacheWarmer {
  private static baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  static async warmPopularEndpoints(): Promise<void> {
    const endpoints = [
      '/api/courses',
      '/api/leaderboard',
      '/api/courses/popular',
      '/api/stats/overview'
    ];

    console.log('Warming API cache for popular endpoints...');

    const promises = endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'X-Cache-Warmup': 'true' }
        });
        
        if (response.ok) {
          console.log(`Warmed cache for ${endpoint}`);
        } else {
          console.warn(`Failed to warm cache for ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error warming cache for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('API cache warming completed');
  }

  static async warmUserSpecificCache(userId: string): Promise<void> {
    const endpoints = [
      `/api/users/${userId}`,
      `/api/users/${userId}/progress`,
      `/api/users/${userId}/achievements`
    ];

    const promises = endpoints.map(async (endpoint) => {
      try {
        await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 
            'X-Cache-Warmup': 'true',
            'user-id': userId
          }
        });
      } catch (error) {
        console.error(`Error warming user cache for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Middleware for cache statistics
export function withCacheStats() {
  return function <T extends ApiHandler>(handler: T): T {
    return (async (req: NextRequest) => {
      const startTime = Date.now();
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Timestamp', new Date().toISOString());

      return response;
    }) as T;
  };
}

// Export decorated cache functions
export const withUserCache = () => withApiCache(cacheConfigs.user);
export const withCourseCache = () => withApiCache(cacheConfigs.courses);
export const withCourseDetailsCache = () => withApiCache(cacheConfigs.courseDetails);
export const withLeaderboardCache = () => withApiCache(cacheConfigs.leaderboard);
export const withProgressCache = () => withApiCache(cacheConfigs.progress);
export const withStaticCache = () => withApiCache(cacheConfigs.static);

// Combined middleware for comprehensive caching and monitoring
export function withApiOptimization(config: CacheConfig = {}) {
  return function <T extends ApiHandler>(handler: T): T {
    return withCacheStats()(withApiCache(config)(handler));
  };
}