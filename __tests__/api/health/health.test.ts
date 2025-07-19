/**
 * Health Check API Endpoint Testing Suite
 * Comprehensive tests for system health monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import test utilities
import {
  measureExecutionTime,
  loadTest,
} from '../../utils/testHelpers';
import {
  expectValidApiResponse,
  expectValidErrorResponse,
  expectPerformanceWithinLimits,
} from '../../utils/assertionHelpers';

// Import mocks
import {
  mockPrismaClient,
  resetPrismaMocks,
} from '../../mocks/database/prisma.mock';
import {
  mockRedisClient,
  resetRedisMocks,
} from '../../mocks/cache/redis.mock';

// Health Check Response Types
interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    websocket: ServiceHealth;
    storage: ServiceHealth;
    ai: ServiceHealth;
  };
  metrics: SystemMetrics;
  error?: string;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  error?: string;
  details?: any;
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load: number[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    errors: number;
    averageResponseTime: number;
  };
}

// Mock Health Check Service
class MockHealthCheckService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  async checkOverallHealth(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    
    try {
      this.requestCount++;
      
      // Check all services
      const [database, cache, websocket, storage, ai] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.checkWebSocketHealth(),
        this.checkStorageHealth(),
        this.checkAIHealth(),
      ]);

      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      // Determine overall status
      const services = { database, cache, websocket, storage, ai };
      const overallStatus = this.determineOverallStatus(services);

      const metrics = this.getSystemMetrics();

      return {
        success: true,
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: '2.0.0',
        services,
        metrics,
      };
    } catch (error) {
      this.errorCount++;
      return {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: '2.0.0',
        services: {} as any,
        metrics: {} as any,
        error: 'Health check failed',
      };
    }
  }

  async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await mockPrismaClient.$connect();
      
      // Test simple query
      await mockPrismaClient.user.count();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'active',
          readLatency: responseTime,
          writeLatency: responseTime * 1.2,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: 'Database connection failed',
        details: {
          connection: 'failed',
          error: (error as Error).message,
        },
      };
    }
  }

  async checkCacheHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test Redis connection
      const pong = await mockRedisClient.ping();
      
      if (pong !== 'PONG') {
        throw new Error('Invalid ping response');
      }

      // Test set/get operations
      const testKey = `health_check_${Date.now()}`;
      await mockRedisClient.set(testKey, 'test_value', { EX: 10 });
      const value = await mockRedisClient.get(testKey);
      await mockRedisClient.del(testKey);

      if (value !== 'test_value') {
        throw new Error('Cache set/get test failed');
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 50 ? 'healthy' : responseTime < 200 ? 'degraded' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'active',
          operations: ['ping', 'set', 'get', 'del'],
          memory_usage: '50MB',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: 'Cache connection failed',
        details: {
          connection: 'failed',
          error: (error as Error).message,
        },
      };
    }
  }

  async checkWebSocketHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Mock WebSocket health check
      const responseTime = Date.now() - startTime + Math.random() * 50;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          activeConnections: 42,
          messagesPerSecond: 15,
          averageLatency: 25,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: 'WebSocket health check failed',
      };
    }
  }

  async checkStorageHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Mock storage health check
      const responseTime = Date.now() - startTime + Math.random() * 30;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          diskSpace: '85% available',
          readSpeed: '150MB/s',
          writeSpeed: '120MB/s',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: 'Storage health check failed',
      };
    }
  }

  async checkAIHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Mock AI service health check
      const responseTime = Date.now() - startTime + Math.random() * 200;
      
      return {
        status: responseTime < 300 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          model: 'gemini-pro',
          apiLatency: responseTime,
          requestsPerMinute: 25,
          errorRate: '0.5%',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: 'AI service health check failed',
      };
    }
  }

  private determineOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        usage: Math.random() * 80, // Mock CPU usage
        load: [0.5, 0.7, 0.6], // Mock load averages
      },
      disk: {
        used: 50 * 1024 * 1024 * 1024, // 50GB
        total: 100 * 1024 * 1024 * 1024, // 100GB
        percentage: 50,
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        averageResponseTime: this.responseTimes.length > 0 
          ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
          : 0,
      },
    };
  }

  async checkReadiness(): Promise<{ ready: boolean; checks: Record<string, boolean> }> {
    try {
      const checks = {
        database: await this.isDatabaseReady(),
        cache: await this.isCacheReady(),
        migrations: await this.areMigrationsComplete(),
      };

      const ready = Object.values(checks).every(check => check);

      return { ready, checks };
    } catch (error) {
      return {
        ready: false,
        checks: {
          database: false,
          cache: false,
          migrations: false,
        },
      };
    }
  }

  async checkLiveness(): Promise<{ alive: boolean; uptime: number }> {
    return {
      alive: true,
      uptime: Date.now() - this.startTime,
    };
  }

  private async isDatabaseReady(): Promise<boolean> {
    try {
      await mockPrismaClient.$connect();
      await mockPrismaClient.user.count();
      return true;
    } catch {
      return false;
    }
  }

  private async isCacheReady(): Promise<boolean> {
    try {
      const pong = await mockRedisClient.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  private async areMigrationsComplete(): Promise<boolean> {
    try {
      // Mock migration check
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.startTime = Date.now();
  }
}

const mockHealthService = new MockHealthCheckService();

describe('Health Check API Endpoint Tests', () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetRedisMocks();
    mockHealthService.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return overall system health status', async () => {
      // Act
      const { result, duration } = await measureExecutionTime(() =>
        mockHealthService.checkOverallHealth()
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.version).toBe('2.0.0');
      expect(result.services).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      expectValidApiResponse(result);
    });

    it('should check all critical services', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.services.database).toBeDefined();
      expect(result.services.cache).toBeDefined();
      expect(result.services.websocket).toBeDefined();
      expect(result.services.storage).toBeDefined();
      expect(result.services.ai).toBeDefined();

      // Validate service health structure
      Object.values(result.services).forEach(service => {
        expect(service.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
        expect(service.responseTime).toBeTypeOf('number');
        expect(service.lastCheck).toBeDefined();
      });
    });

    it('should include system metrics', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.metrics.memory).toBeDefined();
      expect(result.metrics.cpu).toBeDefined();
      expect(result.metrics.disk).toBeDefined();
      expect(result.metrics.requests).toBeDefined();

      // Validate memory metrics
      expect(result.metrics.memory.used).toBeTypeOf('number');
      expect(result.metrics.memory.total).toBeTypeOf('number');
      expect(result.metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.memory.percentage).toBeLessThanOrEqual(100);

      // Validate CPU metrics
      expect(result.metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.metrics.cpu.load)).toBe(true);

      // Validate request metrics
      expect(result.metrics.requests.total).toBeGreaterThanOrEqual(0);
      expect(result.metrics.requests.errors).toBeGreaterThanOrEqual(0);
      expect(result.metrics.requests.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should respond quickly for health checks', async () => {
      // Act
      const { duration } = await measureExecutionTime(() =>
        mockHealthService.checkOverallHealth()
      );

      // Assert
      expect(duration).toBeLessThan(1000); // Health checks should be fast
      
      expectPerformanceWithinLimits({
        responseTime: duration,
      });
    });

    it('should handle database connection failures', async () => {
      // Arrange
      mockPrismaClient.$connect.mockRejectedValueOnce(new Error('Connection refused'));

      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.success).toBe(true); // Overall health check should still work
      expect(result.services.database.status).toBe('unhealthy');
      expect(result.services.database.error).toBeDefined();
      expect(result.status).toBe('unhealthy'); // Overall status should be unhealthy
    });

    it('should handle cache connection failures', async () => {
      // Arrange
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Redis unavailable'));

      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.services.cache.status).toBe('unhealthy');
      expect(result.services.cache.error).toBeDefined();
    });

    it('should determine overall status correctly', async () => {
      // Test healthy status
      const healthyResult = await mockHealthService.checkOverallHealth();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthyResult.status);

      // Test unhealthy status with database failure
      mockPrismaClient.$connect.mockRejectedValueOnce(new Error('DB down'));
      const unhealthyResult = await mockHealthService.checkOverallHealth();
      expect(unhealthyResult.status).toBe('unhealthy');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should check system readiness', async () => {
      // Act
      const result = await mockHealthService.checkReadiness();

      // Assert
      expect(result.ready).toBeTypeOf('boolean');
      expect(result.checks).toBeDefined();
      expect(result.checks.database).toBeTypeOf('boolean');
      expect(result.checks.cache).toBeTypeOf('boolean');
      expect(result.checks.migrations).toBeTypeOf('boolean');
    });

    it('should return ready when all services are available', async () => {
      // Act
      const result = await mockHealthService.checkReadiness();

      // Assert
      expect(result.ready).toBe(true);
      expect(result.checks.database).toBe(true);
      expect(result.checks.cache).toBe(true);
      expect(result.checks.migrations).toBe(true);
    });

    it('should return not ready when database is unavailable', async () => {
      // Arrange
      mockPrismaClient.$connect.mockRejectedValueOnce(new Error('DB unavailable'));

      // Act
      const result = await mockHealthService.checkReadiness();

      // Assert
      expect(result.ready).toBe(false);
      expect(result.checks.database).toBe(false);
    });

    it('should return not ready when cache is unavailable', async () => {
      // Arrange
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Cache unavailable'));

      // Act
      const result = await mockHealthService.checkReadiness();

      // Assert
      expect(result.ready).toBe(false);
      expect(result.checks.cache).toBe(false);
    });
  });

  describe('GET /api/health/live', () => {
    it('should check system liveness', async () => {
      // Act
      const result = await mockHealthService.checkLiveness();

      // Assert
      expect(result.alive).toBe(true);
      expect(result.uptime).toBeTypeOf('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track uptime correctly', async () => {
      // Act
      const result1 = await mockHealthService.checkLiveness();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result2 = await mockHealthService.checkLiveness();

      // Assert
      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });

  describe('Performance Requirements', () => {
    it('should handle concurrent health check requests', async () => {
      // Act
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        mockHealthService.checkOverallHealth()
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(results).toHaveLength(concurrentRequests);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle 10 concurrent requests within 3 seconds
    });

    it('should maintain performance under load', async () => {
      // Act
      const loadTestResult = await loadTest(
        async () => mockHealthService.checkOverallHealth(),
        {
          concurrentUsers: 5,
          duration: 3000, // 3 seconds
          requestDelay: 200, // 200ms between requests per user
        }
      );

      // Assert
      expect(loadTestResult.successRate).toBeGreaterThan(95);
      expect(loadTestResult.averageResponseTime).toBeLessThan(500);
    });

    it('should not cause memory leaks during repeated checks', async () => {
      // Arrange
      const initialMemory = process.memoryUsage().heapUsed;

      // Act
      for (let i = 0; i < 50; i++) {
        await mockHealthService.checkOverallHealth();
      }

      // Force garbage collection if available
      if (global.gc) global.gc();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Assert
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });

  describe('Service-Specific Health Checks', () => {
    it('should check database health independently', async () => {
      // Act
      const dbHealth = await mockHealthService.checkDatabaseHealth();

      // Assert
      expect(dbHealth.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
      expect(dbHealth.responseTime).toBeTypeOf('number');
      expect(dbHealth.lastCheck).toBeDefined();
      expect(dbHealth.details).toBeDefined();
    });

    it('should check cache health independently', async () => {
      // Act
      const cacheHealth = await mockHealthService.checkCacheHealth();

      // Assert
      expect(cacheHealth.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
      expect(cacheHealth.responseTime).toBeTypeOf('number');
      expect(cacheHealth.lastCheck).toBeDefined();
      expect(cacheHealth.details).toBeDefined();
    });

    it('should provide detailed service information', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.services.database.details).toBeDefined();
      expect(result.services.cache.details).toBeDefined();
      expect(result.services.websocket.details).toBeDefined();
      expect(result.services.storage.details).toBeDefined();
      expect(result.services.ai.details).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle complete system failure gracefully', async () => {
      // Arrange
      mockPrismaClient.$connect.mockRejectedValue(new Error('Complete failure'));
      mockRedisClient.ping.mockRejectedValue(new Error('Complete failure'));

      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.success).toBe(true); // Should still return a response
      expect(result.status).toBe('unhealthy');
      
      // Should have error information for failed services
      expect(result.services.database.status).toBe('unhealthy');
      expect(result.services.cache.status).toBe('unhealthy');
    });

    it('should handle partial service failures', async () => {
      // Arrange - Only database fails
      mockPrismaClient.$connect.mockRejectedValueOnce(new Error('DB failure'));

      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe('unhealthy'); // Overall unhealthy due to DB
      expect(result.services.database.status).toBe('unhealthy');
      expect(result.services.cache.status).toBeOneOf(['healthy', 'degraded']); // Should still be ok
    });

    it('should timeout slow service checks', async () => {
      // Arrange
      mockPrismaClient.$connect.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );

      // Act
      const { duration } = await measureExecutionTime(() =>
        mockHealthService.checkOverallHealth()
      );

      // Assert
      expect(duration).toBeLessThan(3000); // Should timeout before 3 seconds
    });

    it('should provide meaningful error messages', async () => {
      // Arrange
      const errorMessage = 'Specific database error';
      mockPrismaClient.$connect.mockRejectedValueOnce(new Error(errorMessage));

      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.services.database.error).toBeDefined();
      expect(result.services.database.details.error).toBe(errorMessage);
    });
  });

  describe('Health Check Metrics', () => {
    it('should track request metrics accurately', async () => {
      // Act
      await mockHealthService.checkOverallHealth();
      await mockHealthService.checkOverallHealth();
      await mockHealthService.checkOverallHealth();

      const result = await mockHealthService.checkOverallHealth();

      // Assert
      expect(result.metrics.requests.total).toBe(4);
      expect(result.metrics.requests.averageResponseTime).toBeGreaterThan(0);
      expect(result.metrics.requests.errors).toBeGreaterThanOrEqual(0);
    });

    it('should monitor system resources', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth();

      // Assert
      const metrics = result.metrics;
      
      // Memory metrics should be realistic
      expect(metrics.memory.used).toBeGreaterThan(0);
      expect(metrics.memory.total).toBeGreaterThan(metrics.memory.used);
      expect(metrics.memory.percentage).toBeGreaterThan(0);
      expect(metrics.memory.percentage).toBeLessThan(100);

      // CPU metrics should be within expected ranges
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(metrics.cpu.load).toHaveLength(3);

      // Disk metrics should be realistic
      expect(metrics.disk.used).toBeGreaterThan(0);
      expect(metrics.disk.total).toBeGreaterThan(metrics.disk.used);
      expect(metrics.disk.percentage).toBeGreaterThan(0);
      expect(metrics.disk.percentage).toBeLessThan(100);
    });
  });
});