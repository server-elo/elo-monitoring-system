/**
 * AI System Health Monitoring API
 * 
 * Provides comprehensive health information for all AI services
 * with caching and performance metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedTutor } from '@/lib/ai/EnhancedTutorSystem';
import { 
  getCached, 
  setCached
} from '@/lib/utils/cache';
import { logger } from '@/lib/monitoring/simple-logger';
import { 
  withRateLimit,
  getClientIP 
} from '@/lib/utils/rateLimiter';

async function handleHealthCheck(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const refresh = searchParams.get('refresh') === 'true';
    
    const cacheKey = `health:${detailed ? 'detailed' : 'basic'}`;
    
    // Check cache unless refresh is requested
    if (!refresh) {
      const cached = await getCached(cacheKey, {
        ttl: 30 * 1000, // 30 seconds cache for health data
        namespace: 'health'
      });
      
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true,
          responseTime: Date.now() - startTime
        }, {
          headers: {
            'X-Cache': 'HIT',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        });
      }
    }
    
    // Get comprehensive health information
    const systemHealth = enhancedTutor.getSystemHealth();
    
    const healthData: any = {
      timestamp: new Date().toISOString(),
      overall: {
        status: systemHealth.overall.healthyServices > 0 ? 'healthy' : 'degraded',
        healthyServices: systemHealth.overall.healthyServices,
        totalServices: systemHealth.overall.totalServices,
        uptime: systemHealth.overall.averageUptime,
        responseTime: systemHealth.overall.averageResponseTime
      },
      services: systemHealth.services.map(service => ({
        name: service.name,
        status: service.healthy ? 'healthy' : 'unhealthy',
        specialty: service.specialty,
        uptime: service.uptime,
        responseTime: service.responseTime,
        lastCheck: service.lastCheck
      })),
      performance: {
        totalRequests: systemHealth.performance.totalRequests,
        averageResponseTime: systemHealth.performance.averageResponseTime,
        successRate: systemHealth.performance.successRate,
        fallbackRate: systemHealth.performance.fallbackRate
      }
    };
    
    // Add detailed information if requested
    if (detailed) {
      healthData.detailed = {
        serviceBreakdown: systemHealth.services,
        systemMetrics: {
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        recommendations: generateHealthRecommendations(systemHealth)
      };
    }
    
    // Cache the result
    await setCached(cacheKey, healthData, {
      ttl: 30 * 1000, // 30 seconds
      namespace: 'health',
      tags: ['health', 'monitoring']
    });
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: healthData,
      cached: false,
      responseTime
    }, {
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`,
        'X-Health-Status': healthData.overall.status
      }
    });
    
  } catch (error) {
    logger.error('Health check error', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }, { 
      status: 500,
      headers: {
        'X-Error': 'true',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

function generateHealthRecommendations(systemHealth: any): string[] {
  const recommendations = [];
  
  if (systemHealth.overall.healthyServices === 0) {
    recommendations.push('🚨 All AI services are down. Check service configurations and network connectivity.');
  } else if (systemHealth.overall.healthyServices < systemHealth.overall.totalServices) {
    recommendations.push('⚠️ Some AI services are unhealthy. Consider restarting failed services.');
  }
  
  if (systemHealth.overall.averageUptime < 95) {
    recommendations.push('📈 Service uptime is below 95%. Review service stability and error logs.');
  }
  
  if (systemHealth.overall.averageResponseTime > 10000) {
    recommendations.push('🐌 Average response time is high. Consider optimizing service performance.');
  }
  
  if (systemHealth.performance.fallbackRate > 20) {
    recommendations.push('🔄 High fallback rate detected. Primary services may need attention.');
  }
  
  if (systemHealth.performance.successRate < 95) {
    recommendations.push('❌ Success rate is below 95%. Review error patterns and service reliability.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All systems are operating normally.');
  }
  
  return recommendations;
}

// Service-specific health check
async function handleServiceHealth(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get('service');
  
  if (!serviceName) {
    return NextResponse.json({
      error: 'Service name is required'
    }, { status: 400 });
  }
  
  try {
    const systemHealth = enhancedTutor.getSystemHealth();
    const service = systemHealth.services.find(s => s.name === serviceName);
    
    if (!service) {
      return NextResponse.json({
        error: 'Service not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        service: service.name,
        status: service.healthy ? 'healthy' : 'unhealthy',
        specialty: service.specialty,
        uptime: service.uptime,
        responseTime: service.responseTime,
        lastCheck: service.lastCheck
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check service health',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Force health check refresh
async function handleHealthRefresh(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceName = searchParams.get('service');
    
    // Force health check
    await enhancedTutor.checkServiceHealth();
    
    // Clear health cache
    // Note: This would clear all health-related cache entries
    
    return NextResponse.json({
      success: true,
      message: serviceName 
        ? `Health check refreshed for ${serviceName}` 
        : 'Health check refreshed for all services'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to refresh health check',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Apply rate limiting to endpoints
export const GET = withRateLimit(
  async (request: Request) => {
    const nextRequest = request as NextRequest;
    return handleHealthCheck(nextRequest);
  },
  'quick',
  (request: Request) => getClientIP(request)
);

export const POST = withRateLimit(
  async (request: Request) => {
    const nextRequest = request as NextRequest;
    return handleHealthRefresh(nextRequest);
  },
  'quick',
  (request: Request) => getClientIP(request)
);

// Service-specific health check (no rate limiting for internal use)
export async function PUT(request: NextRequest) {
  return handleServiceHealth(request);
}
