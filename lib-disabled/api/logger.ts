import { NextRequest, NextResponse } from 'next/server';

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
  metadata?: Record<string, unknown>;
  stack?: string;
  duration?: number;
  httpMethod?: string;
  path?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
}

// Logger Configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxFileSize?: number;
  maxFiles?: number;
  format?: 'json' | 'text';
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableRemote: false,
  format: 'json'
};

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Set up buffer flushing
    if (this.config.enableRemote) {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  private createEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: metadata?.requestId as string,
      userId: metadata?.userId as string,
      metadata,
      stack: metadata?.stack as string
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.minLevel;
  }

  private formatEntry(entry: LogEntry): string {
    if (this.config.format === 'text') {
      const levelName = LogLevel[entry.level];
      return `[${entry.timestamp}] ${levelName}: ${entry.message}${entry.stack ? '\n' + entry.stack : ''}`;
    }
    return JSON.stringify(entry);
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    if (!this.config.enableConsole) return;

    const formatted = this.formatEntry(entry);
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile) return;
    // File writing would be implemented here
    // For now, we'll skip actual file operations
  }

  private async writeToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries)
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  private async log(level: LogLevel, message: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, metadata);
    
    // Write to console immediately
    await this.writeToConsole(entry);
    
    // Write to file
    await this.writeToFile(entry);
    
    // Buffer for remote
    if (this.config.enableRemote) {
      this.buffer.push(entry);
      if (this.buffer.length >= 100) {
        await this.flush();
      }
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    await this.writeToRemote(entries);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata).catch(console.error);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata).catch(console.error);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata).catch(console.error);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata).catch(console.error);
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush().catch(console.error);
  }
}

// Export singleton instance
export const logger = new Logger({
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableRemote: false
});

// Middleware for API logging
export function withLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      logger.info('API Request', {
        requestId,
        httpMethod: req.method,
        path: req.url,
        statusCode: response.status,
        duration,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('API Error', {
        requestId,
        httpMethod: req.method,
        path: req.url,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  };
}