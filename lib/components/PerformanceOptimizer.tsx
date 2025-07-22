/**
 * Performance Optimization HOCs and Utilities
 * 
 * Provides systematic performance optimization patterns including automatic
 * memoization, debouncing, and render optimization for React components.
 */
'use client';

import React, { 
  ComponentType, 
  memo, 
  useMemo, 
  useCallback, 
  forwardRef, 
  useRef, 
  useEffect, 
  useState 
} from 'react';
import { logger } from '@/lib/api/logger';

/**
 * Performance optimization configuration
 */
interface PerformanceConfig {
  /** Whether to use React.memo for the component */
  memo?: boolean;
  /** Custom comparison function for React.memo */
  areEqual?: (prevProps: unknown, nextProps: unknown) => boolean;
  /** Debounce delay for expensive operations (ms) */
  debounceMs?: number;
  /** Whether to track render performance */
  trackRenders?: boolean;
  /** Name for performance tracking */
  displayName?: string;
  /** Whether to deep compare props */
  deepCompare?: boolean;
  /** Props that should trigger re-renders when changed */
  watchProps?: string[];
  /** Props that should be ignored for memoization */
  ignoreProps?: string[];
}

/**
 * Performance tracking utilities
 */
class PerformanceTracker {
  private static renderCounts = new Map<string, number>();
  private static renderTimes = new Map<string, number[]>();

  static trackRender(componentName: string, renderTime: number): void {
    // Update render count
    const currentCount = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, currentCount + 1);

    // Update render times
    const times = this.renderTimes.get(componentName) || [];
    times.push(renderTime);
    
    // Keep only last 100 render times
    if (times.length > 100) {
      times.shift();
    }
    this.renderTimes.set(componentName, times);

    // Check performance issues
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    if (avgTime > 16) {
      // More than one frame (60fps)
      logger.warn(`Performance Warning: ${componentName} average render time: ${avgTime.toFixed(2)}ms`, {
        metadata: {
          component: componentName,
          renderCount: currentCount,
          averageRenderTime: avgTime,
          lastRenderTime: renderTime
        }
      });
    }
  }

  static getStats(componentName: string) {
    const renderCount = this.renderCounts.get(componentName) || 0;
    const renderTimes = this.renderTimes.get(componentName) || [];
    const avgTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0;

    return {
      renderCount,
      averageRenderTime: avgTime,
      lastRenderTime: renderTimes[renderTimes.length - 1] || 0,
      renderTimes
    };
  }

  static reset(componentName?: string): void {
    if (componentName) {
      this.renderCounts.delete(componentName);
      this.renderTimes.delete(componentName);
    } else {
      this.renderCounts.clear();
      this.renderTimes.clear();
    }
  }
}

/**
 * Deep comparison utility for props
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Custom areEqual function factory
 */
function createAreEqual(config: PerformanceConfig) {
  return (prevProps: any, nextProps: any): boolean => {
    // Handle watch props
    if (config.watchProps) {
      for (const prop of config.watchProps) {
        if (prevProps[prop] !== nextProps[prop]) {
          return false;
        }
      }
      return true;
    }

    // Handle ignore props
    if (config.ignoreProps) {
      const filteredPrev = { ...prevProps };
      const filteredNext = { ...nextProps };
      
      for (const prop of config.ignoreProps) {
        delete filteredPrev[prop];
        delete filteredNext[prop];
      }

      return config.deepCompare
        ? deepEqual(filteredPrev, filteredNext)
        : Object.keys(filteredPrev).every(key => filteredPrev[key] === filteredNext[key]);
    }

    // Default comparison
    return config.deepCompare
      ? deepEqual(prevProps, nextProps)
      : Object.keys(prevProps).every(key => prevProps[key] === nextProps[key]);
  };
}

/**
 * Performance optimization HOC
 * 
 * @example
 * const OptimizedComponent = withPerformance(MyComponent, {
 *   memo: true,
 *   trackRenders: true,
 *   displayName: 'MyOptimizedComponent'
 * });
 */
export function withPerformance<P extends object>(
  Component: ComponentType<P>,
  config: PerformanceConfig = {}
): ComponentType<P> {
  const {
    memo: useMemo = true,
    areEqual,
    trackRenders = false,
    displayName = Component.displayName || Component.name || 'Component',
    ...restConfig
  } = config;

  // Create wrapped component
  const WrappedComponent = forwardRef<any, P>((props, ref) => {
    const renderStartTime = useRef<number>(0);

    // Track render start
    if (trackRenders) {
      renderStartTime.current = performance.now();
    }

    // Track render completion
    useEffect(() => {
      if (trackRenders && renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        PerformanceTracker.trackRender(displayName, renderTime);
      }
    });

    return <Component {...props} ref={ref} />;
  });

  WrappedComponent.displayName = `withPerformance(${displayName})`;

  // Apply memo if requested
  if (useMemo) {
    const memoComparison = areEqual || createAreEqual(restConfig);
    return memo(WrappedComponent, memoComparison);
  }

  return WrappedComponent;
}

/**
 * Hook for debouncing expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling expensive operations
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= interval) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, interval - (Date.now() - lastRun.current));

    return () => clearTimeout(handler);
  }, [value, interval]);

  return throttledValue;
}

/**
 * Hook for lazy loading components
 */
export function useLazyComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  fallback: React.ReactNode = null
): [T | null, boolean, Error | null] {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    loader()
      .then(module => {
        if (mounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return [Component, loading, error];
}

/**
 * Utility to get performance stats
 */
export function getPerformanceStats(componentName: string) {
  return PerformanceTracker.getStats(componentName);
}

/**
 * Utility to reset performance tracking
 */
export function resetPerformanceTracking(componentName?: string) {
  PerformanceTracker.reset(componentName);
}

// Export configuration type
export type { PerformanceConfig };

// Export the main optimization HOC with a simpler alias
export const withPerformanceOptimization = withPerformance;