/**
 * Client-safe logging system
 * 
 * This logger is designed for use in browser environments and has no server dependencies.
 * It provides basic logging functionality without server-specific features.
 * 
 * @module lib/monitoring/client-logger
 */

'use client';

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  componentStack?: string;
  errorInfo?: any;
  count?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  /**
   * Format log message for console output
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase();
    
    if (this.isDevelopment && context && Object.keys(context).length > 0) {
      return `[${timestamp}] [${levelStr}] ${message}`;
    }
    
    return `[${levelStr}] ${message}`;
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context), context);
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = { ...context, error };
    console.error(this.formatMessage('error', message, errorContext), error, context);
    
    // Send to client-side error tracking if configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error || new Error(message), {
        extra: errorContext
      });
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context), context);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context), context);
    }
  }

  /**
   * Log authentication event (client-safe version)
   */
  logAuth(
    event: 'login' | 'logout' | 'register' | 'password_reset' | 'oauth_callback',
    success: boolean,
    context?: LogContext
  ): void {
    const level = success ? 'info' : 'warn';
    const message = `Authentication: ${event} - ${success ? 'success' : 'failed'}`;
    
    if (level === 'info') {
      this.info(message, { ...context, event, success });
    } else {
      this.warn(message, { ...context, event, success });
    }
  }

  /**
   * Log performance metrics (client-safe version)
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    if (duration > 5000) { // Slow operation
      this.warn(`Slow operation detected: ${operation}`, { operation, duration, metadata });
    } else if (this.isDevelopment) {
      this.debug(`Performance: ${operation}`, { operation, duration, metadata });
    }
  }

  /**
   * Log learning analytics event (client-safe version)
   */
  logLearning(
    type: 'lesson_start' | 'lesson_complete' | 'code_submit' | 'achievement_unlock' | 'collaboration_join',
    userId: string,
    metadata?: Record<string, any>
  ): void {
    this.info(`Learning event: ${type}`, { type, userId, ...metadata });
    
    // Send to analytics if available
    if (typeof window !== 'undefined') {
      // Google Analytics
      const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if ((window as any).gtag && gaId) {
        (window as any).gtag('event', type, {
          user_id: userId,
          ...metadata
        });
      }
      
      // PostHog
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if ((window as any).posthog && posthogKey) {
        (window as any).posthog.capture(type, { userId, ...metadata });
      }
    }
  }

  /**
   * Get logger statistics (client-safe version)
   */
  getStats(): {
    isDevelopment: boolean;
    hasErrorTracking: boolean;
    hasAnalytics: boolean;
  } {
    return {
      isDevelopment: this.isDevelopment,
      hasErrorTracking: typeof window !== 'undefined' && !!(window as any).Sentry,
      hasAnalytics: typeof window !== 'undefined' && (!!(window as any).gtag || !!(window as any).posthog)
    };
  }
}

// Create singleton instance
export const logger = new ClientLogger();

// Export types
export type { LogContext, LogLevel };