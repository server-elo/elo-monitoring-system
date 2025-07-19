import { NextRequest, NextResponse } from 'next/server';

// Cache Interface
interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// In-Memory Cache Store (for development)
class MemoryCacheStore implements CacheStore {
  private store = new Map<string, { value: any; expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    if (item.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    this.store.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.store.get(key);
    
    if (!item) {
      return false;
    }

    if (item.expires < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expires < now) {
        this.store.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    this.cleanup();
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys())
    };
  }
}

// Redis Cache Store (for production)
class RedisCacheStore implements CacheStore {
  private redis: any; // Redis client

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }
}

// Cache Manager
export class CacheManager {
  private static instance: CacheManager;
  private store: CacheStore;
  private defaultTTL: number = 300; // 5 minutes
  private enabled: boolean = true;

  constructor(store?: CacheStore) {
    this.store = store || new MemoryCacheStore();
    this.enabled = process.env.CACHE_ENABLED !== 'false';
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      return await this.store.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.store.set(key, value, ttl || this.defaultTTL);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.store.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.store.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      return await this.store.has(key);
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  // Cache with function execution
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  // Generate cache key
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    // This would be implemented differently for Redis vs Memory
    if (this.store instanceof MemoryCacheStore) {
      const stats = this.store.getStats();
      const keysToDelete = stats.keys.filter(key => 
        key.includes(pattern) || key.match(new RegExp(pattern))
      );
      
      for (const key of keysToDelete) {
        await this.delete(key);
      }
    }
  }

  // Enable/disable caching
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Cache Middleware
export function cacheMiddleware(
  ttl: number = 300,
  keyGenerator?: (request: NextRequest) => string
) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return handler(request);
    }

    const cache = CacheManager.getInstance();
    const cacheKey = keyGenerator 
      ? keyGenerator(request)
      : `api:${request.url}`;

    // Try to get from cache
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      const response = new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`
        }
      });
      return response;
    }

    // Execute handler
    const response = await handler(request);

    // Cache successful responses
    if (response.status === 200) {
      try {
        const responseData = await response.json();
        await cache.set(cacheKey, responseData, ttl);
        
        // Create new response with cache headers
        const cachedResponse = new NextResponse(JSON.stringify(responseData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}`
          }
        });
        
        return cachedResponse;
      } catch (error) {
        console.error('Cache middleware error:', error);
        return response;
      }
    }

    return response;
  };
}

// Cache decorators for common patterns
export const CachePatterns = {
  // User data cache
  user: (userId: string) => `user:${userId}`,
  
  // Lesson data cache
  lesson: (lessonId: string) => `lesson:${lessonId}`,
  lessons: (filters: string) => `lessons:${filters}`,
  
  // Course data cache
  course: (courseId: string) => `course:${courseId}`,
  courses: (filters: string) => `courses:${filters}`,
  
  // Progress data cache
  progress: (userId: string, lessonId: string) => `progress:${userId}:${lessonId}`,
  userProgress: (userId: string) => `user_progress:${userId}`,
  
  // Community data cache
  leaderboard: (category: string, filters: string) => `leaderboard:${category}:${filters}`,
  stats: (filters: string) => `stats:${filters}`,
  
  // Achievement data cache
  achievements: () => 'achievements:all',
  userAchievements: (userId: string) => `achievements:user:${userId}`
};

// Cache TTL constants
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
  DAILY: 86400      // 24 hours
};

// Singleton instance
export const cache = CacheManager.getInstance();

// Helper functions
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  return cache.getOrSet(key, fn, ttl);
}

export function invalidateUserCache(userId: string): Promise<void> {
  return cache.invalidatePattern(`user:${userId}`);
}

export function invalidateLessonCache(lessonId: string): Promise<void> {
  return cache.invalidatePattern(`lesson:${lessonId}`);
}

export function invalidateCourseCache(courseId: string): Promise<void> {
  return cache.invalidatePattern(`course:${courseId}`);
}
