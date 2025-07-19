import { useEffect, useRef, useState, useCallback } from 'react';

export interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  fallbackInView?: boolean;
}

// Hook for intersection observer based lazy loading
export function useIntersectionObserver(
  options: LazyLoadingOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    delay = 0,
    fallbackInView = false,
  } = options;

  const [isInView, setIsInView] = useState(fallbackInView);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    
    // Fallback for environments without IntersectionObserver
    if (!window.IntersectionObserver) {
      setIsInView(true);
      return;
    }

    if (!element) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting) {
        if (delay > 0) {
          setTimeout(() => {
            setIsInView(true);
            if (triggerOnce) {
              setHasTriggered(true);
            }
          }, delay);
        } else {
          setIsInView(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        }
      } else if (!triggerOnce) {
        setIsInView(false);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  useEffect(() => {
    if (hasTriggered && observerRef.current) {
      observerRef.current.disconnect();
    }
  }, [hasTriggered]);

  return { ref: setRef, isInView };
}

// Hook for lazy loading components
export function useLazyComponent<T = any>(
  importFunction: () => Promise<{ default: React.ComponentType<T> }>,
  options: LazyLoadingOptions = {}
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { ref, isInView } = useIntersectionObserver(options);

  useEffect(() => {
    if (isInView && !Component && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      importFunction()
        .then((module) => {
          setComponent(() => module.default);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isInView, Component, isLoading, importFunction]);

  return { ref, Component, isLoading, error, isInView };
}

// Hook for lazy loading images
export function useLazyImage(src: string, options: LazyLoadingOptions = {}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { ref, isInView } = useIntersectionObserver(options);

  useEffect(() => {
    if (isInView && !imageSrc) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setError(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    }
  }, [isInView, src, imageSrc]);

  return { ref, imageSrc, isLoaded, error, isInView };
}

// Hook for lazy loading data
export function useLazyData<T>(
  fetchFunction: () => Promise<T>,
  options: LazyLoadingOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { ref, isInView } = useIntersectionObserver(options);

  const refetch = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    fetchFunction()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [fetchFunction, isLoading]);

  useEffect(() => {
    if (isInView && !data && !isLoading) {
      refetch();
    }
  }, [isInView, data, isLoading, refetch]);

  return { ref, data, isLoading, error, refetch, isInView };
}

// Hook for virtual scrolling
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
  };
}

// Hook for progressive image loading
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string,
  options: LazyLoadingOptions = {}
) {
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const { ref, isInView } = useIntersectionObserver(options);

  useEffect(() => {
    if (isInView && !isHighQualityLoaded) {
      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(highQualitySrc);
        setIsHighQualityLoaded(true);
      };
      
      img.src = highQualitySrc;
    }
  }, [isInView, highQualitySrc, isHighQualityLoaded]);

  return { ref, currentSrc, isHighQualityLoaded, isInView };
}

// Hook for lazy loading with retry logic
export function useLazyLoadingWithRetry<T>(
  loadFunction: () => Promise<T>,
  options: LazyLoadingOptions & { maxRetries?: number; retryDelay?: number } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, ...intersectionOptions } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { ref, isInView } = useIntersectionObserver(intersectionOptions);

  const load = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loadFunction();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      setError(err as Error);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          load();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadFunction, isLoading, retryCount, maxRetries, retryDelay]);

  useEffect(() => {
    if (isInView && !data && !isLoading && retryCount === 0) {
      load();
    }
  }, [isInView, data, isLoading, retryCount, load]);

  const retry = useCallback(() => {
    setRetryCount(0);
    load();
  }, [load]);

  return { ref, data, isLoading, error, retry, retryCount, isInView };
}

export default useIntersectionObserver;
