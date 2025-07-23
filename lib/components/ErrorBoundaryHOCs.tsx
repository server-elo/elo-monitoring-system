'use client';

import { ReactElement, ReactNode, Component, ErrorInfo } from 'react';
// Create a client-safe logger
const logger = {
  error: (message: string, error?: unknown, meta?: unknown) => {
    console.error(message, { error, meta });
  },
  warn: (message: string, data?: unknown) => {
    console.warn(message, data);
  },
  info: (message: string, data?: unknown) => {
    console.info(message, data);
  },
  debug: (message: string, data?: unknown) => {
    console.debug(message, data);
  }
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundaryHOC extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundaryHOC caught an error', error, {
      component: 'ErrorBoundaryHOC',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactElement
) => {
  const ErrorBoundaryWrapper = (props: P): ReactElement => (
    <ErrorBoundaryHOC fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundaryHOC>
  );

  ErrorBoundaryWrapper.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ErrorBoundaryWrapper;
};

// Additional exports for compatibility
export const withAuthErrorBoundary = withErrorBoundary;

export default ErrorBoundaryHOC;