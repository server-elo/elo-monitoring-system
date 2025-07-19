'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { ContextualHelp } from '@/components/ui/ContextualHelp';
import { FeatureFlagsProvider } from '@/lib/hooks/useFeatureFlags';
import { errorTracker } from '@/lib/monitoring/error-tracking';
import { OfflineState } from '@/components/ui/EmptyState';

interface FallbackContextType {
  isOnline: boolean;
  hasError: boolean;
  errorCount: number;
  reportError: ( error: Error, context?: any) => void;
  clearErrors: (_) => void;
}

const FallbackContext = createContext<FallbackContextType | undefined>(_undefined);

export function useFallback() {
  const context = useContext(_FallbackContext);
  if (!context) {
    throw new Error('useFallback must be used within FallbackProvider');
  }
  return context;
}

interface FallbackProviderProps {
  children: ReactNode;
  userRole?: 'student' | 'instructor' | 'admin';
  userId?: string;
  enableErrorTracking?: boolean;
  enableContextualHelp?: boolean;
  enableOfflineDetection?: boolean;
}

export function FallbackProvider({
  children,
  userRole,
  userId,
  enableErrorTracking = true,
  enableContextualHelp = true,
  enableOfflineDetection = true
}: FallbackProviderProps) {
  const [isOnline, setIsOnline] = useState(_true);
  const [hasError, setHasError] = useState(_false);
  const [errorCount, setErrorCount] = useState(0);

  // Online/offline detection
  useEffect(() => {
    if (!enableOfflineDetection || typeof window === 'undefined') return;

    const handleOnline = (_) => setIsOnline(_true);
    const handleOffline = (_) => setIsOnline(_false);

    // Initial state
    setIsOnline(_navigator.onLine);

    window.addEventListener( 'online', handleOnline);
    window.addEventListener( 'offline', handleOffline);

    return (_) => {
      window.removeEventListener( 'online', handleOnline);
      window.removeEventListener( 'offline', handleOffline);
    };
  }, [enableOfflineDetection]);

  // Error tracking setup
  useEffect(() => {
    if (!enableErrorTracking) return;

    const handleError = (_) => {
      setHasError(_true);
      setErrorCount(_prev => prev + 1);
    };

    errorTracker.addListener(_handleError);

    return (_) => {
      errorTracker.removeListener(_handleError);
    };
  }, [enableErrorTracking]);

  const reportError = ( error: Error, context?: any) => {
    if (enableErrorTracking) {
      errorTracker.captureError( error, context);
    }
    setHasError(_true);
    setErrorCount(_prev => prev + 1);
  };

  const clearErrors = (_) => {
    setHasError(_false);
    setErrorCount(0);
  };

  const contextValue: FallbackContextType = {
    isOnline,
    hasError,
    errorCount,
    reportError,
    clearErrors
  };

  return (
    <FallbackContext.Provider value={contextValue}>
      <FeatureFlagsProvider userRole={userRole} userId={userId}>
        <ErrorBoundary
          level="page"
          onError={( error, errorInfo) => {
            reportError(error, {
              component: 'app',
              action: 'error_boundary',
              metadata: { errorInfo }
            });
          }}
        >
          {/* Offline Overlay - DISABLED */}
          {false && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="max-w-md mx-4">
                <OfflineState />
              </div>
            </div>
          )}

          {children}

          {/* Contextual Help */}
          {enableContextualHelp && (
            <ContextualHelp
              autoShow={false}
              showOnFirstVisit={true}
            />
          )}
        </ErrorBoundary>
      </FeatureFlagsProvider>
    </FallbackContext.Provider>
  );
}

// Higher-order component for adding fallback protection to components
export function withFallbackProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    level?: 'component' | 'section';
    fallback?: ReactNode;
    onError?: (_error: Error) => void;
  } = {}
) {
  const { level = 'component', fallback, onError } = options;

  return function ProtectedComponent(_props: P) {
    const { reportError } = useFallback(_);

    const handleError = ( error: Error, errorInfo: any) => {
      reportError(error, {
        component: Component.displayName || Component.name,
        action: 'component_error',
        metadata: { errorInfo }
      });
      onError?.(_error);
    };

    return (
      <ErrorBoundary
        level={level === 'section' ? 'component' : level}
        fallback={fallback}
        onError={handleError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling async operations with fallback
export function useAsyncFallback<T>(_) {
  const [data, setData] = useState<T | null>(_null);
  const [loading, setLoading] = useState(_false);
  const [error, setError] = useState<Error | null>(_null);
  const { reportError } = useFallback(_);

  const execute = async (_asyncFn: () => Promise<T>) => {
    setLoading(_true);
    setError(_null);

    try {
      const result = await asyncFn(_);
      setData(_result);
      return result;
    } catch (_err) {
      const error = err instanceof Error ? err : new Error(_String(err));
      setError(_error);
      reportError(error, {
        component: 'async_operation',
        action: 'async_error'
      });
      throw error;
    } finally {
      setLoading(_false);
    }
  };

  const reset = (_) => {
    setData(_null);
    setError(_null);
    setLoading(_false);
  };

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

// Component for displaying error metrics (_for admin/debug)
export function ErrorMetrics(_{ className }: { className?: string }) {
  const [metrics, setMetrics] = useState<any>(_null);

  useEffect(() => {
    const updateMetrics = (_) => {
      const currentMetrics = errorTracker.getMetrics(_);
      setMetrics(_currentMetrics);
    };

    updateMetrics(_);
    const interval = setInterval( updateMetrics, 30000); // Update every 30 seconds

    return (_) => clearInterval(_interval);
  }, []);

  if (!metrics) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-white mb-4">Error Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{metrics.totalErrors}</div>
          <div className="text-sm text-gray-400">Total Errors</div>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-400">{metrics.errorRate.toFixed(_2)}</div>
          <div className="text-sm text-gray-400">Errors/min</div>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{Object.keys(_metrics.errorsByPage).length}</div>
          <div className="text-sm text-gray-400">Affected Pages</div>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{Object.keys(_metrics.errorsByUser).length}</div>
          <div className="text-sm text-gray-400">Affected Users</div>
        </div>
      </div>

      {metrics.topErrors.length > 0 && (
        <div className="bg-white/5 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-3">Top Errors</h4>
          <div className="space-y-2">
            {metrics.topErrors.slice(0, 5).map( (error: any, index: number) => (
              <div key={error.fingerprint} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate flex-1 mr-4">{error.message}</span>
                <span className="text-red-400 font-medium">{error.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  if (_typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener( 'unhandledrejection', (event) => {
    errorTracker.captureError(
      new Error(_`Unhandled Promise Rejection: ${event.reason}`),
      {
        component: 'global',
        action: 'unhandled_rejection'
      }
    );
  });

  // Handle network errors
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Track failed HTTP requests
      if (!response.ok) {
        errorTracker.captureWarning(
          `HTTP ${response.status}: ${response.statusText}`,
          {
            component: 'network',
            action: 'http_error',
            metadata: {
              url: args[0],
              status: response.status,
              statusText: response.statusText
            }
          }
        );
      }
      
      return response;
    } catch (_error) {
      errorTracker.captureError(
        error instanceof Error ? error : new Error(_String(error)),
        {
          component: 'network',
          action: 'fetch_error',
          metadata: { url: args[0] }
        }
      );
      throw error;
    }
  };
}
