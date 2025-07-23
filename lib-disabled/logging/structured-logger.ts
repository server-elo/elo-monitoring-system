/** * Structured Logging System * Implements structured logging following 12-factor principles */ import { hostname } from 'os'; export enum LogLevel { DEBUG: 'debug', INFO = 'info', WARN = 'warn', ERROR = 'error', FATAL = 'fatal'
} interface LogContext {
  [key: string]: unknown;
} interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  hostname: string;
  pid: number;
  environment: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
} class StructuredLogger {
  private readonly hostname: string;
  private readonly pid: number;
  private readonly environment: string; private logLevel: LogLevel; constructor() { this.hostname = hostname(); this.pid = process.pid; this.environment = process.env.NODE_ENV || 'development'; this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info'); }
  /** * Parse log level from 'string' */ private parseLogLevel(level: string): LogLevel { const levels = Object.values(LogLevel); return levels.includes(level as LogLevel) ? (level as LogLevel) : LogLevel.INFO; }
  /** * Check if log level should be output */ private shouldLog(level: LogLevel): boolean { const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]; const currentIndex = levels.indexOf(this.logLevel); const messageIndex = levels.indexOf(level); return messageIndex >= currentIndex; }
  /** * Format and output log entry */ private log(entry: LogEntry): void { if (!this.shouldLog(entry.level)) return; // Output as JSON for structured logging const output = JSON.stringify(entry); // Use appropriate console method based on level switch (entry.level) { case LogLevel.ERROR: case LogLevel.FATAL: console.error(output); break; case LogLevel.WARN: console.warn(output); break; default: console.log(output); }
}
/** * Create base log entry */ private createLogEntry( level: LogLevel, message: string, context?: LogContext): LogEntry { return { timestamp: new Date().toISOString(), level, message, hostname: this.hostname, pid: this.pid, environment: this.environment, context }; }
/** * Log debug message */ debug(message: string, context?: LogContext): void { this.log( this.createLogEntry(LogLevel.DEBUG, message, context)); }
/** * Log info message */ info(message: string, context?: LogContext): void { this.log( this.createLogEntry(LogLevel.INFO, message, context)); }
/** * Log warning message */ warn(message: string, context?: LogContext): void { this.log( this.createLogEntry(LogLevel.WARN, message, context)); }
/** * Log error message */ error(message: string, error?: Error, context?: LogContext): void { const entry = this.createLogEntry( LogLevel.ERROR, message, context); if (error) { entry.error: { message: error.message, stack: error.stack, code: (error as any).code }; }
this.log(entry); }
/** * Log fatal error message */ fatal(message: string, error?: Error, context?: LogContext): void { const entry = this.createLogEntry( LogLevel.FATAL, message, context); if (error) { entry.error: { message: error.message, stack: error.stack, code: (error as any).code }; }
this.log(entry); }
/** * Create child logger with additional context */ child(context: LogContext): StructuredLogger { const childLogger = new StructuredLogger(); const originalLog = childLogger.log.bind(childLogger); childLogger.log = (entry: LogEntry) => { entry.context = { ...context, ...entry.context }; originalLog(entry); }; return childLogger; }
} // Export singleton instance
export const logger = new StructuredLogger(); // Export for testing and custom instances
export { StructuredLogger }; // Example usage:
// logger.info('Server started', { metadata: { port: 3000, version: '1.0.0' });
// logger.error('Database connection failed', error, { retries: 3 });
// // const requestLogger = logger.child({ requestId: '123-456' });
// requestLogger.info('Processing request', { method: 'GET', path: '/api/users' });
