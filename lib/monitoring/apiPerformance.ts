// API Performance Monitoring and Optimization

export interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  size?: number;
  cached?: boolean;
  retryCount?: number;
  userAgent?: string;
  userId?: string;
}

export interface PerformanceThresholds {
  warning: number; // ms
  critical: number; // ms
  timeout: number; // ms
}

class APIPerformanceMonitor {
  private metrics: APIMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    warning: 200,
    critical: 500,
    timeout: 10000,
  };
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  // Record API call metrics
  recordMetric(metric: APIMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metric.duration > this.thresholds.warning) {
      console.warn(`Slow API call detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }

    if (metric.duration > this.thresholds.critical) {
      console.error(`Critical slow API call: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
      
      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        this.sendToMonitoringService(metric);
      }
    }
  }

  // Get performance statistics
  getStats(timeWindow: number = 300000): {
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    slowRequestRate: number;
    endpointStats: Record<string, {
      count: number;
      averageTime: number;
      errorRate: number;
    }>;
  } {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeWindow);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        slowRequestRate: 0,
        endpointStats: {},
      };
    }

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errors = recentMetrics.filter(m => m.status >= 400);
    const slowRequests = recentMetrics.filter(m => m.duration > this.thresholds.warning);

    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // Calculate endpoint-specific stats
    const endpointStats: Record<string, { count: number; averageTime: number; errorRate: number }> = {};
    
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = { count: 0, averageTime: 0, errorRate: 0 };
      }
      endpointStats[key].count++;
    });

    Object.keys(endpointStats).forEach(key => {
      const endpointMetrics = recentMetrics.filter(m => `${m.method} ${m.endpoint}` === key);
      const endpointDurations = endpointMetrics.map(m => m.duration);
      const endpointErrors = endpointMetrics.filter(m => m.status >= 400);
      
      endpointStats[key].averageTime = endpointDurations.reduce((a, b) => a + b, 0) / endpointDurations.length;
      endpointStats[key].errorRate = endpointErrors.length / endpointMetrics.length;
    });

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      errorRate: errors.length / recentMetrics.length,
      slowRequestRate: slowRequests.length / recentMetrics.length,
      endpointStats,
    };
  }

  // Send metrics to external monitoring service
  private async sendToMonitoringService(metric: APIMetrics): Promise<void> {
    try {
      // This would integrate with services like DataDog, New Relic, etc.
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send metrics to monitoring service:', error);
    }
  }

  // Clear old metrics
  clearOldMetrics(maxAge: number = 3600000): void {
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  // Get slow endpoints
  getSlowEndpoints(limit: number = 10): Array<{
    endpoint: string;
    method: string;
    averageTime: number;
    count: number;
  }> {
    const stats = this.getStats();
    return Object.entries(stats.endpointStats)
      .map(([key, data]) => {
        const [method, ...endpointParts] = key.split(' ');
        return {
          endpoint: endpointParts.join(' '),
          method,
          averageTime: data.averageTime,
          count: data.count,
        };
      })
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }
}

// Singleton instance
export const apiPerformanceMonitor = new APIPerformanceMonitor();

// Fetch wrapper with performance monitoring
export async function monitoredFetch(
  url: string,
  options: RequestInit = {},
  metadata: { endpoint?: string; userId?: string } = {}
): Promise<Response> {
  const startTime = performance.now();
  const method = options.method || 'GET';
  const endpoint = metadata.endpoint || url;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Request-Start': startTime.toString(),
        ...options.headers,
      },
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record metrics
    apiPerformanceMonitor.recordMetric({
      endpoint,
      method,
      duration,
      status: response.status,
      timestamp: Date.now(),
      size: parseInt(response.headers.get('content-length') || '0'),
      cached: response.headers.get('x-cache') === 'HIT',
      userAgent: navigator.userAgent,
      userId: metadata.userId,
    });

    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record error metrics
    apiPerformanceMonitor.recordMetric({
      endpoint,
      method,
      duration,
      status: 0, // Network error
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      userId: metadata.userId,
    });

    throw error;
  }
}

// Request deduplication utility
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const request = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, ttl);
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Cache utility for API responses
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new APICache();

// Optimized API client with caching and deduplication
export class OptimizedAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & {
      cache?: boolean;
      cacheTTL?: number;
      deduplicate?: boolean;
      retries?: number;
    } = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheTTL = 300000,
      deduplicate = true,
      retries = 3,
      ...fetchOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const method = fetchOptions.method || 'GET';
    const cacheKey = `${method}:${url}:${JSON.stringify(fetchOptions.body || {})}`;

    // Check cache for GET requests
    if (method === 'GET' && cache && apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    const requestFn = async (): Promise<T> => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await monitoredFetch(url, {
            ...fetchOptions,
            headers: {
              ...this.defaultHeaders,
              ...fetchOptions.headers,
            },
          }, { endpoint });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          // Cache successful GET requests
          if (method === 'GET' && cache) {
            apiCache.set(cacheKey, data, cacheTTL);
          }

          return data;
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry on client errors (4xx)
          if (error instanceof Error && error.message.includes('HTTP 4')) {
            throw error;
          }
          
          // Wait before retry with exponential backoff
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      throw lastError;
    };

    // Use deduplication for GET requests
    if (method === 'GET' && deduplicate) {
      return requestDeduplicator.deduplicate(cacheKey, requestFn);
    }

    return requestFn();
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      cache: false,
      deduplicate: false,
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      cache: false,
      deduplicate: false,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      cache: false,
      deduplicate: false,
    });
  }
}

// Default API client instance
export const apiClient = new OptimizedAPIClient('/api');

export default apiPerformanceMonitor;
