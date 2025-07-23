/**
 * Simple logger implementation
 * Client and server safe - no external dependencies
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  component?: string;
}

class SimpleLogger {
  private logLevel: LogLevel = 'info';

  constructor(level: LogLevel = 'info') {
    this.logLevel = level;
  }

  private log(level: LogLevel, message: string, data?: unknown, meta?: Record<string, unknown>): void {
    const logLevels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (logLevels[level] < logLevels[this.logLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component: meta?.component as string,
    };

    const formattedMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`;
    
    // Use console methods for logger output (allowed for simple logger implementation)
    if (level === 'error') {
      console.error(formattedMessage, data || '');
    } else if (level === 'warn') {
      console.warn(formattedMessage, data || '');
    } else {
      console.log(formattedMessage, data || '');
    }
  }

  debug(message: string, data?: unknown, meta?: Record<string, unknown>): void {
    this.log('debug', message, data, meta);
  }

  info(message: string, data?: unknown, meta?: Record<string, unknown>): void {
    this.log('info', message, data, meta);
  }

  warn(message: string, data?: unknown, meta?: Record<string, unknown>): void {
    this.log('warn', message, data, meta);
  }

  error(message: string, data?: unknown, meta?: Record<string, unknown>): void {
    this.log('error', message, data, meta);
  }

  performance(name: string, duration: number, meta?: Record<string, unknown>): void {
    this.info(`Performance: ${name}`, { duration, ...meta });
  }
}

// Create logger instance with no external dependencies
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
export const logger = new SimpleLogger(isDevelopment ? 'debug' : 'info');

export default logger;