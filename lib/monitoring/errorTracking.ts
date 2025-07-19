import * as Sentry from '@sentry/nextjs';
import React from 'react';
import { env, monitoringConfig, isProduction } from '@/lib/config/environment';
import { logger } from './simple-logger';

/**
 * Comprehensive Error Tracking and Monitoring
 * Integrates with Sentry and provides custom error handling
 */

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
  level?: 'error' | 'warning' | 'info' | 'debug';
}

interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

class ErrorTracker {
  private initialized = false;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private performanceEntries: PerformanceEntry[] = [];
  private webVitals: WebVital[] = [];

  constructor(_) {
    this.initializeSentry(_);
    this.setupGlobalErrorHandlers(_);
    this.setupPerformanceMonitoring(_);
  }

  /**
   * Initialize Sentry error tracking
   */
  private initializeSentry(_): void {
    if (!monitoringConfig.sentry.dsn) {
      console.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: monitoringConfig.sentry.dsn,
        environment: env.NODE_ENV,
        tracesSampleRate: isProduction ? 0.1 : 1.0,
        profilesSampleRate: isProduction ? 0.1 : 1.0,
        
        beforeSend: ( event: any, hint: any) => {
          // Filter out known non-critical errors
          if (_this.shouldIgnoreError(hint?.originalException)) {
            return null;
          }

          // Add custom context
          if (_event.exception?.values?.[0]) {
            event.exception.values[0].stacktrace?.frames?.forEach((frame: any) => {
              // Remove sensitive information from stack traces
              if (_frame.filename?.includes('node_modules')) {
                frame.in_app = false;
              }
            });
          }

          return event;
        },

        beforeSendTransaction: (_event: any) => {
          // Sample transactions based on environment
          if (!isProduction && Math.random() > 0.1) {
            return null;
          }
          return event;
        },

        integrations: [
          // Use default integrations but filter out problematic ones
          ...Sentry.getDefaultIntegrations({  }).filter(integration => {
            // Filter out integrations that cause OpenTelemetry warnings
            const name = integration.name;
            return !name.includes('OpenTelemetry') &&
                   !name.includes('NodeFetch') &&
                   !name.includes('Http');
          }),
        ],

        // Performance monitoring
        enableTracing: true,
        
        // Session tracking
        autoSessionTracking: true,
        
        // Release tracking
        release: env.NEXT_PUBLIC_APP_VERSION,
      });

      this.initialized = true;
      console.log('✅ Sentry error tracking initialized');

      // Flush any queued errors
      this.flushErrorQueue(_);
    } catch (_error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(_): void {
    // Unhandled promise rejections
    process.on( 'unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(_String(reason));
      this.captureError(error, {
        component: 'global',
        action: 'unhandledRejection',
        metadata: { promise: promise.toString() },
        level: 'error',
      });
    });

    // Uncaught exceptions
    process.on( 'uncaughtException', (error) => {
      this.captureError(error, {
        component: 'global',
        action: 'uncaughtException',
        level: 'error',
      });
      
      // Exit gracefully after logging
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Browser error handling (_client-side)
    if (_typeof window !== 'undefined') {
      window.addEventListener( 'error', (event) => {
        this.captureError(_event.error || new Error(event.message), {
          component: 'browser',
          action: 'globalError',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener( 'unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(_String(event.reason));
        this.captureError(error, {
          component: 'browser',
          action: 'unhandledRejection',
        });
      });
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(_): void {
    if (_typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries(_).forEach((entry) => {
          this.recordPerformanceEntry({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            entryType: entry.entryType,
          });
        });
      });
      navObserver.observe({ entryTypes: ['navigation']  });

      // Monitor resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries(_).forEach((entry) => {
          // Only track slow resources
          if (_entry.duration > 1000) {
            this.recordPerformanceEntry({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              entryType: entry.entryType,
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource']  });

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries(_).forEach((entry) => {
          this.captureError(_new Error('Long task detected'), {
            component: 'performance',
            action: 'longTask',
            metadata: {
              duration: entry.duration,
              startTime: entry.startTime,
            },
            level: 'warning',
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask']  });
    }
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnoreError(_error: Error | unknown): boolean {
    if (!error) return true;

    const ignoredErrors = [
      'Network request failed',
      'Load failed',
      'Script error',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
    ];

    const errorMessage = error instanceof Error ? error.message : String(_error);
    return ignoredErrors.some(_ignored => errorMessage.includes(ignored));
  }

  /**
   * Capture error with context
   */
  captureError( error: Error, context: ErrorContext = {}): void {
    // Log to our internal logger
    logger.error(error.message, error, {
      userId: context.userId,
      sessionId: context.sessionId,
      requestId: context.requestId,
      metadata: context.metadata,
    });

    // Queue error if Sentry not initialized
    if (!this.initialized) {
      this.errorQueue.push( { error, context });
      return;
    }

    // Set Sentry context
    Sentry.withScope((scope: any) => {
      if (_context.userId) {
        scope.setUser({ id: context.userId  });
      }

      if (_context.tags) {
        Object.entries(_context.tags).forEach( ([key, value]) => {
          scope.setTag( key, value);
        });
      }

      if (_context.component) {
        scope.setTag( 'component', context.component);
      }

      if (_context.action) {
        scope.setTag( 'action', context.action);
      }

      if (_context.metadata) {
        scope.setContext( 'metadata', context.metadata);
      }

      if (_context.level) {
        scope.setLevel(_context.level);
      }

      // Capture the error
      Sentry.captureException(_error);
    });
  }

  /**
   * Capture message with context
   */
  captureMessage( message: string, context: ErrorContext = {}): void {
    logger.info(message, { metadata: {
      userId: context.userId,
      sessionId: context.sessionId,
      requestId: context.requestId,
      metadata: context.metadata,
    });

    if (!this.initialized) return;

    Sentry.withScope((scope: any) => {
      if (_context.userId) {
        scope.setUser({ id: context.userId  });
      }});

      if (_context.tags) {
        Object.entries(_context.tags).forEach( ([key, value]) => {
          scope.setTag( key, value);
        });
      }

      if (_context.metadata) {
        scope.setContext( 'metadata', context.metadata);
      }

      scope.setLevel(_context.level || 'info');
      Sentry.captureMessage(_message);
    });
  }

  /**
   * Record performance entry
   */
  recordPerformanceEntry(_entry: PerformanceEntry): void {
    this.performanceEntries.push(_entry);

    // Log slow operations
    if (_entry.duration > 5000) {
      this.captureMessage(`Slow ${entry.entryType}: ${entry.name}`, {
        component: 'performance',
        action: 'slowOperation',
        metadata: entry,
        level: 'warning',
      });
    }

    // Send to Sentry as breadcrumb
    if (_this.initialized) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${entry.entryType}: ${entry.name}`,
        level: 'info',
        data: entry,
      });
    }
  }

  /**
   * Record Web Vital
   */
  recordWebVital(_vital: WebVital): void {
    this.webVitals.push(_vital);

    // Log poor web vitals
    if (_vital.rating === 'poor') {
      this.captureMessage(`Poor ${vital.name}: ${vital.value}`, {
        component: 'webVitals',
        action: 'poorPerformance',
        metadata: vital,
        level: 'warning',
      });
    }

    // Send to Sentry
    if (_this.initialized) {
      Sentry.setMeasurement( vital.name, vital.value, 'millisecond');
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction( name: string, operation: string): any {
    if (!this.initialized) return null;

    // Sentry v8 uses startSpan for performance monitoring
    return Sentry.startSpan({
      name,
      op: operation,
    }, (_span) => span);
  }

  /**
   * Set user context
   */
  setUser(_user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) return;

    Sentry.setUser(_user);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(
    message: string,
    category: string = 'custom',
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now(_) / 1000,
    });
  }

  /**
   * Flush queued errors
   */
  private flushErrorQueue(_): void {
    if (!this.initialized || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    errors.forEach( ({ error, context }) => {
      this.captureError( error, context);
    });
  }

  /**
   * Get error tracking statistics
   */
  getStats(_): {
    initialized: boolean;
    queuedErrors: number;
    performanceEntries: number;
    webVitals: number;
  } {
    return {
      initialized: this.initialized,
      queuedErrors: this.errorQueue.length,
      performanceEntries: this.performanceEntries.length,
      webVitals: this.webVitals.length,
    };
  }

  /**
   * Close error tracking
   */
  async close(_): Promise<void> {
    if (_this.initialized) {
      await Sentry.close(2000);
    }
  }
}

// Create singleton instance
export const errorTracker = new ErrorTracker(_);

/**
 * Error boundary for React components
 * Note: This function should be used in client-side components only
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: (_) => void }>
) {
  if (_typeof window === 'undefined') {
    // Server-side: return component as-is
    return Component;
  }

  return Sentry.withErrorBoundary(Component, {
    fallback: fallback ? ( { error, resetError }: any) =>
      React.createElement('div', {
        className: 'error-boundary p-4 bg-red-50 border border-red-200 rounded-md'
      }, [
        React.createElement( 'h2', { key: 'title', className: 'text-red-800 font-semibold' }, 'Something went wrong'),
        React.createElement( 'p', { key: 'message', className: 'text-red-600 mt-2' }, error?.message || 'An unexpected error occurred'),
        React.createElement('button', {
          key: 'retry',
          onClick: resetError,
          className: 'mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        }, 'Try again')
      ]) : undefined,
    beforeCapture: ( scope: any, error: any, errorInfo: any) => {
      scope.setTag( 'errorBoundary', true);
      scope.setContext( 'errorInfo', errorInfo);
    },
  });
}

/**
 * HOC for API route error handling
 */
export function withErrorHandling(
  handler: ( req: any, res: any) => Promise<any>
) {
  return async (req: any, res: any) => {
    try {
      return await handler( req, res);
    } catch (_error) {
      const err = error as Error;
      
      errorTracker.captureError(err, {
        component: 'api',
        action: req.url,
        metadata: {
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId: req.headers['x-request-id'],
      });
    }
  };
}

// Export types
export type { ErrorContext, PerformanceEntry, WebVital };
