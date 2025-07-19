'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { errorTracker } from '@/lib/monitoring/error-tracking';
;

// Async Error Boundary for handling async operation errors
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  showNetworkStatus?: boolean;
  operationType?: 'api' | 'upload' | 'download' | 'processing' | 'authentication';
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: number;
  isOnline: boolean;
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  componentDidMount() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
    // Auto-retry if we were offline and have an error
    if (this.state.hasError && !this.state.isRetrying) {
      this.handleRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Track error with monitoring system
    errorTracker.captureError(error, {
      component: 'AsyncErrorBoundary',
      action: 'async_operation_error',
      metadata: {
        errorId: this.state.errorId,
        operationType: this.props.operationType || 'unknown',
        retryCount: this.state.retryCount,
        isOnline: this.state.isOnline,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = async () => {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = this.props;
    const { retryCount } = this.state;
    
    if (retryCount >= maxRetries || this.state.isRetrying) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: retryCount + 1,
      lastRetryTime: Date.now()
    });

    // Exponential backoff with jitter
    const delay = retryDelay * Math.pow(2, retryCount) + Math.random() * 1000;
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (onRetry) {
        await onRetry();
      }
      
      // Reset error state to retry rendering
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
      
      // Track retry failure
      errorTracker.captureError(retryError as Error, {
        component: 'AsyncErrorBoundary',
        action: 'retry_failed',
        metadata: {
          originalErrorId: this.state.errorId,
          retryAttempt: retryCount + 1,
          operationType: this.props.operationType
        }
      });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: 0
    });
  };

  private getErrorMessage = () => {
    const { operationType } = this.props;
    const { error, isOnline } = this.state;
    
    if (!isOnline) {
      return {
        title: 'Connection Lost',
        description: 'Please check your internet connection and try again.',
        icon: WifiOff,
        color: 'text-orange-500'
      };
    }
    
    switch (operationType) {
      case 'api':
        return {
          title: 'API Request Failed',
          description: 'Unable to connect to our servers. This might be a temporary issue.',
          icon: Wifi,
          color: 'text-red-500'
        };
      case 'upload':
        return {
          title: 'Upload Failed',
          description: 'Your file upload was interrupted. Please try uploading again.',
          icon: AlertTriangle,
          color: 'text-red-500'
        };
      case 'download':
        return {
          title: 'Download Failed',
          description: 'Unable to download the requested file. Please try again.',
          icon: AlertTriangle,
          color: 'text-red-500'
        };
      case 'processing':
        return {
          title: 'Processing Error',
          description: 'An error occurred while processing your request.',
          icon: AlertTriangle,
          color: 'text-red-500'
        };
      case 'authentication':
        return {
          title: 'Authentication Error',
          description: 'Unable to verify your credentials. Please try logging in again.',
          icon: AlertTriangle,
          color: 'text-red-500'
        };
      default:
        return {
          title: 'Operation Failed',
          description: error?.message || 'An unexpected error occurred during the operation.',
          icon: AlertTriangle,
          color: 'text-red-500'
        };
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { maxRetries = 3 } = this.props;
      const { retryCount, isRetrying, isOnline } = this.state;
      const errorMessage = this.getErrorMessage();
      const Icon = errorMessage.icon;

      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <GlassContainer intensity="medium" className="p-6 text-center max-w-md mx-auto">
              <div className="mb-4">
                <div className={`w-12 h-12 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${errorMessage.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {errorMessage.title}
                </h3>
                <p className="text-gray-300 text-sm">
                  {errorMessage.description}
                </p>
                
                {!isOnline && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-orange-400 text-sm">
                    <WifiOff className="w-4 h-4" />
                    <span>You're currently offline</span>
                  </div>
                )}
                
                {retryCount > 0 && (
                  <div className="mt-3 text-sm text-yellow-400">
                    Attempt {retryCount} of {maxRetries}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                {retryCount < maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    disabled={isRetrying || (!isOnline && this.props.operationType !== 'processing')}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
                  </button>
                )}
                
                {retryCount >= maxRetries && (
                  <button
                    onClick={this.handleReset}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              
              {isRetrying && (
                <div className="mt-4 text-xs text-gray-400 flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Please wait...</span>
                </div>
              )}
            </GlassContainer>
          </motion.div>
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components for specific use cases
export function ApiErrorBoundary({ children, onRetry }: { children: ReactNode; onRetry?: () => Promise<void> }) {
  return (
    <AsyncErrorBoundary operationType="api" onRetry={onRetry} maxRetries={3}>
      {children}
    </AsyncErrorBoundary>
  );
}

export function UploadErrorBoundary({ children, onRetry }: { children: ReactNode; onRetry?: () => Promise<void> }) {
  return (
    <AsyncErrorBoundary operationType="upload" onRetry={onRetry} maxRetries={2}>
      {children}
    </AsyncErrorBoundary>
  );
}

export function AuthErrorBoundary({ children, onRetry }: { children: ReactNode; onRetry?: () => Promise<void> }) {
  return (
    <AsyncErrorBoundary operationType="authentication" onRetry={onRetry} maxRetries={1}>
      {children}
    </AsyncErrorBoundary>
  );
}
