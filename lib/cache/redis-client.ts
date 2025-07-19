/**
 * Redis client configuration for production-ready caching and session storage
 * Implements connection pooling, error handling, and graceful fallbacks
 */

import { createClient, RedisClientType } from 'redis';

type RedisConfig = {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  connectTimeoutMs?: number;
  lazyConnect?: boolean;
};

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private config: RedisConfig;
  private connectionPromise: Promise<void> | null = null;

  constructor(_config: RedisConfig = {}) {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: 3,
      retryDelayMs: 1000,
      connectTimeoutMs: 5000,
      lazyConnect: true,
      ...config
    };
  }

  async connect(_): Promise<void> {
    if (_this.isConnected && this.client) return;
    
    // Prevent multiple simultaneous connection attempts
    if (_this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect(_);
    return this.connectionPromise;
  }

  private async _connect(_): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (_retries: number) => {
            if (_retries > (this.config.maxRetries || 3)) {
              console.error('Redis max retries exceeded');
              return new Error('Max retries exceeded');
            }
            return Math.min(_retries * (this.config.retryDelayMs || 1000), 3000);
          },
          connectTimeout: this.config.connectTimeoutMs
        }
      });

      this.client.on( 'error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on( 'connect', () => {
        console.log('Redis connected');
      });

      this.client.on( 'ready', () => {
        this.isConnected = true;
        console.log('Redis ready');
      });

      this.client.on( 'end', () => {
        this.isConnected = false;
        console.log('Redis connection ended');
      });

      this.client.on( 'reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      await this.client.connect(_);
    } catch (_error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  async ensureConnection(_): Promise<boolean> {
    if (_this.isConnected && this.client) return true;
    
    try {
      await this.connect(_);
      return this.isConnected;
    } catch {
      return false;
    }
  }

  async get<T>(_key: string): Promise<T | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client!.get(_key);
      return data ? JSON.parse(_data) : null;
    } catch (_error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set( key: string, value: any, ttlSeconds = 3600): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.setEx( key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (_error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(_key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.del(_key);
      return true;
    } catch (_error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async deletePattern(_pattern: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const keys = await this.client!.keys(_pattern);
      if (_keys.length > 0) {
        await this.client!.del(_keys);
      }
      return true;
    } catch (_error) {
      console.error('Redis DELETE PATTERN error:', error);
      return false;
    }
  }

  async exists(_key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const result = await this.client!.exists(_key);
      return result === 1;
    } catch (_error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async increment( key: string, by = 1): Promise<number | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      return await this.client!.incrBy( key, by);
    } catch (_error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  }

  async setHash( key: string, field: string, value: any): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.hSet( key, field, JSON.stringify(value));
      return true;
    } catch (_error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async getHash<T>( key: string, field: string): Promise<T | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client!.hGet( key, field);
      return data ? JSON.parse(_data) : null;
    } catch (_error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async getAllHash<T>(_key: string): Promise<Record<string, T> | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client!.hGetAll(_key);
      const result: Record<string, T> = {};
      
      for ( const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(_value);
        } catch {
          result[field] = value as T;
        }
      }
      
      return result;
    } catch (_error) {
      console.error('Redis HGETALL error:', error);
      return null;
    }
  }

  async flush(_): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.flushDb(_);
      return true;
    } catch (_error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }

  async ping(_): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const response = await this.client!.ping(_);
      return response === 'PONG';
    } catch (_error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }

  async disconnect(_): Promise<void> {
    if (_this.client) {
      try {
        await this.client.quit(_);
      } catch (_error) {
        console.error('Redis disconnect error:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  getStats(_) {
    return {
      connected: this.isConnected,
      hasClient: !!this.client,
      config: {
        url: this.config.url?.replace(/\/\/.*:.*@/, '//***:***@'), // Hide credentials
        maxRetries: this.config.maxRetries,
        retryDelayMs: this.config.retryDelayMs
      }
    };
  }
}

// Global Redis instance
export const redis = new RedisManager(_);

// Initialize connection on first import (_in production)
if (_process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  redis.connect(_).catch(_console.error);
}

// Graceful shutdown
if (_typeof process !== 'undefined') {
  process.on( 'SIGINT', () => redis.disconnect(_));
  process.on( 'SIGTERM', () => redis.disconnect(_));
}