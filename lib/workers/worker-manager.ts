/**
 * Worker Process Management System
 * Implements perfect 12-Factor Admin Processes (Factor XII)
 */

import { spawn, ChildProcess } from 'child_process';
import { logger } from '@/lib/logging/structured-logger';
import { env } from '@/lib/config/env-validator';
import { gracefulShutdown } from '@/lib/server/graceful-shutdown';

interface WorkerConfig {
  name: string;
  script: string;
  args?: string[];
  env?: Record<string, string>;
  restartOnExit?: boolean;
  maxRestarts?: number;
  restartDelay?: number;
}

interface WorkerProcess {
  config: WorkerConfig;
  process?: ChildProcess;
  pid?: number;
  startTime?: Date;
  restartCount: number;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'crashed';
}

class WorkerManager {
  private workers = new Map<string, WorkerProcess>();
  private isShuttingDown = false;

  constructor() {
    this.setupGracefulShutdown();
  }

  /**
   * Register a worker process
   */
  register(config: WorkerConfig): void {
    this.workers.set(config.name, {
      config: {
        ...config,
        restartOnExit: config.restartOnExit ?? true,
        maxRestarts: config.maxRestarts ?? 5,
        restartDelay: config.restartDelay ?? 5000,
      },
      restartCount: 0,
      status: 'stopped',
    });

    logger.info('Worker registered', { name: config.name, script: config.script });
  }

  /**
   * Start a specific worker
   */
  async start(workerName: string): Promise<boolean> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      logger.error('Worker not found', { name: workerName });
      return false;
    }

    if (worker.status === 'running') {
      logger.warn('Worker already running', { name: workerName });
      return true;
    }

    try {
      worker.status = 'starting';
      logger.info('Starting worker', { name: workerName });

      const childProcess = spawn('node', [worker.config.script, ...(worker.config.args || [])], {
        env: {
          ...process.env,
          ...worker.config.env,
          WORKER_NAME: workerName,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      worker.process = childProcess;
      worker.pid = childProcess.pid;
      worker.startTime = new Date();
      worker.status = 'running';

      // Setup process event handlers
      this.setupWorkerHandlers(workerName, worker);

      logger.info('Worker started successfully', {
        name: workerName,
        pid: worker.pid,
      });

      return true;
    } catch (error) {
      worker.status = 'crashed';
      logger.error('Failed to start worker', error as Error, { name: workerName });
      return false;
    }
  }

  /**
   * Stop a specific worker
   */
  async stop(workerName: string, force = false): Promise<boolean> {
    const worker = this.workers.get(workerName);
    if (!worker || !worker.process) {
      logger.warn('Worker not running', { name: workerName });
      return true;
    }

    worker.status = 'stopping';
    logger.info('Stopping worker', { name: workerName, pid: worker.pid });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (worker.process && !worker.process.killed) {
          logger.warn('Force killing worker due to timeout', { name: workerName });
          worker.process.kill('SIGKILL');
        }
        resolve(false);
      }, force ? 1000 : 10000);

      worker.process!.on('exit', () => {
        clearTimeout(timeout);
        worker.status = 'stopped';
        worker.process = undefined;
        worker.pid = undefined;
        logger.info('Worker stopped', { name: workerName });
        resolve(true);
      });

      // Send graceful shutdown signal
      worker.process!.kill(force ? 'SIGKILL' : 'SIGTERM');
    });
  }

  /**
   * Start all registered workers
   */
  async startAll(): Promise<void> {
    logger.info('Starting all workers', { count: this.workers.size });

    const startPromises = Array.from(this.workers.keys()).map(name => this.start(name));
    await Promise.all(startPromises);

    logger.info('All workers started');
  }

  /**
   * Stop all workers
   */
  async stopAll(force = false): Promise<void> {
    this.isShuttingDown = true;
    logger.info('Stopping all workers', { count: this.workers.size });

    const stopPromises = Array.from(this.workers.keys()).map(name => this.stop(name, force));
    await Promise.all(stopPromises);

    logger.info('All workers stopped');
  }

  /**
   * Restart a specific worker
   */
  async restart(workerName: string): Promise<boolean> {
    logger.info('Restarting worker', { name: workerName });
    
    await this.stop(workerName);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    
    return this.start(workerName);
  }

  /**
   * Get worker status
   */
  getStatus(workerName?: string): any {
    if (workerName) {
      const worker = this.workers.get(workerName);
      return worker ? this.formatWorkerStatus(workerName, worker) : null;
    }

    return Array.from(this.workers.entries()).map(([name, worker]) =>
      this.formatWorkerStatus(name, worker)
    );
  }

  /**
   * Setup event handlers for a worker process
   */
  private setupWorkerHandlers(workerName: string, worker: WorkerProcess): void {
    const childProcess = worker.process!;

    // Handle process output
    childProcess.stdout?.on('data', (data) => {
      logger.info(`[${workerName}] ${data.toString().trim()}`);
    });

    childProcess.stderr?.on('data', (data) => {
      logger.error(`[${workerName}] ${data.toString().trim()}`);
    });

    // Handle process exit
    childProcess.on('exit', (code, signal) => {
      this.handleWorkerExit(workerName, worker, code, signal);
    });

    // Handle process errors
    childProcess.on('error', (error) => {
      logger.error('Worker process error', error, { name: workerName });
      worker.status = 'crashed';
    });
  }

  /**
   * Handle worker process exit
   */
  private handleWorkerExit(
    workerName: string,
    worker: WorkerProcess,
    code: number | null,
    signal: string | null
  ): void {
    worker.status = code === 0 ? 'stopped' : 'crashed';
    worker.process = undefined;
    worker.pid = undefined;

    logger.info('Worker exited', {
      name: workerName,
      code,
      signal,
      restartCount: worker.restartCount,
    });

    // Handle automatic restart
    if (
      !this.isShuttingDown &&
      worker.config.restartOnExit &&
      code !== 0 &&
      worker.restartCount < worker.config.maxRestarts!
    ) {
      worker.restartCount++;
      logger.info('Scheduling worker restart', {
        name: workerName,
        attempt: worker.restartCount,
        delay: worker.config.restartDelay,
      });

      setTimeout(() => {
        if (!this.isShuttingDown) {
          this.start(workerName);
        }
      }, worker.config.restartDelay);
    } else if (worker.restartCount >= worker.config.maxRestarts!) {
      logger.error('Worker exceeded max restarts', {
        name: workerName,
        maxRestarts: worker.config.maxRestarts,
      });
    }
  }

  /**
   * Format worker status for API response
   */
  private formatWorkerStatus(name: string, worker: WorkerProcess): any {
    return {
      name,
      status: worker.status,
      pid: worker.pid,
      startTime: worker.startTime,
      restartCount: worker.restartCount,
      uptime: worker.startTime ? Date.now() - worker.startTime.getTime() : 0,
      config: {
        script: worker.config.script,
        restartOnExit: worker.config.restartOnExit,
        maxRestarts: worker.config.maxRestarts,
      },
    };
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    gracefulShutdown.register({
      name: 'Worker Manager',
      handler: async () => {
        await this.stopAll();
      },
      timeout: 30000,
    });
  }
}

// Export singleton instance
export const workerManager = new WorkerManager();

// Register common workers if enabled
if (env.NODE_ENV === 'production' || env.CLUSTER_DEV_ENABLED) {
  // Background task worker
  workerManager.register({
    name: 'background-tasks',
    script: './workers/background-tasks.js',
    env: {
      WORKER_TYPE: 'background',
    },
  });

  // Metrics collection worker
  if (env.METRICS_ENABLED) {
    workerManager.register({
      name: 'metrics-collector',
      script: './workers/metrics-collector.js',
      env: {
        WORKER_TYPE: 'metrics',
      },
    });
  }

  // Cache warming worker
  if (env.ENABLE_CACHE) {
    workerManager.register({
      name: 'cache-warmer',
      script: './workers/cache-warmer.js',
      env: {
        WORKER_TYPE: 'cache',
      },
    });
  }
}

// Export class for testing
export { WorkerManager };