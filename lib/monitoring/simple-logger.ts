/**
 * Simplified Logging System
 * Lightweight replacement for Winston with essential functionality
 */

import { env, isProduction, isDevelopment } from '@/lib/config/environment';

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  componentStack?: string;
  errorInfo?: any;
  count?: number;
  metadata?: Record<string, any>;
  service?: string;
  operation?: string;
  tokens?: number;
  queryId?: string;
  threshold?: number;
  status?: string;
  measurementId?: string;
  name?: string;
  environment?: string;
  success?: boolean;
  event?: string;
}

interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'csrf_violation' | 'session_hijack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
}

interface LearningEvent {
  type: 'lesson_start' | 'lesson_complete' | 'code_submit' | 'achievement_unlock' | 'collaboration_join';
  userId: string;
  lessonId?: string;
  achievementId?: string;
  sessionId?: string;
  progress?: number;
  score?: number;
  metadata?: Record<string, any>;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class SimpleLogger {
  private logLevel: LogLevel;
  private performanceMetrics: PerformanceMetrics[] = [];
  private securityEvents: SecurityEvent[] = [];
  private learningEvents: LearningEvent[] = [];

  constructor() {
    this.logLevel = (env.LOG_LEVEL as LogLevel) || 'info';
    this.setupPeriodicFlush();
  }

  /**
   * Setup periodic flush of metrics and events
   */
  private setupPeriodicFlush(): void {
    if (typeof window === 'undefined') {
      // Server-side only
      setInterval(() => {
        this.flushMetrics();
        this.flushEvents();
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Format log message
   */
  private formatLog(level: LogLevel, message: string, context: LogContext = {}): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    
    if (isDevelopment) {
      // Pretty format for development
      const contextStr = Object.keys(context).length 
        ? `\n${JSON.stringify(context, null, 2)}` 
        : '';
      return `${timestamp} [${levelStr}] ${message}${contextStr}`;
    } else {
      // JSON format for production
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatLog(level, message, context);

    if (typeof window !== 'undefined') {
      // Client-side logging
      if (level === 'error') {
        console.error(formattedMessage);
      } else if (level === 'warn') {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    } else {
      // Server-side logging
      if (isProduction) {
        // In production, you might want to send to external service
        if (level === 'error' || level === 'warn') {
          console.error(formattedMessage);
        } else {
          console.log(formattedMessage);
        }
      } else {
        console.log(formattedMessage);
      }
    }

    // Send critical errors to monitoring service
    if (level === 'error' && context.error) {
      this.sendToMonitoring('error', { message, error: context.error, context });
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context: LogContext = {}): void {
    this.log('error', message, { ...context, error });
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(
    event: 'login' | 'logout' | 'register' | 'password_reset' | 'oauth_callback',
    success: boolean,
    context: LogContext = {}
  ): void {
    const level = success ? 'info' : 'warn';
    this.log(level, `Authentication: ${event}`, {
      ...context,
      event,
      success,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push({
      ...metrics,
      timestamp: Date.now(),
    } as any);

    // Log slow operations immediately
    if (metrics.duration > 5000) { // 5 seconds
      this.warn(`Slow operation detected: ${metrics.operation}`, {
        duration: metrics.duration,
        metadata: metrics.metadata,
      });
    }
  }

  /**
   * Log security event
   */
  logSecurity(event: SecurityEvent): void {
    this.securityEvents.push({
      ...event,
      timestamp: Date.now(),
    } as any);

    const level = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security event: ${event.type}`, {
      securityEvent: event,
    });

    // Immediate alert for critical security events
    if (event.severity === 'critical') {
      this.alertCriticalSecurity(event);
    }
  }

  /**
   * Log learning analytics event
   */
  logLearning(event: LearningEvent): void {
    this.learningEvents.push({
      ...event,
      timestamp: Date.now(),
    } as any);

    this.info(`Learning event: ${event.type}`, {
      learningEvent: event,
    });
  }

  /**
   * Log database query performance
   */
  logQuery(
    query: string,
    duration: number,
    success: boolean,
    context: LogContext = {}
  ): void {
    const level = success ? 'debug' : 'error';
    this.log(level, 'Database query', {
      ...context,
      query: query.substring(0, 200), // Truncate long queries
      duration,
      success,
    });

    // Track slow queries
    if (duration > 1000) { // 1 second
      this.warn('Slow database query detected', {
        query: query.substring(0, 200),
        duration,
      });
    }
  }

  /**
   * Log AI service interaction
   */
  logAI(
    service: 'openai' | 'google' | 'custom',
    operation: string,
    tokens: number,
    duration: number,
    success: boolean,
    context: LogContext = {}
  ): void {
    this.info(`AI service: ${service} - ${operation}`, {
      ...context,
      service,
      operation,
      tokens,
      duration,
      success,
    });

    // Track AI usage metrics
    this.logPerformance({
      operation: `ai_${service}_${operation}`,
      duration,
      success,
      metadata: { tokens, service },
    });
  }

  /**
   * Flush performance metrics
   */
  private flushMetrics(): void {
    if (this.performanceMetrics.length === 0) return;

    const metrics = [...this.performanceMetrics];
    this.performanceMetrics = [];

    // Calculate basic aggregated metrics
    const summary = {
      totalOperations: metrics.length,
      avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
      successRate: metrics.filter(m => m.success).length / metrics.length,
    };
    
    this.info('Performance metrics summary', { summary, count: metrics.length });
    this.sendToMonitoring('performance', summary);
  }

  /**
   * Flush events
   */
  private flushEvents(): void {
    if (this.securityEvents.length > 0) {
      const events = [...this.securityEvents];
      this.securityEvents = [];
      
      this.info('Security events summary', {
        events: events.length,
        critical: events.filter(e => e.severity === 'critical').length,
        high: events.filter(e => e.severity === 'high').length,
      });

      this.sendToMonitoring('security', events);
    }

    if (this.learningEvents.length > 0) {
      const events = [...this.learningEvents];
      this.learningEvents = [];
      
      this.info('Learning events summary', {
        events: events.length,
        completions: events.filter(e => e.type === 'lesson_complete').length,
        achievements: events.filter(e => e.type === 'achievement_unlock').length,
      });

      this.sendToMonitoring('learning', events);
    }
  }

  /**
   * Send data to external monitoring service
   */
  private sendToMonitoring(type: string, data: any): void {
    // Simple monitoring integration
    if (env.SENTRY_DSN && isProduction) {
      // In a real implementation, you'd send to Sentry or other services
      this.debug(`Sending ${type} data to monitoring service`, { type, dataSize: JSON.stringify(data).length });
    }
  }

  /**
   * Alert for critical security events
   */
  private alertCriticalSecurity(event: SecurityEvent): void {
    this.error('CRITICAL SECURITY ALERT', undefined, { securityEvent: event });
    
    // In production, this would trigger immediate notifications
    if (isProduction) {
      this.sendToMonitoring('critical_alert', event);
    }
  }

  /**
   * Get logger statistics
   */
  getStats(): {
    pendingMetrics: number;
    pendingSecurityEvents: number;
    pendingLearningEvents: number;
    logLevel: string;
  } {
    return {
      pendingMetrics: this.performanceMetrics.length,
      pendingSecurityEvents: this.securityEvents.length,
      pendingLearningEvents: this.learningEvents.length,
      logLevel: this.logLevel,
    };
  }
}

// Create singleton instance
export const logger = new SimpleLogger();

/**
 * Performance monitoring decorator
 */
export function withPerformanceLogging(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      let success = true;
      let error: Error | undefined;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err as Error;
        throw err;
      } finally {
        const duration = Date.now() - start;
        logger.logPerformance({
          operation: `${target.constructor.name}.${propertyName}`,
          duration,
          success,
          metadata: { operation, error: error?.message },
        });
      }
    };

    return descriptor;
  };
}

/**
 * Simple request logger for API routes
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  startTime: number,
  context: LogContext = {}
): void {
  const duration = Date.now() - startTime;
  logger.logRequest(method, url, statusCode, duration, context);
}

// Export types and utilities
export type {
  LogContext,
  PerformanceMetrics,
  SecurityEvent,
  LearningEvent,
  LogLevel,
};