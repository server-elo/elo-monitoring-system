import { NextRequest, NextResponse } from 'next/server';
import { apiPerformanceMonitor } from '@/lib/monitoring/apiPerformance';
import { logger } from '@/lib/monitoring/simple-logger';

// GET /api/monitoring/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '300000'); // 5 minutes default
    const format = searchParams.get('format') || 'json';

    const stats = apiPerformanceMonitor.getStats(timeWindow);
    const slowEndpoints = apiPerformanceMonitor.getSlowEndpoints(10);

    const response = {
      timestamp: new Date().toISOString(),
      timeWindow,
      metrics: stats,
      slowEndpoints,
      thresholds: {
        warning: 200,
        critical: 500,
        timeout: 10000,
      },
      health: {
        status: stats.averageResponseTime < 200 ? 'healthy' : 
                stats.averageResponseTime < 500 ? 'warning' : 'critical',
        score: Math.max(0, 100 - (stats.averageResponseTime / 10)),
      },
    };

    if (format === 'prometheus') {
      // Return Prometheus metrics format
      const prometheusMetrics = `
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total ${stats.totalRequests}

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_sum ${stats.averageResponseTime * stats.totalRequests / 1000}
api_request_duration_seconds_count ${stats.totalRequests}

# HELP api_request_duration_p95_seconds 95th percentile request duration
# TYPE api_request_duration_p95_seconds gauge
api_request_duration_p95_seconds ${stats.p95ResponseTime / 1000}

# HELP api_request_duration_p99_seconds 99th percentile request duration
# TYPE api_request_duration_p99_seconds gauge
api_request_duration_p99_seconds ${stats.p99ResponseTime / 1000}

# HELP api_error_rate API error rate
# TYPE api_error_rate gauge
api_error_rate ${stats.errorRate}

# HELP api_slow_request_rate API slow request rate
# TYPE api_slow_request_rate gauge
api_slow_request_rate ${stats.slowRequestRate}
      `.trim();

      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Error getting performance metrics', error as Error);
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}

// POST /api/monitoring/performance - Record performance metric
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();
    
    // Validate metric data
    if (!metric.endpoint || !metric.method || typeof metric.duration !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Add timestamp if not provided
    if (!metric.timestamp) {
      metric.timestamp = Date.now();
    }

    apiPerformanceMonitor.recordMetric(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error recording performance metric', error as Error);
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

// DELETE /api/monitoring/performance - Clear old metrics
export async function DELETE(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const maxAge = parseInt(searchParams.get('maxAge') || '3600000'); // 1 hour default

    apiPerformanceMonitor.clearOldMetrics(maxAge);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error clearing metrics', error as Error);
    return NextResponse.json(
      { error: 'Failed to clear metrics' },
      { status: 500 }
    );
  }
}
