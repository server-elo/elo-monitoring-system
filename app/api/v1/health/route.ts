import { NextRequest, NextResponse } from 'next/server';
import { publicEndpoint } from '@/lib/api/middleware';
import { ApiResponseBuilder } from '@/lib/api/response';
import { HealthCheck, ServiceHealth } from '@/lib/api/types';
import { MiddlewareContext } from '@/lib/api/middleware';
import { logger } from '@/lib/monitoring/simple-logger';

// Health check service
class HealthCheckService {
  private static startTime = Date.now();

  static async checkDatabase(): Promise<ServiceHealth> {
    try {
      // In production, this would check actual database connectivity
      const start = Date.now();
      
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  static async checkRedis(): Promise<ServiceHealth> {
    try {
      // In production, this would check Redis connectivity
      const start = Date.now();
      
      // Simulate Redis check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30));
      
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown Redis error',
        lastCheck: new Date().toISOString()
      };
    }
  }

  static async checkExternalServices(): Promise<Record<string, ServiceHealth>> {
    const services: Record<string, ServiceHealth> = {};

    // Check external API services
    try {
      // Example: Check blockchain node
      const blockchainStart = Date.now();
      // Simulate blockchain node check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      services.blockchain = {
        status: 'healthy',
        responseTime: Date.now() - blockchainStart,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      services.blockchain = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Blockchain node error',
        lastCheck: new Date().toISOString()
      };
    }

    // Check email service
    try {
      const emailStart = Date.now();
      // Simulate email service check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
      
      services.email = {
        status: 'healthy',
        responseTime: Date.now() - emailStart,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      services.email = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Email service error',
        lastCheck: new Date().toISOString()
      };
    }

    return services;
  }

  static getUptime(): number {
    return Date.now() - this.startTime;
  }

  static getVersion(): string {
    return process.env.APP_VERSION || '1.0.0';
  }

  static getEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }

  static async performHealthCheck(): Promise<HealthCheck> {
    const [database, redis, external] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices()
    ]);

    // Determine overall status
    const allServices = [database, redis, ...Object.values(external)];
    const unhealthyServices = allServices.filter(service => service.status === 'unhealthy');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    
    if (unhealthyServices.length === 0) {
      overallStatus = 'healthy';
    } else if (unhealthyServices.length === allServices.length) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      version: this.getVersion(),
      environment: this.getEnvironment(),
      services: {
        database,
        redis,
        external
      }
    };
  }
}

// GET /api/v1/health - Health check endpoint
export const GET = publicEndpoint(async (_request: NextRequest, context: MiddlewareContext): Promise<NextResponse> => {
  try {
    const healthCheck = await HealthCheckService.performHealthCheck();
    
    // Return appropriate HTTP status based on health
    if (healthCheck.status === 'healthy') {
      return ApiResponseBuilder.success(healthCheck);
    } else if (healthCheck.status === 'degraded') {
      // Return 200 but indicate degraded status
      return ApiResponseBuilder.success(healthCheck);
    } else {
      // Return 503 for unhealthy status
      return NextResponse.json({
        success: false,
        data: healthCheck,
        timestamp: new Date().toISOString(),
        requestId: context.requestId
      }, {
        status: 503
      });
    }
  } catch (error) {
    logger.error('Health check error', error as Error);
    
    const errorHealthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: HealthCheckService.getUptime(),
      version: HealthCheckService.getVersion(),
      environment: HealthCheckService.getEnvironment(),
      services: {
        database: {
          status: 'unhealthy',
          error: 'Health check failed',
          lastCheck: new Date().toISOString()
        }
      }
    };

    return NextResponse.json({
      success: false,
      data: errorHealthCheck,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed'
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    }, {
      status: 503
    });
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
