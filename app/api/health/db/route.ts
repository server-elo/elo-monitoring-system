import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/monitoring/simple-logger';

/**
 * Database Health Check Endpoint
 * Checks database connectivity and performance
 */

interface DatabaseHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy'; 
  timestamp: string; 
  database: { 
    connected: boolean; 
    responseTime: number; 
    version?: string;
    tables?: number;
    connections?: {
      active: number; 
      idle: number; 
      total: number; 
    };
  };
  error?: string;
}

// Create a new Prisma instance for health checks
// This avoids interfering with the main application's connection pool
const healthCheckPrisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: { 
    db: { 
      url: process.env.DATABASE_URL || 'file:./dev.db' 
    }
  }
});

/**
 * Database health check endpoint
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Attempt to connect and query the database
    await healthCheckPrisma.$connect();
    
    // Run a simple query to test connectivity
    const queryStart = Date.now();
    await healthCheckPrisma.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - queryStart;
    
    // Get database version (SQLite for dev, PostgreSQL for prod)
    let version = 'unknown';
    try {
      if (process.env.DATABASE_URL?.includes('postgresql')) {
        const result = await healthCheckPrisma.$queryRaw<[{version: string}]>`SELECT version()`;
        version = result[0]?.version || 'PostgreSQL';
      } else {
        const result = await healthCheckPrisma.$queryRaw<[{version: string}]>`SELECT sqlite_version() as version`;
        version = `SQLite ${result[0]?.version}`;
      }
    } catch (e) {
      // Version query failed, but connection is still working
      logger.warn('Failed to get database version', e as Error);
    }
    
    // Get table count
    let tableCount = 0;
    try {
      if (process.env.DATABASE_URL?.includes('postgresql')) {
        const result = await healthCheckPrisma.$queryRaw<[{count: bigint}]>`
          SELECT COUNT(*) as count 
          FROM informationschema.tables 
          WHERE table_schema = 'public'
        `;
        tableCount = Number(result[0]?.count || 0);
      } else {
        const result = await healthCheckPrisma.$queryRaw<[{count: bigint}]>`
          SELECT COUNT(*) as count 
          FROM sqlite_master 
          WHERE type='table'
        `;
        tableCount = Number(result[0]?.count || 0);
      }
    } catch (e) {
      logger.warn('Failed to get table count', e as Error);
    }
    
    const responseTime = Date.now() - start;
    
    // Determine health status based on response time
    const status: 'healthy' | 'degraded' | 'unhealthy' = 
      queryTime < 50 ? 'healthy' : 
      queryTime < 200 ? 'degraded' : 
      'unhealthy';
    
    const result: DatabaseHealthResult = {
      status 
      timestamp: new Date().toISOString() ,
      database: { 
        connected: true 
        responseTime: queryTime 
        version 
        tables: tableCount 
        connections: { 
          active: 1, // In dev mode, typically just 1
          idle: 0 
          total: 1 
        } 
      } 
    };
    
    logger.info('Database health check completed', { metadata: {
      status 
      responseTime: queryTime 
    });
    
    return NextResponse.json(result, { 
      status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503 
      headers: { 
        'Cache-Control': 'no-cache, no-store, must-revalidate' 
        'X-Database-Status': status 
        'X-Response-Time': responseTime.toString() 
      } 
    });
    
  } catch (error) {
    const responseTime = Date.now() - start;
    
    logger.error('Database health check failed', error as Error);
    
    const result: DatabaseHealthResult = {
      status: 'unhealthy' 
      timestamp: new Date().toISOString() ,
      database: { 
        connected: false 
        responseTime 
      } 
      error: (error as Error).message 
    };
    
    return NextResponse.json(result, { 
      status: 503 
      headers: { 
        'X-Database-Status': 'unhealthy' 
        'X-Response-Time': responseTime.toString() 
      } 
    });
  } finally {
    // Always disconnect to avoid connection leaks
    try {
      await healthCheckPrisma.$disconnect();
    } catch (e) {
      logger.warn('Failed to disconnect health check database connection', e as Error);
    });
  }
}

/**
 * HEAD request support for monitoring tools
 */
export async function HEAD(request: NextRequest) {
  return GET(request);
}