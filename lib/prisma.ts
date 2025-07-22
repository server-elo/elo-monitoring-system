/**
 * Simplified Prisma Client Configuration
 * Basic setup to get the site working
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma client instance (server-side only)
 */
function createPrismaClient(): PrismaClient {
  // Only create on server-side
  if (typeof window !== 'undefined') {
    throw new Error('Prisma client should not be created on client-side');
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
    errorFormat: 'pretty'
  });

  // Add connection monitoring (Prisma 5.0+ compatible) - server-side only
  if (typeof process !== 'undefined') {
    process.on('beforeExit', async () => {
      console.log('Prisma client disconnecting...');
      await client.$disconnect();
    });
  }

  // Add query logging in development
  if (process.env.NODE_ENV === 'development') {
    client.$on('query' as never, (e: any) => {
      console.log('Database query executed:', {
        query: e.query,
        duration: e.duration,
        target: e.target
      });
    });
  }

  return client;
}

// Singleton pattern with global storage for development (server-side only)
export const prisma = typeof window === 'undefined'
  ? (globalForPrisma.prisma ?? createPrismaClient())
  : null as any as PrismaClient; // Client-side stub

if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma;
}

/**
 * Database health check function
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      healthy: true,
      latency
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      error: (error as Error).message
    };
  }
}

/**
 * Get basic database info
 */
export async function getDatabaseInfo(): Promise<{
  success: boolean;
  info?: any;
  error?: string;
}> {
  try {
    const result = await prisma.$queryRaw`SELECT version() as version`;
    return {
      success: true,
      info: result
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Connection status
 */
export function getConnectionStatus(): {
  url: string;
  connected: boolean;
} {
  return {
    url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@') || 'Not configured',
    connected: true // Basic status
  };
}

// Graceful shutdown (server-side only)
if (typeof process !== 'undefined' && typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    console.log('Closing database connections...');
    await prisma.$disconnect();
    console.log('Database connections closed successfully');
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connections...');
    await prisma.$disconnect();
    // Use setTimeout to allow async cleanup without process.exit
    setTimeout(() => {
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
      }
    }, 100);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing database connections...');
    await prisma.$disconnect();
    // Use setTimeout to allow async cleanup without process.exit
    setTimeout(() => {
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
      }
    }, 100);
  });
}