/**
 * Mock Redis Client for Testing
 * Provides comprehensive mocking for all Redis operations
 */

import { vi } from 'vitest';

export const mockRedis = {
  // Basic operations
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),

  // String operations
  append: vi.fn(),
  strlen: vi.fn(),
  getrange: vi.fn(),
  setrange: vi.fn(),

  // Numeric operations
  incr: vi.fn(),
  decr: vi.fn(),
  incrby: vi.fn(),
  decrby: vi.fn(),
  increment: vi.fn(),

  // Hash operations
  hget: vi.fn(),
  hset: vi.fn(),
  hdel: vi.fn(),
  hexists: vi.fn(),
  hgetall: vi.fn(),
  hkeys: vi.fn(),
  hvals: vi.fn(),
  hlen: vi.fn(),

  // List operations
  lpush: vi.fn(),
  rpush: vi.fn(),
  lpop: vi.fn(),
  rpop: vi.fn(),
  llen: vi.fn(),
  lrange: vi.fn(),
  lindex: vi.fn(),
  lset: vi.fn(),

  // Set operations
  sadd: vi.fn(),
  srem: vi.fn(),
  smembers: vi.fn(),
  sismember: vi.fn(),
  scard: vi.fn(),
  spop: vi.fn(),
  srandmember: vi.fn(),

  // Sorted set operations
  zadd: vi.fn(),
  zrem: vi.fn(),
  zscore: vi.fn(),
  zrank: vi.fn(),
  zrange: vi.fn(),
  zcard: vi.fn(),

  // Pattern operations
  keys: vi.fn(),
  scan: vi.fn(),
  deletePattern: vi.fn(),

  // Connection operations
  ping: vi.fn(),
  select: vi.fn(),
  flushdb: vi.fn(),
  flushall: vi.fn(),
  flush: vi.fn(),

  // Transaction operations
  multi: vi.fn(),
  exec: vi.fn(),
  discard: vi.fn(),
  watch: vi.fn(),
  unwatch: vi.fn(),

  // Pub/Sub operations
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  psubscribe: vi.fn(),
  punsubscribe: vi.fn(),

  // Connection management
  connect: vi.fn(),
  disconnect: vi.fn(),
  quit: vi.fn(),

  // Info and stats
  info: vi.fn(),
  dbsize: vi.fn(),
  lastsave: vi.fn(),

  // Specialized operations
  setEx: vi.fn(),
  setNx: vi.fn(),
  getSet: vi.fn(),
  mget: vi.fn(),
  mset: vi.fn(),

  // Event handling (for connection state)
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),

  // Error handling
  ensureConnection: vi.fn().mockResolvedValue(true),
  getStats: vi.fn().mockReturnValue({
    connected: true,
    hasClient: true,
    config: {
      url: 'redis://localhost:6379',
      maxRetries: 3,
      retryDelayMs: 1000
    }
  })
};

// In-memory store for testing
class MockRedisStore {
  private store = new Map<string, { value: any; expires?: number }>();

  get(key: string): any | null {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key: string, value: any, ttlSeconds?: number): boolean {
    const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.store.set(key, { value, expires });
    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  exists(key: string): boolean {
    return this.get(key) !== null;
  }

  increment(key: string, by = 1): number {
    const current = parseInt(this.get(key) || '0');
    const newValue = current + by;
    this.set(key, newValue.toString());
    return newValue;
  }

  keys(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  flush(): boolean {
    this.store.clear();
    return true;
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

// Create a shared store instance for tests
export const mockRedisStore = new MockRedisStore();

// Setup default mock implementations that use the store
export const setupMockRedisDefaults = () => {
  mockRedis.get.mockImplementation((key: string) => {
    return Promise.resolve(mockRedisStore.get(key));
  });

  mockRedis.set.mockImplementation((key: string, value: any, ttl?: number) => {
    const result = mockRedisStore.set(key, value, ttl);
    return Promise.resolve(result);
  });

  mockRedis.del.mockImplementation((key: string) => {
    const result = mockRedisStore.delete(key);
    return Promise.resolve(result);
  });

  mockRedis.exists.mockImplementation((key: string) => {
    const result = mockRedisStore.exists(key);
    return Promise.resolve(result);
  });

  mockRedis.increment.mockImplementation((key: string, by?: number) => {
    const result = mockRedisStore.increment(key, by);
    return Promise.resolve(result);
  });

  mockRedis.keys.mockImplementation((pattern: string) => {
    const result = mockRedisStore.keys(pattern);
    return Promise.resolve(result);
  });

  mockRedis.flush.mockImplementation(() => {
    const result = mockRedisStore.flush();
    return Promise.resolve(result);
  });

  mockRedis.ping.mockResolvedValue(true);
  mockRedis.connect.mockResolvedValue(undefined);
  mockRedis.disconnect.mockResolvedValue(undefined);
};

// Helper function to reset all mocks and store
export const resetMockRedis = () => {
  Object.values(mockRedis).forEach(method => {
    if (typeof method === 'function' && method.mockReset) {
      method.mockReset();
    }
  });
  mockRedisStore.clear();
  setupMockRedisDefaults();
};

// Helper functions for common test scenarios
export const mockRedisFailure = () => {
  mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
  mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));
  mockRedis.ping.mockResolvedValue(false);
};

export const mockRedisSlowResponse = (delay = 100) => {
  mockRedis.get.mockImplementation((key: string) => 
    new Promise(resolve => 
      setTimeout(() => resolve(mockRedisStore.get(key)), delay)
    )
  );
};

export const mockRedisRateLimitExceeded = (key: string, limit = 5) => {
  mockRedisStore.set(key, limit.toString());
  mockRedis.get.mockImplementation((k: string) => {
    if (k === key) {
      return Promise.resolve(limit.toString());
    }
    return Promise.resolve(mockRedisStore.get(k));
  });
};

// Initialize default implementations
setupMockRedisDefaults();