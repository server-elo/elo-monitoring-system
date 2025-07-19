/**
 * Graceful Shutdown Handler
 * Implements proper shutdown handling for the application
 */

interface ShutdownCallback {
  name: string;
  handler: () => Promise<void>;
  timeout?: number;
}

class GracefulShutdownManager {
  private shutdownCallbacks: ShutdownCallback[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds default

  constructor() {
    this.setupSignalHandlers();
  }

  /**
   * Register a shutdown callback
   */
  register(callback: ShutdownCallback): void {
    this.shutdownCallbacks.push(callback);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    // Handle termination signals
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log(`\nReceived ${signal}, starting graceful shutdown...`);

    // Set a timeout for forceful shutdown
    const forceShutdownTimer = setTimeout(() => {
      console.error('Graceful shutdown timeout reached, forcing exit...');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Execute all shutdown callbacks
      for (const callback of this.shutdownCallbacks) {
        try {
          console.log(`Executing shutdown handler: ${callback.name}`);
          const timeout = callback.timeout || 10000;
          await this.executeWithTimeout(callback.handler(), timeout);
          console.log(`✓ ${callback.name} completed`);
        } catch (error) {
          console.error(`✗ ${callback.name} failed:`, error);
        }
      }

      clearTimeout(forceShutdownTimer);
      console.log('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Execute a promise with timeout
   */
  private executeWithTimeout(promise: Promise<void>, timeout: number): Promise<void> {
    return Promise.race([
      promise,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdownManager();

// Example usage:
// gracefulShutdown.register({
//   name: 'Database Connection',
//   handler: async () => {
//     await database.disconnect();
//   },
//   timeout: 5000
// });