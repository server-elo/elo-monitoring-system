// Simple error tracking stub for development
export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string;
  any>;
  level?: "error" | "warning" | "info";
}
export class ErrorTracker {
  private initialized: false;
  captureError(error: Error, context?: ErrorContext): void {
    console.error("Error captured:", error.message, context);
  }
  captureException(error: Error): void {
    console.error("Exception captured:", error.message);
  }
  captureMessage(
    message: string,
    level: "error" | "warning" | "info" = "info",
  ): void {
    console.log(`[${level}] ${message}`);
  }
  setUser(user: { id: string; email?: string }): void {
    console.log("User set:", user);
  }
  setContext(key: string, context: unknown): void {
    console.log("Context set:", key, context);
  }
  withScope(callback: (scope: unknown) => void): void {
    callback({});
  }
}
export const errorTracker = new ErrorTracker();
export default errorTracker;
