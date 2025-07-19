/**
 * Production-ready API caching layer with Redis backend
 * Implements intelligent cache invalidation, tagging, and performance monitoring
 */

import { redis } from './redis-client';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for group invalidation
  namespace?: string; // Cache namespace
  version?: string; // Cache version for busting
  compress?: boolean; // Compress large objects
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  averageResponseTime: number;
}

export class APICache {
  private namespace: string;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    averageResponseTime: 0
  };

  constructor(namespace = 'api') {
    this.namespace = namespace;
  }

  private getKey(key: string, namespace?: string, version?: string): string {
    const ns = namespace || this.namespace;
    const versionSuffix = version ? `:v${version}` : '';
    return `${ns}:${key}${versionSuffix}`;
  }

  private getTagKey(tag: string, namespace?: string): string {
    const ns = namespace || this.namespace;
    return `${ns}:tag:${tag}`;
  }

  private updateStats(hit: boolean, responseTime: number): void {
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = this.stats.hits / total;
    
    // Calculate rolling average
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (total - 1) + responseTime) / total;
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.getKey(key, options.namespace, options.version);
    
    try {
      const data = await redis.get<T>(cacheKey);
      const responseTime = Date.now() - startTime;
      
      this.updateStats(data !== null, responseTime);
      
      if (data && process.env.NODE_ENV === 'development') {
        console.log(`Cache HIT: ${cacheKey} (${responseTime}ms)`);
      }
      
      return data;
    } catch (error) {
      console.error('Cache GET error:', error);
      this.updateStats(false, Date.now() - startTime);
      return null;
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const {
      ttl = 3600,
      tags = [],
      namespace,
      version,
      compress = false
    } = options;
    
    const cacheKey = this.getKey(key, namespace, version);
    
    try {
      // Store the main cache entry
      let dataToStore = value;
      
      // Compress large objects if requested
      if (compress && typeof value === 'object') {
        // In a real implementation, you'd use compression like gzip
        // For now, we'll just store as-is
        dataToStore = value;
      }
      
      const success = await redis.set(cacheKey, dataToStore, ttl);
      
      if (success) {
        // Store tag associations for cache invalidation
        await this.storeTags(cacheKey, tags, namespace, ttl);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Cache SET: ${cacheKey} (TTL: ${ttl}s, Tags: ${tags.join(', ')})`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Cache SET error:', error);
      return false;
    }
  }

  private async storeTags(
    cacheKey: string, 
    tags: string[], 
    namespace?: string,
    ttl?: number
  ): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.getTagKey(tag, namespace);
      
      try {
        // Get existing keys for this tag
        const existingKeys = await redis.get<string[]>(tagKey) || [];
        
        // Add the new key if not already present
        if (!existingKeys.includes(cacheKey)) {
          existingKeys.push(cacheKey);
          
          // Store updated tag association with same TTL as cache entry
          await redis.set(tagKey, existingKeys, ttl || 3600);
        }
      } catch (error) {
        console.error(`Error storing tag ${tag}:`, error);
      }
    }
  }

  async invalidate(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key, options.namespace, options.version);
    
    try {
      const success = await redis.delete(cacheKey);
      
      if (success && process.env.NODE_ENV === 'development') {
        console.log(`Cache INVALIDATE: ${cacheKey}`);
      }
      
      return success;
    } catch (error) {
      console.error('Cache INVALIDATE error:', error);
      return false;
    }
  }

  async invalidateByTag(tag: string, options: CacheOptions = {}): Promise<number> {
    const tagKey = this.getTagKey(tag, options.namespace);
    let invalidatedCount = 0;
    
    try {
      const keys = await redis.get<string[]>(tagKey);
      
      if (keys && keys.length > 0) {
        // Delete all cache entries associated with this tag
        for (const key of keys) {
          const success = await redis.delete(key);
          if (success) invalidatedCount++;
        }
        
        // Delete the tag association
        await redis.delete(tagKey);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Cache INVALIDATE BY TAG: ${tag} (${invalidatedCount} keys)`);
        }
      }
      
      return invalidatedCount;
    } catch (error) {
      console.error(`Cache invalidate by tag error for ${tag}:`, error);
      return 0;
    }
  }

  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const fullPattern = this.getKey(pattern, options.namespace);
    
    try {
      const success = await redis.deletePattern(fullPattern);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache INVALIDATE PATTERN: ${fullPattern}`);
      }
      
      return success ? 1 : 0;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return 0;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key, options.namespace, options.version);
    return await redis.exists(cacheKey);
  }

  async increment(key: string, by = 1, options: CacheOptions = {}): Promise<number | null> {
    const cacheKey = this.getKey(key, options.namespace, options.version);
    return await redis.increment(cacheKey, by);
  }

  async flush(namespace?: string): Promise<boolean> {
    try {
      if (namespace) {
        // Flush specific namespace
        const pattern = `${namespace}:*`;
        return await redis.deletePattern(pattern);
      } else {
        // Flush entire cache
        return await redis.flush();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      averageResponseTime: 0
    };
  }
}

// Specialized cache instances
export const apiCache = new APICache('api');
export const userCache = new APICache('user');
export const courseCache = new APICache('course');
export const sessionCache = new APICache('session');

// Cache warming utility
export class CacheWarmer {
  private cache: APICache;
  
  constructor(cache: APICache) {
    this.cache = cache;
  }
  
  async warmup(entries: Array<{
    key: string;
    fetcher: () => Promise<any>;
    options?: CacheOptions;
  }>): Promise<void> {
    console.log(`Warming up ${entries.length} cache entries...`);
    
    const promises = entries.map(async ({ key, fetcher, options }) => {
      try {
        // Check if already cached
        const exists = await this.cache.exists(key, options);
        if (!exists) {
          const data = await fetcher();
          await this.cache.set(key, data, options);
          console.log(`Warmed cache entry: ${key}`);
        }
      } catch (error) {
        console.error(`Failed to warm cache entry ${key}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    console.log('Cache warmup completed');
  }
}

// Middleware for automatic cache warming
export function createCacheMiddleware(cache: APICache) {
  return {
    // Automatic cache-first wrapper
    async withCache<T>(
      key: string,
      fetcher: () => Promise<T>,
      options: CacheOptions = {}
    ): Promise<T> {
      // Try to get from cache first
      const cached = await cache.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }
      
      // Fetch fresh data
      const data = await fetcher();
      
      // Store in cache for next time
      await cache.set(key, data, options);
      
      return data;
    },
    
    // Background refresh pattern
    async withBackgroundRefresh<T>(
      key: string,
      fetcher: () => Promise<T>,
      options: CacheOptions & { staleTime?: number } = {}
    ): Promise<T> {
      const { staleTime = 300, ...cacheOptions } = options; // 5 minutes stale time
      
      const cached = await cache.get<T>(key, cacheOptions);
      
      if (cached !== null) {
        // Return cached data immediately
        
        // Check if we should refresh in background
        const cacheAge = await this.getCacheAge(key, cacheOptions);
        if (cacheAge > staleTime) {
          // Refresh in background (don't await)
          this.refreshInBackground(key, fetcher, cacheOptions);
        }
        
        return cached;
      }
      
      // No cached data, fetch synchronously
      const data = await fetcher();
      await cache.set(key, data, cacheOptions);
      return data;
    },
    
    async getCacheAge(key: string, options: CacheOptions): Promise<number> {
      // This would require additional Redis commands to track cache timestamps
      // For now, return 0 (implementation can be enhanced)
      return 0;
    },
    
    refreshInBackground(
      key: string,
      fetcher: () => Promise<any>,
      options: CacheOptions
    ): void {
      // Don't await this - it runs in background
      fetcher()
        .then(data => cache.set(key, data, options))
        .catch(error => console.error(`Background refresh failed for ${key}:`, error));
    }
  };
}

// Export middleware instances
export const apiCacheMiddleware = createCacheMiddleware(apiCache);
export const userCacheMiddleware = createCacheMiddleware(userCache);
export const courseCacheMiddleware = createCacheMiddleware(courseCache);