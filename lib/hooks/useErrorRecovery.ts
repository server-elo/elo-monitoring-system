import { useState, useEffect, useCallback, useRef } from 'react';
import { RetryManager, OfflineManager, ErrorAnalyticsManager, UserErrorReporter } from '@/lib/errors/recovery';
import { useError } from '@/lib/errors/ErrorContext';

// Hook for retry functionality with exponential backoff
export function useRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    enabled?: boolean;
    onRetry?: (attempt: number) => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { reportError } = useError();

  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    enabled = true,
    onRetry,
    onSuccess,
    onError
  } = options;

  const executeWithRetry = useCallback(async (): Promise<T | null> => {
    if (!enabled) {
      try {
        const result = await operation();
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error as Error;
        setLastError(err);
        onError?.(err);
        reportError(err);
        return null;
      }
    }

    setIsRetrying(true);
    setLastError(null);

    try {
      const result = await RetryManager.executeWithRetry(operation, {
        maxRetries,
        baseDelay,
        maxDelay,
        onRetry: (_error, attempt) => {
          setRetryCount(attempt);
          onRetry?.(attempt);
        },
        onMaxRetriesReached: (error) => {
          setLastError(error);
          onError?.(error);
          reportError(error, { 
            category: 'retry_exhausted',
            metadata: { maxRetries, retryCount: maxRetries }
          });
        }
      });

      setRetryCount(0);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error as Error;
      setLastError(err);
      onError?.(err);
      return null;
    } finally {
      setIsRetrying(false);
    }
  }, [operation, enabled, maxRetries, baseDelay, maxDelay, onRetry, onSuccess, onError, reportError]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
  }, []);

  return {
    execute: executeWithRetry,
    isRetrying,
    retryCount,
    lastError,
    reset
  };
}

// Hook for offline detection and management
export function useOfflineDetection(options: {
  onOnline?: () => void;
  onOffline?: () => void;
  checkInterval?: number;
} = {}) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const offlineManagerRef = useRef<OfflineManager | null>(null);

  useEffect(() => {
    offlineManagerRef.current = OfflineManager.getInstance({
      checkInterval: options.checkInterval,
      onOnline: () => {
        setIsOnline(true);
        setLastChecked(new Date());
        options.onOnline?.();
      },
      onOffline: () => {
        setIsOnline(false);
        setLastChecked(new Date());
        options.onOffline?.();
      }
    });

    const unsubscribe = offlineManagerRef.current.addListener((online) => {
      setIsOnline(online);
      setLastChecked(new Date());
    });

    // Initial status
    setIsOnline(offlineManagerRef.current.getStatus());

    return () => {
      unsubscribe();
    };
  }, [options.checkInterval, options.onOnline, options.onOffline]);

  const forceCheck = useCallback(async () => {
    if (offlineManagerRef.current) {
      const status = await offlineManagerRef.current.forceCheck();
      setIsOnline(status);
      setLastChecked(new Date());
      return status;
    }
    return navigator.onLine;
  }, []);

  return {
    isOnline,
    lastChecked,
    forceCheck
  };
}

// Hook for error analytics tracking
export function useErrorAnalytics() {
  const analyticsRef = useRef<ErrorAnalyticsManager | null>(null);

  useEffect(() => {
    analyticsRef.current = ErrorAnalyticsManager.getInstance();
  }, []);

  const trackError = useCallback((error: Error, context?: {
    category?: string;
    severity?: 'critical' | 'error' | 'warning' | 'info';
    metadata?: Record<string, any>;
  }) => {
    analyticsRef.current?.trackError(error, context);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analyticsRef.current?.setUserId(userId);
  }, []);

  const getStats = useCallback(() => {
    return analyticsRef.current?.getErrorStats() || {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: []
    };
  }, []);

  return {
    trackError,
    setUserId,
    getStats
  };
}

// Hook for user error reporting
export function useErrorReporting() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitBugReport = useCallback(async (
    error: Error,
    userDescription: string,
    userEmail?: string
  ) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await UserErrorReporter.submitBugReport(error, userDescription, userEmail);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const generateReport = useCallback((error: Error, userDescription?: string) => {
    return UserErrorReporter.generateBugReport(error, userDescription);
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    submitBugReport,
    generateReport,
    isSubmitting,
    submitError,
    submitSuccess,
    reset
  };
}

// Hook for comprehensive error handling with recovery
export function useErrorHandler<T>(
  operation: () => Promise<T>,
  options: {
    enableRetry?: boolean;
    maxRetries?: number;
    trackAnalytics?: boolean;
    category?: string;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
    onOffline?: () => void;
  } = {}
) {
  const {
    enableRetry = true,
    maxRetries = 3,
    trackAnalytics = true,
    category = 'unknown',
    onError,
    onSuccess,
    onOffline
  } = options;

  const { isOnline } = useOfflineDetection({
    onOffline: onOffline
  });

  const { trackError } = useErrorAnalytics();
  const { showApiError, showNetworkError } = useError();

  const { execute, isRetrying, retryCount, lastError, reset } = useRetry(
    operation,
    {
      maxRetries: enableRetry ? maxRetries : 0,
      enabled: enableRetry && isOnline,
      onRetry: (attempt) => {
        console.log(`Retrying operation (attempt ${attempt}/${maxRetries})`);
      },
      onSuccess: (result) => {
        if (trackAnalytics && lastError) {
          trackError(new Error('Operation succeeded after retry'), {
            category: 'recovery_success',
            severity: 'info',
            metadata: { retryCount, originalError: lastError.message }
          });
        }
        onSuccess?.(result);
      },
      onError: (error) => {
        if (trackAnalytics) {
          trackError(error, {
            category,
            severity: 'error',
            metadata: { retryCount, maxRetries, isOnline }
          });
        }

        // Show appropriate error message
        if (!isOnline) {
          showNetworkError(true);
        } else {
          showApiError(error.message, {
            severity: 'critical',
            retryable: enableRetry && retryCount < maxRetries
          });
        }

        onError?.(error);
      }
    }
  );

  const executeOperation = useCallback(async (): Promise<T | null> => {
    if (!isOnline && !options.onOffline) {
      showNetworkError(true);
      return null;
    }

    return await execute();
  }, [execute, isOnline, showNetworkError, options.onOffline]);

  return {
    execute: executeOperation,
    isLoading: isRetrying,
    error: lastError,
    retryCount,
    isOnline,
    reset
  };
}

// Hook for form error handling with recovery
export function useFormErrorHandler() {
  const { showFormError } = useError();
  const { trackError } = useErrorAnalytics();

  const handleFieldError = useCallback((
    field: string,
    error: string | Error,
    metadata?: Record<string, any>
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    showFormError(field, errorMessage, {
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    });

    if (error instanceof Error) {
      trackError(error, {
        category: 'form_validation',
        severity: 'warning',
        metadata: { field, ...metadata }
      });
    }
  }, [showFormError, trackError]);

  const handleSubmissionError = useCallback((
    error: Error,
    formData?: Record<string, any>
  ) => {
    trackError(error, {
      category: 'form_submission',
      severity: 'error',
      metadata: {
        formFields: formData ? Object.keys(formData) : [],
        timestamp: Date.now()
      }
    });

    showFormError('', error.message, {
      severity: 'critical',
      metadata: { type: 'submission_error' }
    });
  }, [trackError, showFormError]);

  return {
    handleFieldError,
    handleSubmissionError
  };
}

// Hook for file upload error handling
export function useUploadErrorHandler() {
  const { showUploadError } = useError();
  const { trackError } = useErrorAnalytics();

  const handleUploadError = useCallback((
    fileName: string,
    error: Error | string,
    fileInfo?: {
      size?: number;
      type?: string;
      maxSize?: number;
      allowedTypes?: string[];
    }
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    showUploadError(fileName, errorMessage, {
      ...fileInfo,
      metadata: {
        timestamp: Date.now(),
        ...fileInfo
      }
    });

    if (error instanceof Error) {
      trackError(error, {
        category: 'file_upload',
        severity: 'warning',
        metadata: {
          fileName,
          ...fileInfo
        }
      });
    }
  }, [showUploadError, trackError]);

  return {
    handleUploadError
  };
}
