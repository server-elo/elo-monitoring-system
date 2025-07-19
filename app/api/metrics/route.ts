import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  withErrorHandling,
  generateRequestId
} from '@/lib/api/utils';
import { ApiErrorCode, HttpStatus, MetricsResponseData } from '@/lib/api/types';
import { errorTracker } from '@/lib/monitoring/error-tracking';
import { apiLogger } from '@/lib/api/logging';
import { logger } from '@/lib/monitoring/simple-logger';

// Validation schema for metrics query
const metricsQuerySchema = z.object({
  timeRange: z.string().optional().default('24h'), // 1h, 24h, 7d, 30d
  granularity: z.enum(['hour', 'day', 'week']).optional().default('hour'),
  metrics: z.array(z.enum(['errors', 'requests', 'response_time', 'status_codes'])).optional()
});

// Convert time range string to milliseconds
function parseTimeRange(timeRange: string): number {
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  return ranges[timeRange] || ranges['24h'];
}

// Generate mock request metrics (in a real app, this would come from your monitoring system)
function generateRequestMetrics(timeRangeMs: number, granularity: string) {
  const now = Date.now();
  const intervals: number[] = [];
  
  // Determine interval size based on granularity
  let intervalMs: number;
  switch (granularity) {
    case 'hour':
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case 'day':
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case 'week':
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    default:
      intervalMs = 60 * 60 * 1000;
  }
  
  // Generate intervals
  const numIntervals = Math.ceil(timeRangeMs / intervalMs);
  for (let i = numIntervals - 1; i >= 0; i--) {
    intervals.push(now - (i * intervalMs));
  }
  
  // Generate mock data for each interval
  return intervals.map(timestamp => ({
    timestamp: new Date(timestamp).toISOString(),
    requests: Math.floor(Math.random() * 1000) + 100,
    errors: Math.floor(Math.random() * 50) + 5,
    responseTime: Math.floor(Math.random() * 500) + 100
  }));
}

// GET /api/metrics - Get API metrics and analytics
async function getMetricsHandler(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // TODO: Check if user has admin permissions
    // const user = await getUserFromToken(request);
    // if (user.role !== 'ADMIN') {
    //   return forbiddenResponse('Admin access required', requestId);
    // }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validation = metricsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'INVALID_FORMAT'
      }));
      return validationErrorResponse(errors, requestId);
    }
    
    const { timeRange, granularity, metrics } = validation.data;
    const timeRangeMs = parseTimeRange(timeRange);
    
    // Get error metrics from error tracker
    const errorMetrics = errorTracker.getMetrics(timeRangeMs);
    
    // Get recent logs for additional metrics
    const recentLogs = apiLogger.getRecentLogs(1000);
    const cutoffTime = Date.now() - timeRangeMs;
    const filteredLogs = recentLogs.filter(log => 
      new Date(log.timestamp).getTime() > cutoffTime
    );
    
    // Calculate request metrics
    const requestCount = filteredLogs.length;
    const errorCount = filteredLogs.filter(log => log.level === 'error').length;
    const warningCount = filteredLogs.filter(log => log.level === 'warn').length;
    
    // Calculate average response time
    const responseTimes = filteredLogs
      .filter(log => log.context.response?.responseTime)
      .map(log => log.context.response!.responseTime);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    // Calculate status code distribution
    const statusCodes = filteredLogs
      .filter(log => log.context.response?.statusCode)
      .reduce((acc, log) => {
        const status = log.context.response!.statusCode.toString();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    // Find slowest endpoints
    const endpointTimes = filteredLogs
      .filter(log => log.context.response?.responseTime && log.context.request?.url)
      .reduce((acc, log) => {
        const url = new URL(log.context.request!.url).pathname;
        if (!acc[url]) {
          acc[url] = { times: [], count: 0 };
        }
        acc[url].times.push(log.context.response!.responseTime);
        acc[url].count++;
        return acc;
      }, {} as Record<string, { times: number[], count: number }>);
    
    const slowestEndpoints = Object.entries(endpointTimes)
      .map(([endpoint, data]) => ({
        endpoint,
        averageTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        requestCount: data.count,
        maxTime: Math.max(...data.times),
        minTime: Math.min(...data.times)
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
    
    // Generate time series data
    const timeSeriesData = generateRequestMetrics(timeRangeMs, granularity);
    
    // Compile response data
    const responseData: MetricsResponseData = {
      summary: {
        timeRange,
        granularity,
        totalRequests: requestCount,
        totalErrors: errorCount,
        totalWarnings: warningCount,
        errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
        averageResponseTime: Math.round(averageResponseTime),
        uptime: 99.9, // Mock uptime percentage
        lastUpdated: new Date().toISOString()
      },
      
      errors: {
        total: errorMetrics.totalErrors,
        rate: errorMetrics.errorRate,
        topErrors: errorMetrics.topErrors.map((error: any) => ({
          type: error.fingerprint || error.type,
          count: error.count,
          message: error.message
        })),
        errorsByPage: errorMetrics.errorsByPage,
        errorsByBrowser: errorMetrics.errorsByBrowser
      },
      
      performance: {
        averageResponseTime: Math.round(averageResponseTime),
        slowestEndpoints,
        responseTimePercentiles: {
          p50: Math.round(averageResponseTime * 0.8),
          p90: Math.round(averageResponseTime * 1.5),
          p95: Math.round(averageResponseTime * 2),
          p99: Math.round(averageResponseTime * 3)
        }
      },
      
      traffic: {
        totalRequests: requestCount,
        requestsPerMinute: Math.round(requestCount / (timeRangeMs / 60000)),
        statusCodes,
        topPages: Object.entries(errorMetrics.errorsByPage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([page, count]) => ({ page, requests: count }))
      },
      
      timeSeries: timeSeriesData,
      
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Filter response based on requested metrics
    if (metrics && metrics.length > 0) {
      const filteredData: Partial<MetricsResponseData> = { summary: responseData.summary };
      
      if (metrics.includes('errors')) {
        filteredData.errors = responseData.errors;
      }
      if (metrics.includes('requests')) {
        filteredData.traffic = responseData.traffic;
      }
      if (metrics.includes('response_time')) {
        filteredData.performance = responseData.performance;
      }
      if (metrics.includes('status_codes')) {
        filteredData.statusCodes = responseData.traffic?.statusCodes;
      }
      
      return successResponse(filteredData, undefined, HttpStatus.OK, requestId);
    }
    
    return successResponse(responseData, undefined, HttpStatus.OK, requestId);
    
  } catch (error) {
    logger.error('Get metrics error', error as Error);
    return errorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch metrics',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestId
    );
  }
}

// Route handlers
export const GET = withErrorHandling(getMetricsHandler);
