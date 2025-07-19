/**
 * Redis Client Mock
 * Provides comprehensive mocking for Redis cache operations
 */

import { vi } from 'vitest';

// Mock Redis data storage
const mockRedisStorage = new Map<string, any>();
const mockRedisExpiration = new Map<string, number>();

// Redis command response types
type RedisValue = string | number | Buffer | null;
type RedisHash = Record<string, string>;
type RedisList = string[];
type RedisSet = Set<string>;

// Mock Redis client implementation
export const mockRedisClient = {
  // String operations
  get: vi.fn(async (key: string): Promise<string | null> => {
    if (mockRedisExpiration.has(key)) {
      const expiry = mockRedisExpiration.get(key)!;
      if (Date.now() > expiry) {
        mockRedisStorage.delete(key);
        mockRedisExpiration.delete(key);
        return null;
      }
    }
    return mockRedisStorage.get(key) || null;
  }),

  set: vi.fn(async (key: string, value: RedisValue, options?: any): Promise<'OK'> => {
    mockRedisStorage.set(key, String(value));
    
    if (options) {
      if (options.EX) {
        // Set expiry in seconds
        mockRedisExpiration.set(key, Date.now() + (options.EX * 1000));
      } else if (options.PX) {
        // Set expiry in milliseconds
        mockRedisExpiration.set(key, Date.now() + options.PX);
      } else if (typeof options === 'string' && options.toUpperCase() === 'EX') {
        // Handle: set(key, value, 'EX', seconds)
        const ttl = arguments[3];
        mockRedisExpiration.set(key, Date.now() + (ttl * 1000));
      }
    }
    
    return 'OK';
  }),

  setex: vi.fn(async (key: string, seconds: number, value: RedisValue): Promise<'OK'> => {
    mockRedisStorage.set(key, String(value));
    mockRedisExpiration.set(key, Date.now() + (seconds * 1000));
    return 'OK';
  }),

  psetex: vi.fn(async (key: string, milliseconds: number, value: RedisValue): Promise<'OK'> => {
    mockRedisStorage.set(key, String(value));
    mockRedisExpiration.set(key, Date.now() + milliseconds);
    return 'OK';
  }),

  del: vi.fn(async (...keys: string[]): Promise<number> => {
    let deletedCount = 0;
    keys.forEach(key => {
      if (mockRedisStorage.has(key)) {
        mockRedisStorage.delete(key);
        mockRedisExpiration.delete(key);
        deletedCount++;
      }
    });
    return deletedCount;
  }),

  exists: vi.fn(async (...keys: string[]): Promise<number> => {
    return keys.filter(key => {
      if (mockRedisExpiration.has(key)) {
        const expiry = mockRedisExpiration.get(key)!;
        if (Date.now() > expiry) {
          mockRedisStorage.delete(key);
          mockRedisExpiration.delete(key);
          return false;
        }
      }
      return mockRedisStorage.has(key);
    }).length;
  }),

  expire: vi.fn(async (key: string, seconds: number): Promise<0 | 1> => {
    if (!mockRedisStorage.has(key)) return 0;
    mockRedisExpiration.set(key, Date.now() + (seconds * 1000));
    return 1;
  }),

  pexpire: vi.fn(async (key: string, milliseconds: number): Promise<0 | 1> => {
    if (!mockRedisStorage.has(key)) return 0;
    mockRedisExpiration.set(key, Date.now() + milliseconds);
    return 1;
  }),

  ttl: vi.fn(async (key: string): Promise<number> => {
    if (!mockRedisStorage.has(key)) return -2;
    if (!mockRedisExpiration.has(key)) return -1;
    
    const expiry = mockRedisExpiration.get(key)!;
    const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
    
    if (remaining === 0) {
      mockRedisStorage.delete(key);
      mockRedisExpiration.delete(key);
      return -2;
    }
    
    return remaining;
  }),

  pttl: vi.fn(async (key: string): Promise<number> => {
    if (!mockRedisStorage.has(key)) return -2;
    if (!mockRedisExpiration.has(key)) return -1;
    
    const expiry = mockRedisExpiration.get(key)!;
    const remaining = Math.max(0, expiry - Date.now());
    
    if (remaining === 0) {
      mockRedisStorage.delete(key);
      mockRedisExpiration.delete(key);
      return -2;
    }
    
    return remaining;
  }),

  // Increment/Decrement operations
  incr: vi.fn(async (key: string): Promise<number> => {
    const current = parseInt(mockRedisStorage.get(key) || '0', 10);
    const newValue = current + 1;
    mockRedisStorage.set(key, String(newValue));
    return newValue;
  }),

  incrby: vi.fn(async (key: string, increment: number): Promise<number> => {
    const current = parseInt(mockRedisStorage.get(key) || '0', 10);
    const newValue = current + increment;
    mockRedisStorage.set(key, String(newValue));
    return newValue;
  }),

  decr: vi.fn(async (key: string): Promise<number> => {
    const current = parseInt(mockRedisStorage.get(key) || '0', 10);
    const newValue = current - 1;
    mockRedisStorage.set(key, String(newValue));
    return newValue;
  }),

  decrby: vi.fn(async (key: string, decrement: number): Promise<number> => {
    const current = parseInt(mockRedisStorage.get(key) || '0', 10);
    const newValue = current - decrement;
    mockRedisStorage.set(key, String(newValue));
    return newValue;
  }),

  // Hash operations
  hget: vi.fn(async (key: string, field: string): Promise<string | null> => {
    const hash = mockRedisStorage.get(key) as RedisHash;
    return hash?.[field] || null;
  }),

  hset: vi.fn(async (key: string, ...args: any[]): Promise<number> => {
    let hash = mockRedisStorage.get(key) as RedisHash || {};
    let fieldsSet = 0;
    
    // Handle both hset(key, field, value) and hset(key, {field1: value1, field2: value2})
    if (args.length === 2 && typeof args[0] === 'string') {
      // Single field-value pair
      const [field, value] = args;
      if (!hash[field]) fieldsSet = 1;
      hash[field] = String(value);
    } else if (args.length === 1 && typeof args[0] === 'object') {
      // Multiple field-value pairs as object
      const fields = args[0];
      Object.entries(fields).forEach(([field, value]) => {
        if (!hash[field]) fieldsSet++;
        hash[field] = String(value);
      });
    } else {
      // Multiple field-value pairs as arguments
      for (let i = 0; i < args.length; i += 2) {
        const field = args[i];
        const value = args[i + 1];
        if (!hash[field]) fieldsSet++;
        hash[field] = String(value);
      }
    }
    
    mockRedisStorage.set(key, hash);
    return fieldsSet;
  }),

  hgetall: vi.fn(async (key: string): Promise<RedisHash> => {
    return mockRedisStorage.get(key) as RedisHash || {};
  }),

  hdel: vi.fn(async (key: string, ...fields: string[]): Promise<number> => {
    const hash = mockRedisStorage.get(key) as RedisHash;
    if (!hash) return 0;
    
    let deletedCount = 0;
    fields.forEach(field => {
      if (hash[field]) {
        delete hash[field];
        deletedCount++;
      }
    });
    
    if (Object.keys(hash).length === 0) {
      mockRedisStorage.delete(key);
    } else {
      mockRedisStorage.set(key, hash);
    }
    
    return deletedCount;
  }),

  hexists: vi.fn(async (key: string, field: string): Promise<0 | 1> => {
    const hash = mockRedisStorage.get(key) as RedisHash;
    return hash?.[field] !== undefined ? 1 : 0;
  }),

  hkeys: vi.fn(async (key: string): Promise<string[]> => {
    const hash = mockRedisStorage.get(key) as RedisHash;
    return hash ? Object.keys(hash) : [];
  }),

  hvals: vi.fn(async (key: string): Promise<string[]> => {
    const hash = mockRedisStorage.get(key) as RedisHash;
    return hash ? Object.values(hash) : [];
  }),

  // List operations
  lpush: vi.fn(async (key: string, ...elements: string[]): Promise<number> => {
    let list = mockRedisStorage.get(key) as RedisList || [];
    list.unshift(...elements);
    mockRedisStorage.set(key, list);
    return list.length;
  }),

  rpush: vi.fn(async (key: string, ...elements: string[]): Promise<number> => {
    let list = mockRedisStorage.get(key) as RedisList || [];
    list.push(...elements);
    mockRedisStorage.set(key, list);
    return list.length;
  }),

  lpop: vi.fn(async (key: string): Promise<string | null> => {
    const list = mockRedisStorage.get(key) as RedisList;
    if (!list || list.length === 0) return null;
    
    const element = list.shift()!;
    if (list.length === 0) {
      mockRedisStorage.delete(key);
    } else {
      mockRedisStorage.set(key, list);
    }
    return element;
  }),

  rpop: vi.fn(async (key: string): Promise<string | null> => {
    const list = mockRedisStorage.get(key) as RedisList;
    if (!list || list.length === 0) return null;
    
    const element = list.pop()!;
    if (list.length === 0) {
      mockRedisStorage.delete(key);
    } else {
      mockRedisStorage.set(key, list);
    }
    return element;
  }),

  llen: vi.fn(async (key: string): Promise<number> => {
    const list = mockRedisStorage.get(key) as RedisList;
    return list ? list.length : 0;
  }),

  lrange: vi.fn(async (key: string, start: number, stop: number): Promise<string[]> => {
    const list = mockRedisStorage.get(key) as RedisList;
    if (!list) return [];
    
    // Handle negative indices
    const len = list.length;
    const startIdx = start < 0 ? Math.max(0, len + start) : Math.min(start, len);
    const stopIdx = stop < 0 ? Math.max(-1, len + stop) : Math.min(stop, len - 1);
    
    return list.slice(startIdx, stopIdx + 1);
  }),

  // Set operations
  sadd: vi.fn(async (key: string, ...members: string[]): Promise<number> => {
    let set = mockRedisStorage.get(key) as RedisSet || new Set();
    let addedCount = 0;
    
    members.forEach(member => {
      if (!set.has(member)) {
        set.add(member);
        addedCount++;
      }
    });
    
    mockRedisStorage.set(key, set);
    return addedCount;
  }),

  srem: vi.fn(async (key: string, ...members: string[]): Promise<number> => {
    const set = mockRedisStorage.get(key) as RedisSet;
    if (!set) return 0;
    
    let removedCount = 0;
    members.forEach(member => {
      if (set.has(member)) {
        set.delete(member);
        removedCount++;
      }
    });
    
    if (set.size === 0) {
      mockRedisStorage.delete(key);
    } else {
      mockRedisStorage.set(key, set);
    }
    
    return removedCount;
  }),

  sismember: vi.fn(async (key: string, member: string): Promise<0 | 1> => {
    const set = mockRedisStorage.get(key) as RedisSet;
    return set?.has(member) ? 1 : 0;
  }),

  smembers: vi.fn(async (key: string): Promise<string[]> => {
    const set = mockRedisStorage.get(key) as RedisSet;
    return set ? Array.from(set) : [];
  }),

  scard: vi.fn(async (key: string): Promise<number> => {
    const set = mockRedisStorage.get(key) as RedisSet;
    return set ? set.size : 0;
  }),

  // Database operations
  flushall: vi.fn(async (): Promise<'OK'> => {
    mockRedisStorage.clear();
    mockRedisExpiration.clear();
    return 'OK';
  }),

  flushdb: vi.fn(async (): Promise<'OK'> => {
    mockRedisStorage.clear();
    mockRedisExpiration.clear();
    return 'OK';
  }),

  keys: vi.fn(async (pattern: string): Promise<string[]> => {
    const allKeys = Array.from(mockRedisStorage.keys());
    if (pattern === '*') return allKeys;
    
    // Simple pattern matching (just * wildcard)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }),

  // Connection management
  ping: vi.fn(async (): Promise<'PONG'> => 'PONG'),
  
  quit: vi.fn(async (): Promise<'OK'> => 'OK'),

  disconnect: vi.fn(() => {}),

  // Pipeline and multi support
  pipeline: vi.fn(() => ({
    get: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    del: vi.fn().mockReturnThis(),
    exec: vi.fn(async () => []),
  })),

  multi: vi.fn(() => ({
    get: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    del: vi.fn().mockReturnThis(),
    exec: vi.fn(async () => []),
  })),

  // Status
  status: 'ready',
  
  // Event emitter methods
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

// Helper functions for tests
export const setMockRedisValue = (key: string, value: any, ttl?: number) => {
  mockRedisStorage.set(key, value);
  if (ttl) {
    mockRedisExpiration.set(key, Date.now() + (ttl * 1000));
  }
};

export const getMockRedisValue = (key: string) => {
  return mockRedisStorage.get(key);
};

export const clearMockRedis = () => {
  mockRedisStorage.clear();
  mockRedisExpiration.clear();
};

export const getMockRedisStorage = () => mockRedisStorage;

export const getMockRedisExpiration = () => mockRedisExpiration;

export const resetRedisMocks = () => {
  vi.clearAllMocks();
  Object.values(mockRedisClient).forEach(fn => {
    if (typeof fn === 'function') {
      fn.mockClear?.();
    }
  });
  clearMockRedis();
};

// Mock Redis connection configurations
export const mockRedisConfig = {
  host: 'localhost',
  port: 6379,
  password: undefined,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxMemoryPolicy: 'allkeys-lru',
};

export default mockRedisClient;