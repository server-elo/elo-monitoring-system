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
  private startTime = Date.now(_);
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  async checkOverallHealth(_): Promise<HealthCheckResponse> {
    const startTime = Date.now(_);
    
    try {
      this.requestCount++;
      
      // Check all services
      const [database, cache, websocket, storage, ai] = await Promise.all([
        this.checkDatabaseHealth(_),
        this.checkCacheHealth(_),
        this.checkWebSocketHealth(_),
        this.checkStorageHealth(_),
        this.checkAIHealth(_),
      ]);

      const responseTime = Date.now(_) - startTime;
      this.responseTimes.push(_responseTime);

      // Determine overall status
      const services = { database, cache, websocket, storage, ai };
      const overallStatus = this.determineOverallStatus(_services);

      const metrics = this.getSystemMetrics(_);

      return {
        success: true,
        status: overallStatus,
        timestamp: new Date(_).toISOString(),
        uptime: Date.now(_) - this.startTime,
        version: '2.0.0',
        services,
        metrics,
      };
    } catch (_error) {
      this.errorCount++;
      return {
        success: false,
        status: 'unhealthy',
        timestamp: new Date(_).toISOString(),
        uptime: Date.now(_) - this.startTime,
        version: '2.0.0',
        services: {} as any,
        metrics: {} as any,
        error: 'Health check failed',
      };
    }
  }

  async checkDatabaseHealth(_): Promise<ServiceHealth> {
    const startTime = Date.now(_);
    
    try {
      // Test database connection
      await mockPrismaClient.$connect(_);
      
      // Test simple query
      await mockPrismaClient.user.count(_);
      
      const responseTime = Date.now(_) - startTime;
      
      return {
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
        responseTime,
        lastCheck: new Date(_).toISOString(),
        details: {
          connection: 'active',
          readLatency: responseTime,
          writeLatency: responseTime * 1.2,
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(_) - startTime,
        lastCheck: new Date(_).toISOString(),
        error: 'Database connection failed',
        details: {
          connection: 'failed',
          error: (_error as Error).message,
        },
      };
    }
  }

  async checkCacheHealth(_): Promise<ServiceHealth> {
    const startTime = Date.now(_);
    
    try {
      // Test Redis connection
      const pong = await mockRedisClient.ping(_);
      
      if (_pong !== 'PONG') {
        throw new Error('Invalid ping response');
      }

      // Test set/get operations
      const testKey = `health_check_${Date.now(_)}`;
      await mockRedisClient.set( testKey, 'test_value', { EX: 10 });
      const value = await mockRedisClient.get(_testKey);
      await mockRedisClient.del(_testKey);

      if (_value !== 'test_value') {
        throw new Error('Cache set/get test failed');
      }

      const responseTime = Date.now(_) - startTime;

      return {
        status: responseTime < 50 ? 'healthy' : responseTime < 200 ? 'degraded' : 'unhealthy',
        responseTime,
        lastCheck: new Date(_).toISOString(),
        details: {
          connection: 'active',
          operations: ['ping', 'set', 'get', 'del'],
          memory_usage: '50MB',
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(_) - startTime,
        lastCheck: new Date(_).toISOString(),
        error: 'Cache connection failed',
        details: {
          connection: 'failed',
          error: (_error as Error).message,
        },
      };
    }
  }

  async checkWebSocketHealth(_): Promise<ServiceHealth> {
    const startTime = Date.now(_);
    
    try {
      // Mock WebSocket health check
      const responseTime = Date.now(_) - startTime + Math.random() * 50;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date(_).toISOString(),
        details: {
          activeConnections: 42,
          messagesPerSecond: 15,
          averageLatency: 25,
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(_) - startTime,
        lastCheck: new Date(_).toISOString(),
        error: 'WebSocket health check failed',
      };
    }
  }

  async checkStorageHealth(_): Promise<ServiceHealth> {
    const startTime = Date.now(_);
    
    try {
      // Mock storage health check
      const responseTime = Date.now(_) - startTime + Math.random() * 30;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date(_).toISOString(),
        details: {
          diskSpace: '85% available',
          readSpeed: '150MB/s',
          writeSpeed: '120MB/s',
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(_) - startTime,
        lastCheck: new Date(_).toISOString(),
        error: 'Storage health check failed',
      };
    }
  }

  async checkAIHealth(_): Promise<ServiceHealth> {
    const startTime = Date.now(_);
    
    try {
      // Mock AI service health check
      const responseTime = Date.now(_) - startTime + Math.random() * 200;
      
      return {
        status: responseTime < 300 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(_).toISOString(),
        details: {
          model: 'gemini-pro',
          apiLatency: responseTime,
          requestsPerMinute: 25,
          errorRate: '0.5%',
        },
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(_) - startTime,
        lastCheck: new Date(_).toISOString(),
        error: 'AI service health check failed',
      };
    }
  }

  private determineOverallStatus( services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(_services).map(service => service.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private getSystemMetrics(_): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (_memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
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
          ? this.responseTimes.reduce( (a, b) => a + b, 0) / this.responseTimes.length 
          : 0,
      },
    };
  }

  async checkReadiness(_): Promise<{ ready: boolean; checks: Record<string, boolean> }> {
    try {
      const checks = {
        database: await this.isDatabaseReady(_),
        cache: await this.isCacheReady(_),
        migrations: await this.areMigrationsComplete(_),
      };

      const ready = Object.values(_checks).every(_check => check);

      return { ready, checks };
    } catch (_error) {
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

  async checkLiveness(_): Promise<{ alive: boolean; uptime: number }> {
    return {
      alive: true,
      uptime: Date.now(_) - this.startTime,
    };
  }

  private async isDatabaseReady(_): Promise<boolean> {
    try {
      await mockPrismaClient.$connect(_);
      await mockPrismaClient.user.count(_);
      return true;
    } catch {
      return false;
    }
  }

  private async isCacheReady(_): Promise<boolean> {
    try {
      const pong = await mockRedisClient.ping(_);
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  private async areMigrationsComplete(_): Promise<boolean> {
    try {
      // Mock migration check
      return true;
    } catch {
      return false;
    }
  }

  reset(_) {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.startTime = Date.now(_);
  }
}

const mockHealthService = new MockHealthCheckService(_);

describe( 'Health Check API Endpoint Tests', () => {
  beforeEach(() => {
    resetPrismaMocks(_);
    resetRedisMocks(_);
    mockHealthService.reset(_);
  });

  afterEach(() => {
    vi.clearAllMocks(_);
  });

  describe( 'GET /api/health', () => {
    it( 'should return overall system health status', async () => {
      // Act
      const { result, duration } = await measureExecutionTime(() =>
        mockHealthService.checkOverallHealth(_)
      );

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.status).toBeOneOf( ['healthy', 'degraded', 'unhealthy']);
      expect(_result.timestamp).toBeDefined(_);
      expect(_result.uptime).toBeGreaterThanOrEqual(0);
      expect(_result.version).toBe('2.0.0');
      expect(_result.services).toBeDefined(_);
      expect(_result.metrics).toBeDefined(_);
      expect(_duration).toBeLessThan(2000); // Should complete within 2 seconds

      expectValidApiResponse(_result);
    });

    it( 'should check all critical services', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.services.database).toBeDefined(_);
      expect(_result.services.cache).toBeDefined(_);
      expect(_result.services.websocket).toBeDefined(_);
      expect(_result.services.storage).toBeDefined(_);
      expect(_result.services.ai).toBeDefined(_);

      // Validate service health structure
      Object.values(_result.services).forEach(service => {
        expect(_service.status).toBeOneOf( ['healthy', 'degraded', 'unhealthy']);
        expect(_service.responseTime).toBeTypeOf('number');
        expect(_service.lastCheck).toBeDefined(_);
      });
    });

    it( 'should include system metrics', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.metrics.memory).toBeDefined(_);
      expect(_result.metrics.cpu).toBeDefined(_);
      expect(_result.metrics.disk).toBeDefined(_);
      expect(_result.metrics.requests).toBeDefined(_);

      // Validate memory metrics
      expect(_result.metrics.memory.used).toBeTypeOf('number');
      expect(_result.metrics.memory.total).toBeTypeOf('number');
      expect(_result.metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(_result.metrics.memory.percentage).toBeLessThanOrEqual(100);

      // Validate CPU metrics
      expect(_result.metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(_result.metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(_Array.isArray(result.metrics.cpu.load)).toBe(_true);

      // Validate request metrics
      expect(_result.metrics.requests.total).toBeGreaterThanOrEqual(0);
      expect(_result.metrics.requests.errors).toBeGreaterThanOrEqual(0);
      expect(_result.metrics.requests.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it( 'should respond quickly for health checks', async () => {
      // Act
      const { duration } = await measureExecutionTime(() =>
        mockHealthService.checkOverallHealth(_)
      );

      // Assert
      expect(_duration).toBeLessThan(1000); // Health checks should be fast
      
      expectPerformanceWithinLimits({
        responseTime: duration,
      });
    });

    it( 'should handle database connection failures', async () => {
      // Arrange
      mockPrismaClient.$connect.mockRejectedValueOnce(_new Error('Connection refused'));

      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.success).toBe(_true); // Overall health check should still work
      expect(_result.services.database.status).toBe('unhealthy');
      expect(_result.services.database.error).toBeDefined(_);
      expect(_result.status).toBe('unhealthy'); // Overall status should be unhealthy
    });

    it( 'should handle cache connection failures', async () => {
      // Arrange
      mockRedisClient.ping.mockRejectedValueOnce(_new Error('Redis unavailable'));

      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.services.cache.status).toBe('unhealthy');
      expect(_result.services.cache.error).toBeDefined(_);
    });

    it( 'should determine overall status correctly', async () => {
      // Test healthy status
      const healthyResult = await mockHealthService.checkOverallHealth(_);
      expect( ['healthy', 'degraded', 'unhealthy']).toContain(_healthyResult.status);

      // Test unhealthy status with database failure
      mockPrismaClient.$connect.mockRejectedValueOnce(_new Error('DB down'));
      const unhealthyResult = await mockHealthService.checkOverallHealth(_);
      expect(_unhealthyResult.status).toBe('unhealthy');
    });
  });

  describe( 'GET /api/health/ready', () => {
    it( 'should check system readiness', async () => {
      // Act
      const result = await mockHealthService.checkReadiness(_);

      // Assert
      expect(_result.ready).toBeTypeOf('boolean');
      expect(_result.checks).toBeDefined(_);
      expect(_result.checks.database).toBeTypeOf('boolean');
      expect(_result.checks.cache).toBeTypeOf('boolean');
      expect(_result.checks.migrations).toBeTypeOf('boolean');
    });

    it( 'should return ready when all services are available', async () => {
      // Act
      const result = await mockHealthService.checkReadiness(_);

      // Assert
      expect(_result.ready).toBe(_true);
      expect(_result.checks.database).toBe(_true);
      expect(_result.checks.cache).toBe(_true);
      expect(_result.checks.migrations).toBe(_true);
    });

    it( 'should return not ready when database is unavailable', async () => {
      // Arrange
      mockPrismaClient.$connect.mockRejectedValueOnce(_new Error('DB unavailable'));

      // Act
      const result = await mockHealthService.checkReadiness(_);

      // Assert
      expect(_result.ready).toBe(_false);
      expect(_result.checks.database).toBe(_false);
    });

    it( 'should return not ready when cache is unavailable', async () => {
      // Arrange
      mockRedisClient.ping.mockRejectedValueOnce(_new Error('Cache unavailable'));

      // Act
      const result = await mockHealthService.checkReadiness(_);

      // Assert
      expect(_result.ready).toBe(_false);
      expect(_result.checks.cache).toBe(_false);
    });
  });

  describe( 'GET /api/health/live', () => {
    it( 'should check system liveness', async () => {
      // Act
      const result = await mockHealthService.checkLiveness(_);

      // Assert
      expect(_result.alive).toBe(_true);
      expect(_result.uptime).toBeTypeOf('number');
      expect(_result.uptime).toBeGreaterThanOrEqual(0);
    });

    it( 'should track uptime correctly', async () => {
      // Act
      const result1 = await mockHealthService.checkLiveness(_);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result2 = await mockHealthService.checkLiveness(_);

      // Assert
      expect(_result2.uptime).toBeGreaterThan(_result1.uptime);
    });
  });

  describe( 'Performance Requirements', () => {
    it( 'should handle concurrent health check requests', async () => {
      // Act
      const concurrentRequests = 10;
      const startTime = Date.now(_);
      
      const promises = Array.from( { length: concurrentRequests }, () =>
        mockHealthService.checkOverallHealth(_)
      );
      
      const results = await Promise.all(_promises);
      const endTime = Date.now(_);

      // Assert
      expect(_results).toHaveLength(_concurrentRequests);
      expect(_results.every(r => r.success)).toBe(_true);
      expect(_endTime - startTime).toBeLessThan(3000); // Should handle 10 concurrent requests within 3 seconds
    });

    it( 'should maintain performance under load', async () => {
      // Act
      const loadTestResult = await loadTest(
        async () => mockHealthService.checkOverallHealth(_),
        {
          concurrentUsers: 5,
          duration: 3000, // 3 seconds
          requestDelay: 200, // 200ms between requests per user
        }
      );

      // Assert
      expect(_loadTestResult.successRate).toBeGreaterThan(_95);
      expect(_loadTestResult.averageResponseTime).toBeLessThan(500);
    });

    it( 'should not cause memory leaks during repeated checks', async () => {
      // Arrange
      const initialMemory = process.memoryUsage().heapUsed;

      // Act
      for (let i = 0; i < 50; i++) {
        await mockHealthService.checkOverallHealth(_);
      }

      // Force garbage collection if available
      if (_global.gc) global.gc(_);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Assert
      expect(_memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });

  describe( 'Service-Specific Health Checks', () => {
    it( 'should check database health independently', async () => {
      // Act
      const dbHealth = await mockHealthService.checkDatabaseHealth(_);

      // Assert
      expect(_dbHealth.status).toBeOneOf( ['healthy', 'degraded', 'unhealthy']);
      expect(_dbHealth.responseTime).toBeTypeOf('number');
      expect(_dbHealth.lastCheck).toBeDefined(_);
      expect(_dbHealth.details).toBeDefined(_);
    });

    it( 'should check cache health independently', async () => {
      // Act
      const cacheHealth = await mockHealthService.checkCacheHealth(_);

      // Assert
      expect(_cacheHealth.status).toBeOneOf( ['healthy', 'degraded', 'unhealthy']);
      expect(_cacheHealth.responseTime).toBeTypeOf('number');
      expect(_cacheHealth.lastCheck).toBeDefined(_);
      expect(_cacheHealth.details).toBeDefined(_);
    });

    it( 'should provide detailed service information', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.services.database.details).toBeDefined(_);
      expect(_result.services.cache.details).toBeDefined(_);
      expect(_result.services.websocket.details).toBeDefined(_);
      expect(_result.services.storage.details).toBeDefined(_);
      expect(_result.services.ai.details).toBeDefined(_);
    });
  });

  describe( 'Error Handling', () => {
    it( 'should handle complete system failure gracefully', async () => {
      // Arrange
      mockPrismaClient.$connect.mockRejectedValue(_new Error('Complete failure'));
      mockRedisClient.ping.mockRejectedValue(_new Error('Complete failure'));

      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.success).toBe(_true); // Should still return a response
      expect(_result.status).toBe('unhealthy');
      
      // Should have error information for failed services
      expect(_result.services.database.status).toBe('unhealthy');
      expect(_result.services.cache.status).toBe('unhealthy');
    });

    it( 'should handle partial service failures', async () => {
      // Arrange - Only database fails
      mockPrismaClient.$connect.mockRejectedValueOnce(_new Error('DB failure'));

      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.success).toBe(_true);
      expect(_result.status).toBe('unhealthy'); // Overall unhealthy due to DB
      expect(_result.services.database.status).toBe('unhealthy');
      expect(_result.services.cache.status).toBeOneOf( ['healthy', 'degraded']); // Should still be ok
    });

    it( 'should timeout slow service checks', async () => {
      // Arrange
      mockPrismaClient.$connect.mockImplementationOnce(
        (_) => new Promise(resolve => setTimeout(resolve, 5000))
      );

      // Act
      const { duration } = await measureExecutionTime(() =>
        mockHealthService.checkOverallHealth(_)
      );

      // Assert
      expect(_duration).toBeLessThan(3000); // Should timeout before 3 seconds
    });

    it( 'should provide meaningful error messages', async () => {
      // Arrange
      const errorMessage = 'Specific database error';
      mockPrismaClient.$connect.mockRejectedValueOnce(_new Error(errorMessage));

      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.services.database.error).toBeDefined(_);
      expect(_result.services.database.details.error).toBe(_errorMessage);
    });
  });

  describe( 'Health Check Metrics', () => {
    it( 'should track request metrics accurately', async () => {
      // Act
      await mockHealthService.checkOverallHealth(_);
      await mockHealthService.checkOverallHealth(_);
      await mockHealthService.checkOverallHealth(_);

      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      expect(_result.metrics.requests.total).toBe(_4);
      expect(_result.metrics.requests.averageResponseTime).toBeGreaterThan(0);
      expect(_result.metrics.requests.errors).toBeGreaterThanOrEqual(0);
    });

    it( 'should monitor system resources', async () => {
      // Act
      const result = await mockHealthService.checkOverallHealth(_);

      // Assert
      const metrics = result.metrics;
      
      // Memory metrics should be realistic
      expect(_metrics.memory.used).toBeGreaterThan(0);
      expect(_metrics.memory.total).toBeGreaterThan(_metrics.memory.used);
      expect(_metrics.memory.percentage).toBeGreaterThan(0);
      expect(_metrics.memory.percentage).toBeLessThan(100);

      // CPU metrics should be within expected ranges
      expect(_metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(_metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(_metrics.cpu.load).toHaveLength(3);

      // Disk metrics should be realistic
      expect(_metrics.disk.used).toBeGreaterThan(0);
      expect(_metrics.disk.total).toBeGreaterThan(_metrics.disk.used);
      expect(_metrics.disk.percentage).toBeGreaterThan(0);
      expect(_metrics.disk.percentage).toBeLessThan(100);
    });
  });
});