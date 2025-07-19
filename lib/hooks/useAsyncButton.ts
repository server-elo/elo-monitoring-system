import { useState, useCallback, useRef } from 'react';

export interface AsyncButtonState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  isDisabled: boolean;
}

export interface AsyncButtonOptions {
  debounceMs?: number;
  successDuration?: number;
  errorDuration?: number;
  preventDoubleClick?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAsyncButton(options: AsyncButtonOptions = {}) {
  const {
    debounceMs = 300,
    successDuration = 2000,
    errorDuration = 3000,
    preventDoubleClick = true,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<AsyncButtonState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    isDisabled: false
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<number>(0);

  const clearTimeouts = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimeouts();
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      isDisabled: false
    });
  }, [clearTimeouts]);

  const execute = useCallback(async (asyncFn: () => Promise<void>) => {
    const now = Date.now();
    
    // Prevent double clicks
    if (preventDoubleClick && now - lastClickRef.current < debounceMs) {
      return;
    }
    lastClickRef.current = now;

    // Clear any existing timeouts
    clearTimeouts();

    // Set loading state immediately
    setState(prev => ({
      ...prev,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      isDisabled: true
    }));

    try {
      await asyncFn();
      
      // Set success state
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        isDisabled: false
      }));

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Auto-clear success state after duration
      successTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isSuccess: false
        }));
      }, successDuration);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Set error state
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        isDisabled: false
      }));

      // Call error callback
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }

      // Auto-clear error state after duration
      errorTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isError: false,
          error: null
        }));
      }, errorDuration);
    }
  }, [debounceMs, successDuration, errorDuration, preventDoubleClick, onSuccess, onError, clearTimeouts]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    clearTimeouts();
  }, [clearTimeouts]);

  return {
    state,
    execute,
    reset,
    cleanup
  };
}

// Hook for debounced async actions
export function useDebouncedAsyncButton(
  asyncFn: () => Promise<void>,
  options: AsyncButtonOptions = {}
) {
  const { execute, state, reset, cleanup } = useAsyncButton(options);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedExecute = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      execute(asyncFn);
    }, options.debounceMs || 300);
  }, [execute, asyncFn, options.debounceMs]);

  const cleanupDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    cleanup();
  }, [cleanup]);

  return {
    state,
    execute: debouncedExecute,
    reset,
    cleanup: cleanupDebounce
  };
}

// Hook for form submission buttons
export function useFormSubmitButton(
  submitFn: () => Promise<void>,
  options: AsyncButtonOptions = {}
) {
  const { execute, state, reset, cleanup } = useAsyncButton({
    debounceMs: 500, // Longer debounce for form submissions
    successDuration: 3000,
    errorDuration: 5000,
    preventDoubleClick: true,
    ...options
  });

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    execute(submitFn);
  }, [execute, submitFn]);

  return {
    state,
    handleSubmit,
    reset,
    cleanup
  };
}

// Hook for API call buttons
export function useApiButton<T = any>(
  apiFn: () => Promise<T>,
  options: AsyncButtonOptions & {
    onData?: (data: T) => void;
  } = {}
) {
  const { onData, ...buttonOptions } = options;
  const [data, setData] = useState<T | null>(null);
  
  const { execute, state, reset, cleanup } = useAsyncButton({
    ...buttonOptions,
    onSuccess: () => {
      if (onData && data) {
        onData(data);
      }
      if (buttonOptions.onSuccess) {
        buttonOptions.onSuccess();
      }
    }
  });

  const executeApi = useCallback(async () => {
    await execute(async () => {
      const result = await apiFn();
      setData(result);
    });
  }, [execute, apiFn]);

  const resetWithData = useCallback(() => {
    setData(null);
    reset();
  }, [reset]);

  return {
    state,
    data,
    execute: executeApi,
    reset: resetWithData,
    cleanup
  };
}
