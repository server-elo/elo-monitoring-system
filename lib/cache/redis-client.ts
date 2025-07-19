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

  constructor(config: RedisConfig = {}) {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: 3,
      retryDelayMs: 1000,
      connectTimeoutMs: 5000,
      lazyConnect: true,
      ...config
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) return;
    
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > (this.config.maxRetries || 3)) {
              console.error('Redis max retries exceeded');
              return new Error('Max retries exceeded');
            }
            return Math.min(retries * (this.config.retryDelayMs || 1000), 3000);
          },
          connectTimeout: this.config.connectTimeoutMs
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('Redis ready');
      });

      this.client.on('end', () => {
        this.isConnected = false;
        console.log('Redis connection ended');
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  async ensureConnection(): Promise<boolean> {
    if (this.isConnected && this.client) return true;
    
    try {
      await this.connect();
      return this.isConnected;
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client!.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async increment(key: string, by = 1): Promise<number | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      return await this.client!.incrBy(key, by);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  }

  async setHash(key: string, field: string, value: any): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client!.hGet(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T> | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client!.hGetAll(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value as T;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return null;
    }
  }

  async flush(): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      await this.client!.flushDb();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }

  async ping(): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const response = await this.client!.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        console.error('Redis disconnect error:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  getStats() {
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
export const redis = new RedisManager();

// Initialize connection on first import (in production)
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  redis.connect().catch(console.error);
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => redis.disconnect());
  process.on('SIGTERM', () => redis.disconnect());
}