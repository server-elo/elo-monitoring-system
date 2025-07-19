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

  constructor(_config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ..._config };
  }

  static getInstance(_): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(_);
    }
    return Logger.instance;
  }

  private shouldLog(_level: LogLevel): boolean {
    return _level <= this.config.level;
  }

  private sanitizeData(_data: any): any {
    if (typeof _data !== 'object' || _data === null) {
      return _data;
    }

    if (Array.isArray(_data)) {
      return _data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(_data)) {
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

  private formatLog(_entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify({
        level: LogLevel[_entry.level],
        message: _entry.message,
        timestamp: _entry.timestamp,
        requestId: _entry.requestId,
        userId: _entry.userId,
        metadata: _entry.metadata,
        error: _entry.error ? {
          name: _entry.error.name,
          message: _entry.error.message,
          stack: _entry.error.stack
        } : undefined
      });
    } else {
      const levelName = LogLevel[_entry.level].padEnd(5);
      const timestamp = _entry.timestamp;
      const requestId = _entry.requestId ? ` [${_entry.requestId}]` : '';
      const userId = _entry.userId ? ` [user:${_entry.userId}]` : '';
      
      let message = `${timestamp} ${levelName}${requestId}${userId} ${_entry.message}`;
      
      if (_entry.metadata) {
        message += ` ${JSON.stringify(_entry.metadata)}`;
      }
      
      if (_entry.error) {
        message += `\n${_entry.error.stack}`;
      }
      
      return message;
    }
  }

  private log( level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
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

  error( message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log( LogLevel.ERROR, message, metadata, error);
  }

  warn( message: string, metadata?: Record<string, any>): void {
    this.log( LogLevel.WARN, message, metadata);
  }

  info( message: string, metadata?: Record<string, any>): void {
    this.log( LogLevel.INFO, message, metadata);
  }

  debug( message: string, metadata?: Record<string, any>): void {
    this.log( LogLevel.DEBUG, message, metadata);
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
      ip: this.getClientIP(_request),
      headers: Object.fromEntries(_request.headers.entries())
    };

    if (_this.config.includeRequestBody && body) {
      const bodyString = JSON.stringify(_body);
      if (_bodyString.length <= this.config.maxBodySize) {
        metadata.body = this.sanitizeData(_body);
      } else {
        metadata.body = '[BODY_TOO_LARGE]';
      }
    }

    this.info( 'API Request', { ...metadata, requestId, userId });
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
      headers: Object.fromEntries(_response.headers.entries())
    };

    if (_this.config.includeResponseBody && body) {
      const bodyString = JSON.stringify(_body);
      if (_bodyString.length <= this.config.maxBodySize) {
        metadata.body = this.sanitizeData(_body);
      } else {
        metadata.body = '[BODY_TOO_LARGE]';
      }
    }

    const level = response.status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = response.status >= 400 ? 'API Error Response' : 'API Response';
    
    this.log( level, message, { ...metadata, requestId, userId });
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
      metadata.ip = this.getClientIP(_request);
    }

    this.error( 'Unhandled Error', { ...metadata, requestId, userId }, error);
  }

  private getClientIP(_request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim(_);
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }

  // Get recent logs
  getRecentLogs(_count: number = 100): LogEntry[] {
    return this.logs.slice(_-count);
  }

  // Get logs by level
  getLogsByLevel( level: LogLevel, count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(_-count);
  }

  // Get logs by request ID
  getLogsByRequestId(_requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  // Clear logs
  clearLogs(_): void {
    this.logs = [];
  }

  // Get log statistics
  getStats(_): {
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
  updateConfig(_config: Partial<LoggerConfig>): void {
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

  constructor(_) {
    this.logger = Logger.getInstance(_);
  }

  static getInstance(_): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(_);
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
      ip: this.getClientIP(_request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    this.auditLogs.push(_auditEntry);
    
    // Also log to main logger
    this.logger.info('Audit Log', { metadata: {
      audit: true,
      ...auditEntry
    }});
  }

  private getClientIP(_request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim(_);
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }

  getAuditLogs(_limit: number = 100): typeof this.auditLogs {
    return this.auditLogs.slice(_-limit);
  }

  getAuditLogsByUser( userId: string, limit: number = 100): typeof this.auditLogs {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(_-limit);
  }

  getAuditLogsByResource( resourceType: string, resourceId: string): typeof this.auditLogs {
    return this.auditLogs.filter(log => 
      log.resourceType === resourceType && log.resourceId === resourceId
    );
  }
}

// Singleton instances
export const logger = Logger.getInstance({});
export const auditLogger = AuditLogger.getInstance({});

// Helper functions
export function logApiRequest(
  request: NextRequest,
  requestId: string,
  userId?: string,
  body?: any
): void {
  logger.logRequest( request, requestId, userId, body);
}

export function logApiResponse(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
  userId?: string,
  duration?: number,
  body?: any
): void {
  logger.logResponse( request, response, requestId, userId, duration, body);
}

export function logApiError(
  error: Error,
  request?: NextRequest,
  requestId?: string,
  userId?: string
): void {
  logger.logError( error, request, requestId, userId);
}
