// Optimized API client with caching, deduplication, and performance monitoring
import { apiPerformanceMonitor, requestDeduplicator, apiCache } from '@/lib/monitoring/apiPerformance';
import { logger } from '@/lib/api/logger';

// Enhanced type definitions
export type RequestBody = 
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null
  | undefined;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: RequestBody;
  cache?: boolean;
  cacheTTL?: number;
  deduplicate?: boolean;
  retries?: number;
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
  duration: number;
}

class OptimizedApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  // Request queue for deduplication - kept for future implementation
  // private requestQueue: Map<string, Promise<ApiResponse<unknown>>> = new Map();

  constructor(baseURL: string = '/api', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  async request<T = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache = method === 'GET',
      cacheTTL = 300000, // 5 minutes
      deduplicate = method === 'GET',
      retries = 3,
      timeout = 10000,
      priority = 'normal', // priority could be used for request prioritization
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.generateCacheKey(method, url, body);
    const startTime = performance.now();

    // Check cache first for GET requests
    if (cache && method === 'GET') {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          status: 200,
          headers: new Headers(),
          cached: true,
          duration: performance.now() - startTime,
        };
      }
    }

    // Use deduplication for GET requests
    if (deduplicate && method === 'GET') {
      return requestDeduplicator.deduplicate(cacheKey, () =>
        this.executeRequest<T>(url, method, headers, body, retries, timeout, startTime, cache, cacheTTL, cacheKey)
      );
    }

    return this.executeRequest<T>(url, method, headers, body, retries, timeout, startTime, cache, cacheTTL, cacheKey);
  }

  private async executeRequest<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: RequestBody,
    retries: number,
    timeout: number,
    startTime: number,
    cache: boolean,
    cacheTTL: number,
    cacheKey: string
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            ...this.defaultHeaders,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Record performance metrics
        apiPerformanceMonitor.recordMetric({
          endpoint: url,
          method,
          duration,
          status: response.status,
          timestamp: Date.now(),
          size: parseInt(response.headers.get('content-length') || '0'),
          cached: false,
          retryCount: attempt,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET requests
        if (cache && method === 'GET') {
          apiCache.set(cacheKey, data, cacheTTL);
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          cached: false,
          duration,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) or abort errors
        if (error instanceof Error) {
          if (error.message.includes('HTTP 4') || error.name === 'AbortError') {
            break;
          }
        }

        // Wait before retry with exponential backoff
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Record failed request
    const endTime = performance.now();
    const duration = endTime - startTime;

    apiPerformanceMonitor.recordMetric({
      endpoint: url,
      method,
      duration,
      status: 0,
      timestamp: Date.now(),
      retryCount: retries,
    });

    throw lastError || new Error('Request failed after retries');
  }

  private generateCacheKey(method: string, url: string, body?: RequestBody): string {
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: RequestBody, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data, cache: false, deduplicate: false });
  }

  async put<T = unknown>(endpoint: string, data?: RequestBody, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data, cache: false, deduplicate: false });
  }

  async delete<T = unknown>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE', cache: false, deduplicate: false });
  }

  async patch<T = unknown>(endpoint: string, data?: RequestBody, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data, cache: false, deduplicate: false });
  }

  // Batch requests
  async batch<T = unknown>(requests: Array<{ endpoint: string; config?: ApiRequestConfig }>): Promise<Array<ApiResponse<T>>> {
    return Promise.all(
      requests.map(({ endpoint, config }) => this.request<T>(endpoint, config))
    );
  }

  // Prefetch for performance
  async prefetch(endpoint: string, config?: ApiRequestConfig): Promise<void> {
    try {
      await this.request(endpoint, { ...config, priority: 'low' });
    } catch (error) {
      // Ignore prefetch errors
      logger.warn('Prefetch failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'prefetch'
      });
    }
  }

  // Clear cache
  clearCache(): void {
    apiCache.clear();
  }

  // Get performance stats
  getPerformanceStats() {
    return apiPerformanceMonitor.getStats();
  }
}

// Create singleton instance
export const apiClient = new OptimizedApiClient();

// React Query integration
export const createQueryKey = (endpoint: string, params?: QueryParams): string[] => {
  const baseKey = endpoint.split('/').filter(Boolean);
  return params ? [...baseKey, JSON.stringify(params)] : baseKey;
};

// Custom hooks for common API patterns
export const useOptimizedQuery = <T = unknown>(
  endpoint: string,
  config?: ApiRequestConfig,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) => {
  const { enabled = true, refetchInterval, staleTime = 300000 } = options || {};

  return {
    queryKey: createQueryKey(endpoint),
    queryFn: () => apiClient.get<T>(endpoint, config),
    enabled,
    refetchInterval,
    staleTime,
    retry: (failureCount: number, error: ApiError | Error) => {
      // Don't retry on 4xx errors
      if ('status' in error && error.status && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  };
};

export const useOptimizedMutation = <T = unknown, V = RequestBody>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  config?: ApiRequestConfig
) => {
  return {
    mutationFn: (variables: V) => {
      switch (method) {
        case 'POST':
          return apiClient.post<T>(endpoint, variables, config);
        case 'PUT':
          return apiClient.put<T>(endpoint, variables, config);
        case 'PATCH':
          return apiClient.patch<T>(endpoint, variables, config);
        case 'DELETE':
          return apiClient.delete<T>(endpoint, config);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      // This would integrate with React Query's query client
    },
    onError: (error: ApiError | Error) => {
      logger.error('Mutation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'mutation'
      }, error instanceof Error ? error : undefined);
    },
  };
};

export default apiClient;
