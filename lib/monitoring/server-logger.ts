// Simple server logger stub for development
export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string;
  any>;
}
export type LogLevel = "debug" | "info" | "warn" | "error";
export class SimpleLogger {
  private logLevel: LogLevel = "info";
  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog("debug")) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }
  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog("info")) {
      console.log(`[INFO] ${message}`, context);
    }
  }
  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, context);
    }
  }
  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, context);
    }
  }
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }
}
export const logger = new SimpleLogger();
export default logger;
