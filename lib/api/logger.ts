import { NextRequest, NextResponse } from 'next/server';
;

// Log Levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Log Entry Interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

// Logger Configuration
export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  sensitiveFields: string[];
  maxBodySize: number; // in bytes
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  format: process.env.NODE_ENV === 'production' ? 'json' : 'text',
  includeRequestBody: process.env.LOG_REQUEST_BODY === 'true',
  includeResponseBody: process.env.LOG_RESPONSE_BODY === 'true',
  sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
  maxBodySize: 10000 // 10KB
};

// Logger Class
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.config.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private formatLog(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify({
        level: LogLevel[entry.level],
        message: entry.message,
        timestamp: entry.timestamp,
        requestId: entry.requestId,
        userId: entry.userId,
        metadata: entry.metadata,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        } : undefined
      });
    } else {
      const levelName = LogLevel[entry.level].padEnd(5);
      const timestamp = entry.timestamp;
      const requestId = entry.requestId ? ` [${entry.requestId}]` : '';
      const userId = entry.userId ? ` [user:${entry.userId}]` : '';
      
      let message = `${timestamp} ${levelName}${requestId}${userId} ${entry.message}`;
      
      if (entry.metadata) {
        message += ` ${JSON.stringify(entry.metadata)}`;
      }
      
      if (entry.error) {
        message += `\n${entry.error.stack}`;
      }
      
      return message;
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: metadata ? this.sanitizeData(metadata) : undefined,
      error
    };

    // Store log entry
    this.logs.push(entry);
    
    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console
    const formattedLog = this.formatLog(entry);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  // Request/Response logging
  logRequest(
    request: NextRequest,
    requestId: string,
    userId?: string,
    body?: any
  ): void {
    const metadata: Record<string, any> = {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: this.getClientIP(request),
      headers: Object.fromEntries(request.headers.entries())
    };

    if (this.config.includeRequestBody && body) {
      const bodyString = JSON.stringify(body);
      if (bodyString.length <= this.config.maxBodySize) {
        metadata.body = this.sanitizeData(body);
      } else {
        metadata.body = '[BODY_TOO_LARGE]';
      }
    }

    this.info('API Request', { ...metadata, requestId, userId });
  }

  logResponse(
    request: NextRequest,
    response: NextResponse,
    requestId: string,
    userId?: string,
    duration?: number,
    body?: any
  ): void {
    const metadata: Record<string, any> = {
      method: request.method,
      url: request.url,
      statusCode: response.status,
      duration: duration ? `${duration}ms` : undefined,
      headers: Object.fromEntries(response.headers.entries())
    };

    if (this.config.includeResponseBody && body) {
      const bodyString = JSON.stringify(body);
      if (bodyString.length <= this.config.maxBodySize) {
        metadata.body = this.sanitizeData(body);
      } else {
        metadata.body = '[BODY_TOO_LARGE]';
      }
    }

    const level = response.status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = response.status >= 400 ? 'API Error Response' : 'API Response';
    
    this.log(level, message, { ...metadata, requestId, userId });
  }

  logError(
    error: Error,
    request?: NextRequest,
    requestId?: string,
    userId?: string
  ): void {
    const metadata: Record<string, any> = {
      errorName: error.name,
      errorMessage: error.message
    };

    if (request) {
      metadata.method = request.method;
      metadata.url = request.url;
      metadata.userAgent = request.headers.get('user-agent');
      metadata.ip = this.getClientIP(request);
    }

    this.error('Unhandled Error', { ...metadata, requestId, userId }, error);
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }

  // Get recent logs
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  // Get logs by request ID
  getLogsByRequestId(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Get log statistics
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    recentErrors: LogEntry[];
  } {
    const byLevel: Record<string, number> = {};
    
    for (const log of this.logs) {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
    }

    const recentErrors = this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-10);

    return {
      total: this.logs.length,
      byLevel,
      recentErrors
    };
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Audit Logger for sensitive operations
export class AuditLogger {
  private static instance: AuditLogger;
  private logger: Logger;
  private auditLogs: Array<{
    action: string;
    userId: string;
    resourceType: string;
    resourceId: string;
    changes?: Record<string, any>;
    timestamp: string;
    ip: string;
    userAgent: string;
  }> = [];

  constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  log(
    action: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    request: NextRequest,
    changes?: Record<string, any>
  ): void {
    const auditEntry = {
      action,
      userId,
      resourceType,
      resourceId,
      changes,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    this.auditLogs.push(auditEntry);
    
    // Also log to main logger
    this.logger.info('Audit Log', {
      audit: true,
      ...auditEntry
    });
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }

  getAuditLogs(limit: number = 100): typeof this.auditLogs {
    return this.auditLogs.slice(-limit);
  }

  getAuditLogsByUser(userId: string, limit: number = 100): typeof this.auditLogs {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  getAuditLogsByResource(resourceType: string, resourceId: string): typeof this.auditLogs {
    return this.auditLogs.filter(log => 
      log.resourceType === resourceType && log.resourceId === resourceId
    );
  }
}

// Singleton instances
export const logger = Logger.getInstance();
export const auditLogger = AuditLogger.getInstance();

// Helper functions
export function logApiRequest(
  request: NextRequest,
  requestId: string,
  userId?: string,
  body?: any
): void {
  logger.logRequest(request, requestId, userId, body);
}

export function logApiResponse(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
  userId?: string,
  duration?: number,
  body?: any
): void {
  logger.logResponse(request, response, requestId, userId, duration, body);
}

export function logApiError(
  error: Error,
  request?: NextRequest,
  requestId?: string,
  userId?: string
): void {
  logger.logError(error, request, requestId, userId);
}
