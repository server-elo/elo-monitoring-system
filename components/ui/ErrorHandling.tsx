import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
          onRetry={this.handleRetry}
          showDetails={this.props.showDetails}
          details={this.state.errorInfo?.componentStack || undefined}
        />
      );
    }

    return this.props.children;
  }
}

// Error Display Component
interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
  details?: string;
  actions?: React.ReactNode;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  showDetails = false,
  details,
  actions,
}) => {
  const [showFullDetails, setShowFullDetails] = React.useState(false);

  const variantStyles = {
    error: {
      bg: 'bg-brand-error-500/10',
      border: 'border-brand-error-500/20',
      text: 'text-brand-error-300',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-brand-warning-500/10',
      border: 'border-brand-warning-500/20',
      text: 'text-brand-warning-300',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-brand-info-500/10',
      border: 'border-brand-info-500/20',
      text: 'text-brand-info-300',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.div
      className={`rounded-lg border p-4 ${style.bg} ${style.border}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${style.text}`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${style.text}`}>
            {title}
          </h3>
          <p className={`text-sm mt-1 ${style.text} opacity-90`}>
            {message}
          </p>
          
          {showDetails && details && (
            <div className="mt-3">
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className={`text-xs ${style.text} opacity-75 hover:opacity-100 underline`}
              >
                {showFullDetails ? 'Hide' : 'Show'} details
              </button>
              <AnimatePresence>
                {showFullDetails && (
                  <motion.pre
                    className={`text-xs mt-2 p-2 bg-black/20 rounded overflow-auto max-h-32 ${style.text} opacity-75`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {details}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRetry}
                className={`${style.text} hover:bg-white/10`}
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className={`${style.text} hover:bg-white/10`}
              >
                Dismiss
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Inline Error Component
interface InlineErrorProps {
  message: string;
  className?: string;
}

const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => (
  <motion.div
    className={`flex items-center gap-2 text-brand-error-400 text-sm ${className}`}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.2 }}
  >
    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span>{message}</span>
  </motion.div>
);

// Retry Component
interface RetryProps {
  onRetry: () => void;
  isRetrying?: boolean;
  maxRetries?: number;
  currentRetry?: number;
  message?: string;
}

const Retry: React.FC<RetryProps> = ({
  onRetry,
  isRetrying = false,
  maxRetries = 3,
  currentRetry = 0,
  message = 'Something went wrong',
}) => {
  const canRetry = currentRetry < maxRetries;

  return (
    <div className="text-center py-8">
      <div className="text-brand-error-400 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-brand-text-primary font-medium">{message}</p>
        {currentRetry > 0 && (
          <p className="text-brand-text-muted text-sm mt-1">
            Attempt {currentRetry} of {maxRetries}
          </p>
        )}
      </div>
      
      {canRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="default"
          className="mx-auto"
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
      
      {!canRetry && (
        <p className="text-brand-text-muted text-sm">
          Maximum retry attempts reached. Please refresh the page or contact support.
        </p>
      )}
    </div>
  );
};

// Network Error Component
interface NetworkErrorProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, isRetrying = false }) => (
  <ErrorDisplay
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    variant="warning"
    onRetry={onRetry}
    actions={
      isRetrying && (
        <div className="flex items-center gap-2 text-brand-warning-300 text-sm">
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>Reconnecting...</span>
        </div>
      )
    }
  />
);

export {
  ErrorBoundary,
  ErrorDisplay,
  InlineError,
  Retry,
  NetworkError,
};

export default ErrorBoundary;
