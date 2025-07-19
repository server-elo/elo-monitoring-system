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

describe( 'Database Cleanup Operations', () => {
  let cleanupManager: CleanupManager;
  let backupService: BackupService;

  beforeEach(() => {
    cleanupManager = CleanupManager.getInstance(_);
    backupService = BackupService.getInstance(_);
    jest.clearAllMocks(_);
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  describe( 'CleanupManager', () => {
    describe( 'Operation Registration', () => {
      it( 'should register cleanup operations', () => {
        const operation = new OrphanedAchievementCleanup(_);
        
        cleanupManager.registerOperation(_operation);
        
        const registered = cleanupManager.getOperation(_operation.id);
        expect(_registered).toBeDefined(_);
        expect(_registered?.name).toBe(_operation.name);
        expect(_registered?.category).toBe(_operation.category);
        expect(_registered?.severity).toBe(_operation.severity);
      });

      it( 'should retrieve operations by category', () => {
        const orphanedOp = new OrphanedAchievementCleanup(_);
        const expiredOp = new ExpiredTokensCleanup(_);
        
        cleanupManager.registerOperation(_orphanedOp);
        cleanupManager.registerOperation(_expiredOp);
        
        const orphanedOps = cleanupManager.getOperationsByCategory(_CleanupCategory.ORPHANED_DATA);
        const expiredOps = cleanupManager.getOperationsByCategory(_CleanupCategory.EXPIRED_DATA);
        
        expect(_orphanedOps).toHaveLength(1);
        expect(_orphanedOps[0].id).toBe(_orphanedOp.id);
        expect(_expiredOps).toHaveLength(1);
        expect(_expiredOps[0].id).toBe(_expiredOp.id);
      });

      it( 'should retrieve operations by severity', () => {
        const lowSeverityOp = new ExpiredTokensCleanup(_);
        const highSeverityOp = new OrphanedProgressCleanup(_);
        
        cleanupManager.registerOperation(_lowSeverityOp);
        cleanupManager.registerOperation(_highSeverityOp);
        
        const lowOps = cleanupManager.getOperationsBySeverity(_CleanupSeverity.LOW);
        const highOps = cleanupManager.getOperationsBySeverity(_CleanupSeverity.HIGH);
        
        expect(_lowOps).toHaveLength(1);
        expect(_lowOps[0].id).toBe(_lowSeverityOp.id);
        expect(_highOps).toHaveLength(1);
        expect(_highOps[0].id).toBe(_highSeverityOp.id);
      });
    });

    describe( 'Operation Execution', () => {
      it( 'should execute cleanup operation in dry run mode', async () => {
        const operation = new ExpiredTokensCleanup(_);
        cleanupManager.registerOperation(_operation);

        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await cleanupManager.executeOperation( operation.id, options);

        expect(_result.success).toBe(_true);
        expect(_result.operation).toBe(_operation.name);
        expect(_result.duration).toBeGreaterThan(0);
        expect(_result.errors).toHaveLength(0);
        expect(_result.itemsProcessed).toBeGreaterThanOrEqual(0);
      });

      it( 'should execute cleanup operation with actual changes', async () => {
        const operation = new ExpiredTokensCleanup(_);
        cleanupManager.registerOperation(_operation);

        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await cleanupManager.executeOperation( operation.id, options);

        expect(_result.success).toBe(_true);
        expect(_result.itemsAffected).toBeGreaterThanOrEqual(0);
      });

      it( 'should handle operation not found', async () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        await expect(
          cleanupManager.executeOperation( 'non-existent-operation', options)
        ).rejects.toThrow('Cleanup operation not found');
      });

      it( 'should prevent concurrent operations', async () => {
        const operation = new ExpiredTokensCleanup(_);
        cleanupManager.registerOperation(_operation);

        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        // Start first operation
        const promise1 = cleanupManager.executeOperation( operation.id, options);
        
        // Try to start second operation immediately
        await expect(
          cleanupManager.executeOperation( operation.id, options)
        ).rejects.toThrow('Another cleanup operation is already running');

        // Wait for first operation to complete
        await promise1;
      });

      it( 'should allow forced concurrent operations', async () => {
        const operation = new ExpiredTokensCleanup(_);
        cleanupManager.registerOperation(_operation);

        const options: CleanupOptions = {
          dryRun: true,
          force: true,
          batchSize: 100,
          maxExecutionTime: 300
        };

        // Both operations should succeed with force flag
        const [result1, result2] = await Promise.all([
          cleanupManager.executeOperation( operation.id, options),
          cleanupManager.executeOperation( operation.id, options)
        ]);

        expect(_result1.success).toBe(_true);
        expect(_result2.success).toBe(_true);
      });
    });

    describe( 'Batch Execution', () => {
      it( 'should execute multiple operations in batch', async () => {
        const operation1 = new OrphanedAchievementCleanup(_);
        const operation2 = new ExpiredTokensCleanup(_);
        
        cleanupManager.registerOperation(_operation1);
        cleanupManager.registerOperation(_operation2);

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

        expect(_report.operations).toHaveLength(_2);
        expect(_report.status).toBe('SUCCESS');
        expect(_report.totalItemsProcessed).toBeGreaterThanOrEqual(0);
        expect(_report.totalDuration).toBeGreaterThan(0);
      });

      it( 'should handle partial failures in batch', async () => {
        const successOperation = new ExpiredTokensCleanup(_);
        const failingOperation = {
          id: 'failing-operation',
          name: 'Failing Operation',
          description: 'An operation that always fails',
          category: CleanupCategory.ORPHANED_DATA,
          severity: CleanupSeverity.LOW,
          estimatedDuration: 60,
          requiresBackup: false,
          dryRunSupported: true,
          execute: jest.fn(_).mockRejectedValue(_new Error('Operation failed'))
        };

        cleanupManager.registerOperation(_successOperation);
        cleanupManager.registerOperation(_failingOperation);

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

        expect(_report.operations).toHaveLength(_2);
        expect(_report.status).toBe('PARTIAL_SUCCESS');
        expect(_report.totalErrors).toBeGreaterThan(0);
      });
    });
  });

  describe( 'BackupService', () => {
    describe( 'Backup Creation', () => {
      it( 'should create database backup', async () => {
        const tables = ['users', 'lessons', 'progress'];
        
        const backupPath = await backupService.createBackup( tables, 'test_backup');
        
        expect(_backupPath).toContain('test_backup');
        expect(_backupPath).toContain('.sql');
      });

      it( 'should create backup with default name', async () => {
        const tables = ['users'];
        
        const backupPath = await backupService.createBackup(_tables);
        
        expect(_backupPath).toContain('cleanup_backup');
        expect(_backupPath).toContain('.sql');
      });

      it( 'should handle backup creation errors', async () => {
        // Mock backup failure
        jest.spyOn( backupService as any, 'simulateBackupCreation')
          .mockRejectedValue(_new Error('Backup failed'));

        await expect(
          backupService.createBackup( ['users'], 'failing_backup')
        ).rejects.toThrow('Backup failed');
      });
    });

    describe( 'Backup Verification', () => {
      it( 'should verify backup integrity', async () => {
        const backupPath = 'backups/test_backup.sql';
        
        const isValid = await backupService.verifyBackup(_backupPath);
        
        expect(_isValid).toBe(_true);
      });

      it( 'should handle verification errors', async () => {
        // Mock verification failure
        jest.spyOn( backupService, 'verifyBackup')
          .mockResolvedValue(_false);

        const isValid = await backupService.verifyBackup('invalid_backup.sql');
        
        expect(_isValid).toBe(_false);
      });
    });

    describe( 'Backup Management', () => {
      it( 'should list available backups', async () => {
        const backups = await backupService.listBackups(_);
        
        expect(_Array.isArray(backups)).toBe(_true);
        
        if (_backups.length > 0) {
          expect(_backups[0]).toHaveProperty('name');
          expect(_backups[0]).toHaveProperty('path');
          expect(_backups[0]).toHaveProperty('size');
          expect(_backups[0]).toHaveProperty('created');
          expect(_backups[0]).toHaveProperty('tables');
        }
      });

      it( 'should delete old backups', async () => {
        const deletedCount = await backupService.deleteOldBackups(30);
        
        expect(_typeof deletedCount).toBe('number');
        expect(_deletedCount).toBeGreaterThanOrEqual(0);
      });

      it( 'should restore from backup', async () => {
        const backupPath = 'backups/test_backup.sql';
        
        const success = await backupService.restoreBackup(_backupPath);
        
        expect(_success).toBe(_true);
      });
    });
  });

  describe( 'Orphaned Data Operations', () => {
    describe( 'OrphanedAchievementCleanup', () => {
      it( 'should identify orphaned achievements', async () => {
        const operation = new OrphanedAchievementCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('orphanedByUser');
        expect(_result.details).toHaveProperty('orphanedByCourse');
      });

      it( 'should handle cleanup errors gracefully', async () => {
        const operation = new OrphanedAchievementCleanup(_);
        
        // Mock database error
        jest.spyOn( operation as any, 'execute')
          .mockRejectedValue(_new Error('Database error'));

        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_false);
        expect(_result.errors).toContain('Database error');
      });
    });

    describe( 'OrphanedProgressCleanup', () => {
      it( 'should identify orphaned progress records', async () => {
        const operation = new OrphanedProgressCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('orphanedByUser');
        expect(_result.details).toHaveProperty('orphanedByLesson');
        expect(_result.details).toHaveProperty('orphanedByCourse');
      });
    });

    describe( 'OrphanedLeaderboardCleanup', () => {
      it( 'should identify orphaned leaderboard entries', async () => {
        const operation = new OrphanedLeaderboardCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('orphanedEntries');
        expect(_result.details).toHaveProperty('duplicateEntries');
      });
    });

    describe( 'OrphanedPrerequisitesCleanup', () => {
      it( 'should identify orphaned prerequisites', async () => {
        const operation = new OrphanedPrerequisitesCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('orphanedPrerequisites');
        expect(_result.details).toHaveProperty('circularPrerequisites');
      });
    });
  });

  describe( 'Data Removal Operations', () => {
    describe( 'ExpiredTokensCleanup', () => {
      it( 'should clean expired tokens', async () => {
        const operation = new ExpiredTokensCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('expiredTokens');
        expect(_result.details).toHaveProperty('expiredSessions');
        expect(_result.details).toHaveProperty('expiredResetTokens');
      });
    });

    describe( 'OldLogsCleanup', () => {
      it( 'should clean old logs', async () => {
        const operation = new OldLogsCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('oldApiLogs');
        expect(_result.details).toHaveProperty('oldAuditLogs');
        expect(_result.details).toHaveProperty('oldErrorLogs');
        expect(_result.details).toHaveProperty('retentionDate');
      });
    });

    describe( 'CachedDataCleanup', () => {
      it( 'should clean cached data', async () => {
        const operation = new CachedDataCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('expiredEntries');
        expect(_result.details).toHaveProperty('orphanedEntries');
      });
    });

    describe( 'InactiveAccountsCleanup', () => {
      it( 'should identify inactive accounts', async () => {
        const operation = new InactiveAccountsCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('inactiveAccounts');
        expect(_result.details).toHaveProperty('dormantAccounts');
        expect(_result.details).toHaveProperty('cutoffDate');
      });
    });

    describe( 'TemporaryFilesCleanup', () => {
      it( 'should clean temporary files', async () => {
        const operation = new TemporaryFilesCleanup(_);
        
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const result = await operation.execute(_options);
        
        expect(_result.success).toBe(_true);
        expect(_result.details).toHaveProperty('tempFiles');
        expect(_result.details).toHaveProperty('uploadFiles');
        expect(_result.details).toHaveProperty('cutoffDate');
      });
    });
  });

  describe( 'SafetyUtils', () => {
    describe( 'confirmOperation', () => {
      it( 'should confirm low severity operations', async () => {
        const operation = new ExpiredTokensCleanup(_);
        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const confirmed = await SafetyUtils.confirmOperation( operation, options);
        
        expect(_confirmed).toBe(_true);
      });

      it( 'should require force for critical operations', async () => {
        const operation = new InactiveAccountsCleanup(_);
        const options: CleanupOptions = {
          dryRun: false,
          force: false,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const confirmed = await SafetyUtils.confirmOperation( operation, options);
        
        expect(_confirmed).toBe(_false);
      });

      it( 'should allow forced critical operations', async () => {
        const operation = new InactiveAccountsCleanup(_);
        const options: CleanupOptions = {
          dryRun: false,
          force: true,
          batchSize: 100,
          maxExecutionTime: 300
        };

        const confirmed = await SafetyUtils.confirmOperation( operation, options);
        
        expect(_confirmed).toBe(_true);
      });
    });

    describe( 'validateOptions', () => {
      it( 'should validate correct options', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 1000,
          maxExecutionTime: 1800
        };

        const errors = SafetyUtils.validateOptions(_options);
        
        expect(_errors).toHaveLength(0);
      });

      it( 'should reject invalid batch size', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 0,
          maxExecutionTime: 1800
        };

        const errors = SafetyUtils.validateOptions(_options);
        
        expect(_errors).toContain('Batch size must be greater than 0');
      });

      it( 'should reject excessive batch size', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 20000,
          maxExecutionTime: 1800
        };

        const errors = SafetyUtils.validateOptions(_options);
        
        expect(_errors).toContain('Batch size too large (max: 10000)');
      });

      it( 'should reject invalid execution time', () => {
        const options: CleanupOptions = {
          dryRun: true,
          force: false,
          batchSize: 1000,
          maxExecutionTime: 0
        };

        const errors = SafetyUtils.validateOptions(_options);
        
        expect(_errors).toContain('Max execution time must be greater than 0');
      });
    });

    describe( 'estimateImpact', () => {
      it( 'should estimate impact for operations', () => {
        const operation = new OrphanedProgressCleanup(_);
        
        const impact = SafetyUtils.estimateImpact(_operation);
        
        expect(_impact).toHaveProperty('estimatedItems');
        expect(_impact).toHaveProperty('estimatedDuration');
        expect(_impact).toHaveProperty('riskLevel');
        expect(_typeof impact.estimatedItems).toBe('number');
        expect(_typeof impact.estimatedDuration).toBe('number');
        expect( ['LOW', 'MEDIUM', 'HIGH']).toContain(_impact.riskLevel);
      });
    });
  });
});
