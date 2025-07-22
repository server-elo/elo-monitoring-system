import { memo, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
// Memoization wrapper for expensive components
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, propsAreEqual);
};
// Dynamic import with loading state
export const lazyLoad = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    loading?: React.ComponentType;
    ssr?: boolean;
  }
) => {
  return dynamic(importFunc, {
    loading: options?.loading || (() => <div>Loading...</div>),
    ssr: options?.ssr ?? true
  });
};
// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      if (renderTime>16) { // More than one frame
      console.warn(`[${componentName}] Slow render: ${renderTime.toFixed(2)}ms`);
    }
  };
}
return () => {};
};
// Debounce utility for event handlers
export const useDebounce = <T extends (...args: unknown[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};
// Virtual list hook for large data sets
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight
      }
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);
  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};
