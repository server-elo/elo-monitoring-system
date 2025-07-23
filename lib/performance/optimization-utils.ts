import { logger } from '@/lib/logging/structured-logger';

/**
 * Performance Optimization Utilities
 * Comprehensive tools for app performance enhancement
 */

// Debounce function for performance optimization
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

// Memoization with TTL for expensive computations
export function memoizeWithTTL<T extends (...args: unknown[]) => unknown>(
  func: T,
  ttlMs: number = 300000, // 5 minutes default
  maxSize: number = 100
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    
    // Check if we have a valid cached result
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < ttlMs) {
      return cached.value;
    }
    
    // Compute new result
    const result = func(...args);
    
    // Cache management - remove oldest entries if cache is full
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    cache.set(key, { value: result, timestamp: now });
    return result;
  }) as T;
}

// Lazy loading utility for components
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): React.LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFunc);
  
  if (fallback) {
    return React.lazy(async () => {
      try {
        return await importFunc();
      } catch (error) {
        logger.error('Lazy component loading failed', { action: 'lazy_load' }, error as Error);
        return { default: fallback as T };
      }
    });
  }
  
  return LazyComponent;
}

// Bundle splitting utility
export function splitChunks() {
  return {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
      },
      ui: {
        test: /[\\/]components[\\/]ui[\\/]/,
        name: 'ui',
        chunks: 'all',
        priority: 8,
      },
    },
  };
}

// Image optimization helper
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  sizes?: string;
}

export function getOptimizedImageProps(props: OptimizedImageProps): OptimizedImageProps {
  return {
    quality: 85,
    placeholder: 'blur',
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    ...props,
  };
}

// Critical CSS extraction utility
export function extractCriticalCSS(html: string): string {
  // Simple critical CSS extraction (in production, use a more sophisticated tool)
  const criticalRules = [
    'body', 'html', 
    '.container', '.flex', '.grid',
    '.text-', '.bg-', '.p-', '.m-',
    '.w-', '.h-', '.font-',
    '@media (max-width: 768px)'
  ];
  
  // This is a simplified version - in production, use tools like 'critical' package
  return `/* Critical CSS placeholder - implement with proper tool */`;
}

// Resource preloading utilities
export function preloadResource(href: string, as: string, type?: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
}

export function prefetchResource(href: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  
  document.head.appendChild(link);
}

// Service Worker utilities
export function registerServiceWorker(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(undefined);
  }
  
  return navigator.serviceWorker.register(swPath)
    .then((registration) => {
      logger.info('Service Worker registered successfully', {
        action: 'sw_register',
        metadata: { scope: registration.scope },
      });
      return registration;
    })
    .catch((error) => {
      logger.error('Service Worker registration failed', {
        action: 'sw_register',
      }, error);
      return undefined;
    });
}

// Virtual scrolling utility for large lists
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollItems<T>(
  items: T[],
  scrollTop: number,
  config: VirtualScrollConfig
): {
  visibleItems: Array<{ item: T; index: number; offset: number }>;
  totalHeight: number;
  spacerBefore: number;
  spacerAfter: number;
} {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  const totalHeight = items.length * itemHeight;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      item: items[i],
      index: i,
      offset: i * itemHeight,
    });
  }
  
  const spacerBefore = startIndex * itemHeight;
  const spacerAfter = (items.length - endIndex - 1) * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    spacerBefore,
    spacerAfter,
  };
}

// Web Worker utilities for heavy computations
export function createWebWorker(workerScript: string): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  try {
    return new Worker(workerScript);
  } catch (error) {
    logger.error('Failed to create Web Worker', {
      action: 'web_worker',
    }, error as Error);
    return null;
  }
}

// Performance timing helpers
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor(private name: string) {
    this.startTime = performance.now();
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }
  
  mark(label: string): void {
    const time = performance.now();
    this.marks.set(label, time);
    
    if (typeof performance !== 'undefined') {
      performance.mark(`${this.name}-${label}`);
    }
  }
  
  measure(label: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) || this.startTime : this.startTime;
    const duration = endTime - startTime;
    
    if (typeof performance !== 'undefined') {
      try {
        const startMarkName = startMark ? `${this.name}-${startMark}` : `${this.name}-start`;
        performance.measure(`${this.name}-${label}`, startMarkName);
      } catch (error) {
        // Mark might not exist, ignore
      }
    }
    
    logger.performance(`${this.name}-${label}`, duration);
    return duration;
  }
  
  end(): number {
    const duration = this.measure('total');
    
    // Log performance summary
    logger.info(`Performance timing: ${this.name}`, {
      action: 'performance_timing',
      duration,
      metadata: Object.fromEntries(this.marks),
    });
    
    return duration;
  }
}

// Code splitting helper
export function createAsyncChunk<T>(
  importFn: () => Promise<T>,
  chunkName?: string
): () => Promise<T> {
  return async () => {
    const timer = new PerformanceTimer(`chunk-load-${chunkName || 'unknown'}`);
    
    try {
      const module = await importFn();
      timer.end();
      return module;
    } catch (error) {
      timer.end();
      logger.error(`Failed to load chunk: ${chunkName}`, {
        action: 'chunk_load',
      }, error as Error);
      throw error;
    }
  };
}

// Memory optimization utilities
export function cleanupUnusedResources(): void {
  // Clear expired cache entries
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('old') || cacheName.includes('expired')) {
          caches.delete(cacheName);
        }
      });
    });
  }
  
  // Force garbage collection if available (development only)
  if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
    (window as { gc?: () => void }).gc?.();
  }
}

// React is not used in this file, removing unused import

const optimizationUtils = {
  debounce,
  throttle,
  memoizeWithTTL,
  createLazyComponent,
  splitChunks,
  getOptimizedImageProps,
  preloadResource,
  prefetchResource,
  registerServiceWorker,
  calculateVirtualScrollItems,
  createWebWorker,
  PerformanceTimer,
  createAsyncChunk,
  cleanupUnusedResources,
};

export default optimizationUtils;