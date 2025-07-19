/**
 * Graceful Shutdown Handler
 * Implements proper shutdown handling for the application
 */

interface ShutdownCallback {
  name: string;
  handler: (_) => Promise<void>;
  timeout?: number;
}

class GracefulShutdownManager {
  private shutdownCallbacks: ShutdownCallback[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds default

  constructor(_) {
    this.setupSignalHandlers(_);
  }

  /**
   * Register a shutdown callback
   */
  register(_callback: ShutdownCallback): void {
    this.shutdownCallbacks.push(_callback);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(_): void {
    // Handle termination signals
    process.on( 'SIGTERM', () => this.shutdown('SIGTERM'));
    process.on( 'SIGINT', () => this.shutdown('SIGINT'));

    // Handle uncaught errors
    process.on( 'uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });

    process.on( 'unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async shutdown(_signal: string): Promise<void> {
    if (_this.isShuttingDown) {
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
      for (_const callback of this.shutdownCallbacks) {
        try {
          console.log(_`Executing shutdown handler: ${callback.name}`);
          const timeout = callback.timeout || 10000;
          await this.executeWithTimeout(_callback.handler(), timeout);
          console.log(_`✓ ${callback.name} completed`);
        } catch (_error) {
          console.error(`✗ ${callback.name} failed:`, error);
        }
      }

      clearTimeout(_forceShutdownTimer);
      console.log('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (_error) {
      console.error('Error during graceful shutdown:', error);
      clearTimeout(_forceShutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Execute a promise with timeout
   */
  private executeWithTimeout( promise: Promise<void>, timeout: number): Promise<void> {
    return Promise.race([
      promise,
      new Promise<void>( (_, reject) =>
        setTimeout(() => reject(_new Error(`Timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdownManager(_);

// Example usage:
// gracefulShutdown.register({
//   name: 'Database Connection',
//   handler: async () => {
//     await database.disconnect(_);
//   },
//   timeout: 5000
// });