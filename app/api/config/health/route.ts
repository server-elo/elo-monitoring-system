/**
 * Configuration Health Check API Endpoint
 * Perfect 12-Factor Config Validation at Runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { createConfigHealthEndpoint } from '@/lib/config/env-validator';
import { checkDatabaseHealth, getConnectionPoolStatus } from '@/lib/prisma';
import { clusterManager } from '@/lib/cluster/cluster-manager';
import { workerManager } from '@/lib/workers/worker-manager';

const configHealthHandler = createConfigHealthEndpoint();

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive system health
    const [dbHealth, poolStatus, clusterStatus, workerStatus] = await Promise.all([
      checkDatabaseHealth(),
      getConnectionPoolStatus(),
      Promise.resolve(clusterManager.getStatus()),
      Promise.resolve(workerManager.getStatus()),
    ]);

    // Run config health check
    let configHealth;
    let configResponse;
    
    // Capture config health response
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          configResponse = { status: code, data };
        }
      })
    };
    
    await configHealthHandler(request, mockRes);
    configHealth = configResponse;

    const overallHealth = 
      dbHealth.healthy && 
      (configHealth?.status === 200) &&
      (Array.isArray(workerStatus) ? workerStatus.every((w: any) => w.status === 'running') : true);

    return NextResponse.json({
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        config: configHealth?.data || { status: 'unknown' },
        database: {
          healthy: dbHealth.healthy,
          latency: dbHealth.latency,
          error: dbHealth.error,
          pool: poolStatus,
        },
        cluster: clusterStatus,
        workers: workerStatus,
      },
      version: process.env.npm_package_version || '2.0.0',
      uptime: process.uptime(),
      pid: process.pid,
    }, {
      status: overallHealth ? 200 : 503,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}