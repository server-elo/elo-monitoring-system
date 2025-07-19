import { useState, useEffect, useCallback, useRef } from 'react';
import { RetryManager, OfflineManager, ErrorAnalyticsManager, UserErrorReporter } from '@/lib/errors/recovery';
import { useError } from '@/lib/errors/ErrorContext';

// Hook for retry functionality with exponential backoff
export function useRetry<T>(
  operation: (_) => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    enabled?: boolean;
    onRetry?: (_attempt: number) => void;
    onSuccess?: (_result: T) => void;
    onError?: (_error: Error) => void;
  } = {}
) {
  const [isRetrying, setIsRetrying] = useState(_false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(_null);
  const { reportError } = useError(_);

  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    enabled = true,
    onRetry,
    onSuccess,
    onError
  } = options;

  const executeWithRetry = useCallback( async (): Promise<T | null> => {
    if (!enabled) {
      try {
        const result = await operation(_);
        onSuccess?.(_result);
        return result;
      } catch (_error) {
        const err = error as Error;
        setLastError(_err);
        onError?.(_err);
        reportError(_err);
        return null;
      }
    }

    setIsRetrying(_true);
    setLastError(_null);

    try {
      const result = await RetryManager.executeWithRetry(operation, {
        maxRetries,
        baseDelay,
        maxDelay,
        onRetry: ( _error, attempt) => {
          setRetryCount(_attempt);
          onRetry?.(_attempt);
        },
        onMaxRetriesReached: (_error) => {
          setLastError(_error);
          onError?.(_error);
          reportError(error, { 
            category: 'retry_exhausted',
            metadata: { maxRetries, retryCount: maxRetries }
          });
        }
      });

      setRetryCount(0);
      onSuccess?.(_result);
      return result;
    } catch (_error) {
      const err = error as Error;
      setLastError(_err);
      onError?.(_err);
      return null;
    } finally {
      setIsRetrying(_false);
    }
  }, [operation, enabled, maxRetries, baseDelay, maxDelay, onRetry, onSuccess, onError, reportError]);

  const reset = useCallback(() => {
    setIsRetrying(_false);
    setRetryCount(0);
    setLastError(_null);
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
  onOnline?: (_) => void;
  onOffline?: (_) => void;
  checkInterval?: number;
} = {}) {
  const [isOnline, setIsOnline] = useState(_true);
  const [lastChecked, setLastChecked] = useState<Date | null>(_null);
  const offlineManagerRef = useRef<OfflineManager | null>(_null);

  useEffect(() => {
    offlineManagerRef.current = OfflineManager.getInstance({
      checkInterval: options.checkInterval,
      onOnline: (_) => {
        setIsOnline(_true);
        setLastChecked(new Date());
        options.onOnline?.(_);
      },
      onOffline: (_) => {
        setIsOnline(_false);
        setLastChecked(new Date());
        options.onOffline?.(_);
      }
    });

    const unsubscribe = offlineManagerRef.current.addListener((online) => {
      setIsOnline(_online);
      setLastChecked(new Date());
    });

    // Initial status
    setIsOnline(_offlineManagerRef.current.getStatus());

    return (_) => {
      unsubscribe(_);
    };
  }, [options.checkInterval, options.onOnline, options.onOffline]);

  const forceCheck = useCallback( async () => {
    if (_offlineManagerRef.current) {
      const status = await offlineManagerRef.current.forceCheck(_);
      setIsOnline(_status);
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
  const analyticsRef = useRef<ErrorAnalyticsManager | null>(_null);

  useEffect(() => {
    analyticsRef.current = ErrorAnalyticsManager.getInstance(_);
  }, []);

  const trackError = useCallback((error: Error, context?: {
    category?: string;
    severity?: 'critical' | 'error' | 'warning' | 'info';
    metadata?: Record<string, any>;
  }) => {
    analyticsRef.current?.trackError( error, context);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analyticsRef.current?.setUserId(_userId);
  }, []);

  const getStats = useCallback(() => {
    return analyticsRef.current?.getErrorStats(_) || {
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
  const [isSubmitting, setIsSubmitting] = useState(_false);
  const [submitError, setSubmitError] = useState<string | null>(_null);
  const [submitSuccess, setSubmitSuccess] = useState(_false);

  const submitBugReport = useCallback(async (
    error: Error,
    userDescription: string,
    userEmail?: string
  ) => {
    setIsSubmitting(_true);
    setSubmitError(_null);
    setSubmitSuccess(_false);

    try {
      await UserErrorReporter.submitBugReport( error, userDescription, userEmail);
      setSubmitSuccess(_true);
    } catch (_err) {
      setSubmitError(_err instanceof Error ? err.message : 'Failed to submit bug report');
    } finally {
      setIsSubmitting(_false);
    }
  }, []);

  const generateReport = useCallback( (error: Error, userDescription?: string) => {
    return UserErrorReporter.generateBugReport( error, userDescription);
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(_false);
    setSubmitError(_null);
    setSubmitSuccess(_false);
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
  operation: (_) => Promise<T>,
  options: {
    enableRetry?: boolean;
    maxRetries?: number;
    trackAnalytics?: boolean;
    category?: string;
    onError?: (_error: Error) => void;
    onSuccess?: (_result: T) => void;
    onOffline?: (_) => void;
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

  const { trackError } = useErrorAnalytics(_);
  const { showApiError, showNetworkError } = useError(_);

  const { execute, isRetrying, retryCount, lastError, reset } = useRetry(
    operation,
    {
      maxRetries: enableRetry ? maxRetries : 0,
      enabled: enableRetry && isOnline,
      onRetry: (_attempt) => {
        console.log(_`Retrying operation (attempt ${attempt}/${maxRetries})`);
      },
      onSuccess: (_result) => {
        if (trackAnalytics && lastError) {
          trackError(_new Error('Operation succeeded after retry'), {
            category: 'recovery_success',
            severity: 'info',
            metadata: { retryCount, originalError: lastError.message }
          });
        }
        onSuccess?.(_result);
      },
      onError: (_error) => {
        if (trackAnalytics) {
          trackError(error, {
            category,
            severity: 'error',
            metadata: { retryCount, maxRetries, isOnline }
          });
        }

        // Show appropriate error message
        if (!isOnline) {
          showNetworkError(_true);
        } else {
          showApiError(error.message, {
            severity: 'critical',
            retryable: enableRetry && retryCount < maxRetries
          });
        }

        onError?.(_error);
      }
    }
  );

  const executeOperation = useCallback( async (): Promise<T | null> => {
    if (!isOnline && !options.onOffline) {
      showNetworkError(_true);
      return null;
    }

    return await execute(_);
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
  const { showFormError } = useError(_);
  const { trackError } = useErrorAnalytics(_);

  const handleFieldError = useCallback((
    field: string,
    error: string | Error,
    metadata?: Record<string, any>
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    showFormError(field, errorMessage, {
      metadata: {
        ...metadata,
        timestamp: Date.now(_)
      }
    });

    if (_error instanceof Error) {
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
        formFields: formData ? Object.keys(_formData) : [],
        timestamp: Date.now(_)
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
  const { showUploadError } = useError(_);
  const { trackError } = useErrorAnalytics(_);

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
        timestamp: Date.now(_),
        ...fileInfo
      }
    });

    if (_error instanceof Error) {
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
