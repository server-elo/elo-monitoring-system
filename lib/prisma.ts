/**
 * Optimized Prisma Client with Perfect 12-Factor Compliance
 * Implements advanced connection pooling and monitoring
 */

import { PrismaClient } from '@prisma/client';
import { env } from '@/lib/config/env-validator';
import { logger } from '@/lib/logging/structured-logger';
import { gracefulShutdown } from '@/lib/server/graceful-shutdown';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create optimized Prisma client with connection pooling
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    // Optimized connection pooling
    datasourceUrl: `${env.DATABASE_URL}?connection_limit=${env.DATABASE_MAX_CONNECTIONS}&pool_timeout=${env.DATABASE_IDLE_TIMEOUT}&socket_timeout=60`,
    log: env.isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
    errorFormat: 'pretty',
  });

  // Add connection monitoring
  client.$on('beforeExit', async () => {
    logger.info('Prisma client disconnecting...');
  });

  // Add query logging in development
  if (env.isDevelopment) {
    client.$on('query', (e) => {
      logger.debug('Database query executed', {
        query: e.query,
        duration: e.duration,
        target: e.target,
      });
    });
  }

  // Production error monitoring
  if (env.isProduction) {
    client.$on('error', (e) => {
      logger.error('Database error occurred', e.target as Error, {
        target: e.target,
      });
    });
  }

  return client;
}

// Singleton pattern with global storage for development
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// Register graceful shutdown
gracefulShutdown.register({
  name: 'Database Connection',
  handler: async () => {
    logger.info('Closing database connections...');
    await prisma.$disconnect();
    logger.info('Database connections closed successfully');
  },
  timeout: 10000,
});

/**
 * Database health check function
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    return {
      healthy: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get database connection metrics
 */
export async function getDatabaseMetrics() {
  try {
    const metrics = await prisma.$metrics.json();
    return {
      success: true,
      metrics,
    };
  } catch (error) {
    logger.error('Failed to get database metrics', error as Error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Connection pool status
 */
export function getConnectionPoolStatus() {
  return {
    maxConnections: env.DATABASE_MAX_CONNECTIONS,
    poolSize: env.DATABASE_POOL_SIZE,
    idleTimeout: env.DATABASE_IDLE_TIMEOUT,
    url: env.DATABASE_URL.replace(/:[^:]*@/, ':***@'), // Hide password
  };
}
