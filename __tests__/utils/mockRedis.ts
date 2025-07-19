/**
 * Mock Redis Client for Testing
 * Provides comprehensive mocking for all Redis operations
 */

import { vi } from 'vitest';

export const mockRedis = {
  // Basic operations
  get: vi.fn(_),
  set: vi.fn(_),
  del: vi.fn(_),
  exists: vi.fn(_),
  expire: vi.fn(_),
  ttl: vi.fn(_),

  // String operations
  append: vi.fn(_),
  strlen: vi.fn(_),
  getrange: vi.fn(_),
  setrange: vi.fn(_),

  // Numeric operations
  incr: vi.fn(_),
  decr: vi.fn(_),
  incrby: vi.fn(_),
  decrby: vi.fn(_),
  increment: vi.fn(_),

  // Hash operations
  hget: vi.fn(_),
  hset: vi.fn(_),
  hdel: vi.fn(_),
  hexists: vi.fn(_),
  hgetall: vi.fn(_),
  hkeys: vi.fn(_),
  hvals: vi.fn(_),
  hlen: vi.fn(_),

  // List operations
  lpush: vi.fn(_),
  rpush: vi.fn(_),
  lpop: vi.fn(_),
  rpop: vi.fn(_),
  llen: vi.fn(_),
  lrange: vi.fn(_),
  lindex: vi.fn(_),
  lset: vi.fn(_),

  // Set operations
  sadd: vi.fn(_),
  srem: vi.fn(_),
  smembers: vi.fn(_),
  sismember: vi.fn(_),
  scard: vi.fn(_),
  spop: vi.fn(_),
  srandmember: vi.fn(_),

  // Sorted set operations
  zadd: vi.fn(_),
  zrem: vi.fn(_),
  zscore: vi.fn(_),
  zrank: vi.fn(_),
  zrange: vi.fn(_),
  zcard: vi.fn(_),

  // Pattern operations
  keys: vi.fn(_),
  scan: vi.fn(_),
  deletePattern: vi.fn(_),

  // Connection operations
  ping: vi.fn(_),
  select: vi.fn(_),
  flushdb: vi.fn(_),
  flushall: vi.fn(_),
  flush: vi.fn(_),

  // Transaction operations
  multi: vi.fn(_),
  exec: vi.fn(_),
  discard: vi.fn(_),
  watch: vi.fn(_),
  unwatch: vi.fn(_),

  // Pub/Sub operations
  publish: vi.fn(_),
  subscribe: vi.fn(_),
  unsubscribe: vi.fn(_),
  psubscribe: vi.fn(_),
  punsubscribe: vi.fn(_),

  // Connection management
  connect: vi.fn(_),
  disconnect: vi.fn(_),
  quit: vi.fn(_),

  // Info and stats
  info: vi.fn(_),
  dbsize: vi.fn(_),
  lastsave: vi.fn(_),

  // Specialized operations
  setEx: vi.fn(_),
  setNx: vi.fn(_),
  getSet: vi.fn(_),
  mget: vi.fn(_),
  mset: vi.fn(_),

  // Event handling (_for connection state)
  on: vi.fn(_),
  off: vi.fn(_),
  emit: vi.fn(_),

  // Error handling
  ensureConnection: vi.fn(_).mockResolvedValue(_true),
  getStats: vi.fn(_).mockReturnValue({
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
  private store = new Map<string, { value: any; expires?: number }>(_);

  get(_key: string): any | null {
    const item = this.store.get(_key);
    if (!item) return null;
    
    if (_item.expires && Date.now() > item.expires) {
      this.store.delete(_key);
      return null;
    }
    
    return item.value;
  }

  set( key: string, value: any, ttlSeconds?: number): boolean {
    const expires = ttlSeconds ? Date.now(_) + (_ttlSeconds * 1000) : undefined;
    this.store.set( key, { value, expires });
    return true;
  }

  delete(_key: string): boolean {
    return this.store.delete(_key);
  }

  exists(_key: string): boolean {
    return this.get(_key) !== null;
  }

  increment( key: string, by = 1): number {
    const current = parseInt(_this.get(key) || '0');
    const newValue = current + by;
    this.set( key, newValue.toString());
    return newValue;
  }

  keys(_pattern: string): string[] {
    const regex = new RegExp( pattern.replace(/\*/g, '.*'));
    return Array.from(_this.store.keys()).filter(key => regex.test(key));
  }

  flush(_): boolean {
    this.store.clear(_);
    return true;
  }

  size(_): number {
    return this.store.size;
  }

  clear(_): void {
    this.store.clear(_);
  }
}

// Create a shared store instance for tests
export const mockRedisStore = new MockRedisStore(_);

// Setup default mock implementations that use the store
export const setupMockRedisDefaults = (_) => {
  mockRedis.get.mockImplementation((key: string) => {
    return Promise.resolve(_mockRedisStore.get(key));
  });

  mockRedis.set.mockImplementation( (key: string, value: any, ttl?: number) => {
    const result = mockRedisStore.set( key, value, ttl);
    return Promise.resolve(_result);
  });

  mockRedis.del.mockImplementation((key: string) => {
    const result = mockRedisStore.delete(_key);
    return Promise.resolve(_result);
  });

  mockRedis.exists.mockImplementation((key: string) => {
    const result = mockRedisStore.exists(_key);
    return Promise.resolve(_result);
  });

  mockRedis.increment.mockImplementation( (key: string, by?: number) => {
    const result = mockRedisStore.increment( key, by);
    return Promise.resolve(_result);
  });

  mockRedis.keys.mockImplementation((pattern: string) => {
    const result = mockRedisStore.keys(_pattern);
    return Promise.resolve(_result);
  });

  mockRedis.flush.mockImplementation(() => {
    const result = mockRedisStore.flush(_);
    return Promise.resolve(_result);
  });

  mockRedis.ping.mockResolvedValue(_true);
  mockRedis.connect.mockResolvedValue(_undefined);
  mockRedis.disconnect.mockResolvedValue(_undefined);
};

// Helper function to reset all mocks and store
export const resetMockRedis = (_) => {
  Object.values(_mockRedis).forEach(method => {
    if (_typeof method === 'function' && method.mockReset) {
      method.mockReset(_);
    }
  });
  mockRedisStore.clear(_);
  setupMockRedisDefaults(_);
};

// Helper functions for common test scenarios
export const mockRedisFailure = (_) => {
  mockRedis.get.mockRejectedValue(_new Error('Redis connection failed'));
  mockRedis.set.mockRejectedValue(_new Error('Redis connection failed'));
  mockRedis.ping.mockResolvedValue(_false);
};

export const mockRedisSlowResponse = (_delay = 100) => {
  mockRedis.get.mockImplementation((key: string) => 
    new Promise(resolve => 
      setTimeout(() => resolve(_mockRedisStore.get(key)), delay)
    )
  );
};

export const mockRedisRateLimitExceeded = ( key: string, limit = 5) => {
  mockRedisStore.set( key, limit.toString());
  mockRedis.get.mockImplementation((k: string) => {
    if (_k === key) {
      return Promise.resolve(_limit.toString());
    }
    return Promise.resolve(_mockRedisStore.get(k));
  });
};

// Initialize default implementations
setupMockRedisDefaults(_);