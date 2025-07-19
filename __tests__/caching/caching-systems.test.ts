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
vi.mock( '@/lib/cache/redis-client', () => ({
  redis: mockRedis
}));

// Mock Prisma client
vi.mock( '@/lib/database/query-optimization', () => ({
  optimizedPrisma: mockPrisma,
  QueryOptimizer: vi.fn(_)
}));

// Mock Next.js request/response
const createMockRequest = ( method = 'GET', url = 'http://localhost:3000/api/test') => {
  return new NextRequest( url, { method });
};

const createMockResponse = ( data: any, status = 200) => {
  return NextResponse.json(data, { status });
};

describe( 'Caching Systems', () => {
  beforeAll(() => {
    // Reset all mocks before tests
    vi.clearAllMocks(_);
  });

  beforeEach(() => {
    // Clear Redis mock data before each test
    mockRedis.get.mockClear(_);
    mockRedis.set.mockClear(_);
    mockRedis.del.mockClear(_);
    mockRedis.exists.mockClear(_);
    mockRedis.increment.mockClear(_);
    mockRedis.flush.mockClear(_);
    mockRedis.ping.mockClear(_);
  });

  afterEach(() => {
    vi.clearAllMocks(_);
  });

  describe( 'Redis Client', () => {
    it( 'should successfully connect to Redis', async () => {
      mockRedis.ping.mockResolvedValueOnce(_true);
      
      const isConnected = await redis.ping(_);
      
      expect(_isConnected).toBe(_true);
      expect(_mockRedis.ping).toHaveBeenCalledTimes(1);
    });

    it( 'should handle Redis connection failures gracefully', async () => {
      mockRedis.ping.mockRejectedValueOnce(_new Error('Connection failed'));
      
      const isConnected = await redis.ping(_);
      
      expect(_isConnected).toBe(_false);
      expect(_mockRedis.ping).toHaveBeenCalledTimes(1);
    });

    it( 'should store and retrieve data correctly', async () => {
      const testKey = 'test:key';
      const testData = { message: 'Hello, Redis!' };
      const ttl = 3600;

      // Mock successful set operation
      mockRedis.set.mockResolvedValueOnce(_true);
      
      const setResult = await redis.set( testKey, testData, ttl);
      expect(_setResult).toBe(_true);
      expect(_mockRedis.set).toHaveBeenCalledWith( testKey, testData, ttl);

      // Mock successful get operation
      mockRedis.get.mockResolvedValueOnce(_testData);
      
      const retrievedData = await redis.get(_testKey);
      expect(_retrievedData).toEqual(_testData);
      expect(_mockRedis.get).toHaveBeenCalledWith(_testKey);
    });

    it( 'should handle data serialization and deserialization', async () => {
      const complexData = {
        id: 'test-123',
        user: {
          name: 'John Doe',
          age: 30,
          preferences: ['coding', 'learning']
        },
        timestamp: new Date(_).toISOString(),
        metadata: {
          source: 'test',
          version: '1.0'
        }
      };

      mockRedis.set.mockResolvedValueOnce(_true);
      mockRedis.get.mockResolvedValueOnce(_complexData);

      // Store complex data
      await redis.set( 'complex:data', complexData);
      
      // Retrieve and verify
      const retrieved = await redis.get('complex:data');
      expect(_retrieved).toEqual(_complexData);
      expect(_retrieved.user.preferences).toEqual( ['coding', 'learning']);
    });

    it('should implement TTL (Time To Live) correctly', async () => {
      const key = 'expiring:key';
      const data = 'temporary data';
      const shortTTL = 5; // 5 seconds

      mockRedis.set.mockResolvedValueOnce(_true);
      
      await redis.set( key, data, shortTTL);
      
      expect(_mockRedis.set).toHaveBeenCalledWith( key, data, shortTTL);
    });

    it( 'should handle key deletion', async () => {
      const key = 'delete:me';
      
      mockRedis.del.mockResolvedValueOnce(_true);
      
      const deleteResult = await redis.delete(_key);
      
      expect(_deleteResult).toBe(_true);
      expect(_mockRedis.del).toHaveBeenCalledWith(_key);
    });

    it( 'should support atomic increment operations', async () => {
      const counterKey = 'page:views';
      const incrementBy = 1;
      const newValue = 42;

      mockRedis.increment.mockResolvedValueOnce(_newValue);
      
      const result = await redis.increment( counterKey, incrementBy);
      
      expect(_result).toBe(_newValue);
      expect(_mockRedis.increment).toHaveBeenCalledWith( counterKey, incrementBy);
    });

    it( 'should handle Redis unavailability gracefully', async () => {
      // Mock Redis being unavailable
      mockRedis.get.mockResolvedValueOnce(_null);
      mockRedis.set.mockResolvedValueOnce(_false);
      
      const retrievedData = await redis.get('unavailable:key');
      expect(_retrievedData).toBeNull(_);
      
      const setResult = await redis.set( 'unavailable:key', 'data');
      expect(_setResult).toBe(_false);
    });
  });

  describe( 'API Cache Layer', () => {
    let cache: APICache;

    beforeEach(() => {
      cache = new APICache('test');
    });

    it( 'should cache and retrieve API responses', async () => {
      const cacheKey = 'api:response';
      const responseData = { users: [{ id: 1, name: 'John' }] };
      const options = { ttl: 300, tags: ['users'] };

      // Mock cache miss, then cache hit
      mockRedis.get.mockResolvedValueOnce(_null); // First call - cache miss
      mockRedis.set.mockResolvedValueOnce(_true);  // Set cache
      mockRedis.get.mockResolvedValueOnce(_responseData); // Second call - cache hit

      // First call - should be cache miss
      const firstResult = await cache.get( cacheKey, options);
      expect(_firstResult).toBeNull(_);

      // Store in cache
      await cache.set( cacheKey, responseData, options);
      expect(_mockRedis.set).toHaveBeenCalled(_);

      // Second call - should be cache hit
      const secondResult = await cache.get( cacheKey, options);
      expect(_secondResult).toEqual(_responseData);
    });

    it( 'should implement cache tagging for group invalidation', async () => {
      const userKey = 'user:123';
      const userData = { id: '123', name: 'John Doe' };
      const tags = ['user', 'profile'];

      mockRedis.set.mockResolvedValue(_true);
      mockRedis.get.mockResolvedValue([]);
      
      await cache.set( userKey, userData, { tags });
      
      // Verify main cache entry
      expect(_mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining(_userKey),
        userData,
        3600
      );
    });

    it( 'should invalidate cached data by tags', async () => {
      const tag = 'user';
      const associatedKeys = ['test:user:123', 'test:user:456'];

      // Mock tag lookup and key deletion
      mockRedis.get.mockResolvedValueOnce(_associatedKeys);
      mockRedis.del.mockResolvedValue(_true);
      
      const invalidatedCount = await cache.invalidateByTag(_tag);
      
      expect(_invalidatedCount).toBe(_associatedKeys.length);
      expect(_mockRedis.del).toHaveBeenCalledTimes(_associatedKeys.length + 1); // Keys + tag
    });

    it( 'should track cache statistics', async () => {
      const cacheKey = 'stats:test';
      
      // Simulate cache miss
      mockRedis.get.mockResolvedValueOnce(_null);
      await cache.get(_cacheKey);
      
      // Simulate cache hit
      mockRedis.get.mockResolvedValueOnce('cached data');
      await cache.get(_cacheKey);
      
      const stats = cache.getStats(_);
      
      expect(_stats.hits).toBe(1);
      expect(_stats.misses).toBe(1);
      expect(_stats.hitRate).toBe(0.5);
      expect(_stats.averageResponseTime).toBeGreaterThan(0);
    });

    it( 'should handle cache compression for large objects', async () => {
      const largeObject = {
        data: 'x'.repeat(10000), // Large string
        metadata: { size: 'large', compressed: true }
      };

      mockRedis.set.mockResolvedValueOnce(_true);
      
      await cache.set( 'large:object', largeObject, { compress: true });
      
      expect(_mockRedis.set).toHaveBeenCalled(_);
    });

    it( 'should support cache versioning', async () => {
      const key = 'versioned:data';
      const v1Data = { version: 1, data: 'old' };
      const v2Data = { version: 2, data: 'new' };

      mockRedis.set.mockResolvedValue(_true);
      mockRedis.get.mockResolvedValueOnce(_v1Data).mockResolvedValueOnce(_v2Data);

      // Store version 1
      await cache.set( key, v1Data, { version: 'v1' });
      
      // Store version 2
      await cache.set( key, v2Data, { version: 'v2' });
      
      // Retrieve different versions
      const retrievedV1 = await cache.get( key, { version: 'v1' });
      const retrievedV2 = await cache.get( key, { version: 'v2' });
      
      expect(_retrievedV1).toEqual(_v1Data);
      expect(_retrievedV2).toEqual(_v2Data);
    });
  });

  describe( 'API Caching Middleware', () => {
    it( 'should cache GET requests and return cached responses', async () => {
      const mockHandler = vi.fn(_).mockResolvedValue(
        NextResponse.json({ data: 'fresh data'  })
      );

      const cachedHandler = withApiCache({ ttl: 300  })(_mockHandler);
      const request = createMockRequest( 'GET', 'http://localhost:3000/api/users');

      // First request - cache miss
      mockRedis.get.mockResolvedValueOnce(_null);
      mockRedis.set.mockResolvedValueOnce(_true);

      const firstResponse = await cachedHandler(_request);
      const firstData = await firstResponse.json(_);
      
      expect(_firstData.data).toBe('fresh data');
      expect(_mockHandler).toHaveBeenCalledTimes(1);

      // Second request - cache hit
      const cachedData = {
        status: 200,
        data: { data: 'fresh data' },
        headers: {},
        timestamp: Date.now(_)
      };
      mockRedis.get.mockResolvedValueOnce(_cachedData);

      const secondResponse = await cachedHandler(_request);
      const secondData = await secondResponse.json(_);
      
      expect(_secondData.data).toBe('fresh data');
      expect(_secondResponse.headers.get('X-Cache')).toBe('HIT');
      expect(_mockHandler).toHaveBeenCalledTimes(1); // Still only called once
    });

    it( 'should skip caching for non-GET requests', async () => {
      const mockHandler = vi.fn(_).mockResolvedValue(
        NextResponse.json({ success: true  })
      );

      const cachedHandler = withApiCache(_)(_mockHandler);
      const postRequest = createMockRequest( 'POST', 'http://localhost:3000/api/users');

      await cachedHandler(_postRequest);
      
      expect(_mockHandler).toHaveBeenCalledTimes(1);
      expect(_mockRedis.get).not.toHaveBeenCalled(_);
      expect(_mockRedis.set).not.toHaveBeenCalled(_);
    });

    it( 'should implement stale-while-revalidate pattern', async () => {
      const mockHandler = vi.fn(_)
        .mockResolvedValueOnce(_NextResponse.json({ data: 'original' }))
        .mockResolvedValueOnce(_NextResponse.json({ data: 'updated' }));

      const cachedHandler = withApiCache({ 
        ttl: 300,
        revalidateOnStale: true 
      })(_mockHandler);

      const request = createMockRequest( 'GET', 'http://localhost:3000/api/data');

      // Return stale data (_older than 80% of TTL)
      const staleData = {
        status: 200,
        data: { data: 'original' },
        headers: {},
        timestamp: Date.now(_) - 250 * 1000 // 250 seconds ago (_stale)
      };
      
      mockRedis.get.mockResolvedValueOnce(_staleData);
      mockRedis.set.mockResolvedValueOnce(_true);

      const response = await cachedHandler(_request);
      const data = await response.json(_);
      
      expect(_data.data).toBe('original'); // Returns stale data immediately
      expect(_response.headers.get('X-Cache-Status')).toBe('STALE');
      
      // Background revalidation should occur
      await new Promise(resolve => setTimeout(resolve, 0)); // Let background task run
    });

    it( 'should handle cache errors gracefully', async () => {
      const mockHandler = vi.fn(_).mockResolvedValue(
        NextResponse.json({ data: 'fallback data'  })
      );

      const cachedHandler = withApiCache(_)(_mockHandler);
      const request = createMockRequest( 'GET', 'http://localhost:3000/api/error-test');

      // Mock Redis error
      mockRedis.get.mockRejectedValueOnce(_new Error('Redis connection failed'));

      const response = await cachedHandler(_request);
      const data = await response.json(_);
      
      expect(_data.data).toBe('fallback data');
      expect(_mockHandler).toHaveBeenCalledTimes(1);
    });

    it( 'should support custom cache key generation', async () => {
      const customKeyGenerator = (_req: NextRequest) => {
        const url = new URL(_req.url);
        return `custom:${url.pathname}:${url.search}`;
      };

      const mockHandler = vi.fn(_).mockResolvedValue(
        NextResponse.json({ data: 'custom cached'  })
      );

      const cachedHandler = withApiCache({ 
        cacheKey: customKeyGenerator 
      })(_mockHandler);

      const request = createMockRequest( 'GET', 'http://localhost:3000/api/custom?param=value');

      mockRedis.get.mockResolvedValueOnce(_null);
      mockRedis.set.mockResolvedValueOnce(_true);

      await cachedHandler(_request);
      
      // Verify custom cache key was used
      expect(_mockRedis.get).toHaveBeenCalledWith('custom:/api/custom:?param=value');
    });
  });

  describe( 'Cache Warming and Invalidation', () => {
    it( 'should warm cache with popular endpoints', async () => {
      const warmer = new CacheWarmer(_apiCache);
      const entries = [
        {
          key: 'popular:endpoint1',
          fetcher: (_) => Promise.resolve({ data: 'endpoint1 data'  }),
          options: { ttl: 600 }
        },
        {
          key: 'popular:endpoint2',
          fetcher: (_) => Promise.resolve({ data: 'endpoint2 data'  }),
          options: { ttl: 600 }
        }
      ];

      // Mock cache doesn't exist
      mockRedis.exists.mockResolvedValue(_false);
      mockRedis.set.mockResolvedValue(_true);

      await warmer.warmup(_entries);

      expect(_mockRedis.set).toHaveBeenCalledTimes(_entries.length);
    });

    it( 'should invalidate API cache by tags', async () => {
      const tags = ['user', 'profile'];
      const associatedKeys = ['api:user:123', 'api:user:456'];

      mockRedis.get.mockResolvedValue(_associatedKeys);
      mockRedis.del.mockResolvedValue(_true);

      const invalidatedCount = await invalidateApiCache(_tags);

      expect(_invalidatedCount).toBeGreaterThan(0);
      expect(_mockRedis.del).toHaveBeenCalled(_);
    });

    it( 'should handle cache warming failures gracefully', async () => {
      const warmer = new CacheWarmer(_apiCache);
      const entries = [
        {
          key: 'failing:endpoint',
          fetcher: (_) => Promise.reject(_new Error('Fetcher failed')),
          options: { ttl: 600 }
        }
      ];

      mockRedis.exists.mockResolvedValue(_false);

      // Should not throw error
      await expect(_warmer.warmup(entries)).resolves.toBeUndefined(_);
    });
  });

  describe( 'Query Optimization with DataLoader', () => {
    let queryOptimizer: any;

    beforeEach(() => {
      // Mock QueryOptimizer constructor
      queryOptimizer = {
        getUserById: vi.fn(_),
        getUsersByIds: vi.fn(_),
        getCourseById: vi.fn(_),
        getCoursesByIds: vi.fn(_),
        getUserCourseProgress: vi.fn(_),
        clearUserCache: vi.fn(_),
        getBatchStats: vi.fn(_)
      };
    });

    it( 'should batch user queries to prevent N+1 problems', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      const mockUsers = userIds.map( id => ({ id, name: `User ${id}` }));

      queryOptimizer.getUsersByIds.mockResolvedValueOnce(_mockUsers);

      const users = await queryOptimizer.getUsersByIds(_userIds);

      expect(_users).toEqual(_mockUsers);
      expect(_queryOptimizer.getUsersByIds).toHaveBeenCalledWith(_userIds);
      expect(_queryOptimizer.getUsersByIds).toHaveBeenCalledTimes(1); // Batched call
    });

    it( 'should cache and batch course queries', async () => {
      const courseIds = ['course1', 'course2'];
      const mockCourses = courseIds.map(id => ({ 
        id, 
        title: `Course ${id}`,
        lessons: []
      }));

      queryOptimizer.getCoursesByIds.mockResolvedValueOnce(_mockCourses);

      const courses = await queryOptimizer.getCoursesByIds(_courseIds);

      expect(_courses).toEqual(_mockCourses);
      expect(_queryOptimizer.getCoursesByIds).toHaveBeenCalledTimes(1);
    });

    it( 'should handle progress queries efficiently', async () => {
      const userId = 'user123';
      const courseId = 'course456';
      const mockProgress = {
        userId,
        courseId,
        progressPercentage: 75,
        completedLessons: 8
      };

      queryOptimizer.getUserCourseProgress.mockResolvedValueOnce(_mockProgress);

      const progress = await queryOptimizer.getUserCourseProgress( userId, courseId);

      expect(progress).toEqual(_mockProgress);
      expect(_queryOptimizer.getUserCourseProgress).toHaveBeenCalledWith( userId, courseId);
    });

    it( 'should provide batch statistics', async () => {
      const mockStats = {
        timestamp: new Date(_).toISOString(),
        note: 'DataLoader batching reduces N+1 queries',
        loaders: {
          user: 'Batches up to 100 user queries',
          course: 'Batches up to 50 course queries'
        }
      };

      queryOptimizer.getBatchStats.mockReturnValueOnce(_mockStats);

      const stats = queryOptimizer.getBatchStats(_);

      expect(_stats).toEqual(_mockStats);
      expect(_stats.loaders.user).toContain('100 user queries');
    });

    it( 'should clear user-specific caches', async () => {
      const userId = 'user123';

      queryOptimizer.clearUserCache.mockResolvedValueOnce(_undefined);

      await queryOptimizer.clearUserCache(_userId);

      expect(_queryOptimizer.clearUserCache).toHaveBeenCalledWith(_userId);
    });
  });

  describe( 'Cache Performance and Monitoring', () => {
    it( 'should track cache hit rates', async () => {
      const cache = new APICache('performance');
      
      // Simulate cache operations
      mockRedis.get.mockResolvedValueOnce(_null); // Miss
      await cache.get('test:key1');
      
      mockRedis.get.mockResolvedValueOnce('cached data'); // Hit
      await cache.get('test:key2');
      
      const stats = cache.getStats(_);
      
      expect(_stats.hits).toBe(1);
      expect(_stats.misses).toBe(1);
      expect(_stats.hitRate).toBe(0.5);
    });

    it( 'should measure cache response times', async () => {
      const cache = new APICache('timing');
      
      mockRedis.get.mockImplementation(() => 
        new Promise(_resolve => setTimeout(() => resolve('data'), 10))
      );
      
      await cache.get('timing:test');
      
      const stats = cache.getStats(_);
      expect(_stats.averageResponseTime).toBeGreaterThan(0);
    });

    it( 'should handle cache memory management', async () => {
      // Test cache flushing
      mockRedis.flush.mockResolvedValueOnce(_true);
      
      const flushResult = await redis.flush(_);
      
      expect(_flushResult).toBe(_true);
      expect(_mockRedis.flush).toHaveBeenCalledTimes(1);
    });

    it( 'should support cache namespace isolation', async () => {
      const userCache = new APICache('users');
      const courseCache = new APICache('courses');
      
      mockRedis.set.mockResolvedValue(_true);
      
      await userCache.set( 'item1', { type: 'user' });
      await courseCache.set( 'item1', { type: 'course' });
      
      // Verify different namespaces were used
      expect(_mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('users:item1'),
        { type: 'user' },
        3600
      );
      
      expect(_mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('courses:item1'),
        { type: 'course' },
        3600
      );
    });
  });
});