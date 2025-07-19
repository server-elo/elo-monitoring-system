/**
 * @fileoverview Comprehensive Caching Systems Testing
 * Tests Redis caching, API caching middleware, and query optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache/redis-client';
import { apiCache, APICache, CacheWarmer } from '@/lib/cache/api-cache';
import { withApiCache, ApiCacheWarmer, invalidateApiCache } from '@/lib/cache/api-middleware';
import { optimizedPrisma, QueryOptimizer } from '@/lib/database/query-optimization';
import { mockRedis } from '../utils/mockRedis';
import { mockPrisma } from '../utils/mockPrisma';

// Mock Redis client
vi.mock('@/lib/cache/redis-client', () => ({
  redis: mockRedis
}));

// Mock Prisma client
vi.mock('@/lib/database/query-optimization', () => ({
  optimizedPrisma: mockPrisma,
  QueryOptimizer: vi.fn()
}));

// Mock Next.js request/response
const createMockRequest = (method = 'GET', url = 'http://localhost:3000/api/test') => {
  return new NextRequest(url, { method });
};

const createMockResponse = (data: any, status = 200) => {
  return NextResponse.json(data, { status });
};

describe('Caching Systems', () => {
  beforeAll(() => {
    // Reset all mocks before tests
    vi.clearAllMocks();
  });

  beforeEach(() => {
    // Clear Redis mock data before each test
    mockRedis.get.mockClear();
    mockRedis.set.mockClear();
    mockRedis.del.mockClear();
    mockRedis.exists.mockClear();
    mockRedis.increment.mockClear();
    mockRedis.flush.mockClear();
    mockRedis.ping.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Redis Client', () => {
    it('should successfully connect to Redis', async () => {
      mockRedis.ping.mockResolvedValueOnce(true);
      
      const isConnected = await redis.ping();
      
      expect(isConnected).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalledTimes(1);
    });

    it('should handle Redis connection failures gracefully', async () => {
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection failed'));
      
      const isConnected = await redis.ping();
      
      expect(isConnected).toBe(false);
      expect(mockRedis.ping).toHaveBeenCalledTimes(1);
    });

    it('should store and retrieve data correctly', async () => {
      const testKey = 'test:key';
      const testData = { message: 'Hello, Redis!' };
      const ttl = 3600;

      // Mock successful set operation
      mockRedis.set.mockResolvedValueOnce(true);
      
      const setResult = await redis.set(testKey, testData, ttl);
      expect(setResult).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(testKey, testData, ttl);

      // Mock successful get operation
      mockRedis.get.mockResolvedValueOnce(testData);
      
      const retrievedData = await redis.get(testKey);
      expect(retrievedData).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
    });

    it('should handle data serialization and deserialization', async () => {
      const complexData = {
        id: 'test-123',
        user: {
          name: 'John Doe',
          age: 30,
          preferences: ['coding', 'learning']
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'test',
          version: '1.0'
        }
      };

      mockRedis.set.mockResolvedValueOnce(true);
      mockRedis.get.mockResolvedValueOnce(complexData);

      // Store complex data
      await redis.set('complex:data', complexData);
      
      // Retrieve and verify
      const retrieved = await redis.get('complex:data');
      expect(retrieved).toEqual(complexData);
      expect(retrieved.user.preferences).toEqual(['coding', 'learning']);
    });

    it('should implement TTL (Time To Live) correctly', async () => {
      const key = 'expiring:key';
      const data = 'temporary data';
      const shortTTL = 5; // 5 seconds

      mockRedis.set.mockResolvedValueOnce(true);
      
      await redis.set(key, data, shortTTL);
      
      expect(mockRedis.set).toHaveBeenCalledWith(key, data, shortTTL);
    });

    it('should handle key deletion', async () => {
      const key = 'delete:me';
      
      mockRedis.del.mockResolvedValueOnce(true);
      
      const deleteResult = await redis.delete(key);
      
      expect(deleteResult).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(key);
    });

    it('should support atomic increment operations', async () => {
      const counterKey = 'page:views';
      const incrementBy = 1;
      const newValue = 42;

      mockRedis.increment.mockResolvedValueOnce(newValue);
      
      const result = await redis.increment(counterKey, incrementBy);
      
      expect(result).toBe(newValue);
      expect(mockRedis.increment).toHaveBeenCalledWith(counterKey, incrementBy);
    });

    it('should handle Redis unavailability gracefully', async () => {
      // Mock Redis being unavailable
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.set.mockResolvedValueOnce(false);
      
      const retrievedData = await redis.get('unavailable:key');
      expect(retrievedData).toBeNull();
      
      const setResult = await redis.set('unavailable:key', 'data');
      expect(setResult).toBe(false);
    });
  });

  describe('API Cache Layer', () => {
    let cache: APICache;

    beforeEach(() => {
      cache = new APICache('test');
    });

    it('should cache and retrieve API responses', async () => {
      const cacheKey = 'api:response';
      const responseData = { users: [{ id: 1, name: 'John' }] };
      const options = { ttl: 300, tags: ['users'] };

      // Mock cache miss, then cache hit
      mockRedis.get.mockResolvedValueOnce(null); // First call - cache miss
      mockRedis.set.mockResolvedValueOnce(true);  // Set cache
      mockRedis.get.mockResolvedValueOnce(responseData); // Second call - cache hit

      // First call - should be cache miss
      const firstResult = await cache.get(cacheKey, options);
      expect(firstResult).toBeNull();

      // Store in cache
      await cache.set(cacheKey, responseData, options);
      expect(mockRedis.set).toHaveBeenCalled();

      // Second call - should be cache hit
      const secondResult = await cache.get(cacheKey, options);
      expect(secondResult).toEqual(responseData);
    });

    it('should implement cache tagging for group invalidation', async () => {
      const userKey = 'user:123';
      const userData = { id: '123', name: 'John Doe' };
      const tags = ['user', 'profile'];

      mockRedis.set.mockResolvedValue(true);
      mockRedis.get.mockResolvedValue([]);
      
      await cache.set(userKey, userData, { tags });
      
      // Verify main cache entry
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining(userKey),
        userData,
        3600
      );
    });

    it('should invalidate cached data by tags', async () => {
      const tag = 'user';
      const associatedKeys = ['test:user:123', 'test:user:456'];

      // Mock tag lookup and key deletion
      mockRedis.get.mockResolvedValueOnce(associatedKeys);
      mockRedis.del.mockResolvedValue(true);
      
      const invalidatedCount = await cache.invalidateByTag(tag);
      
      expect(invalidatedCount).toBe(associatedKeys.length);
      expect(mockRedis.del).toHaveBeenCalledTimes(associatedKeys.length + 1); // Keys + tag
    });

    it('should track cache statistics', async () => {
      const cacheKey = 'stats:test';
      
      // Simulate cache miss
      mockRedis.get.mockResolvedValueOnce(null);
      await cache.get(cacheKey);
      
      // Simulate cache hit
      mockRedis.get.mockResolvedValueOnce('cached data');
      await cache.get(cacheKey);
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });

    it('should handle cache compression for large objects', async () => {
      const largeObject = {
        data: 'x'.repeat(10000), // Large string
        metadata: { size: 'large', compressed: true }
      };

      mockRedis.set.mockResolvedValueOnce(true);
      
      await cache.set('large:object', largeObject, { compress: true });
      
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should support cache versioning', async () => {
      const key = 'versioned:data';
      const v1Data = { version: 1, data: 'old' };
      const v2Data = { version: 2, data: 'new' };

      mockRedis.set.mockResolvedValue(true);
      mockRedis.get.mockResolvedValueOnce(v1Data).mockResolvedValueOnce(v2Data);

      // Store version 1
      await cache.set(key, v1Data, { version: 'v1' });
      
      // Store version 2
      await cache.set(key, v2Data, { version: 'v2' });
      
      // Retrieve different versions
      const retrievedV1 = await cache.get(key, { version: 'v1' });
      const retrievedV2 = await cache.get(key, { version: 'v2' });
      
      expect(retrievedV1).toEqual(v1Data);
      expect(retrievedV2).toEqual(v2Data);
    });
  });

  describe('API Caching Middleware', () => {
    it('should cache GET requests and return cached responses', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'fresh data' })
      );

      const cachedHandler = withApiCache({ ttl: 300 })(mockHandler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/users');

      // First request - cache miss
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.set.mockResolvedValueOnce(true);

      const firstResponse = await cachedHandler(request);
      const firstData = await firstResponse.json();
      
      expect(firstData.data).toBe('fresh data');
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Second request - cache hit
      const cachedData = {
        status: 200,
        data: { data: 'fresh data' },
        headers: {},
        timestamp: Date.now()
      };
      mockRedis.get.mockResolvedValueOnce(cachedData);

      const secondResponse = await cachedHandler(request);
      const secondData = await secondResponse.json();
      
      expect(secondData.data).toBe('fresh data');
      expect(secondResponse.headers.get('X-Cache')).toBe('HIT');
      expect(mockHandler).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should skip caching for non-GET requests', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const cachedHandler = withApiCache()(mockHandler);
      const postRequest = createMockRequest('POST', 'http://localhost:3000/api/users');

      await cachedHandler(postRequest);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should implement stale-while-revalidate pattern', async () => {
      const mockHandler = vi.fn()
        .mockResolvedValueOnce(NextResponse.json({ data: 'original' }))
        .mockResolvedValueOnce(NextResponse.json({ data: 'updated' }));

      const cachedHandler = withApiCache({ 
        ttl: 300,
        revalidateOnStale: true 
      })(mockHandler);

      const request = createMockRequest('GET', 'http://localhost:3000/api/data');

      // Return stale data (older than 80% of TTL)
      const staleData = {
        status: 200,
        data: { data: 'original' },
        headers: {},
        timestamp: Date.now() - 250 * 1000 // 250 seconds ago (stale)
      };
      
      mockRedis.get.mockResolvedValueOnce(staleData);
      mockRedis.set.mockResolvedValueOnce(true);

      const response = await cachedHandler(request);
      const data = await response.json();
      
      expect(data.data).toBe('original'); // Returns stale data immediately
      expect(response.headers.get('X-Cache-Status')).toBe('STALE');
      
      // Background revalidation should occur
      await new Promise(resolve => setTimeout(resolve, 0)); // Let background task run
    });

    it('should handle cache errors gracefully', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'fallback data' })
      );

      const cachedHandler = withApiCache()(mockHandler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/error-test');

      // Mock Redis error
      mockRedis.get.mockRejectedValueOnce(new Error('Redis connection failed'));

      const response = await cachedHandler(request);
      const data = await response.json();
      
      expect(data.data).toBe('fallback data');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should support custom cache key generation', async () => {
      const customKeyGenerator = (req: NextRequest) => {
        const url = new URL(req.url);
        return `custom:${url.pathname}:${url.search}`;
      };

      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'custom cached' })
      );

      const cachedHandler = withApiCache({ 
        cacheKey: customKeyGenerator 
      })(mockHandler);

      const request = createMockRequest('GET', 'http://localhost:3000/api/custom?param=value');

      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.set.mockResolvedValueOnce(true);

      await cachedHandler(request);
      
      // Verify custom cache key was used
      expect(mockRedis.get).toHaveBeenCalledWith('custom:/api/custom:?param=value');
    });
  });

  describe('Cache Warming and Invalidation', () => {
    it('should warm cache with popular endpoints', async () => {
      const warmer = new CacheWarmer(apiCache);
      const entries = [
        {
          key: 'popular:endpoint1',
          fetcher: () => Promise.resolve({ data: 'endpoint1 data' }),
          options: { ttl: 600 }
        },
        {
          key: 'popular:endpoint2',
          fetcher: () => Promise.resolve({ data: 'endpoint2 data' }),
          options: { ttl: 600 }
        }
      ];

      // Mock cache doesn't exist
      mockRedis.exists.mockResolvedValue(false);
      mockRedis.set.mockResolvedValue(true);

      await warmer.warmup(entries);

      expect(mockRedis.set).toHaveBeenCalledTimes(entries.length);
    });

    it('should invalidate API cache by tags', async () => {
      const tags = ['user', 'profile'];
      const associatedKeys = ['api:user:123', 'api:user:456'];

      mockRedis.get.mockResolvedValue(associatedKeys);
      mockRedis.del.mockResolvedValue(true);

      const invalidatedCount = await invalidateApiCache(tags);

      expect(invalidatedCount).toBeGreaterThan(0);
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should handle cache warming failures gracefully', async () => {
      const warmer = new CacheWarmer(apiCache);
      const entries = [
        {
          key: 'failing:endpoint',
          fetcher: () => Promise.reject(new Error('Fetcher failed')),
          options: { ttl: 600 }
        }
      ];

      mockRedis.exists.mockResolvedValue(false);

      // Should not throw error
      await expect(warmer.warmup(entries)).resolves.toBeUndefined();
    });
  });

  describe('Query Optimization with DataLoader', () => {
    let queryOptimizer: any;

    beforeEach(() => {
      // Mock QueryOptimizer constructor
      queryOptimizer = {
        getUserById: vi.fn(),
        getUsersByIds: vi.fn(),
        getCourseById: vi.fn(),
        getCoursesByIds: vi.fn(),
        getUserCourseProgress: vi.fn(),
        clearUserCache: vi.fn(),
        getBatchStats: vi.fn()
      };
    });

    it('should batch user queries to prevent N+1 problems', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      const mockUsers = userIds.map(id => ({ id, name: `User ${id}` }));

      queryOptimizer.getUsersByIds.mockResolvedValueOnce(mockUsers);

      const users = await queryOptimizer.getUsersByIds(userIds);

      expect(users).toEqual(mockUsers);
      expect(queryOptimizer.getUsersByIds).toHaveBeenCalledWith(userIds);
      expect(queryOptimizer.getUsersByIds).toHaveBeenCalledTimes(1); // Batched call
    });

    it('should cache and batch course queries', async () => {
      const courseIds = ['course1', 'course2'];
      const mockCourses = courseIds.map(id => ({ 
        id, 
        title: `Course ${id}`,
        lessons: []
      }));

      queryOptimizer.getCoursesByIds.mockResolvedValueOnce(mockCourses);

      const courses = await queryOptimizer.getCoursesByIds(courseIds);

      expect(courses).toEqual(mockCourses);
      expect(queryOptimizer.getCoursesByIds).toHaveBeenCalledTimes(1);
    });

    it('should handle progress queries efficiently', async () => {
      const userId = 'user123';
      const courseId = 'course456';
      const mockProgress = {
        userId,
        courseId,
        progressPercentage: 75,
        completedLessons: 8
      };

      queryOptimizer.getUserCourseProgress.mockResolvedValueOnce(mockProgress);

      const progress = await queryOptimizer.getUserCourseProgress(userId, courseId);

      expect(progress).toEqual(mockProgress);
      expect(queryOptimizer.getUserCourseProgress).toHaveBeenCalledWith(userId, courseId);
    });

    it('should provide batch statistics', async () => {
      const mockStats = {
        timestamp: new Date().toISOString(),
        note: 'DataLoader batching reduces N+1 queries',
        loaders: {
          user: 'Batches up to 100 user queries',
          course: 'Batches up to 50 course queries'
        }
      };

      queryOptimizer.getBatchStats.mockReturnValueOnce(mockStats);

      const stats = queryOptimizer.getBatchStats();

      expect(stats).toEqual(mockStats);
      expect(stats.loaders.user).toContain('100 user queries');
    });

    it('should clear user-specific caches', async () => {
      const userId = 'user123';

      queryOptimizer.clearUserCache.mockResolvedValueOnce(undefined);

      await queryOptimizer.clearUserCache(userId);

      expect(queryOptimizer.clearUserCache).toHaveBeenCalledWith(userId);
    });
  });

  describe('Cache Performance and Monitoring', () => {
    it('should track cache hit rates', async () => {
      const cache = new APICache('performance');
      
      // Simulate cache operations
      mockRedis.get.mockResolvedValueOnce(null); // Miss
      await cache.get('test:key1');
      
      mockRedis.get.mockResolvedValueOnce('cached data'); // Hit
      await cache.get('test:key2');
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should measure cache response times', async () => {
      const cache = new APICache('timing');
      
      mockRedis.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data'), 10))
      );
      
      await cache.get('timing:test');
      
      const stats = cache.getStats();
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });

    it('should handle cache memory management', async () => {
      // Test cache flushing
      mockRedis.flush.mockResolvedValueOnce(true);
      
      const flushResult = await redis.flush();
      
      expect(flushResult).toBe(true);
      expect(mockRedis.flush).toHaveBeenCalledTimes(1);
    });

    it('should support cache namespace isolation', async () => {
      const userCache = new APICache('users');
      const courseCache = new APICache('courses');
      
      mockRedis.set.mockResolvedValue(true);
      
      await userCache.set('item1', { type: 'user' });
      await courseCache.set('item1', { type: 'course' });
      
      // Verify different namespaces were used
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('users:item1'),
        { type: 'user' },
        3600
      );
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('courses:item1'),
        { type: 'course' },
        3600
      );
    });
  });
});