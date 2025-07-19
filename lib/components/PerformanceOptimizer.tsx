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
  areEqual?: ( prevProps: any, nextProps: any) => boolean;
  /** Debounce delay for expensive operations (_ms) */
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
  private static renderCounts = new Map<string, number>(_);
  private static renderTimes = new Map<string, number[]>(_);

  static trackRender( componentName: string, renderTime: number): void {
    // Update render count
    const currentCount = this.renderCounts.get(_componentName) || 0;
    this.renderCounts.set( componentName, currentCount + 1);

    // Update render times
    const times = this.renderTimes.get(_componentName) || [];
    times.push(_renderTime);
    
    // Keep only last 100 render times
    if (_times.length > 100) {
      times.shift(_);
    }
    
    this.renderTimes.set( componentName, times);

    // Log performance warnings in development
    if (_process.env.NODE_ENV === 'development') {
      const avgTime = times.reduce( (sum, time) => sum + time, 0) / times.length;
      
      if (_avgTime > 16) { // More than one frame (_60fps)
        logger.warn(`Performance Warning: ${componentName} average render time: ${avgTime.toFixed(2)}ms`, { metadata: {
          component: componentName,
          renderCount: currentCount,
          averageRenderTime: avgTime,
          lastRenderTime: renderTime
        });
      }});
    }
  }

  static getStats(_componentName: string) {
    const renderCount = this.renderCounts.get(_componentName) || 0;
    const times = this.renderTimes.get(_componentName) || [];
    const avgTime = times.length > 0 
      ? times.reduce( (sum, time) => sum + time, 0) / times.length 
      : 0;

    return {
      renderCount,
      averageRenderTime: avgTime,
      totalRenders: renderCount,
      recentRenderTimes: times.slice(-10)
    };
  }

  static getAllStats(_) {
    const stats: Record<string, any> = {};
    
    for (_const [componentName] of this.renderCounts) {
      stats[componentName] = this.getStats(_componentName);
    }
    
    return stats;
  }
}

/**
 * Deep comparison utility for props
 */
function deepEqual( a: any, b: any): boolean {
  if (_a === b) return true;
  
  if (_a == null || b == null) return a === b;
  
  if (_typeof a !== typeof b) return false;
  
  if (_typeof a === 'object') {
    const keysA = Object.keys(_a);
    const keysB = Object.keys(_b);
    
    if (_keysA.length !== keysB.length) return false;
    
    return keysA.every( key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Create a shallow comparison function that ignores specific props
 */
function createPropsComparison(
  ignoreProps: string[] = [],
  watchProps: string[] = [],
  deepCompare: boolean = false
) {
  return function areEqual( prevProps: any, nextProps: any): boolean {
    // If watchProps is specified, only compare those props
    if (_watchProps.length > 0) {
      return watchProps.every(prop => {
        const comparison = deepCompare 
          ? deepEqual( prevProps[prop], nextProps[prop])
          : prevProps[prop] === nextProps[prop];
        return comparison;
      });
    }

    // Get all props except ignored ones
    const prevFiltered = { ...prevProps };
    const nextFiltered = { ...nextProps };
    
    ignoreProps.forEach(prop => {
      delete prevFiltered[prop];
      delete nextFiltered[prop];
    });

    // Compare filtered props
    const prevKeys = Object.keys(_prevFiltered);
    const nextKeys = Object.keys(_nextFiltered);
    
    if (_prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      const comparison = deepCompare
        ? deepEqual( prevFiltered[key], nextFiltered[key])
        : prevFiltered[key] === nextFiltered[key];
      return comparison;
    });
  };
}

/**
 * HOC for automatic performance optimization
 */
export function withPerformanceOptimization<P extends object>(
  Component: ComponentType<P>,
  config: PerformanceConfig = {}
) {
  const {
    memo: useMemoization = true,
    areEqual,
    debounceMs = 0,
    trackRenders = process.env.NODE_ENV === 'development',
    displayName,
    deepCompare = false,
    watchProps = [],
    ignoreProps = []
  } = config;

  const componentName = displayName || Component.displayName || Component.name || 'UnknownComponent';

  // Create the optimized component
  const OptimizedComponent = forwardRef<unknown, P>( (props, ref) => {
    const renderStartTime = useRef<number>(_);
    const [renderKey, setRenderKey] = useState(0);

    // Track render performance
    useEffect(() => {
      if (trackRenders && renderStartTime.current) {
        const renderTime = performance.now(_) - renderStartTime.current;
        PerformanceTracker.trackRender( componentName, renderTime);
      }
    });

    // Record render start time
    if (trackRenders) {
      renderStartTime.current = performance.now(_);
    }

    // Debounced render trigger
    const debouncedRender = useCallback(() => {
      if (_debounceMs > 0) {
        const timeoutId = setTimeout(() => {
          setRenderKey(_prev => prev + 1);
        }, debounceMs);
        
        return (_) => clearTimeout(_timeoutId);
      }
    }, [debounceMs]);

    // Trigger debounced render when props change
    useEffect(() => {
      if (_debounceMs > 0) {
        const cleanup = debouncedRender(_);
        return cleanup;
      }
    }, [props, debouncedRender]);

    return <Component {...props} ref={ref} key={debounceMs > 0 ? renderKey : undefined} />;
  });

  OptimizedComponent.displayName = `withPerformanceOptimization(_${componentName})`;

  // Apply memoization if requested
  if (useMemoization) {
    const memoComparison = areEqual || createPropsComparison( ignoreProps, watchProps, deepCompare);
    return memo( OptimizedComponent, memoComparison);
  }

  return OptimizedComponent;
}

/**
 * HOC for expensive components that need aggressive optimization
 */
export function withAggressiveOptimization<P extends object>(
  Component: ComponentType<P>,
  config: Omit<PerformanceConfig, 'memo'> & { 
    stableProps?: (_keyof P)[];
    computedProps?: (_keyof P)[];
  } = {}
) {
  const {
    stableProps = [],
    computedProps = [],
    ...optimizationConfig
  } = config;

  return withPerformanceOptimization(Component, {
    ...optimizationConfig,
    memo: true,
    deepCompare: true,
    ignoreProps: [...(_optimizationConfig.ignoreProps || []), ...computedProps as string[]],
    watchProps: optimizationConfig.watchProps?.length 
      ? optimizationConfig.watchProps 
      : stableProps as string[]
  });
}

/**
 * Hook for optimizing expensive computations
 */
export function useOptimizedComputation<T>(
  computation: (_) => T,
  dependencies: React.DependencyList,
  options: {
    /** Debounce computation by this many milliseconds */
    debounceMs?: number;
    /** Whether computation is expensive and should be memoized */
    expensive?: boolean;
    /** Name for performance tracking */
    name?: string;
  } = {}
): T {
  const { debounceMs = 0, expensive = true, name = 'computation' } = options;
  
  // For expensive computations, use useMemo
  const memoizedResult = useMemo(() => {
    const startTime = performance.now(_);
    const result = computation(_);
    const computationTime = performance.now(_) - startTime;
    
    // Log performance warnings for expensive computations
    if (_process.env.NODE_ENV === 'development' && computationTime > 5) {
      logger.warn(`Expensive computation detected: ${name} took ${computationTime.toFixed(2)}ms`);
    }
    
    return result;
  }, expensive ? dependencies : []);

  // For debounced computations
  const [debouncedResult, setDebouncedResult] = useState<T>(_memoizedResult);
  
  useEffect(() => {
    if (_debounceMs > 0) {
      const timeoutId = setTimeout(() => {
        setDebouncedResult(_memoizedResult);
      }, debounceMs);
      
      return (_) => clearTimeout(_timeoutId);
    } else {
      setDebouncedResult(_memoizedResult);
    }
  }, [memoizedResult, debounceMs]);

  return debounceMs > 0 ? debouncedResult : memoizedResult;
}

/**
 * Hook for creating stable callback references
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList = []
): T {
  return useCallback( callback, dependencies);
}

/**
 * Hook for creating stable object references
 */
export function useStableObject<T extends object>(
  object: T,
  dependencies: React.DependencyList = []
): T {
  return useMemo(() => object, dependencies);
}

/**
 * Utility to analyze component performance
 */
export function usePerformanceAnalysis(_componentName: string) {
  const [stats, setStats] = useState(() => PerformanceTracker.getStats(_componentName));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(_PerformanceTracker.getStats(componentName));
    }, 1000);
    
    return (_) => clearInterval(_interval);
  }, [componentName]);
  
  return stats;
}

/**
 * Development-only performance monitoring component
 */
export function PerformanceMonitor({ enabled = process.env.NODE_ENV === 'development'  }) {
  const [allStats, setAllStats] = useState({  });
  
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setAllStats(_PerformanceTracker.getAllStats());
    }, 5000);
    
    return (_) => clearInterval(_interval);
  }, [enabled]);
  
  if (!enabled) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        maxHeight: '200px',
        overflow: 'auto'
      }}
    >
      <h4>Performance Monitor</h4>
      {Object.entries(_allStats).map( ([name, stats]: [string, any]) => (
        <div key={name} style={{ marginBottom: '5px' }}>
          <strong>{name}:</strong> {stats.renderCount} renders, {stats.averageRenderTime.toFixed(1)}ms avg
        </div>
      ))}
    </div>
  );
}

// Export performance tracker for advanced usage
export { PerformanceTracker };

// Convenience exports
export {
  withPerformanceOptimization as withPerformance,
  withAggressiveOptimization as withAggressive,
  useOptimizedComputation as useOptimized,
  useStableCallback as useStable,
  useStableObject as useStableObj
};