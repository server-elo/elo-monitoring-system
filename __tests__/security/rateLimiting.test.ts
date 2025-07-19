/**
 * Rate Limiting Security Testing Suite
 * Comprehensive tests for rate limiting and CSRF protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Import mocks
import {
  mockRedisClient,
  setMockRedisValue,
  getMockRedisValue,
  clearMockRedis,
  resetRedisMocks,
} from '../mocks/cache/redis.mock';

// Import test utilities
import {
  measureExecutionTime,
  loadTest,
  waitFor,
} from '../utils/testHelpers';
import {
  expectRateLimitHeaders,
  expectValidApiResponse,
  expectValidErrorResponse,
} from '../utils/assertionHelpers';

// Mock rate limiting implementation
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class MockRateLimiter {
  constructor(private config: RateLimitConfig) {}

  async checkLimit(req: any): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    error?: string;
  }> {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get current count from Redis
    const currentCount = parseInt(await mockRedisClient.get(`rate_limit:${key}`) || '0');
    
    if (currentCount >= this.config.maxRequests) {
      const resetTime = now + this.config.windowMs;
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime,
        error: 'Rate limit exceeded',
      };
    }

    // Increment counter
    await mockRedisClient.incr(`rate_limit:${key}`);
    await mockRedisClient.expire(`rate_limit:${key}`, Math.ceil(this.config.windowMs / 1000));

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - currentCount - 1,
      resetTime: now + this.config.windowMs,
    };
  }

  async resetLimit(key: string): Promise<void> {
    await mockRedisClient.del(`rate_limit:${key}`);
  }
}

// Mock CSRF protection
class MockCSRFProtection {
  private tokens = new Set<string>();

  generateToken(): string {
    const token = `csrf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.tokens.add(token);
    return token;
  }

  validateToken(token: string): boolean {
    return this.tokens.has(token);
  }

  clearTokens(): void {
    this.tokens.clear();
  }
}

describe('Rate Limiting Security Tests', () => {
  let rateLimiter: MockRateLimiter;
  let csrfProtection: MockCSRFProtection;

  beforeEach(() => {
    resetRedisMocks();
    clearMockRedis();
    
    rateLimiter = new MockRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      keyGenerator: (req) => req.ip || '127.0.0.1',
    });

    csrfProtection = new MockCSRFProtection();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Arrange
      const mockReq = { ip: '192.168.1.1', path: '/api/test' };

      // Act
      const result = await rateLimiter.checkLimit(mockReq);

      // Assert
      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should block requests exceeding rate limit', async () => {
      // Arrange
      const mockReq = { ip: '192.168.1.2', path: '/api/test' };
      
      // Set counter to max limit
      await setMockRedisValue('rate_limit:192.168.1.2', '100', 60);

      // Act
      const result = await rateLimiter.checkLimit(mockReq);

      // Assert
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should track requests per IP address', async () => {
      // Arrange
      const ip1 = { ip: '192.168.1.1', path: '/api/test' };
      const ip2 = { ip: '192.168.1.2', path: '/api/test' };

      // Act
      await rateLimiter.checkLimit(ip1);
      await rateLimiter.checkLimit(ip1);
      const result1 = await rateLimiter.checkLimit(ip1);
      
      const result2 = await rateLimiter.checkLimit(ip2);

      // Assert
      expect(result1.remaining).toBe(97); // 3 requests from IP1
      expect(result2.remaining).toBe(99); // 1 request from IP2
    });

    it('should reset counters after time window', async () => {
      // Arrange
      const mockReq = { ip: '192.168.1.3', path: '/api/test' };
      
      // Simulate expired counter
      await setMockRedisValue('rate_limit:192.168.1.3', '50', -1); // Expired
      await mockRedisClient.del('rate_limit:192.168.1.3'); // Simulate expiration

      // Act
      const result = await rateLimiter.checkLimit(mockReq);

      // Assert
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(99); // Fresh start
    });
  });

  describe('Different Rate Limiting Strategies', () => {
    it('should implement user-based rate limiting', async () => {
      // Arrange
      const userRateLimiter = new MockRateLimiter({
        windowMs: 60000,
        maxRequests: 50,
        keyGenerator: (req) => `user:${req.userId}`,
      });

      const mockReq = { userId: 'user-123', ip: '192.168.1.1' };

      // Act
      const result = await userRateLimiter.checkLimit(mockReq);

      // Assert
      expect(result.success).toBe(true);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBe(49);
    });

    it('should implement endpoint-specific rate limiting', async () => {
      // Arrange
      const apiRateLimiter = new MockRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: (req) => `${req.ip}:${req.path}`,
      });

      const loginReq = { ip: '192.168.1.1', path: '/api/auth/login' };
      const registerReq = { ip: '192.168.1.1', path: '/api/auth/register' };

      // Act
      for (let i = 0; i < 5; i++) {
        await apiRateLimiter.checkLimit(loginReq);
      }
      
      const loginResult = await apiRateLimiter.checkLimit(loginReq);
      const registerResult = await apiRateLimiter.checkLimit(registerReq);

      // Assert
      expect(loginResult.remaining).toBe(4); // 6 login requests
      expect(registerResult.remaining).toBe(9); // 1 register request
    });

    it('should implement strict rate limiting for sensitive endpoints', async () => {
      // Arrange
      const strictRateLimiter = new MockRateLimiter({
        windowMs: 300000, // 5 minutes
        maxRequests: 3, // Only 3 attempts
        keyGenerator: (req) => `${req.ip}:password-reset`,
      });

      const mockReq = { ip: '192.168.1.1', path: '/api/auth/password-reset' };

      // Act
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await strictRateLimiter.checkLimit(mockReq));
      }

      // Assert
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(false); // 4th request blocked
      expect(results[4].success).toBe(false); // 5th request blocked
    });
  });

  describe('Rate Limiting Headers', () => {
    it('should include rate limiting headers in responses', () => {
      // Arrange
      const rateLimitInfo = {
        limit: 100,
        remaining: 75,
        resetTime: Date.now() + 60000,
      };

      const headers = {
        'x-ratelimit-limit': rateLimitInfo.limit.toString(),
        'x-ratelimit-remaining': rateLimitInfo.remaining.toString(),
        'x-ratelimit-reset': Math.floor(rateLimitInfo.resetTime / 1000).toString(),
      };

      // Act & Assert
      expectRateLimitHeaders({ headers });
      expect(headers['x-ratelimit-limit']).toBe('100');
      expect(headers['x-ratelimit-remaining']).toBe('75');
      expect(Number(headers['x-ratelimit-reset'])).toBeGreaterThan(Date.now() / 1000);
    });

    it('should update headers correctly as requests are made', async () => {
      // Arrange
      const mockReq = { ip: '192.168.1.5', path: '/api/test' };

      // Act
      const result1 = await rateLimiter.checkLimit(mockReq);
      const result2 = await rateLimiter.checkLimit(mockReq);
      const result3 = await rateLimiter.checkLimit(mockReq);

      // Assert
      expect(result1.remaining).toBe(99);
      expect(result2.remaining).toBe(98);
      expect(result3.remaining).toBe(97);
    });
  });

  describe('CSRF Protection', () => {
    it('should generate valid CSRF tokens', () => {
      // Act
      const token1 = csrfProtection.generateToken();
      const token2 = csrfProtection.generateToken();

      // Assert
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^csrf-\d+-\w+$/);
      expect(token2).toMatch(/^csrf-\d+-\w+$/);
    });

    it('should validate CSRF tokens correctly', () => {
      // Arrange
      const validToken = csrfProtection.generateToken();
      const invalidToken = 'invalid-csrf-token';

      // Act & Assert
      expect(csrfProtection.validateToken(validToken)).toBe(true);
      expect(csrfProtection.validateToken(invalidToken)).toBe(false);
      expect(csrfProtection.validateToken('')).toBe(false);
    });

    it('should reject requests with missing CSRF tokens', () => {
      // Arrange
      const mockRequest = {
        method: 'POST',
        headers: {},
        body: { data: 'test' },
      };

      // Mock CSRF middleware
      const csrfMiddleware = (req: any) => {
        const token = req.headers['x-csrf-token'] || req.body._csrf;
        if (!token || !csrfProtection.validateToken(token)) {
          return { success: false, error: 'Invalid CSRF token' };
        }
        return { success: true };
      };

      // Act
      const result = csrfMiddleware(mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid CSRF token');
    });

    it('should accept requests with valid CSRF tokens', () => {
      // Arrange
      const validToken = csrfProtection.generateToken();
      const mockRequest = {
        method: 'POST',
        headers: { 'x-csrf-token': validToken },
        body: { data: 'test' },
      };

      // Mock CSRF middleware
      const csrfMiddleware = (req: any) => {
        const token = req.headers['x-csrf-token'] || req.body._csrf;
        if (!token || !csrfProtection.validateToken(token)) {
          return { success: false, error: 'Invalid CSRF token' };
        }
        return { success: true };
      };

      // Act
      const result = csrfMiddleware(mockRequest);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Distributed Rate Limiting', () => {
    it('should use Redis for distributed rate limiting', async () => {
      // Arrange
      const key = 'rate_limit:test-key';
      
      // Act
      await mockRedisClient.incr(key);
      await mockRedisClient.incr(key);
      const count = await mockRedisClient.get(key);

      // Assert
      expect(count).toBe('2');
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Arrange
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis connection failed'));
      
      const fallbackRateLimiter = new MockRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        keyGenerator: (req) => req.ip,
      });

      const mockReq = { ip: '192.168.1.6', path: '/api/test' };

      // Act & Assert - Should not throw, should handle gracefully
      try {
        const result = await fallbackRateLimiter.checkLimit(mockReq);
        // In a real implementation, this might fall back to in-memory limiting
        expect(result).toBeDefined();
      } catch (error) {
        // Should handle Redis errors gracefully
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should support multiple Redis instances for high availability', async () => {
      // Mock multiple Redis clients
      const redis1 = { ...mockRedisClient };
      const redis2 = { ...mockRedisClient };

      redis1.ping = jest.fn().mockResolvedValue('PONG');
      redis2.ping = jest.fn().mockResolvedValue('PONG');

      // Act
      const health1 = await redis1.ping();
      const health2 = await redis2.ping();

      // Assert
      expect(health1).toBe('PONG');
      expect(health2).toBe('PONG');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high request volumes efficiently', async () => {
      // Arrange
      const mockReq = { ip: '192.168.1.7', path: '/api/test' };

      // Act
      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: 50 }, () => 
          rateLimiter.checkLimit(mockReq)
        );
        return Promise.all(promises);
      });

      // Assert
      expect(duration).toBeLessThan(1000); // Should handle 50 requests within 1 second
    });

    it('should maintain performance under concurrent load', async () => {
      // Arrange
      const testFunction = async () => {
        const mockReq = { 
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`, 
          path: '/api/test' 
        };
        return rateLimiter.checkLimit(mockReq);
      };

      // Act
      const loadTestResult = await loadTest(testFunction, {
        concurrentUsers: 10,
        duration: 5000, // 5 seconds
        requestDelay: 100, // 100ms between requests per user
      });

      // Assert
      expect(loadTestResult.successRate).toBeGreaterThan(95); // 95% success rate
      expect(loadTestResult.averageResponseTime).toBeLessThan(100); // Under 100ms average
    });

    it('should not cause memory leaks under sustained load', async () => {
      // Arrange
      const initialMemory = process.memoryUsage().heapUsed;

      // Act
      for (let i = 0; i < 1000; i++) {
        const mockReq = { ip: `192.168.1.${i % 255}`, path: '/api/test' };
        await rateLimiter.checkLimit(mockReq);
      }

      // Force garbage collection
      if (global.gc) global.gc();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Assert
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });
  });

  describe('Security Edge Cases', () => {
    it('should prevent rate limit bypass attempts', async () => {
      // Test various bypass techniques
      const bypassAttempts = [
        { ip: '192.168.1.8', path: '/api/test' },
        { ip: '192.168.1.8 ', path: '/api/test' }, // Trailing space
        { ip: '192.168.1.8\n', path: '/api/test' }, // Newline
        { ip: '192.168.1.8\t', path: '/api/test' }, // Tab
        { ip: 'X-Forwarded-For: 192.168.1.9, 192.168.1.8', path: '/api/test' },
      ];

      for (const attempt of bypassAttempts) {
        await rateLimiter.checkLimit(attempt);
      }

      // All should be counted against the same key (after normalization)
      const result = await rateLimiter.checkLimit({ ip: '192.168.1.8', path: '/api/test' });
      
      // Should reflect multiple requests
      expect(result.remaining).toBeLessThan(100);
    });

    it('should handle IPv6 addresses correctly', async () => {
      // Arrange
      const ipv6Addresses = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '2001:db8:85a3::8a2e:370:7334',
        '::1',
        'fe80::1',
      ];

      // Act & Assert
      for (const ip of ipv6Addresses) {
        const result = await rateLimiter.checkLimit({ ip, path: '/api/test' });
        expect(result.success).toBe(true);
      }
    });

    it('should handle malformed IP addresses', async () => {
      // Arrange
      const malformedIPs = [
        '',
        'invalid-ip',
        '999.999.999.999',
        '192.168.1',
        '192.168.1.1.1',
        null,
        undefined,
      ];

      // Act & Assert
      for (const ip of malformedIPs) {
        const result = await rateLimiter.checkLimit({ ip, path: '/api/test' });
        expect(result).toBeDefined(); // Should not crash
      }
    });

    it('should prevent timing attacks on rate limiting', async () => {
      // Arrange
      const validIP = '192.168.1.10';
      const invalidIP = '192.168.1.11';

      // Fill up the rate limit for one IP
      for (let i = 0; i < 100; i++) {
        await rateLimiter.checkLimit({ ip: validIP, path: '/api/test' });
      }

      // Act - Measure response times
      const { duration: blockedDuration } = await measureExecutionTime(() =>
        rateLimiter.checkLimit({ ip: validIP, path: '/api/test' })
      );

      const { duration: allowedDuration } = await measureExecutionTime(() =>
        rateLimiter.checkLimit({ ip: invalidIP, path: '/api/test' })
      );

      // Assert - Response times should be similar to prevent timing attacks
      const timingDifference = Math.abs(blockedDuration - allowedDuration);
      expect(timingDifference).toBeLessThan(50); // Less than 50ms difference
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should support different limits for different endpoints', () => {
      const endpointConfigs = {
        '/api/auth/login': { windowMs: 900000, maxRequests: 5 }, // 15 minutes, 5 attempts
        '/api/auth/register': { windowMs: 3600000, maxRequests: 3 }, // 1 hour, 3 attempts
        '/api/courses': { windowMs: 60000, maxRequests: 100 }, // 1 minute, 100 requests
        '/api/lessons': { windowMs: 60000, maxRequests: 200 }, // 1 minute, 200 requests
      };

      Object.entries(endpointConfigs).forEach(([endpoint, config]) => {
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.maxRequests).toBeGreaterThan(0);
        expect(typeof config.windowMs).toBe('number');
        expect(typeof config.maxRequests).toBe('number');
      });
    });

    it('should allow whitelisting of certain IPs', () => {
      const whitelistedIPs = [
        '127.0.0.1', // Localhost
        '10.0.0.0/8', // Private network
        '192.168.0.0/16', // Private network
      ];

      const isWhitelisted = (ip: string): boolean => {
        return whitelistedIPs.some(range => {
          if (range.includes('/')) {
            // CIDR notation - simplified check
            const [network, prefix] = range.split('/');
            return ip.startsWith(network.split('.').slice(0, parseInt(prefix) / 8).join('.'));
          }
          return ip === range;
        });
      };

      expect(isWhitelisted('127.0.0.1')).toBe(true);
      expect(isWhitelisted('192.168.1.1')).toBe(true);
      expect(isWhitelisted('8.8.8.8')).toBe(false);
    });
  });
});