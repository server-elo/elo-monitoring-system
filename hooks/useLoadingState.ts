import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  minLoadingTime?: number;
  timeout?: number;
}

interface UseLoadingStateReturn<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (data: T | null) => void;
  executeAsync: <U>(asyncFn: () => Promise<U>) => Promise<U | null>;
  reset: () => void;
}

export const useLoadingState = <T = unknown>(
  options: UseLoadingStateOptions = {}
): UseLoadingStateReturn<T> => {
  const {
    initialLoading = false,
    minLoadingTime = 0,
    timeout = 0,
  } = options;

  const [state, setState] = useState<LoadingState<T>>({
    isLoading: initialLoading,
    error: null,
    data: null,
  });

  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      loadingStartTime.current = Date.now();
    }
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
    });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setState(prev => ({ ...prev, error: null }));

      // Set timeout if specified
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          setError('Request timed out');
        }, timeout);
      }

      const result = await asyncFn();

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Ensure minimum loading time
      if (minLoadingTime > 0 && loadingStartTime.current) {
        const elapsed = Date.now() - loadingStartTime.current;
        if (elapsed < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
        }
      }

      setData(result);
      setLoading(false);
      return result;
    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      return null;
    }
  }, [setLoading, setError, setData, minLoadingTime, timeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    setLoading,
    setError,
    setData,
    executeAsync,
    reset,
  };
};

// Multiple loading states manager
interface UseMultipleLoadingStatesReturn {
  isLoading: (key: string) => boolean;
  isAnyLoading: boolean;
  setLoading: (key: string, loading: boolean) => void;
  getError: (key: string) => string | null;
  setError: (key: string, error: string | null) => void;
  reset: (key?: string) => void;
}

export const useMultipleLoadingStates = (): UseMultipleLoadingStatesReturn => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({});

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
    if (loading) {
      // Clear error when starting to load
      setErrorStates(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const getError = useCallback((key: string): string | null => {
    return errorStates[key] || null;
  }, [errorStates]);

  const setError = useCallback((key: string, error: string | null) => {
    setErrorStates(prev => ({ ...prev, [key]: error }));
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      setErrorStates(prev => ({ ...prev, [key]: null }));
    } else {
      setLoadingStates({});
      setErrorStates({});
    }
  }, []);

  return {
    isLoading,
    isAnyLoading,
    setLoading,
    getError,
    setError,
    reset,
  };
};

// Debounced loading state
export const useDebouncedLoading = (delay: number = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      // Show loading immediately when starting
      setDebouncedLoading(true);
    } else {
      // Delay hiding loading to prevent flicker
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(false);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return {
    isLoading: debouncedLoading,
    setLoading: setIsLoading,
  };
};

export default useLoadingState;
