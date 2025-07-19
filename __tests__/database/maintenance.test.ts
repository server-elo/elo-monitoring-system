import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  CleanupManager, 
  BackupService, 
  CleanupCategory, 
  CleanupSeverity,
  CleanupOptions 
} from '@/lib/database/cleanup';
import { 
  OrphanedAchievementCleanup,
  OrphanedProgressCleanup 
} from '@/lib/database/orphaned-data';
import { ExpiredTokensCleanup } from '@/lib/database/data-removal';
import { 
  MaintenanceScheduler,
  MaintenanceSchedule 
} from '@/lib/database/maintenance';
import { MigrationManager } from '@/lib/database/migrations';

describe('Database Maintenance System', () => {
  let cleanupManager: CleanupManager;
  let backupService: BackupService;
  let maintenanceScheduler: MaintenanceScheduler;
  let migrationManager: MigrationManager;

  beforeEach(() => {
    cleanupManager = CleanupManager.getInstance();
    backupService = BackupService.getInstance();
    maintenanceScheduler = MaintenanceScheduler.getInstance();
    migrationManager = MigrationManager.getInstance();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await maintenanceScheduler.stopScheduler();
    jest.restoreAllMocks();
  });

  describe('CleanupManager', () => {
    it('should register cleanup operations', () => {
      const operation = new OrphanedAchievementCleanup();
      cleanupManager.registerOperation(operation);

      const registered = cleanupManager.getOperation(operation.id);
      expect(registered).toBeDefined();
      expect(registered?.name).toBe(operation.name);
    });

    it('should execute cleanup operation in dry run mode', async () => {
      const operation = new ExpiredTokensCleanup();
      cleanupManager.registerOperation(operation);

      const options: CleanupOptions = {
        dryRun: true,
        force: false,
        batchSize: 100,
        maxExecutionTime: 300
      };

      const result = await cleanupManager.executeOperation(operation.id, options);

      expect(result.success).toBe(true);
      expect(result.operation).toBe(operation.name);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should execute batch cleanup operations', async () => {
      const operation1 = new OrphanedAchievementCleanup();
      const operation2 = new ExpiredTokensCleanup();
      
      cleanupManager.registerOperation(operation1);
      cleanupManager.registerOperation(operation2);

      const options: CleanupOptions = {
        dryRun: true,
        force: false,
        batchSize: 100,
        maxExecutionTime: 600
      };

      const report = await cleanupManager.executeBatch(
        [operation1.id, operation2.id],
        options
      );

      expect(report.operations).toHaveLength(2);
      expect(report.status).toBe('SUCCESS');
      expect(report.totalItemsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should handle cleanup operation failures gracefully', async () => {
      const mockOperation = {
        id: 'failing_operation',
        name: 'Failing Operation',
        description: 'An operation that always fails',
        category: CleanupCategory.ORPHANED_DATA,
        severity: CleanupSeverity.LOW,
        estimatedDuration: 60,
        requiresBackup: false,
        dryRunSupported: true,
        execute: jest.fn().mockRejectedValue(new Error('Operation failed'))
      };

      cleanupManager.registerOperation(mockOperation);

      const options: CleanupOptions = {
        dryRun: false,
        force: false,
        batchSize: 100,
        maxExecutionTime: 300
      };

      const result = await cleanupManager.executeOperation(mockOperation.id, options);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Operation failed');
    });

    it('should filter operations by category', () => {
      const operation1 = new OrphanedAchievementCleanup();
      const operation2 = new ExpiredTokensCleanup();
      
      cleanupManager.registerOperation(operation1);
      cleanupManager.registerOperation(operation2);

      const orphanedOps = cleanupManager.getOperationsByCategory(CleanupCategory.ORPHANED_DATA);
      const expiredOps = cleanupManager.getOperationsByCategory(CleanupCategory.EXPIRED_DATA);

      expect(orphanedOps).toHaveLength(1);
      expect(orphanedOps[0].id).toBe(operation1.id);
      expect(expiredOps).toHaveLength(1);
      expect(expiredOps[0].id).toBe(operation2.id);
    });

    it('should filter operations by severity', () => {
      const operation1 = new OrphanedProgressCleanup(); // HIGH severity
      const operation2 = new ExpiredTokensCleanup(); // LOW severity
      
      cleanupManager.registerOperation(operation1);
      cleanupManager.registerOperation(operation2);

      const highSeverityOps = cleanupManager.getOperationsBySeverity(CleanupSeverity.HIGH);
      const lowSeverityOps = cleanupManager.getOperationsBySeverity(CleanupSeverity.LOW);

      expect(highSeverityOps).toHaveLength(1);
      expect(highSeverityOps[0].id).toBe(operation1.id);
      expect(lowSeverityOps).toHaveLength(1);
      expect(lowSeverityOps[0].id).toBe(operation2.id);
    });
  });

  describe('BackupService', () => {
    it('should create database backup', async () => {
      const tables = ['users', 'lessons', 'progress'];
      const backupPath = await backupService.createBackup(tables, 'test_backup');

      expect(backupPath).toContain('test_backup');
      expect(backupPath).toContain('.sql');
    });

    it('should verify backup integrity', async () => {
      const backupPath = 'backups/test_backup.sql';
      const isValid = await backupService.verifyBackup(backupPath);

      expect(isValid).toBe(true);
    });

    it('should list available backups', async () => {
      const backups = await backupService.listBackups();

      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBeGreaterThanOrEqual(0);
      
      if (backups.length > 0) {
        expect(backups[0]).toHaveProperty('name');
        expect(backups[0]).toHaveProperty('path');
        expect(backups[0]).toHaveProperty('size');
        expect(backups[0]).toHaveProperty('created');
        expect(backups[0]).toHaveProperty('tables');
      }
    });

    it('should delete old backups', async () => {
      const deletedCount = await backupService.deleteOldBackups(30);

      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('MaintenanceScheduler', () => {
    it('should start and stop scheduler', async () => {
      await maintenanceScheduler.startScheduler();
      let status = await maintenanceScheduler.getMaintenanceStatus();
      expect(status.schedulerRunning).toBe(true);

      await maintenanceScheduler.stopScheduler();
      status = await maintenanceScheduler.getMaintenanceStatus();
      expect(status.schedulerRunning).toBe(false);
    });

    it('should add and retrieve maintenance schedules', async () => {
      const schedule: MaintenanceSchedule = {
        id: 'test_schedule',
        name: 'Test Schedule',
        description: 'A test maintenance schedule',
        operations: ['expired_tokens'],
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
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        },
        notifications: {
          onSuccess: false,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com'],
          channels: ['email']
        }
      };

      await maintenanceScheduler.addSchedule(schedule);
      const retrieved = maintenanceScheduler.getSchedule(schedule.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(schedule.name);
      expect(retrieved?.enabled).toBe(true);
    });

    it('should update maintenance schedule', async () => {
      const schedule: MaintenanceSchedule = {
        id: 'update_test_schedule',
        name: 'Update Test Schedule',
        description: 'A schedule for testing updates',
        operations: ['expired_tokens'],
        schedule: {
          minute: '0',
          hour: '3',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        },
        notifications: {
          onSuccess: false,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com'],
          channels: ['email']
        }
      };

      await maintenanceScheduler.addSchedule(schedule);
      
      await maintenanceScheduler.updateSchedule(schedule.id, {
        enabled: false,
        name: 'Updated Schedule Name'
      });

      const updated = maintenanceScheduler.getSchedule(schedule.id);
      expect(updated?.enabled).toBe(false);
      expect(updated?.name).toBe('Updated Schedule Name');
    });

    it('should delete maintenance schedule', async () => {
      const schedule: MaintenanceSchedule = {
        id: 'delete_test_schedule',
        name: 'Delete Test Schedule',
        description: 'A schedule for testing deletion',
        operations: ['expired_tokens'],
        schedule: {
          minute: '0',
          hour: '4',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        },
        notifications: {
          onSuccess: false,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com'],
          channels: ['email']
        }
      };

      await maintenanceScheduler.addSchedule(schedule);
      expect(maintenanceScheduler.getSchedule(schedule.id)).toBeDefined();

      await maintenanceScheduler.deleteSchedule(schedule.id);
      expect(maintenanceScheduler.getSchedule(schedule.id)).toBeUndefined();
    });

    it('should execute scheduled maintenance', async () => {
      // Register a test cleanup operation
      const testOperation = new ExpiredTokensCleanup();
      cleanupManager.registerOperation(testOperation);

      const schedule: MaintenanceSchedule = {
        id: 'execute_test_schedule',
        name: 'Execute Test Schedule',
        description: 'A schedule for testing execution',
        operations: [testOperation.id],
        schedule: {
          minute: '0',
          hour: '5',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        },
        notifications: {
          onSuccess: false,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com'],
          channels: ['email']
        }
      };

      await maintenanceScheduler.addSchedule(schedule);
      const report = await maintenanceScheduler.runMaintenanceNow(schedule.id);

      expect(report.status).toBe('SUCCESS');
      expect(report.operations).toHaveLength(1);
      expect(report.duration).toBeGreaterThan(0);
      expect(report.systemMetrics).toBeDefined();
    });
  });

  describe('MigrationManager', () => {
    it('should get migration status', async () => {
      const status = await migrationManager.getMigrationStatus();

      expect(status).toHaveProperty('applied');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('total');
      expect(typeof status.applied).toBe('number');
      expect(typeof status.pending).toBe('number');
      expect(typeof status.total).toBe('number');
    });

    it('should get applied migrations', async () => {
      const applied = await migrationManager.getAppliedMigrations();

      expect(Array.isArray(applied)).toBe(true);
      applied.forEach(migration => {
        expect(migration).toHaveProperty('id');
        expect(migration).toHaveProperty('appliedAt');
        expect(migration).toHaveProperty('rollbackAvailable');
        expect(migration).toHaveProperty('checksum');
      });
    });

    it('should get pending migrations', async () => {
      const pending = await migrationManager.getPendingMigrations();

      expect(Array.isArray(pending)).toBe(true);
      pending.forEach(migration => {
        expect(migration).toHaveProperty('id');
        expect(migration).toHaveProperty('name');
        expect(migration).toHaveProperty('description');
        expect(migration).toHaveProperty('version');
        expect(migration).toHaveProperty('up');
        expect(migration).toHaveProperty('down');
      });
    });

    it('should create migration plan', async () => {
      const plan = await migrationManager.createMigrationPlan();

      expect(plan).toHaveProperty('migrations');
      expect(plan).toHaveProperty('totalEstimatedDuration');
      expect(plan).toHaveProperty('requiresBackup');
      expect(plan).toHaveProperty('dataTransformations');
      expect(plan).toHaveProperty('dependencies');
      expect(Array.isArray(plan.migrations)).toBe(true);
      expect(typeof plan.totalEstimatedDuration).toBe('number');
      expect(typeof plan.requiresBackup).toBe('boolean');
    });

    it('should test migration', async () => {
      const pending = await migrationManager.getPendingMigrations();
      
      if (pending.length > 0) {
        const testResult = await migrationManager.testMigration(pending[0].id);

        expect(testResult).toHaveProperty('syntaxValid');
        expect(testResult).toHaveProperty('dependenciesMet');
        expect(testResult).toHaveProperty('estimatedImpact');
        expect(testResult).toHaveProperty('warnings');
        expect(typeof testResult.syntaxValid).toBe('boolean');
        expect(typeof testResult.dependenciesMet).toBe('boolean');
        expect(Array.isArray(testResult.warnings)).toBe(true);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should execute complete maintenance workflow', async () => {
      // Register cleanup operations
      const operation1 = new OrphanedAchievementCleanup();
      const operation2 = new ExpiredTokensCleanup();
      cleanupManager.registerOperation(operation1);
      cleanupManager.registerOperation(operation2);

      // Create maintenance schedule
      const schedule: MaintenanceSchedule = {
        id: 'integration_test_schedule',
        name: 'Integration Test Schedule',
        description: 'Complete workflow test',
        operations: [operation1.id, operation2.id],
        schedule: {
          minute: '0',
          hour: '6',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
          timezone: 'UTC'
        },
        enabled: true,
        options: {
          dryRun: true,
          force: false,
          batchSize: 50,
          maxExecutionTime: 600
        },
        notifications: {
          onSuccess: true,
          onFailure: true,
          onWarnings: true,
          recipients: ['admin@example.com'],
          channels: ['email']
        }
      };

      // Add schedule and execute
      await maintenanceScheduler.addSchedule(schedule);
      const report = await maintenanceScheduler.runMaintenanceNow(schedule.id);

      // Verify results
      expect(report.status).toBe('SUCCESS');
      expect(report.operations).toHaveLength(1);
      expect(report.operations[0].operations).toHaveLength(2);
      expect(report.systemMetrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);

      // Cleanup
      await maintenanceScheduler.deleteSchedule(schedule.id);
    });
  });
});
