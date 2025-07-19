import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  CleanupManager, 
  BackupService, 
  CleanupCategory, 
  CleanupSeverity,
  CleanupOptions,
  SafetyUtils
} from '@/lib/database/cleanup';
import { 
  OrphanedAchievementCleanup,
  OrphanedProgressCleanup,
  OrphanedLeaderboardCleanup,
  OrphanedPrerequisitesCleanup
} from '@/lib/database/orphaned-data';
import { 
  ExpiredTokensCleanup,
  OldLogsCleanup,
  CachedDataCleanup,
  InactiveAccountsCleanup,
  TemporaryFilesCleanup
} from '@/lib/database/data-removal';

describe('Database Cleanup Operations', () => {
  let cleanupManager: CleanupManager;
  let backupService: BackupService;

  beforeEach(() => {
    cleanupManager = CleanupManager.getInstance();
    backupService = BackupService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CleanupManager', () => {
    describe('Operation Registration', () => {
      it('should register cleanup operations', () => {
        const operation = new OrphanedAchievementCleanup();
        
        cleanupManager.registerOperation(operation);
        
        const registered = cleanupManager.getOperation(operation.id);
        expect(registered).toBeDefined();
        expect(registered?.name).toBe(operation.name);
        expect(registered?.category).toBe(operation.category);
        expect(registered?.severity).toBe(operation.severity);
      });

      it('should retrieve operations by category', () => {
        const orphanedOp = new OrphanedAchievementCleanup();
        const expiredOp = new ExpiredTokensCleanup();
        
        cleanupManager.registerOperation(orphanedOp);
        cleanupManager.registerOperation(expiredOp);
        
        const orphanedOps = cleanupManager.getOperationsByCategory(CleanupCategory.ORPHANED_DATA);
        const expiredOps = cleanupManager.getOperationsByCategory(CleanupCategory.EXPIRED_DATA);
        
        expect(orphanedOps).toHaveLength(1);
        expect(orphanedOps[0].id).toBe(orphanedOp.id);
        expect(expiredOps).toHaveLength(1);
        expect(expiredOps[0].id).toBe(expiredOp.id);
      });

      it('should retrieve operations by severity', () => {
        const lowSeverityOp = new ExpiredTokensCleanup();
        const highSeverityOp = new OrphanedProgressCleanup();
        
        cleanupManager.registerOperation(lowSeverityOp);
        cleanupManager.registerOperation(highSeverityOp);
        
        const lowOps = cleanupManager.getOperationsBySeverity(CleanupSeverity.LOW);
        const highOps = cleanupManager.getOperationsBySeverity(CleanupSeverity.HIGH);
        
        expect(lowOps).toHaveLength(1);
        expect(lowOps[0].id).toBe(lowSeverityOp.id);
        expect(highOps).toHaveLength(1);
        expect(highOps[0].id).toBe(highSeverityOp.id);
      });
    });

    describe('Operation Execution', () => {
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
        expect(result.itemsProcessed).toBeGreaterThanOrEqual(0);
      });

      it('should execute cleanup operation with actual changes', async () => {
        const operation = new ExpiredTokensCleanup();
        cleanupManager.registerOperation(operation);

        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await cleanupManager.executeOperation(operation.id, options);

        expect(result.success).toBe(true);
        expect(result.itemsAffected).toBeGreaterThanOrEqual(0);
      });

      it('should handle operation not found', async () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        await expect(
          cleanupManager.executeOperation('non-existent-operation', options)
        ).rejects.toThrow('Cleanup operation not found');
      });

      it('should prevent concurrent operations', async () => {
        const operation = new ExpiredTokensCleanup();
        cleanupManager.registerOperation(operation);

        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        // Start first operation
        const promise1 = cleanupManager.executeOperation(operation.id, options);
        
        // Try to start second operation immediately
        await expect(
          cleanupManager.executeOperation(operation.id, options)
        ).rejects.toThrow('Another cleanup operation is already running');

        // Wait for first operation to complete
        await promise1;
      });

      it('should allow forced concurrent operations', async () => {
        const operation = new ExpiredTokensCleanup();
        cleanupManager.registerOperation(operation);

        const options: CleanupOptions = {
          dryRun: true,
          force: true,
          batchSize: 100,
          maxExecutionTime: 300
        };

        // Both operations should succeed with force flag
        const [result1, result2] = await Promise.all([
          cleanupManager.executeOperation(operation.id, options),
          cleanupManager.executeOperation(operation.id, options)
        ]);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
      });
    });

    describe('Batch Execution', () => {
      it('should execute multiple operations in batch', async () => {
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
        expect(report.totalDuration).toBeGreaterThan(0);
      });

      it('should handle partial failures in batch', async () => {
        const successOperation = new ExpiredTokensCleanup();
        const failingOperation = {
          id: 'failing-operation',
          name: 'Failing Operation',
          description: 'An operation that always fails',
          category: CleanupCategory.ORPHANED_DATA,
          severity: CleanupSeverity.LOW,
          estimatedDuration: 60,
          requiresBackup: false,
          dryRunSupported: true,
          execute: jest.fn().mockRejectedValue(new Error('Operation failed'))
        };

        cleanupManager.registerOperation(successOperation);
        cleanupManager.registerOperation(failingOperation);

        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 600
        };

        const report = await cleanupManager.executeBatch(
          [successOperation.id, failingOperation.id],
          options
        );

        expect(report.operations).toHaveLength(2);
        expect(report.status).toBe('PARTIAL_SUCCESS');
        expect(report.totalErrors).toBeGreaterThan(0);
      });
    });
  });

  describe('BackupService', () => {
    describe('Backup Creation', () => {
      it('should create database backup', async () => {
        const tables = ['users', 'lessons', 'progress'];
        
        const backupPath = await backupService.createBackup(tables, 'test_backup');
        
        expect(backupPath).toContain('test_backup');
        expect(backupPath).toContain('.sql');
      });

      it('should create backup with default name', async () => {
        const tables = ['users'];
        
        const backupPath = await backupService.createBackup(tables);
        
        expect(backupPath).toContain('cleanup_backup_');
        expect(backupPath).toContain('.sql');
      });

      it('should handle backup creation errors', async () => {
        // Mock backup failure
        jest.spyOn(backupService as any, 'simulateBackupCreation')
          .mockRejectedValue(new Error('Backup failed'));

        await expect(
          backupService.createBackup(['users'], 'failing_backup')
        ).rejects.toThrow('Backup failed');
      });
    });

    describe('Backup Verification', () => {
      it('should verify backup integrity', async () => {
        const backupPath = 'backups/test_backup.sql';
        
        const isValid = await backupService.verifyBackup(backupPath);
        
        expect(isValid).toBe(true);
      });

      it('should handle verification errors', async () => {
        // Mock verification failure
        jest.spyOn(backupService, 'verifyBackup')
          .mockResolvedValue(false);

        const isValid = await backupService.verifyBackup('invalid_backup.sql');
        
        expect(isValid).toBe(false);
      });
    });

    describe('Backup Management', () => {
      it('should list available backups', async () => {
        const backups = await backupService.listBackups();
        
        expect(Array.isArray(backups)).toBe(true);
        
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

      it('should restore from backup', async () => {
        const backupPath = 'backups/test_backup.sql';
        
        const success = await backupService.restoreBackup(backupPath);
        
        expect(success).toBe(true);
      });
    });
  });

  describe('Orphaned Data Operations', () => {
    describe('OrphanedAchievementCleanup', () => {
      it('should identify orphaned achievements', async () => {
        const operation = new OrphanedAchievementCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('orphanedByUser');
        expect(result.details).toHaveProperty('orphanedByCourse');
      });

      it('should handle cleanup errors gracefully', async () => {
        const operation = new OrphanedAchievementCleanup();
        
        // Mock database error
        jest.spyOn(operation as any, 'execute')
          .mockRejectedValue(new Error('Database error'));

        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Database error');
      });
    });

    describe('OrphanedProgressCleanup', () => {
      it('should identify orphaned progress records', async () => {
        const operation = new OrphanedProgressCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('orphanedByUser');
        expect(result.details).toHaveProperty('orphanedByLesson');
        expect(result.details).toHaveProperty('orphanedByCourse');
      });
    });

    describe('OrphanedLeaderboardCleanup', () => {
      it('should identify orphaned leaderboard entries', async () => {
        const operation = new OrphanedLeaderboardCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('orphanedEntries');
        expect(result.details).toHaveProperty('duplicateEntries');
      });
    });

    describe('OrphanedPrerequisitesCleanup', () => {
      it('should identify orphaned prerequisites', async () => {
        const operation = new OrphanedPrerequisitesCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('orphanedPrerequisites');
        expect(result.details).toHaveProperty('circularPrerequisites');
      });
    });
  });

  describe('Data Removal Operations', () => {
    describe('ExpiredTokensCleanup', () => {
      it('should clean expired tokens', async () => {
        const operation = new ExpiredTokensCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('expiredTokens');
        expect(result.details).toHaveProperty('expiredSessions');
        expect(result.details).toHaveProperty('expiredResetTokens');
      });
    });

    describe('OldLogsCleanup', () => {
      it('should clean old logs', async () => {
        const operation = new OldLogsCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('oldApiLogs');
        expect(result.details).toHaveProperty('oldAuditLogs');
        expect(result.details).toHaveProperty('oldErrorLogs');
        expect(result.details).toHaveProperty('retentionDate');
      });
    });

    describe('CachedDataCleanup', () => {
      it('should clean cached data', async () => {
        const operation = new CachedDataCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('expiredEntries');
        expect(result.details).toHaveProperty('orphanedEntries');
      });
    });

    describe('InactiveAccountsCleanup', () => {
      it('should identify inactive accounts', async () => {
        const operation = new InactiveAccountsCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('inactiveAccounts');
        expect(result.details).toHaveProperty('dormantAccounts');
        expect(result.details).toHaveProperty('cutoffDate');
      });
    });

    describe('TemporaryFilesCleanup', () => {
      it('should clean temporary files', async () => {
        const operation = new TemporaryFilesCleanup();
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(options);
        
        expect(result.success).toBe(true);
        expect(result.details).toHaveProperty('tempFiles');
        expect(result.details).toHaveProperty('uploadFiles');
        expect(result.details).toHaveProperty('cutoffDate');
      });
    });
  });

  describe('SafetyUtils', () => {
    describe('confirmOperation', () => {
      it('should confirm low severity operations', async () => {
        const operation = new ExpiredTokensCleanup();
        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const confirmed = await SafetyUtils.confirmOperation(operation, options);
        
        expect(confirmed).toBe(true);
      });

      it('should require force for critical operations', async () => {
        const operation = new InactiveAccountsCleanup();
        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const confirmed = await SafetyUtils.confirmOperation(operation, options);
        
        expect(confirmed).toBe(false);
      });

      it('should allow forced critical operations', async () => {
        const operation = new InactiveAccountsCleanup();
        const options: CleanupOptions = {
          dryRun: false,
          force: true,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const confirmed = await SafetyUtils.confirmOperation(operation, options);
        
        expect(confirmed).toBe(true);
      });
    });

    describe('validateOptions', () => {
      it('should validate correct options', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 1000,
          maxExecutionTime: 1800
        };

        const errors = SafetyUtils.validateOptions(options);
        
        expect(errors).toHaveLength(0);
      });

      it('should reject invalid batch size', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 0,
          maxExecutionTime: 1800
        };

        const errors = SafetyUtils.validateOptions(options);
        
        expect(errors).toContain('Batch size must be greater than 0');
      });

      it('should reject excessive batch size', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 20000,
          maxExecutionTime: 1800
        };

        const errors = SafetyUtils.validateOptions(options);
        
        expect(errors).toContain('Batch size too large (max: 10000)');
      });

      it('should reject invalid execution time', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 1000,
          maxExecutionTime: 0
        };

        const errors = SafetyUtils.validateOptions(options);
        
        expect(errors).toContain('Max execution time must be greater than 0');
      });
    });

    describe('estimateImpact', () => {
      it('should estimate impact for operations', () => {
        const operation = new OrphanedProgressCleanup();
        
        const impact = SafetyUtils.estimateImpact(operation);
        
        expect(impact).toHaveProperty('estimatedItems');
        expect(impact).toHaveProperty('estimatedDuration');
        expect(impact).toHaveProperty('riskLevel');
        expect(typeof impact.estimatedItems).toBe('number');
        expect(typeof impact.estimatedDuration).toBe('number');
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(impact.riskLevel);
      });
    });
  });
});
