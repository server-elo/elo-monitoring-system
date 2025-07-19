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
  onSuccess?: (_) => void;
  onError?: (_error: Error) => void;
}

export function useAsyncButton(_options: AsyncButtonOptions = {}) {
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

  const debounceRef = useRef<NodeJS.Timeout | null>(_null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(_null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(_null);
  const lastClickRef = useRef<number>(0);

  const clearTimeouts = useCallback(() => {
    if (_debounceRef.current) {
      clearTimeout(_debounceRef.current);
      debounceRef.current = null;
    }
    if (_successTimeoutRef.current) {
      clearTimeout(_successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (_errorTimeoutRef.current) {
      clearTimeout(_errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimeouts(_);
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      isDisabled: false
    });
  }, [clearTimeouts]);

  const execute = useCallback( async (asyncFn: () => Promise<void>) => {
    const now = Date.now(_);
    
    // Prevent double clicks
    if (preventDoubleClick && now - lastClickRef.current < debounceMs) {
      return;
    }
    lastClickRef.current = now;

    // Clear any existing timeouts
    clearTimeouts(_);

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
      await asyncFn(_);
      
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
        onSuccess(_);
      }

      // Auto-clear success state after duration
      successTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isSuccess: false
        }));
      }, successDuration);

    } catch (_error) {
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
        onError(_error instanceof Error ? error : new Error(errorMessage));
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
    clearTimeouts(_);
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
  asyncFn: (_) => Promise<void>,
  options: AsyncButtonOptions = {}
) {
  const { execute, state, reset, cleanup } = useAsyncButton(_options);
  const debounceRef = useRef<NodeJS.Timeout | null>(_null);

  const debouncedExecute = useCallback(() => {
    if (_debounceRef.current) {
      clearTimeout(_debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      execute(_asyncFn);
    }, options.debounceMs || 300);
  }, [execute, asyncFn, options.debounceMs]);

  const cleanupDebounce = useCallback(() => {
    if (_debounceRef.current) {
      clearTimeout(_debounceRef.current);
      debounceRef.current = null;
    }
    cleanup(_);
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
  submitFn: (_) => Promise<void>,
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
      e.preventDefault(_);
    }
    execute(_submitFn);
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
  apiFn: (_) => Promise<T>,
  options: AsyncButtonOptions & {
    onData?: (_data: T) => void;
  } = {}
) {
  const { onData, ...buttonOptions } = options;
  const [data, setData] = useState<T | null>(_null);
  
  const { execute, state, reset, cleanup } = useAsyncButton({
    ...buttonOptions,
    onSuccess: (_) => {
      if (onData && data) {
        onData(_data);
      }
      if (_buttonOptions.onSuccess) {
        buttonOptions.onSuccess(_);
      }
    }
  });

  const executeApi = useCallback( async () => {
    await execute( async () => {
      const result = await apiFn(_);
      setData(_result);
    });
  }, [execute, apiFn]);

  const resetWithData = useCallback(() => {
    setData(_null);
    reset(_);
  }, [reset]);

  return {
    state,
    data,
    execute: executeApi,
    reset: resetWithData,
    cleanup
  };
}
