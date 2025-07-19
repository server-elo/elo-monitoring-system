import { useEffect, useRef, useCallback, useState } from 'react';

// Debounce Hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle Hook
export const useThrottle = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastRan = useRef<number>(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Intersection Observer Hook for Lazy Loading
interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
) => {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && triggerOnce && !hasTriggered) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isIntersecting: triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting,
  };
};

// Virtual Scrolling Hook
interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = <T>(
  items: T[],
  options: UseVirtualScrollOptions
) => {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleItemsCount + overscan * 2
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
  };
};

// Memoization Hook with Dependencies
export const useMemoWithDeps = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const ref = useRef<{ value: T; deps: React.DependencyList } | null>(null);

  if (!ref.current || !depsEqual(ref.current.deps, deps)) {
    ref.current = {
      value: factory(),
      deps,
    };
  }

  return ref.current.value;
};

// Helper function to compare dependencies
const depsEqual = (a: React.DependencyList, b: React.DependencyList): boolean => {
  if (a.length !== b.length) return false;
  return a.every((dep, index) => Object.is(dep, b[index]));
};

// Performance Monitoring Hook
interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  lastUpdateTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());
  const lastRenderTime = useRef<number>(Date.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    lastUpdateTime: 0,
  });

  useEffect(() => {
    const componentMountTime = Date.now() - mountTime.current;
    setMetrics(prev => ({ ...prev, componentMountTime }));
  }, []);

  useEffect(() => {
    const renderTime = Date.now() - lastRenderTime.current;
    const lastUpdateTime = Date.now();
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      lastUpdateTime,
    }));

    lastRenderTime.current = Date.now();

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime}ms`,
        mountTime: `${metrics.componentMountTime}ms`,
      });
    }
  });

  return metrics;
};

// Image Lazy Loading Hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setIsError(false);
      };
      
      img.onerror = () => {
        setIsError(true);
        setIsLoaded(false);
      };
      
      img.src = src;
    }
  }, [isIntersecting, src]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    isError,
    isIntersecting,
  };
};

// Batch Updates Hook
export const useBatchUpdates = <T>(initialValue: T, delay: number = 100) => {
  const [value, setValue] = useState<T>(initialValue);
  const [pendingValue, setPendingValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchedSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(pendingValue)
      : newValue;
    
    setPendingValue(resolvedValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setValue(resolvedValue);
    }, delay);
  }, [pendingValue, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, batchedSetValue] as const;
};

// Resource Preloader Hook
export const useResourcePreloader = (resources: string[]) => {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const [failedResources, setFailedResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadResource = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          // Preload image
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = url;
        } else if (url.match(/\.(js|css)$/i)) {
          // Preload script or stylesheet
          const link = document.createElement('link');
          link.rel = url.endsWith('.css') ? 'stylesheet' : 'preload';
          link.as = url.endsWith('.css') ? '' : 'script';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = () => reject();
          document.head.appendChild(link);
        } else {
          // Generic fetch preload
          fetch(url)
            .then(() => resolve())
            .catch(() => reject());
        }
      });
    };

    const preloadAll = async () => {
      for (const resource of resources) {
        try {
          await preloadResource(resource);
          setLoadedResources(prev => new Set(prev).add(resource));
        } catch {
          setFailedResources(prev => new Set(prev).add(resource));
        }
      }
    };

    preloadAll();
  }, [resources]);

  const isLoaded = (resource: string) => loadedResources.has(resource);
  const isFailed = (resource: string) => failedResources.has(resource);
  const allLoaded = resources.every(isLoaded);
  const loadingProgress = loadedResources.size / resources.length;

  return {
    isLoaded,
    isFailed,
    allLoaded,
    loadingProgress,
    loadedCount: loadedResources.size,
    failedCount: failedResources.size,
    totalCount: resources.length,
  };
};

// Memory Usage Monitor Hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

export default {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useVirtualScroll,
  useMemoWithDeps,
  usePerformanceMonitor,
  useLazyImage,
  useBatchUpdates,
  useResourcePreloader,
  useMemoryMonitor,
};
