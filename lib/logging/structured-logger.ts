/**
 * 12-Factor App Compliant Structured Logging
 * Treats logs as event streams and provides structured output
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class StructuredLogger {
  private isDevelopment: boolean;
  private isPerformanceEnabled: boolean;

  constructor() {
    this.isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    this.isPerformanceEnabled = true; // Always enable performance monitoring
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Human-readable format for development
      const contextStr = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
      const errorStr = entry.error ? ` ERROR: ${entry.error.message}` : '';
      
      // Use console.log for logger output (allowed for structured logging implementation)
      console.log(
        `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`
      );
      
      if (entry.error?.stack) {
        console.log(entry.error.stack);
      }
    } else {
      // JSON format for production (log aggregation)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.output(this.createEntry('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    this.output(this.createEntry('info', message, context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.output(this.createEntry('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.output(this.createEntry('error', message, context, error));
  }

  performance(name: string, duration: number, context?: LogContext): void {
    if (this.isPerformanceEnabled) {
      this.info(`Performance: ${name}`, {
        ...context,
        action: 'performance',
        duration,
      });
    }
  }
}

// Export singleton instance
export const logger = new StructuredLogger();

export default logger;