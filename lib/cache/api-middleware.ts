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
  cacheKey?: (_req: NextRequest) => string;
  shouldCache?: ( req: NextRequest, res: NextResponse) => boolean;
  bypassCache?: (_req: NextRequest) => boolean;
}

type ApiHandler = (_req: NextRequest) => Promise<NextResponse> | NextResponse;

export function withApiCache(_config: CacheConfig = {}) {
  return function <T extends ApiHandler>(_handler: T): T {
    return ( async (req: NextRequest) => {
      const {
        ttl = 300, // 5 minutes default
        tags = [],
        revalidateOnStale = true,
        cacheKey = defaultCacheKey,
        shouldCache = defaultShouldCache,
        bypassCache = defaultBypassCache
      } = config;

      // Skip caching for non-GET requests or when bypassed
      if (_req.method !== 'GET' || bypassCache(req)) {
        return handler(_req);
      }

      const key = cacheKey(_req);
      
      try {
        // Try to get from cache first
        const cached = await apiCache.get<{
          status: number;
          data: any;
          headers: Record<string, string>;
          timestamp: number;
        }>( key, { ttl, tags });

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
            revalidateInBackground( key, handler, req, { ttl, tags });
          }

          return response;
        }

        // Not in cache, execute handler
        const response = await handler(_req);
        const responseData = await response.clone(_).json(_);

        // Cache the response if it should be cached
        if ( shouldCache(req, response) && response.status < 400) {
          const cacheData = {
            status: response.status,
            data: responseData,
            headers: Object.fromEntries(_response.headers.entries()),
            timestamp: Date.now(_)
          };

          await apiCache.set( key, cacheData, { ttl, tags });
        }

        // Add cache headers to response
        const enhancedResponse = NextResponse.json(responseData, {
          status: response.status,
          headers: {
            ...Object.fromEntries(_response.headers.entries()),
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl}`
          }
        });

        return enhancedResponse;

      } catch (_error) {
        console.error('Cache middleware error:', error);
        // Fallback to handler on cache error
        return handler(_req);
      }
    }) as T;
  };
}

// Default cache key generator
function defaultCacheKey(_req: NextRequest): string {
  const url = new URL(_req.url);
  const pathWithQuery = url.pathname + url.search;
  return `api:${pathWithQuery}`;
}

// Default should cache predicate
function defaultShouldCache( req: NextRequest, res: NextResponse): boolean {
  // Cache successful GET responses
  return req.method === 'GET' && res.status >= 200 && res.status < 300;
}

// Default bypass cache predicate
function defaultBypassCache(_req: NextRequest): boolean {
  const url = new URL(_req.url);
  
  // Skip cache for auth endpoints
  if (_url.pathname.includes('/auth/')) return true;
  
  // Skip cache when no-cache header is present
  if (_req.headers.get('cache-control') === 'no-cache') return true;
  
  // Skip cache for admin endpoints
  if (_url.pathname.includes('/admin/')) return true;
  
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
    const response = await handler(_req);
    const responseData = await response.json(_);

    if (_response.status < 400) {
      const cacheData = {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(_response.headers.entries()),
        timestamp: Date.now(_)
      };

      await apiCache.set( key, cacheData, options);
      console.log(_`Background revalidation completed for ${key}`);
    }
  } catch (_error) {
    console.error(`Background revalidation failed for ${key}:`, error);
  }
}

// Specialized caching configurations for different endpoints
export const cacheConfigs = {
  // User data - medium TTL, invalidate on user updates
  user: {
    ttl: 600, // 10 minutes
    tags: ['user'],
    cacheKey: (_req: NextRequest) => {
      const url = new URL(_req.url);
      const userId = url.pathname.split('/').pop(_);
      return `user:${userId}`;
    }
  },

  // Course data - long TTL, invalidate on course updates
  courses: {
    ttl: 1800, // 30 minutes
    tags: ['courses'],
    cacheKey: (_req: NextRequest) => {
      const url = new URL(_req.url);
      const params = url.searchParams.toString();
      return `courses:list:${params}`;
    }
  },

  // Course details - long TTL with course-specific tags
  courseDetails: {
    ttl: 1800, // 30 minutes
    tags: ['course-details'],
    cacheKey: (_req: NextRequest) => {
      const url = new URL(_req.url);
      const courseId = url.pathname.split('/').pop(_);
      return `course:${courseId}:details`;
    }
  },

  // Leaderboard - short TTL, frequently updated
  leaderboard: {
    ttl: 300, // 5 minutes
    tags: ['leaderboard'],
    cacheKey: (_req: NextRequest) => {
      const url = new URL(_req.url);
      const params = url.searchParams.toString();
      return `leaderboard:${params}`;
    }
  },

  // Progress data - short TTL, user-specific
  progress: {
    ttl: 180, // 3 minutes
    tags: ['progress'],
    cacheKey: (_req: NextRequest) => {
      const url = new URL(_req.url);
      const userId = req.headers.get('user-id') || 'anonymous';
      const courseId = url.searchParams.get('courseId') || '';
      return `progress:${userId}:${courseId}`;
    }
  },

  // Static content - very long TTL
  static: {
    ttl: 86400, // 24 hours
    tags: ['static'],
    shouldCache: (_) => true
  }
};

// Helper function to invalidate caches by tag
export async function invalidateApiCache(_tags: string | string[]): Promise<number> {
  const tagArray = Array.isArray(_tags) ? tags : [tags];
  let totalInvalidated = 0;

  for (_const tag of tagArray) {
    const count = await apiCache.invalidateByTag(_tag);
    totalInvalidated += count;
  }

  return totalInvalidated;
}

// Cache warming utilities
export class ApiCacheWarmer {
  private static baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  static async warmPopularEndpoints(_): Promise<void> {
    const endpoints = [
      '/api/courses',
      '/api/leaderboard',
      '/api/courses/popular',
      '/api/stats/overview'
    ];

    console.log('Warming API cache for popular endpoints...');

    const promises = endpoints.map( async (endpoint) => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'X-Cache-Warmup': 'true' }
        });
        
        if (_response.ok) {
          console.log(_`Warmed cache for ${endpoint}`);
        } else {
          console.warn(_`Failed to warm cache for ${endpoint}: ${response.status}`);
        }
      } catch (_error) {
        console.error(`Error warming cache for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(_promises);
    console.log('API cache warming completed');
  }

  static async warmUserSpecificCache(_userId: string): Promise<void> {
    const endpoints = [
      `/api/users/${userId}`,
      `/api/users/${userId}/progress`,
      `/api/users/${userId}/achievements`
    ];

    const promises = endpoints.map( async (endpoint) => {
      try {
        await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 
            'X-Cache-Warmup': 'true',
            'user-id': userId
          }
        });
      } catch (_error) {
        console.error(`Error warming user cache for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(_promises);
  }
}

// Middleware for cache statistics
export function withCacheStats() {
  return function <T extends ApiHandler>(_handler: T): T {
    return ( async (req: NextRequest) => {
      const startTime = Date.now(_);
      const response = await handler(_req);
      const duration = Date.now(_) - startTime;

      // Add performance headers
      response.headers.set( 'X-Response-Time', `${duration}ms`);
      response.headers.set( 'X-Timestamp', new Date().toISOString());

      return response;
    }) as T;
  };
}

// Export decorated cache functions
export const withUserCache = (_) => withApiCache(_cacheConfigs.user);
export const withCourseCache = (_) => withApiCache(_cacheConfigs.courses);
export const withCourseDetailsCache = (_) => withApiCache(_cacheConfigs.courseDetails);
export const withLeaderboardCache = (_) => withApiCache(_cacheConfigs.leaderboard);
export const withProgressCache = (_) => withApiCache(_cacheConfigs.progress);
export const withStaticCache = (_) => withApiCache(_cacheConfigs.static);

// Combined middleware for comprehensive caching and monitoring
export function withApiOptimization(_config: CacheConfig = {}) {
  return function <T extends ApiHandler>(_handler: T): T {
    return withCacheStats(_)(_withApiCache(config)(_handler));
  };
}