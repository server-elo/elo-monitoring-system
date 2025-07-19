'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Send } from 'lucide-react';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level: 'page' | 'feature' | 'component';
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
  isolateError?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error details
    console.error(`Error Boundary (${this.props.level}):`, error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service
    this.reportError(error, errorInfo);

    // Auto-retry for transient errors (component level only)
    if (this.props.level === 'component' && this.props.enableRetry && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level,
      name: this.props.name,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Additional context for better debugging
      retryCount: this.state.retryCount,
      props: process.env.NODE_ENV === 'development' ? this.props : undefined,
      buildInfo: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV,
        timestamp: process.env.BUILD_TIMESTAMP || 'unknown'
      }
    };

    // Report to structured logger
    if (typeof window !== 'undefined') {
      try {
        // Send to monitoring service (Sentry integration ready)
        if (process.env.NODE_ENV === 'production' && window.Sentry) {
          window.Sentry.withScope((scope) => {
            scope.setTag('errorBoundary.level', this.props.level);
            scope.setTag('errorBoundary.name', this.props.name || 'unknown');
            scope.setTag('errorBoundary.retryCount', this.state.retryCount);
            scope.setContext('errorBoundary', {
              errorId: this.state.errorId,
              componentStack: errorInfo.componentStack,
              level: this.props.level,
              name: this.props.name
            });
            window.Sentry?.captureException(error);
          });
        }

        // Send to analytics/logging service
        if (window.gtag) {
          window.gtag('event', 'error_boundary_triggered', {
            error_boundary_level: this.props.level,
            error_boundary_name: this.props.name || 'unknown',
            error_message: error.message,
            custom_parameter_error_id: this.state.errorId
          });
        }

        // Development logging
        if (process.env.NODE_ENV === 'development') {
          console.group(`🚨 Error Boundary (${this.props.level}): ${this.props.name || 'unnamed'}`);
          console.error('Error:', error);
          console.error('Error Info:', errorInfo);
          console.error('Full Report:', errorReport);
          console.groupEnd();
        }
      } catch (reportingError) {
        // Fallback if error reporting fails
        console.error('Error reporting failed:', reportingError);
        console.error('Original error:', error);
      }
    }
  };

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000);
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    
    this.handleRetry();
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      level: this.props.level,
      name: this.props.name,
      timestamp: new Date().toISOString()
    };

    // Open bug report form or email
    const subject = encodeURIComponent(`Bug Report: ${this.props.level} Error - ${errorId}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(bugReport, null, 2)}

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:


Additional context:

    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI = () => {
    const { level } = this.props;

    switch (level) {
      case 'page':
        return this.renderPageError();
      case 'feature':
        return this.renderFeatureError();
      case 'component':
        return this.renderComponentError();
      default:
        return this.renderGenericError();
    }
  };

  private renderPageError = () => {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-300 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </p>

            <div className="space-y-3">
              <EnhancedButton
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                touchTarget
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </EnhancedButton>
              
              <EnhancedButton
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                touchTarget
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </EnhancedButton>
              
              <EnhancedButton
                onClick={this.handleReportBug}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                touchTarget
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Bug
              </EnhancedButton>
            </div>

            {this.props.showErrorDetails && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer">
                  Error Details (ID: {this.state.errorId})
                </summary>
                <pre className="mt-2 p-3 bg-black/20 rounded text-xs text-gray-300 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </Card>
        </motion.div>
      </div>
    );
  };

  private renderFeatureError = () => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                {this.props.name || 'Feature'} Unavailable
              </h3>
              
              <p className="text-red-700 dark:text-red-300 mb-4">
                This feature is temporarily unavailable due to an unexpected error. 
                You can continue using other parts of the application.
              </p>

              <div className="flex flex-wrap gap-2">
                {this.props.enableRetry && this.state.retryCount < (this.props.maxRetries || 3) && (
                  <EnhancedButton
                    onClick={this.handleManualRetry}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    touchTarget
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </EnhancedButton>
                )}
                
                <EnhancedButton
                  onClick={this.handleReportBug}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                  touchTarget
                >
                  <Send className="w-3 h-3 mr-1" />
                  Report Issue
                </EnhancedButton>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  private renderComponentError = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-800 dark:text-red-200">
              Component error
            </span>
          </div>
          
          {this.props.enableRetry && this.state.retryCount < (this.props.maxRetries || 3) && (
            <EnhancedButton
              onClick={this.handleManualRetry}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="w-3 h-3" />
            </EnhancedButton>
          )}
        </div>
      </motion.div>
    );
  };

  private renderGenericError = () => {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200">
            An error occurred in this component
          </span>
        </div>
      </div>
    );
  };
}

// Convenience wrapper components
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="page" {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function FeatureErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="feature" enableRetry maxRetries={2} {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="component" enableRetry maxRetries={3} {...props}>
      {children}
    </ErrorBoundary>
  );
}
