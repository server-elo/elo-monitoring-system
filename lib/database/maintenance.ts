import { cleanupManager, CleanupReport, CleanupOptions } from './cleanup';
;
import { registerOrphanedDataOperations } from './orphaned-data';
import { registerDataRemovalOperations } from './data-removal';
import { logger } from '@/lib/api/logger';

// Maintenance Schedule Types
export interface MaintenanceSchedule {
  id: string;
  name: string;
  description: string;
  operations: string[];
  schedule: CronSchedule;
  enabled: boolean;
  options: CleanupOptions;
  notifications: NotificationConfig;
  lastRun?: string;
  nextRun?: string;
}

export interface CronSchedule {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  timezone?: string;
}

export interface NotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  onWarnings: boolean;
  recipients: string[];
  channels: ('email' | 'slack' | 'webhook')[];
}

export interface MaintenanceReport {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  operations: CleanupReport[];
  systemMetrics: SystemMetrics;
  recommendations: string[];
}

export interface SystemMetrics {
  databaseSize: number;
  tableStats: TableStats[];
  indexEfficiency: number;
  queryPerformance: QueryStats[];
  diskUsage: DiskUsage;
  memoryUsage: MemoryUsage;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  lastAnalyzed: string;
  fragmentationLevel: number;
}

export interface QueryStats {
  query: string;
  avgExecutionTime: number;
  executionCount: number;
  lastExecuted: string;
}

export interface DiskUsage {
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface MemoryUsage {
  total: number;
  used: number;
  buffers: number;
  cached: number;
}

// Maintenance Scheduler
export class MaintenanceScheduler {
  private static instance: MaintenanceScheduler;
  private schedules: Map<string, MaintenanceSchedule> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.initializeDefaultSchedules();
    this.registerCleanupOperations();
  }

  static getInstance(): MaintenanceScheduler {
    if (!MaintenanceScheduler.instance) {
      MaintenanceScheduler.instance = new MaintenanceScheduler();
    }
    return MaintenanceScheduler.instance;
  }

  private registerCleanupOperations(): void {
    registerOrphanedDataOperations();
    registerDataRemovalOperations();
  }

  private initializeDefaultSchedules(): void {
    const defaultSchedules: MaintenanceSchedule[] = [
      {
        id: 'daily_cleanup',
        name: 'Daily Cleanup',
        description: 'Daily maintenance tasks including expired tokens and cache cleanup',
        operations: ['expired_tokens', 'cached_data'],
        schedule: {
          minute: '0',
          hour: '2',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: false,
          force: false,
          batchSize: 1000,
          maxExecutionTime: 1800 // 30 minutes
        },
        notifications: {
          onSuccess: false,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com'],
          channels: ['email']
        }
      },
      {
        id: 'weekly_deep_clean',
        name: 'Weekly Deep Clean',
        description: 'Weekly comprehensive cleanup including orphaned data and old logs',
        operations: [
          'orphaned_achievements',
          'orphaned_progress',
          'orphaned_leaderboard',
          'orphaned_prerequisites',
          'old_logs'
        ],
        schedule: {
          minute: '0',
          hour: '1',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '0', // Sunday
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: false,
          force: false,
          batchSize: 500,
          maxExecutionTime: 3600 // 1 hour
        },
        notifications: {
          onSuccess: true,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com', 'devops@example.com'],
          channels: ['email', 'slack']
        }
      },
      {
        id: 'monthly_archive',
        name: 'Monthly Archive',
        description: 'Monthly archival of inactive accounts and temporary files',
        operations: ['inactive_accounts', 'temporary_files'],
        schedule: {
          minute: '0',
          hour: '3',
          dayOfMonth: '1',
          month: '*',
          dayOfWeek: '*',
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 7200 // 2 hours
        },
        notifications: {
          onSuccess: true,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com', 'compliance@example.com'],
          channels: ['email']
        }
      }
    ];

    defaultSchedules.forEach(schedule => {
      this.schedules.set(schedule.id, schedule);
    });

    logger.info('Default maintenance schedules initialized', {
      scheduleCount: defaultSchedules.length
    });
  }

  async startScheduler(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Maintenance scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting maintenance scheduler');

    // Schedule all enabled maintenance tasks
    for (const [scheduleId, schedule] of this.schedules.entries()) {
      if (schedule.enabled) {
        this.scheduleTask(scheduleId, schedule);
      }
    }

    logger.info('Maintenance scheduler started', {
      activeSchedules: Array.from(this.schedules.values()).filter(s => s.enabled).length
    });
  }

  async stopScheduler(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping maintenance scheduler');

    // Clear all timers
    for (const [scheduleId, timer] of this.timers.entries()) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }

    logger.info('Maintenance scheduler stopped');
  }

  private scheduleTask(scheduleId: string, schedule: MaintenanceSchedule): void {
    const nextRun = this.calculateNextRun(schedule.schedule);
    const delay = nextRun.getTime() - Date.now();

    if (delay > 0) {
      const timer = setTimeout(async () => {
        await this.executeScheduledMaintenance(scheduleId);
        
        // Reschedule for next run
        if (this.isRunning && schedule.enabled) {
          this.scheduleTask(scheduleId, schedule);
        }
      }, delay);

      this.timers.set(scheduleId, timer);
      
      // Update next run time
      schedule.nextRun = nextRun.toISOString();

      logger.info('Maintenance task scheduled', {
        scheduleId,
        nextRun: nextRun.toISOString(),
        delayMs: delay
      });
    }
  }

  private calculateNextRun(schedule: CronSchedule): Date {
    // Simplified cron calculation - in production, use a proper cron library
    const now = new Date();
    const nextRun = new Date(now);

    // Parse hour and minute
    const hour = schedule.hour === '*' ? now.getHours() : parseInt(schedule.hour);
    const minute = schedule.minute === '*' ? now.getMinutes() : parseInt(schedule.minute);

    nextRun.setHours(hour, minute, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Handle day of week
    if (schedule.dayOfWeek !== '*') {
      const targetDay = parseInt(schedule.dayOfWeek);
      const currentDay = nextRun.getDay();
      
      if (currentDay !== targetDay) {
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      }
    }

    // Handle day of month
    if (schedule.dayOfMonth !== '*') {
      const targetDate = parseInt(schedule.dayOfMonth);
      nextRun.setDate(targetDate);
      
      // If the date has passed this month, move to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDate);
      }
    }

    return nextRun;
  }

  async executeScheduledMaintenance(scheduleId: string): Promise<MaintenanceReport> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const startTime = new Date();
    logger.info('Starting scheduled maintenance', {
      scheduleId,
      scheduleName: schedule.name,
      operations: schedule.operations
    });

    try {
      // Collect system metrics before maintenance
      const beforeMetrics = await this.collectSystemMetrics();

      // Execute cleanup operations
      const cleanupResults = await cleanupManager.executeBatch(
        schedule.operations,
        schedule.options
      );

      // Collect system metrics after maintenance
      const afterMetrics = await this.collectSystemMetrics();

      // Update last run time
      schedule.lastRun = startTime.toISOString();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const report: MaintenanceReport = {
        id: `maintenance_${Date.now()}`,
        scheduleId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        status: cleanupResults.status,
        operations: [cleanupResults],
        systemMetrics: afterMetrics,
        recommendations: this.generateRecommendations(beforeMetrics, afterMetrics, cleanupResults)
      };

      // Send notifications
      await this.sendNotifications(schedule, report);

      logger.info('Scheduled maintenance completed', {
        scheduleId,
        status: report.status,
        duration,
        operationsExecuted: schedule.operations.length
      });

      return report;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const errorReport: MaintenanceReport = {
        id: `maintenance_${Date.now()}`,
        scheduleId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        status: 'FAILED',
        operations: [],
        systemMetrics: await this.collectSystemMetrics(),
        recommendations: [`Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };

      await this.sendNotifications(schedule, errorReport);

      logger.error('Scheduled maintenance failed', {
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      return errorReport;
    }
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // Mock system metrics collection
    // In production, this would query actual system and database metrics
    return {
      databaseSize: 1024 * 1024 * 1024, // 1GB
      tableStats: [
        {
          tableName: 'users',
          rowCount: 10000,
          sizeBytes: 50 * 1024 * 1024,
          lastAnalyzed: new Date().toISOString(),
          fragmentationLevel: 5
        },
        {
          tableName: 'lessons',
          rowCount: 500,
          sizeBytes: 10 * 1024 * 1024,
          lastAnalyzed: new Date().toISOString(),
          fragmentationLevel: 2
        }
      ],
      indexEfficiency: 95,
      queryPerformance: [
        {
          query: 'SELECT * FROM users WHERE email = ?',
          avgExecutionTime: 2.5,
          executionCount: 1000,
          lastExecuted: new Date().toISOString()
        }
      ],
      diskUsage: {
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: 60 * 1024 * 1024 * 1024,   // 60GB
        available: 40 * 1024 * 1024 * 1024, // 40GB
        percentage: 60
      },
      memoryUsage: {
        total: 16 * 1024 * 1024 * 1024, // 16GB
        used: 8 * 1024 * 1024 * 1024,   // 8GB
        buffers: 1 * 1024 * 1024 * 1024, // 1GB
        cached: 2 * 1024 * 1024 * 1024   // 2GB
      }
    };
  }

  private generateRecommendations(
    beforeMetrics: SystemMetrics,
    afterMetrics: SystemMetrics,
    cleanupResults: CleanupReport
  ): string[] {
    const recommendations: string[] = [];

    // Disk usage recommendations
    if (afterMetrics.diskUsage.percentage > 80) {
      recommendations.push('Disk usage is high (>80%). Consider increasing cleanup frequency or archiving old data.');
    }

    // Database size recommendations
    const sizeDiff = beforeMetrics.databaseSize - afterMetrics.databaseSize;
    if (sizeDiff > 0) {
      const savedMB = Math.round(sizeDiff / (1024 * 1024));
      recommendations.push(`Cleanup freed ${savedMB}MB of database space.`);
    }

    // Cleanup results recommendations
    if (cleanupResults.totalErrors > 0) {
      recommendations.push(`${cleanupResults.totalErrors} errors occurred during cleanup. Review logs for details.`);
    }

    if (cleanupResults.totalWarnings > 5) {
      recommendations.push(`${cleanupResults.totalWarnings} warnings generated. Consider reviewing data integrity.`);
    }

    // Performance recommendations
    if (afterMetrics.indexEfficiency < 90) {
      recommendations.push('Index efficiency is below 90%. Consider rebuilding indexes.');
    }

    return recommendations;
  }

  private async sendNotifications(schedule: MaintenanceSchedule, report: MaintenanceReport): Promise<void> {
    const shouldNotify = 
      (report.status === 'SUCCESS' && schedule.notifications.onSuccess) ||
      (report.status === 'FAILED' && schedule.notifications.onFailure) ||
      (report.status === 'PARTIAL_SUCCESS' && schedule.notifications.onWarnings);

    if (!shouldNotify) {
      return;
    }

    logger.info('Sending maintenance notifications', {
      scheduleId: schedule.id,
      status: report.status,
      recipients: schedule.notifications.recipients.length,
      channels: schedule.notifications.channels
    });

    // In production, this would send actual notifications
    // For now, just log the notification details
    const notification = {
      subject: `Maintenance Report: ${schedule.name}`,
      status: report.status,
      duration: `${Math.round(report.duration / 1000)}s`,
      operations: report.operations.length,
      recommendations: report.recommendations
    };

    logger.info('Maintenance notification sent', notification);
  }

  // Public API methods
  async addSchedule(schedule: MaintenanceSchedule): Promise<void> {
    this.schedules.set(schedule.id, schedule);
    
    if (schedule.enabled && this.isRunning) {
      this.scheduleTask(schedule.id, schedule);
    }

    logger.info('Maintenance schedule added', {
      scheduleId: schedule.id,
      name: schedule.name
    });
  }

  async updateSchedule(scheduleId: string, updates: Partial<MaintenanceSchedule>): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    // Clear existing timer
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }

    // Update schedule
    Object.assign(schedule, updates);

    // Reschedule if enabled
    if (schedule.enabled && this.isRunning) {
      this.scheduleTask(scheduleId, schedule);
    }

    logger.info('Maintenance schedule updated', {
      scheduleId,
      enabled: schedule.enabled
    });
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }

    this.schedules.delete(scheduleId);

    logger.info('Maintenance schedule deleted', { scheduleId });
  }

  getSchedules(): MaintenanceSchedule[] {
    return Array.from(this.schedules.values());
  }

  getSchedule(scheduleId: string): MaintenanceSchedule | undefined {
    return this.schedules.get(scheduleId);
  }

  async runMaintenanceNow(scheduleId: string): Promise<MaintenanceReport> {
    return this.executeScheduledMaintenance(scheduleId);
  }

  async getMaintenanceStatus(): Promise<{
    schedulerRunning: boolean;
    activeSchedules: number;
    nextRun?: string;
    lastRun?: string;
  }> {
    const activeSchedules = Array.from(this.schedules.values()).filter(s => s.enabled);
    const nextRuns = activeSchedules
      .map(s => s.nextRun)
      .filter(Boolean)
      .sort();
    
    const lastRuns = activeSchedules
      .map(s => s.lastRun)
      .filter(Boolean)
      .sort()
      .reverse();

    return {
      schedulerRunning: this.isRunning,
      activeSchedules: activeSchedules.length,
      nextRun: nextRuns[0],
      lastRun: lastRuns[0]
    };
  }
}

// Export singleton instance
export const maintenanceScheduler = MaintenanceScheduler.getInstance();

// Initialize maintenance system
export async function initializeMaintenanceSystem(): Promise<void> {
  logger.info('Initializing maintenance system');

  // Start the scheduler
  await maintenanceScheduler.startScheduler();

  logger.info('Maintenance system initialized successfully');
}

// Shutdown maintenance system
export async function shutdownMaintenanceSystem(): Promise<void> {
  logger.info('Shutting down maintenance system');

  // Stop the scheduler
  await maintenanceScheduler.stopScheduler();

  logger.info('Maintenance system shutdown complete');
}
