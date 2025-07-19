/**
 * API request/response logging and monitoring integration
 */

import { NextRequest } from 'next/server';
import { ApiError, ErrorContext, createErrorContext } from './errors';
;
import { errorTracker } from '@/lib/monitoring/error-tracking';
import { sanitizeData, getClientIP } from './utils';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  sensitiveFields: string[];
  maxBodySize: number; // in bytes
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableExternalLogging: boolean;
}

const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  includeRequestBody: process.env.NODE_ENV !== 'production',
  includeResponseBody: process.env.NODE_ENV !== 'production',
  sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
  maxBodySize: 10000, // 10KB
  enableConsoleLogging: true,
  enableFileLogging: process.env.NODE_ENV === 'production',
  enableExternalLogging: process.env.NODE_ENV === 'production'
};

// Request context interface
export interface RequestContext {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
}

// Response context interface
export interface ResponseContext {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  responseTime: number;
  error?: ApiError;
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId: string;
  context: {
    request: RequestContext;
    response?: ResponseContext;
    error?: ErrorContext;
    metadata?: Record<string, any>;
  };
}

class ApiLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Create request context from NextRequest
   */
  createRequestContext(request: NextRequest, requestId: string, body?: any): RequestContext {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers.entries());
    const query = Object.fromEntries(url.searchParams.entries());

    return {
      requestId,
      method: request.method,
      url: request.url,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
      userId: headers['x-user-id'], // Set by auth middleware
      sessionId: headers['x-session-id'], // Set by auth middleware
      startTime: Date.now(),
      headers: this.sanitizeHeaders(headers),
      query,
      body: this.shouldIncludeBody(body, 'request') ? this.sanitizeBody(body) : undefined
    };
  }

  /**
   * Create response context
   */
  createResponseContext(
    statusCode: number,
    headers: Record<string, string>,
    body: any,
    startTime: number,
    error?: ApiError
  ): ResponseContext {
    return {
      statusCode,
      headers: this.sanitizeHeaders(headers),
      body: this.shouldIncludeBody(body, 'response') ? this.sanitizeBody(body) : undefined,
      responseTime: Date.now() - startTime,
      error
    };
  }

  /**
   * Log API request
   */
  logRequest(requestContext: RequestContext) {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message: `${requestContext.method} ${requestContext.url}`,
      timestamp: new Date().toISOString(),
      requestId: requestContext.requestId,
      context: {
        request: requestContext
      }
    };

    this.writeLog(logEntry);
  }

  /**
   * Log API response
   */
  logResponse(requestContext: RequestContext, responseContext: ResponseContext) {
    const level = responseContext.statusCode >= 500 ? LogLevel.ERROR :
                  responseContext.statusCode >= 400 ? LogLevel.WARN :
                  LogLevel.INFO;

    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message: `${requestContext.method} ${requestContext.url} - ${responseContext.statusCode} (${responseContext.responseTime}ms)`,
      timestamp: new Date().toISOString(),
      requestId: requestContext.requestId,
      context: {
        request: requestContext,
        response: responseContext
      }
    };

    this.writeLog(logEntry);

    // Send to external monitoring if response indicates an error
    if (responseContext.statusCode >= 400) {
      this.sendToExternalMonitoring(logEntry);
    }
  }

  /**
   * Log API error
   */
  logError(error: ApiError, requestContext: RequestContext, additionalContext?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext = createErrorContext(error, requestContext, additionalContext);

    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message: `API Error: ${error.message}`,
      timestamp: new Date().toISOString(),
      requestId: requestContext.requestId,
      context: {
        request: requestContext,
        error: errorContext,
        metadata: additionalContext
      }
    };

    this.writeLog(logEntry);

    // Send to error tracking system
    this.sendToErrorTracker(error, errorContext);

    // Send to external monitoring for critical errors
    if (errorContext.severity === 'critical' || errorContext.severity === 'high') {
      this.sendToExternalMonitoring(logEntry);
    }
  }

  /**
   * Log general message
   */
  log(level: LogLevel, message: string, context?: any, requestId?: string) {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: requestId || 'system',
      context: {
        request: {} as RequestContext, // Minimal request context for system logs
        metadata: context
      }
    };

    this.writeLog(logEntry);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by request ID
   */
  getLogsByRequestId(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex <= configLevelIndex;
  }

  private shouldIncludeBody(body: any, type: 'request' | 'response'): boolean {
    if (!body) return false;
    
    const include = type === 'request' ? this.config.includeRequestBody : this.config.includeResponseBody;
    if (!include) return false;

    // Check body size
    const bodySize = JSON.stringify(body).length;
    return bodySize <= this.config.maxBodySize;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    return sanitizeData(headers, this.config.sensitiveFields);
  }

  private sanitizeBody(body: any): any {
    return sanitizeData(body, this.config.sensitiveFields);
  }

  private writeLog(logEntry: LogEntry) {
    // Add to memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.writeToConsole(logEntry);
    }

    // File logging (in production)
    if (this.config.enableFileLogging) {
      this.writeToFile(logEntry);
    }
  }

  private writeToConsole(logEntry: LogEntry) {
    const { level, message, timestamp, requestId, context } = logEntry;
    
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${requestId}] ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context);
        break;
      case LogLevel.INFO:
        console.info(logMessage, context);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage, context);
        break;
    }
  }

  private writeToFile(_logEntry: LogEntry) {
    // In a real implementation, you would write to a log file
    // For now, we'll just store in memory
    // Example: fs.appendFileSync('api.log', JSON.stringify(logEntry) + '\n');
  }

  private sendToErrorTracker(error: ApiError, errorContext: ErrorContext) {
    try {
      errorTracker.captureError(error, {
        component: 'api',
        action: 'api_error',
        metadata: {
          ...errorContext.metadata,
          requestId: errorContext.requestId,
          userId: errorContext.userId,
          severity: errorContext.severity,
          fingerprint: errorContext.fingerprint,
          tags: errorContext.tags
        }
      });
    } catch (trackingError) {
      console.error('Failed to send error to tracker:', trackingError);
    }
  }

  private sendToExternalMonitoring(logEntry: LogEntry) {
    if (!this.config.enableExternalLogging) return;

    try {
      // Send to external monitoring service (e.g., DataDog, New Relic, etc.)
      // Example implementation:
      // await fetch('https://api.monitoring-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
      
      console.log('Would send to external monitoring:', logEntry.message);
    } catch (error) {
      console.error('Failed to send to external monitoring:', error);
    }
  }
}

// Global logger instance
export const apiLogger = new ApiLogger();

// Convenience methods
export const logRequest = (requestContext: RequestContext) => apiLogger.logRequest(requestContext);
export const logResponse = (requestContext: RequestContext, responseContext: ResponseContext) => 
  apiLogger.logResponse(requestContext, responseContext);
export const logError = (error: ApiError, requestContext: RequestContext, additionalContext?: any) => 
  apiLogger.logError(error, requestContext, additionalContext);
export const logInfo = (message: string, context?: any, requestId?: string) => 
  apiLogger.log(LogLevel.INFO, message, context, requestId);
export const logWarn = (message: string, context?: any, requestId?: string) => 
  apiLogger.log(LogLevel.WARN, message, context, requestId);
export const logDebug = (message: string, context?: any, requestId?: string) => 
  apiLogger.log(LogLevel.DEBUG, message, context, requestId);

// Middleware for automatic request/response logging
export function createLoggingMiddleware() {
  return async (request: NextRequest, handler: Function) => {
    const requestId = request.headers.get('x-request-id') || 
                     Math.random().toString(36).substring(2, 15);
    
    let requestBody: any;
    try {
      // Clone request to read body without consuming it
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
    } catch {
      // Body is not JSON or already consumed
      requestBody = undefined;
    }

    const requestContext = apiLogger.createRequestContext(request, requestId, requestBody);
    
    // Log request
    apiLogger.logRequest(requestContext);

    try {
      // Execute handler
      const response = await handler(request);
      
      // Extract response data
      let responseBody: any;
      try {
        const clonedResponse = response.clone();
        responseBody = await clonedResponse.json();
      } catch {
        responseBody = undefined;
      }

      const responseContext = apiLogger.createResponseContext(
        response.status,
        Object.fromEntries(response.headers.entries()),
        responseBody,
        requestContext.startTime
      );

      // Log response
      apiLogger.logResponse(requestContext, responseContext);

      return response;
    } catch (error) {
      // Log error
      if (error instanceof ApiError) {
        apiLogger.logError(error, requestContext);
      } else {
        const apiError = new ApiError(
          'INTERNAL_SERVER_ERROR' as any,
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
        apiLogger.logError(apiError, requestContext);
      }
      
      throw error;
    }
  };
}
