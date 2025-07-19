/**
 * Database and Redis Monitoring System
 * 
 * Provides comprehensive monitoring for Prisma database operations
 * and Redis cache performance with real-time metrics and alerting.
 */

;
import { redisConfig } from '@/lib/config/environment';
import { logger } from './simple-logger';
import { sentryUtils } from './sentry-config';

/**
 * Database performance metrics
 */
interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
    waiting: number;
  };
  queryPerformance: {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    failedQueries: number;
  };
  transactions: {
    active: number;
    committed: number;
    rolledBack: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'critical';
    lastCheck: Date;
    uptime: number;
  };
}

/**
 * Redis cache metrics
 */
interface RedisMetrics {
  connection: {
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
    uptime: number;
    lastPing: number;
  };
  memory: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  performance: {
    totalCommands: number;
    averageResponseTime: number;
    slowCommands: number;
    hitRate: number;
    missRate: number;
  };
  keyspace: {
    totalKeys: number;
    expiredKeys: number;
    evictedKeys: number;
  };
}

/**
 * Query tracking for performance monitoring
 */
interface QueryTracker {
  id: string;
  query: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  model?: string;
  operation?: string;
}

/**
 * Database monitoring class
 */
class DatabaseMonitor {
  private queryTracker: Map<string, QueryTracker> = new Map();
  private metrics: DatabaseMetrics;
  private redis: any; // Redis client
  private redisMetrics: RedisMetrics;
  private alertThresholds = {
    slowQueryMs: 1000,
    connectionPoolUtilization: 0.8,
    errorRate: 0.05,
    cacheHitRate: 0.8
  };

  constructor() {
    this.metrics = this.initializeMetrics();
    this.redisMetrics = this.initializeRedisMetrics();
    this.setupRedisConnection();
    this.startMetricsCollection();
  }

  /**
   * Initialize database metrics
   */
  private initializeMetrics(): DatabaseMetrics {
    return {
      connectionPool: {
        active: 0,
        idle: 0,
        total: 0,
        waiting: 0
      },
      queryPerformance: {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowQueries: 0,
        failedQueries: 0
      },
      transactions: {
        active: 0,
        committed: 0,
        rolledBack: 0
      },
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        uptime: 0
      }
    };
  }

  /**
   * Initialize Redis metrics
   */
  private initializeRedisMetrics(): RedisMetrics {
    return {
      connection: {
        status: 'disconnected',
        uptime: 0,
        lastPing: 0
      },
      memory: {
        used: 0,
        peak: 0,
        fragmentation: 0
      },
      performance: {
        totalCommands: 0,
        averageResponseTime: 0,
        slowCommands: 0,
        hitRate: 0,
        missRate: 0
      },
      keyspace: {
        totalKeys: 0,
        expiredKeys: 0,
        evictedKeys: 0
      }
    };
  }

  /**
   * Setup Redis connection monitoring
   */
  private async setupRedisConnection(): Promise<void> {
    try {
      // Dynamically import Redis
      const Redis = await import('ioredis');
      
      this.redis = new Redis.default(redisConfig.url, {
        password: redisConfig.password,
        database: redisConfig.db,
      });

      this.redis.on('connect', () => {
        this.redisMetrics.connection.status = 'connecting';
        logger.info('Redis connection establishing');
      });

      this.redis.on('ready', () => {
        this.redisMetrics.connection.status = 'connected';
        this.redisMetrics.connection.uptime = Date.now();
        logger.info('Redis connection established');
      });

      this.redis.on('error', (error: Error) => {
        this.redisMetrics.connection.status = 'error';
        logger.error('Redis connection error', error);
        sentryUtils.reportPerformanceIssue('redis_connection_error', 0, { error: error.message });
      });

      this.redis.on('end', () => {
        this.redisMetrics.connection.status = 'disconnected';
        logger.warn('Redis connection ended');
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to setup Redis monitoring', error);
    }
  }

  /**
   * Start metrics collection intervals
   */
  private startMetricsCollection(): void {
    // Collect database metrics every 30 seconds
    setInterval(() => {
      this.collectDatabaseMetrics();
    }, 30000);

    // Collect Redis metrics every 15 seconds
    setInterval(() => {
      this.collectRedisMetrics();
    }, 15000);

    // Health check every 60 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // Alert check every 5 minutes
    setInterval(() => {
      this.checkAlertConditions();
    }, 300000);
  }

  /**
   * Collect database metrics from Prisma
   */
  private async collectDatabaseMetrics(): Promise<void> {
    try {
      // Note: Prisma metrics require Prisma v5+ with metrics extension
      // For now, we'll track through our query monitoring
      
      const activeQueries = Array.from(this.queryTracker.values())
        .filter(query => !query.endTime);

      this.metrics.queryPerformance.totalQueries = this.queryTracker.size;
      
      const completedQueries = Array.from(this.queryTracker.values())
        .filter(query => query.endTime);

      if (completedQueries.length > 0) {
        const totalDuration = completedQueries.reduce((sum, query) => sum + (query.duration || 0), 0);
        this.metrics.queryPerformance.averageExecutionTime = totalDuration / completedQueries.length;
        
        this.metrics.queryPerformance.slowQueries = completedQueries
          .filter(query => (query.duration || 0) > this.alertThresholds.slowQueryMs).length;
        
        this.metrics.queryPerformance.failedQueries = completedQueries
          .filter(query => !query.success).length;
      }

      // Simulate connection pool metrics (would be actual in real implementation)
      this.metrics.connectionPool = {
        active: activeQueries.length,
        idle: Math.max(0, 10 - activeQueries.length),
        total: 10,
        waiting: 0
      };

    } catch (error) {
      logger.error('Failed to collect database metrics', error);
    }
  }

  /**
   * Collect Redis metrics
   */
  private async collectRedisMetrics(): Promise<void> {
    if (!this.redis || this.redisMetrics.connection.status !== 'connected') {
      return;
    }

    try {
      const startTime = Date.now();
      
      // Test ping
      await this.redis.ping();
      this.redisMetrics.connection.lastPing = Date.now() - startTime;

      // Get Redis info
      const info = await this.redis.info();
      this.parseRedisInfo(info);

      // Get keyspace info
      const dbSize = await this.redis.dbSize();
      this.redisMetrics.keyspace.totalKeys = dbSize;

    } catch (error) {
      logger.error('Failed to collect Redis metrics', error);
      this.redisMetrics.connection.status = 'error';
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): void {
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      const [key, value] = line.split(':');
      
      switch (key) {
        case 'used_memory':
          this.redisMetrics.memory.used = parseInt(value) || 0;
          break;
        case 'used_memory_peak':
          this.redisMetrics.memory.peak = parseInt(value) || 0;
          break;
        case 'mem_fragmentation_ratio':
          this.redisMetrics.memory.fragmentation = parseFloat(value) || 0;
          break;
        case 'total_commands_processed':
          this.redisMetrics.performance.totalCommands = parseInt(value) || 0;
          break;
        case 'expired_keys':
          this.redisMetrics.keyspace.expiredKeys = parseInt(value) || 0;
          break;
        case 'evicted_keys':
          this.redisMetrics.keyspace.evictedKeys = parseInt(value) || 0;
          break;
      }
    }
  }

  /**
   * Track database query performance
   */
  public trackQuery(operation: string, model: string, query: string): string {
    const queryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const tracker: QueryTracker = {
      id: queryId,
      query: query.substring(0, 200), // Limit query length for storage
      startTime: Date.now(),
      success: true,
      model,
      operation
    };

    this.queryTracker.set(queryId, tracker);
    
    // Clean up old queries (keep last 1000)
    if (this.queryTracker.size > 1000) {
      const oldestEntries = Array.from(this.queryTracker.entries())
        .sort(([, a], [, b]) => a.startTime - b.startTime)
        .slice(0, this.queryTracker.size - 1000);
      
      oldestEntries.forEach(([id]) => this.queryTracker.delete(id));
    }

    return queryId;
  }

  /**
   * Complete query tracking
   */
  public completeQuery(queryId: string, success: boolean, error?: string): void {
    const tracker = this.queryTracker.get(queryId);
    if (!tracker) return;

    tracker.endTime = Date.now();
    tracker.duration = tracker.endTime - tracker.startTime;
    tracker.success = success;
    tracker.error = error;

    // Log slow queries
    if (tracker.duration > this.alertThresholds.slowQueryMs) {
      logger.warn('Slow database query detected', {
        queryId,
        duration: tracker.duration,
        model: tracker.model,
        operation: tracker.operation,
        query: tracker.query
      });

      sentryUtils.reportPerformanceIssue('slow_database_query', tracker.duration, {
        model: tracker.model,
        operation: tracker.operation,
        query: tracker.query
      });
    }

    // Log failed queries
    if (!success && error) {
      logger.error('Database query failed', {
        queryId,
        error,
        model: tracker.model,
        operation: tracker.operation,
        query: tracker.query
      });
    }

    this.queryTracker.set(queryId, tracker);
  }

  /**
   * Track Redis operations
   */
  public trackRedisOperation(operation: string, startTime: number, success: boolean): void {
    const duration = Date.now() - startTime;
    
    this.redisMetrics.performance.totalCommands++;
    
    // Update average response time
    const currentAvg = this.redisMetrics.performance.averageResponseTime;
    const totalCommands = this.redisMetrics.performance.totalCommands;
    this.redisMetrics.performance.averageResponseTime = 
      (currentAvg * (totalCommands - 1) + duration) / totalCommands;

    // Track slow operations
    if (duration > 100) { // 100ms threshold for Redis
      this.redisMetrics.performance.slowCommands++;
      
      logger.warn('Slow Redis operation detected', {
        operation,
        duration,
        threshold: 100
      });
    }

    // Update hit/miss rates (simplified - would need more sophisticated tracking)
    if (operation.includes('get') || operation.includes('hget')) {
      if (success) {
        this.redisMetrics.performance.hitRate = 
          (this.redisMetrics.performance.hitRate * 0.9) + (1 * 0.1);
      } else {
        this.redisMetrics.performance.missRate = 
          (this.redisMetrics.performance.missRate * 0.9) + (1 * 0.1);
      }
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      let healthStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
      
      // Check database health
      const errorRate = this.metrics.queryPerformance.failedQueries / 
                       Math.max(this.metrics.queryPerformance.totalQueries, 1);
      
      const poolUtilization = this.metrics.connectionPool.active / 
                             this.metrics.connectionPool.total;

      if (errorRate > this.alertThresholds.errorRate || 
          poolUtilization > this.alertThresholds.connectionPoolUtilization) {
        healthStatus = 'degraded';
      }

      // Check Redis health
      if (this.redisMetrics.connection.status === 'error' || 
          this.redisMetrics.connection.status === 'disconnected') {
        healthStatus = 'critical';
      }

      this.metrics.health = {
        status: healthStatus,
        lastCheck: new Date(),
        uptime: Date.now() - (this.redisMetrics.connection.uptime || Date.now())
      };

      logger.info('Health check completed', {
        status: healthStatus,
        databaseErrors: this.metrics.queryPerformance.failedQueries,
        redisStatus: this.redisMetrics.connection.status,
        poolUtilization: poolUtilization
      });

    } catch (error) {
      this.metrics.health.status = 'critical';
      logger.error('Health check failed', error);
    }
  }

  /**
   * Check alert conditions
   */
  private checkAlertConditions(): void {
    // Database alerts
    const errorRate = this.metrics.queryPerformance.failedQueries / 
                     Math.max(this.metrics.queryPerformance.totalQueries, 1);
    
    if (errorRate > this.alertThresholds.errorRate) {
      sentryUtils.reportPerformanceIssue('high_database_error_rate', errorRate * 100, {
        errorRate: errorRate,
        threshold: this.alertThresholds.errorRate,
        totalQueries: this.metrics.queryPerformance.totalQueries,
        failedQueries: this.metrics.queryPerformance.failedQueries
      });
    }

    // Redis alerts
    if (this.redisMetrics.performance.hitRate < this.alertThresholds.cacheHitRate) {
      sentryUtils.reportPerformanceIssue('low_cache_hit_rate', this.redisMetrics.performance.hitRate * 100, {
        hitRate: this.redisMetrics.performance.hitRate,
        threshold: this.alertThresholds.cacheHitRate,
        totalCommands: this.redisMetrics.performance.totalCommands
      });
    }

    // Memory alerts for Redis
    if (this.redisMetrics.memory.fragmentation > 1.5) {
      sentryUtils.reportPerformanceIssue('high_redis_fragmentation', this.redisMetrics.memory.fragmentation, {
        fragmentation: this.redisMetrics.memory.fragmentation,
        usedMemory: this.redisMetrics.memory.used,
        peakMemory: this.redisMetrics.memory.peak
      });
    }
  }

  /**
   * Get current database metrics
   */
  public getDatabaseMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current Redis metrics
   */
  public getRedisMetrics(): RedisMetrics {
    return { ...this.redisMetrics };
  }

  /**
   * Get query performance data
   */
  public getQueryPerformance(limit: number = 100): QueryTracker[] {
    return Array.from(this.queryTracker.values())
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, limit);
  }

  /**
   * Export monitoring data for analysis
   */
  public exportMonitoringData(): {
    database: DatabaseMetrics;
    redis: RedisMetrics;
    queries: QueryTracker[];
    timestamp: string;
  } {
    return {
      database: this.getDatabaseMetrics(),
      redis: this.getRedisMetrics(),
      queries: this.getQueryPerformance(50),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Close monitoring connections
   */
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Create singleton instance
export const databaseMonitor = new DatabaseMonitor();

/**
 * Prisma middleware for automatic query tracking
 */
export function createPrismaMonitoringMiddleware() {
  return async (params: any, next: any) => {
    const queryId = databaseMonitor.trackQuery(
      params.action,
      params.model || 'unknown',
      JSON.stringify(params.args || {})
    );

    try {
      const result = await next(params);
      databaseMonitor.completeQuery(queryId, true);
      return result;
    } catch (error) {
      databaseMonitor.completeQuery(queryId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}

/**
 * Redis wrapper with monitoring
 */
export function createMonitoredRedisOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return fn()
    .then(result => {
      databaseMonitor.trackRedisOperation(operation, startTime, true);
      return result;
    })
    .catch(error => {
      databaseMonitor.trackRedisOperation(operation, startTime, false);
      throw error;
    });
}

// Export types
export type { DatabaseMetrics, RedisMetrics, QueryTracker };