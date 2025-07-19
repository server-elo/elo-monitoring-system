/**
 * Advanced Caching Utility for API Responses
 * 
 * Provides multi-level caching with TTL, compression, and cache invalidation
 */

import crypto from 'crypto';
import { logger } from '@/lib/api/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  metadata?: Record<string, any>;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
  tags?: string[]; // For cache invalidation
  namespace?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private tags = new Map<string, Set<string>>(); // tag -> set of keys
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private generateKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private evictLRU(): void {
    if (this.cache.size <= this.maxSize) return;
    
    // Simple LRU: remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, this.cache.size - this.maxSize + 1);
    for (const [key] of toRemove) {
      this.cache.delete(key);
      this.stats.deletes++;
    }
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.generateKey(key, options.namespace);
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      this.stats.deletes++;
      this.updateStats();
      return null;
    }
    
    this.stats.hits++;
    this.updateStats();
    
    // Update timestamp for LRU
    entry.timestamp = Date.now();
    
    return entry.data as T;
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.generateKey(key, options.namespace);
    const ttl = options.ttl || 60 * 60 * 1000; // Default 1 hour
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      compressed: options.compress,
      metadata: {}
    };
    
    this.cache.set(fullKey, entry);
    this.stats.sets++;
    
    // Handle tags for cache invalidation
    if (options.tags) {
      for (const tag of options.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(fullKey);
      }
    }
    
    // Evict old entries if necessary
    this.evictLRU();
    this.updateStats();
  }

  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.generateKey(key, options.namespace);
    const deleted = this.cache.delete(fullKey);
    
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
    }
    
    return deleted;
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tags.get(tag);
    if (!keys) return 0;
    
    let deletedCount = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        deletedCount++;
        this.stats.deletes++;
      }
    }
    
    this.tags.delete(tag);
    this.updateStats();
    return deletedCount;
  }

  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.tags.clear();
    this.stats.deletes += size;
    this.updateStats();
  }

  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      this.stats.deletes += deletedCount;
      this.updateStats();
      logger.info('Cache cleanup completed', {
        deletedCount,
        operation: 'cache-cleanup'
      });
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const globalCache = new InMemoryCache(2000); // Store up to 2000 entries

// Cache key generators
export const cacheKeys = {
  securityAnalysis: (codeHash: string, userId: string) => 
    `security:${codeHash}:${userId}`,
  
  userContext: (userId: string) => 
    `user-context:${userId}`,
  
  llmResponse: (promptHash: string, model: string) => 
    `llm:${model}:${promptHash}`,
  
  codeCompilation: (codeHash: string) => 
    `compile:${codeHash}`,
  
  userProgress: (userId: string) => 
    `progress:${userId}`,
  
  leaderboard: (type: string) => 
    `leaderboard:${type}`,
  
  courseContent: (courseId: string, lessonId: string) => 
    `course:${courseId}:${lessonId}`
};

// Helper function to generate hash from content
export function generateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// Main caching functions
export async function getCached<T>(
  key: string, 
  options: CacheOptions = {}
): Promise<T | null> {
  return globalCache.get<T>(key, options);
}

export async function setCached<T>(
  key: string, 
  data: T, 
  options: CacheOptions = {}
): Promise<void> {
  return globalCache.set(key, data, options);
}

export async function deleteCached(
  key: string, 
  options: CacheOptions = {}
): Promise<boolean> {
  return globalCache.delete(key, options);
}

export async function invalidateByTag(tag: string): Promise<number> {
  return globalCache.invalidateByTag(tag);
}

export async function clearCache(): Promise<void> {
  return globalCache.clear();
}

export function getCacheStats(): CacheStats {
  return globalCache.getStats();
}

// Cache middleware for API routes
export function withCache<T>(
  keyGenerator: (request: Request, ...args: any[]) => string,
  options: CacheOptions = {}
) {
  return function cacheMiddleware(handler: (request: Request, ...args: any[]) => Promise<Response>) {
    return async function cachedHandler(request: Request, ...args: any[]): Promise<Response> {
      const cacheKey = keyGenerator(request, ...args);
      
      // Try to get from cache first
      const cached = await getCached<T>(cacheKey, options);
      if (cached) {
        logger.debug('Cache hit', {
          cacheKey,
          operation: 'cache-get'
        });
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        });
      }
      
      // Execute handler and cache result
      const response = await handler(request, ...args);
      
      if (response instanceof Response && response.ok) {
        try {
          const data = await response.clone().json();
          await setCached(cacheKey, data, options);
          logger.debug('Response cached', {
            cacheKey,
            operation: 'cache-set'
          });
          
          // Add cache headers
          response.headers.set('X-Cache', 'MISS');
          response.headers.set('X-Cache-Key', cacheKey);
        } catch (error) {
          logger.warn('Failed to cache response', {
            error: error instanceof Error ? error.message : 'Unknown error',
            operation: 'cache-set'
          });
        }
      }
      
      return response;
    };
  };
}

// Predefined cache configurations
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  short: {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['short-term']
  },
  
  // Medium-term cache for user-specific data
  medium: {
    ttl: 30 * 60 * 1000, // 30 minutes
    tags: ['medium-term']
  },
  
  // Long-term cache for static or rarely changing data
  long: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ['long-term']
  },
  
  // Security analysis cache
  security: {
    ttl: 60 * 60 * 1000, // 1 hour
    tags: ['security', 'analysis']
  },
  
  // User context cache
  userContext: {
    ttl: 15 * 60 * 1000, // 15 minutes
    tags: ['user', 'context']
  },
  
  // LLM response cache
  llm: {
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    tags: ['llm', 'ai-response']
  }
};

// Response streaming utility for real-time updates
export class StreamingResponse {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.controller = null;
      }
    });
  }

  sendData(data: any): void {
    if (!this.controller) return;

    const chunk = this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    this.controller.enqueue(chunk);
  }

  sendEvent(event: string, data: any): void {
    if (!this.controller) return;

    const chunk = this.encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    this.controller.enqueue(chunk);
  }

  close(): void {
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
  }
}

// Cleanup function for graceful shutdown
export function cleanupCache(): void {
  globalCache.destroy();
}
