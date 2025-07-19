import { 
  CleanupOperation, 
  CleanupCategory, 
  CleanupSeverity, 
  CleanupOptions, 
  CleanupResult,
  cleanupManager 
} from './cleanup';
import { logger } from '@/lib/api/logger';
import { cache } from '@/lib/api/cache';

// Mock database and file system interfaces
interface DatabaseConnection {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number }>;
}

interface FileSystem {
  listFiles(directory: string): Promise<string[]>;
  deleteFile(path: string): Promise<boolean>;
  getFileStats(path: string): Promise<{ size: number; created: Date; modified: Date }>;
}

// Mock implementations
const db: DatabaseConnection = {
  async query<T>(sql: string, _params?: any[]): Promise<T[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (sql.includes('refresh_tokens')) {
      return [
        { id: 'token_1', user_id: 'user_1', expires_at: '2023-12-01T00:00:00Z' },
        { id: 'token_2', user_id: 'user_2', expires_at: '2023-11-15T00:00:00Z' }
      ] as T[];
    } else if (sql.includes('api_logs')) {
      return [
        { id: 'log_1', created_at: '2023-01-01T00:00:00Z', level: 'INFO' },
        { id: 'log_2', created_at: '2023-02-01T00:00:00Z', level: 'ERROR' }
      ] as T[];
    } else if (sql.includes('users') && sql.includes('SUSPENDED')) {
      return [
        { id: 'user_1', email: 'inactive1@example.com', status: 'SUSPENDED', last_login_at: '2023-06-01T00:00:00Z' },
        { id: 'user_2', email: 'inactive2@example.com', status: 'SUSPENDED', last_login_at: '2023-05-01T00:00:00Z' }
      ] as T[];
    }
    
    return [] as T[];
  },

  async execute(sql: string, _params?: any[]): Promise<{ affectedRows: number }> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return { affectedRows: Math.floor(Math.random() * 10) + 1 };
  }
};

const fs: FileSystem = {
  async listFiles(directory: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (directory.includes('temp')) {
      return ['temp_file_1.tmp', 'temp_file_2.tmp', 'old_upload.jpg'];
    } else if (directory.includes('uploads')) {
      return ['orphaned_upload_1.pdf', 'orphaned_upload_2.png'];
    }
    
    return [];
  },

  async deleteFile(path: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  },

  async getFileStats(path: string): Promise<{ size: number; created: Date; modified: Date }> {
    await new Promise(resolve => setTimeout(resolve, 30));
    return {
      size: Math.floor(Math.random() * 1000000) + 1000,
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
  }
};

// Expired Tokens Cleanup
class ExpiredTokensCleanup implements CleanupOperation {
  id = 'expired_tokens';
  name = 'Expired Tokens Cleanup';
  description = 'Remove expired JWT refresh tokens and session data';
  category = CleanupCategory.EXPIRED_DATA;
  severity = CleanupSeverity.LOW;
  estimatedDuration = 120; // 2 minutes
  requiresBackup = false;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting expired tokens cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      // Clean up expired refresh tokens
      const expiredTokens = await db.query<{
        id: string;
        user_id: string;
        expires_at: string;
      }>(`
        SELECT id, user_id, expires_at
        FROM refresh_tokens
        WHERE expires_at < NOW()
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += expiredTokens.length;

      if (expiredTokens.length > 0) {
        if (!options.dryRun) {
          const tokenIds = expiredTokens.map(t => t.id);
          const result = await db.execute(`
            DELETE FROM refresh_tokens 
            WHERE id IN (${tokenIds.map(() => '?').join(',')})
          `, tokenIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += expiredTokens.length;
        }
      }

      // Clean up expired user sessions
      const expiredSessions = await db.query<{
        id: string;
        user_id: string;
        expires_at: string;
      }>(`
        SELECT id, user_id, expires_at
        FROM user_sessions
        WHERE expires_at < NOW()
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += expiredSessions.length;

      if (expiredSessions.length > 0) {
        if (!options.dryRun) {
          const sessionIds = expiredSessions.map(s => s.id);
          const result = await db.execute(`
            DELETE FROM user_sessions 
            WHERE id IN (${sessionIds.map(() => '?').join(',')})
          `, sessionIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += expiredSessions.length;
        }
      }

      // Clean up old password reset tokens
      const expiredResetTokens = await db.query<{
        id: string;
        email: string;
        expires_at: string;
      }>(`
        SELECT id, email, expires_at
        FROM password_reset_tokens
        WHERE expires_at < NOW()
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += expiredResetTokens.length;

      if (expiredResetTokens.length > 0) {
        if (!options.dryRun) {
          const resetIds = expiredResetTokens.map(r => r.id);
          const result = await db.execute(`
            DELETE FROM password_reset_tokens 
            WHERE id IN (${resetIds.map(() => '?').join(',')})
          `, resetIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += expiredResetTokens.length;
        }
      }

      return {
        success: true,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {
          expiredTokens: expiredTokens.length,
          expiredSessions: expiredSessions.length,
          expiredResetTokens: expiredResetTokens.length
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {}
      };
    }
  }
}

// Old Logs Cleanup
class OldLogsCleanup implements CleanupOperation {
  id = 'old_logs';
  name = 'Old Logs Cleanup';
  description = 'Remove API logs beyond retention period (1 year)';
  category = CleanupCategory.LOGS;
  severity = CleanupSeverity.MEDIUM;
  estimatedDuration = 900; // 15 minutes
  requiresBackup = true;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting old logs cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() - 1);

      // Clean up old API logs
      const oldApiLogs = await db.query<{
        id: string;
        created_at: string;
        level: string;
      }>(`
        SELECT id, created_at, level
        FROM api_logs
        WHERE created_at < ?
        ORDER BY created_at ASC
        LIMIT ?
      `, [retentionDate.toISOString(), options.batchSize]);

      itemsProcessed += oldApiLogs.length;

      if (oldApiLogs.length > 0) {
        warnings.push(`Found ${oldApiLogs.length} API logs older than retention period`);
        
        if (!options.dryRun) {
          const logIds = oldApiLogs.map(l => l.id);
          const result = await db.execute(`
            DELETE FROM api_logs 
            WHERE id IN (${logIds.map(() => '?').join(',')})
          `, logIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += oldApiLogs.length;
        }
      }

      // Clean up old audit logs (keep for longer - 2 years)
      const auditRetentionDate = new Date();
      auditRetentionDate.setFullYear(auditRetentionDate.getFullYear() - 2);

      const oldAuditLogs = await db.query<{
        id: string;
        created_at: string;
        action: string;
      }>(`
        SELECT id, created_at, action
        FROM audit_logs
        WHERE created_at < ?
        ORDER BY created_at ASC
        LIMIT ?
      `, [auditRetentionDate.toISOString(), options.batchSize]);

      itemsProcessed += oldAuditLogs.length;

      if (oldAuditLogs.length > 0) {
        warnings.push(`Found ${oldAuditLogs.length} audit logs older than retention period`);
        
        if (!options.dryRun) {
          const auditIds = oldAuditLogs.map(l => l.id);
          const result = await db.execute(`
            DELETE FROM audit_logs 
            WHERE id IN (${auditIds.map(() => '?').join(',')})
          `, auditIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += oldAuditLogs.length;
        }
      }

      // Clean up old error logs
      const oldErrorLogs = await db.query<{
        id: string;
        created_at: string;
        error_type: string;
      }>(`
        SELECT id, created_at, error_type
        FROM error_logs
        WHERE created_at < ?
        ORDER BY created_at ASC
        LIMIT ?
      `, [retentionDate.toISOString(), options.batchSize]);

      itemsProcessed += oldErrorLogs.length;

      if (oldErrorLogs.length > 0) {
        if (!options.dryRun) {
          const errorIds = oldErrorLogs.map(l => l.id);
          const result = await db.execute(`
            DELETE FROM error_logs 
            WHERE id IN (${errorIds.map(() => '?').join(',')})
          `, errorIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += oldErrorLogs.length;
        }
      }

      return {
        success: true,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {
          oldApiLogs: oldApiLogs.length,
          oldAuditLogs: oldAuditLogs.length,
          oldErrorLogs: oldErrorLogs.length,
          retentionDate: retentionDate.toISOString()
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {}
      };
    }
  }
}

// Cached Data Cleanup
class CachedDataCleanup implements CleanupOperation {
  id = 'cached_data';
  name = 'Cached Data Cleanup';
  description = 'Remove invalid and expired cached data';
  category = CleanupCategory.CACHED_DATA;
  severity = CleanupSeverity.LOW;
  estimatedDuration = 60; // 1 minute
  requiresBackup = false;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting cached data cleanup', {
        dryRun: options.dryRun
      });

      if (!options.dryRun) {
        // Clear all expired cache entries
        await cache.clear();
        itemsAffected = 1; // Represent as one operation
      }

      // Clean up database cache entries if using database caching
      const expiredCacheEntries = await db.query<{
        cache_key: string;
        expires_at: string;
      }>(`
        SELECT cache_key, expires_at
        FROM cache_entries
        WHERE expires_at < NOW()
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += expiredCacheEntries.length;

      if (expiredCacheEntries.length > 0) {
        if (!options.dryRun) {
          const cacheKeys = expiredCacheEntries.map(c => c.cache_key);
          const result = await db.execute(`
            DELETE FROM cache_entries 
            WHERE cache_key IN (${cacheKeys.map(() => '?').join(',')})
          `, cacheKeys);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += expiredCacheEntries.length;
        }
      }

      // Clean up orphaned cache entries (keys that reference deleted data)
      const orphanedCacheEntries = await db.query<{
        cache_key: string;
      }>(`
        SELECT DISTINCT c.cache_key
        FROM cache_entries c
        WHERE c.cache_key LIKE 'user:%' 
        AND NOT EXISTS (
          SELECT 1 FROM users u 
          WHERE c.cache_key = CONCAT('user:', u.id)
        )
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedCacheEntries.length;

      if (orphanedCacheEntries.length > 0) {
        warnings.push(`Found ${orphanedCacheEntries.length} orphaned cache entries`);
        
        if (!options.dryRun) {
          const orphanedKeys = orphanedCacheEntries.map(c => c.cache_key);
          const result = await db.execute(`
            DELETE FROM cache_entries 
            WHERE cache_key IN (${orphanedKeys.map(() => '?').join(',')})
          `, orphanedKeys);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedCacheEntries.length;
        }
      }

      return {
        success: true,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {
          expiredEntries: expiredCacheEntries.length,
          orphanedEntries: orphanedCacheEntries.length
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {}
      };
    }
  }
}

// Inactive Accounts Cleanup
class InactiveAccountsCleanup implements CleanupOperation {
  id = 'inactive_accounts';
  name = 'Inactive Accounts Cleanup';
  description = 'Archive or delete inactive user accounts (suspended >6 months)';
  category = CleanupCategory.INACTIVE_ACCOUNTS;
  severity = CleanupSeverity.CRITICAL;
  estimatedDuration = 1800; // 30 minutes
  requiresBackup = true;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting inactive accounts cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Find accounts suspended for more than 6 months
      const inactiveAccounts = await db.query<{
        id: string;
        email: string;
        status: string;
        last_login_at: string;
        suspended_at: string;
      }>(`
        SELECT id, email, status, last_login_at, suspended_at
        FROM users
        WHERE status = 'SUSPENDED' 
        AND (suspended_at < ? OR last_login_at < ?)
        LIMIT ?
      `, [sixMonthsAgo.toISOString(), sixMonthsAgo.toISOString(), options.batchSize]);

      itemsProcessed += inactiveAccounts.length;

      if (inactiveAccounts.length > 0) {
        warnings.push(`Found ${inactiveAccounts.length} inactive accounts eligible for cleanup`);
        
        if (!options.dryRun) {
          for (const account of inactiveAccounts) {
            // Archive user data before deletion
            await this.archiveUserData(account.id);
            
            // Delete user and related data
            await this.deleteUserData(account.id);
            
            itemsAffected++;
          }
        } else {
          itemsAffected += inactiveAccounts.length;
        }
      }

      // Find accounts that haven't logged in for over a year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const dormantAccounts = await db.query<{
        id: string;
        email: string;
        last_login_at: string;
      }>(`
        SELECT id, email, last_login_at
        FROM users
        WHERE status = 'ACTIVE' 
        AND (last_login_at < ? OR last_login_at IS NULL)
        AND created_at < ?
        LIMIT ?
      `, [oneYearAgo.toISOString(), oneYearAgo.toISOString(), Math.floor(options.batchSize / 2)]);

      itemsProcessed += dormantAccounts.length;

      if (dormantAccounts.length > 0) {
        warnings.push(`Found ${dormantAccounts.length} dormant accounts (no login >1 year)`);
        
        if (!options.dryRun) {
          // Mark as inactive rather than delete
          const accountIds = dormantAccounts.map(a => a.id);
          const result = await db.execute(`
            UPDATE users 
            SET status = 'INACTIVE', updated_at = NOW()
            WHERE id IN (${accountIds.map(() => '?').join(',')})
          `, accountIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += dormantAccounts.length;
        }
      }

      return {
        success: true,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {
          inactiveAccounts: inactiveAccounts.length,
          dormantAccounts: dormantAccounts.length,
          cutoffDate: sixMonthsAgo.toISOString()
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {}
      };
    }
  }

  private async archiveUserData(userId: string): Promise<void> {
    // Archive user data to a separate table or export to file
    await db.execute(`
      INSERT INTO archived_users 
      SELECT *, NOW() as archived_at 
      FROM users 
      WHERE id = ?
    `, [userId]);
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Delete user and all related data
    const tables = [
      'user_progress',
      'user_achievements', 
      'user_sessions',
      'refresh_tokens',
      'leaderboard_entries',
      'users'
    ];

    for (const table of tables) {
      await db.execute(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
    }
  }
}

// Temporary Files Cleanup
class TemporaryFilesCleanup implements CleanupOperation {
  id = 'temporary_files';
  name = 'Temporary Files Cleanup';
  description = 'Clean up temporary files and uploads not linked to active content';
  category = CleanupCategory.TEMPORARY_FILES;
  severity = CleanupSeverity.MEDIUM;
  estimatedDuration = 600; // 10 minutes
  requiresBackup = false;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting temporary files cleanup', {
        dryRun: options.dryRun
      });

      // Clean up temporary files older than 24 hours
      const tempFiles = await fs.listFiles('/tmp/uploads');
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const file of tempFiles) {
        const filePath = `/tmp/uploads/${file}`;
        const stats = await fs.getFileStats(filePath);
        
        itemsProcessed++;

        if (stats.created < oneDayAgo) {
          if (!options.dryRun) {
            const deleted = await fs.deleteFile(filePath);
            if (deleted) {
              itemsAffected++;
            }
          } else {
            itemsAffected++;
          }
        }
      }

      // Clean up orphaned upload files
      const uploadFiles = await fs.listFiles('/uploads');
      
      for (const file of uploadFiles) {
        const filePath = `/uploads/${file}`;
        
        // Check if file is referenced in database
        const references = await db.query<{ count: number }>(`
          SELECT COUNT(*) as count
          FROM (
            SELECT avatar as file_path FROM users WHERE avatar LIKE ?
            UNION ALL
            SELECT thumbnail as file_path FROM courses WHERE thumbnail LIKE ?
            UNION ALL
            SELECT attachment as file_path FROM lessons WHERE attachment LIKE ?
          ) as refs
        `, [`%${file}%`, `%${file}%`, `%${file}%`]);

        itemsProcessed++;

        if (references[0]?.count === 0) {
          warnings.push(`Found orphaned upload file: ${file}`);
          
          if (!options.dryRun) {
            const deleted = await fs.deleteFile(filePath);
            if (deleted) {
              itemsAffected++;
            }
          } else {
            itemsAffected++;
          }
        }
      }

      return {
        success: true,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {
          tempFiles: tempFiles.length,
          uploadFiles: uploadFiles.length,
          cutoffDate: oneDayAgo.toISOString()
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        operation: this.name,
        itemsProcessed,
        itemsAffected,
        duration: Date.now() - startTime,
        errors,
        warnings,
        details: {}
      };
    }
  }
}

// Register all data removal operations
export function registerDataRemovalOperations(): void {
  cleanupManager.registerOperation(new ExpiredTokensCleanup());
  cleanupManager.registerOperation(new OldLogsCleanup());
  cleanupManager.registerOperation(new CachedDataCleanup());
  cleanupManager.registerOperation(new InactiveAccountsCleanup());
  cleanupManager.registerOperation(new TemporaryFilesCleanup());
  
  logger.info('Data removal cleanup operations registered', {
    operationCount: 5
  });
}

// Export individual operations for testing
export {
  ExpiredTokensCleanup,
  OldLogsCleanup,
  CachedDataCleanup,
  InactiveAccountsCleanup,
  TemporaryFilesCleanup
};
