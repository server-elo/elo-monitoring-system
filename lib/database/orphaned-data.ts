import { 
  CleanupOperation, 
  CleanupCategory, 
  CleanupSeverity, 
  CleanupOptions, 
  CleanupResult,
  cleanupManager 
} from './cleanup';
import { logger } from '@/lib/api/logger';

// Mock database interfaces - in production, these would be actual database queries
interface DatabaseConnection {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number }>;
}

// Mock database connection
const db: DatabaseConnection = {
  async query<T>(sql: string, _params?: any[]): Promise<T[]> {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on query type
    if (sql.includes('orphaned_achievements')) {
      return [
        { id: 'ach_1', title: 'Orphaned Achievement 1', user_id: 'deleted_user_1' },
        { id: 'ach_2', title: 'Orphaned Achievement 2', course_id: 'deleted_course_1' }
      ] as T[];
    } else if (sql.includes('orphaned_progress')) {
      return [
        { id: 'prog_1', user_id: 'user_1', lesson_id: 'deleted_lesson_1' },
        { id: 'prog_2', user_id: 'deleted_user_2', lesson_id: 'lesson_1' }
      ] as T[];
    } else if (sql.includes('orphaned_leaderboard')) {
      return [
        { id: 'lead_1', user_id: 'deleted_user_3', category: 'global_xp' }
      ] as T[];
    } else if (sql.includes('orphaned_prerequisites')) {
      return [
        { lesson_id: 'lesson_1', prerequisite_id: 'deleted_lesson_2' },
        { lesson_id: 'lesson_2', prerequisite_id: 'deleted_lesson_3' }
      ] as T[];
    }
    
    return [] as T[];
  },

  async execute(sql: string, _params?: any[]): Promise<{ affectedRows: number }> {
    // Simulate database execution
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Return mock affected rows based on operation
    if (sql.includes('DELETE')) {
      return { affectedRows: Math.floor(Math.random() * 10) + 1 };
    }
    
    return { affectedRows: 0 };
  }
};

// Orphaned Achievement Detection and Cleanup
class OrphanedAchievementCleanup implements CleanupOperation {
  id = 'orphaned_achievements';
  name = 'Orphaned Achievements Cleanup';
  description = 'Remove achievements not linked to active users or courses';
  category = CleanupCategory.ORPHANED_DATA;
  severity = CleanupSeverity.MEDIUM;
  estimatedDuration = 300; // 5 minutes
  requiresBackup = true;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting orphaned achievements cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      // Find achievements with non-existent users
      const orphanedByUser = await db.query<{
        id: string;
        title: string;
        user_id: string;
      }>(`
        SELECT a.id, a.title, a.user_id
        FROM user_achievements a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE u.id IS NULL
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedByUser.length;

      if (orphanedByUser.length > 0) {
        warnings.push(`Found ${orphanedByUser.length} achievements linked to deleted users`);
        
        if (!options.dryRun) {
          const userIds = orphanedByUser.map(a => a.id);
          const result = await db.execute(`
            DELETE FROM user_achievements 
            WHERE id IN (${userIds.map(() => '?').join(',')})
          `, userIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedByUser.length;
        }
      }

      // Find achievements with non-existent courses
      const orphanedByCourse = await db.query<{
        id: string;
        title: string;
        course_id: string;
      }>(`
        SELECT a.id, a.title, a.course_id
        FROM achievements a
        LEFT JOIN courses c ON a.course_id = c.id
        WHERE a.course_id IS NOT NULL AND c.id IS NULL
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedByCourse.length;

      if (orphanedByCourse.length > 0) {
        warnings.push(`Found ${orphanedByCourse.length} achievements linked to deleted courses`);
        
        if (!options.dryRun) {
          const courseIds = orphanedByCourse.map(a => a.id);
          const result = await db.execute(`
            DELETE FROM achievements 
            WHERE id IN (${courseIds.map(() => '?').join(',')})
          `, courseIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedByCourse.length;
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
          orphanedByUser: orphanedByUser.length,
          orphanedByCourse: orphanedByCourse.length
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

// Orphaned Progress Records Cleanup
class OrphanedProgressCleanup implements CleanupOperation {
  id = 'orphaned_progress';
  name = 'Orphaned Progress Records Cleanup';
  description = 'Remove progress records for deleted lessons or users';
  category = CleanupCategory.ORPHANED_DATA;
  severity = CleanupSeverity.HIGH;
  estimatedDuration = 600; // 10 minutes
  requiresBackup = true;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting orphaned progress records cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      // Find progress records with non-existent users
      const orphanedByUser = await db.query<{
        id: string;
        user_id: string;
        lesson_id: string;
      }>(`
        SELECT p.id, p.user_id, p.lesson_id
        FROM user_progress p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE u.id IS NULL
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedByUser.length;

      if (orphanedByUser.length > 0) {
        warnings.push(`Found ${orphanedByUser.length} progress records for deleted users`);
        
        if (!options.dryRun) {
          const progressIds = orphanedByUser.map(p => p.id);
          const result = await db.execute(`
            DELETE FROM user_progress 
            WHERE id IN (${progressIds.map(() => '?').join(',')})
          `, progressIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedByUser.length;
        }
      }

      // Find progress records with non-existent lessons
      const orphanedByLesson = await db.query<{
        id: string;
        user_id: string;
        lesson_id: string;
      }>(`
        SELECT p.id, p.user_id, p.lesson_id
        FROM user_progress p
        LEFT JOIN lessons l ON p.lesson_id = l.id
        WHERE l.id IS NULL
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedByLesson.length;

      if (orphanedByLesson.length > 0) {
        warnings.push(`Found ${orphanedByLesson.length} progress records for deleted lessons`);
        
        if (!options.dryRun) {
          const progressIds = orphanedByLesson.map(p => p.id);
          const result = await db.execute(`
            DELETE FROM user_progress 
            WHERE id IN (${progressIds.map(() => '?').join(',')})
          `, progressIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedByLesson.length;
        }
      }

      // Find progress records with non-existent courses
      const orphanedByCourse = await db.query<{
        id: string;
        user_id: string;
        course_id: string;
      }>(`
        SELECT p.id, p.user_id, p.course_id
        FROM user_progress p
        LEFT JOIN courses c ON p.course_id = c.id
        WHERE c.id IS NULL
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedByCourse.length;

      if (orphanedByCourse.length > 0) {
        warnings.push(`Found ${orphanedByCourse.length} progress records for deleted courses`);
        
        if (!options.dryRun) {
          const progressIds = orphanedByCourse.map(p => p.id);
          const result = await db.execute(`
            DELETE FROM user_progress 
            WHERE id IN (${progressIds.map(() => '?').join(',')})
          `, progressIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedByCourse.length;
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
          orphanedByUser: orphanedByUser.length,
          orphanedByLesson: orphanedByLesson.length,
          orphanedByCourse: orphanedByCourse.length
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

// Orphaned Leaderboard Entries Cleanup
class OrphanedLeaderboardCleanup implements CleanupOperation {
  id = 'orphaned_leaderboard';
  name = 'Orphaned Leaderboard Entries Cleanup';
  description = 'Remove leaderboard entries for inactive users';
  category = CleanupCategory.ORPHANED_DATA;
  severity = CleanupSeverity.MEDIUM;
  estimatedDuration = 180; // 3 minutes
  requiresBackup = true;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting orphaned leaderboard entries cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      // Find leaderboard entries with non-existent or inactive users
      const orphanedEntries = await db.query<{
        id: string;
        user_id: string;
        category: string;
        score: number;
      }>(`
        SELECT l.id, l.user_id, l.category, l.score
        FROM leaderboard_entries l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE u.id IS NULL OR u.status IN ('SUSPENDED', 'DELETED')
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedEntries.length;

      if (orphanedEntries.length > 0) {
        warnings.push(`Found ${orphanedEntries.length} orphaned leaderboard entries`);
        
        if (!options.dryRun) {
          const entryIds = orphanedEntries.map(e => e.id);
          const result = await db.execute(`
            DELETE FROM leaderboard_entries 
            WHERE id IN (${entryIds.map(() => '?').join(',')})
          `, entryIds);
          
          itemsAffected += result.affectedRows;
        } else {
          itemsAffected += orphanedEntries.length;
        }
      }

      // Find duplicate leaderboard entries for the same user/category
      const duplicateEntries = await db.query<{
        user_id: string;
        category: string;
        count: number;
      }>(`
        SELECT user_id, category, COUNT(*) as count
        FROM leaderboard_entries
        GROUP BY user_id, category
        HAVING COUNT(*) > 1
        LIMIT ?
      `, [options.batchSize]);

      if (duplicateEntries.length > 0) {
        warnings.push(`Found ${duplicateEntries.length} users with duplicate leaderboard entries`);
        
        if (!options.dryRun) {
          // Keep only the latest entry for each user/category combination
          for (const duplicate of duplicateEntries) {
            const result = await db.execute(`
              DELETE FROM leaderboard_entries 
              WHERE user_id = ? AND category = ? 
              AND id NOT IN (
                SELECT id FROM (
                  SELECT id FROM leaderboard_entries 
                  WHERE user_id = ? AND category = ? 
                  ORDER BY updated_at DESC 
                  LIMIT 1
                ) as latest
              )
            `, [duplicate.user_id, duplicate.category, duplicate.user_id, duplicate.category]);
            
            itemsAffected += result.affectedRows;
          }
        } else {
          itemsAffected += duplicateEntries.reduce((sum, d) => sum + d.count - 1, 0);
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
          orphanedEntries: orphanedEntries.length,
          duplicateEntries: duplicateEntries.length
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

// Orphaned Prerequisites Cleanup
class OrphanedPrerequisitesCleanup implements CleanupOperation {
  id = 'orphaned_prerequisites';
  name = 'Orphaned Prerequisites Cleanup';
  description = 'Remove lesson prerequisites pointing to non-existent lessons';
  category = CleanupCategory.ORPHANED_DATA;
  severity = CleanupSeverity.HIGH;
  estimatedDuration = 240; // 4 minutes
  requiresBackup = true;
  dryRunSupported = true;

  async execute(options: CleanupOptions): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    let itemsAffected = 0;

    try {
      logger.info('Starting orphaned prerequisites cleanup', {
        dryRun: options.dryRun,
        batchSize: options.batchSize
      });

      // Find prerequisites pointing to non-existent lessons
      const orphanedPrereqs = await db.query<{
        lesson_id: string;
        prerequisite_id: string;
      }>(`
        SELECT lp.lesson_id, lp.prerequisite_id
        FROM lesson_prerequisites lp
        LEFT JOIN lessons l ON lp.prerequisite_id = l.id
        WHERE l.id IS NULL
        LIMIT ?
      `, [options.batchSize]);

      itemsProcessed += orphanedPrereqs.length;

      if (orphanedPrereqs.length > 0) {
        warnings.push(`Found ${orphanedPrereqs.length} prerequisites pointing to deleted lessons`);
        
        if (!options.dryRun) {
          for (const prereq of orphanedPrereqs) {
            const result = await db.execute(`
              DELETE FROM lesson_prerequisites 
              WHERE lesson_id = ? AND prerequisite_id = ?
            `, [prereq.lesson_id, prereq.prerequisite_id]);
            
            itemsAffected += result.affectedRows;
          }
        } else {
          itemsAffected += orphanedPrereqs.length;
        }
      }

      // Find circular prerequisites
      const circularPrereqs = await db.query<{
        lesson_id: string;
        prerequisite_id: string;
      }>(`
        SELECT DISTINCT lp1.lesson_id, lp1.prerequisite_id
        FROM lesson_prerequisites lp1
        JOIN lesson_prerequisites lp2 ON lp1.lesson_id = lp2.prerequisite_id 
                                      AND lp1.prerequisite_id = lp2.lesson_id
        LIMIT ?
      `, [options.batchSize]);

      if (circularPrereqs.length > 0) {
        warnings.push(`Found ${circularPrereqs.length} circular prerequisite dependencies`);
        
        if (!options.dryRun) {
          // Remove the circular dependencies (keep the one with lower lesson_id)
          for (const circular of circularPrereqs) {
            if (circular.lesson_id > circular.prerequisite_id) {
              const result = await db.execute(`
                DELETE FROM lesson_prerequisites 
                WHERE lesson_id = ? AND prerequisite_id = ?
              `, [circular.lesson_id, circular.prerequisite_id]);
              
              itemsAffected += result.affectedRows;
            }
          }
        } else {
          itemsAffected += Math.ceil(circularPrereqs.length / 2);
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
          orphanedPrerequisites: orphanedPrereqs.length,
          circularPrerequisites: circularPrereqs.length
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

// Register all orphaned data cleanup operations
export function registerOrphanedDataOperations(): void {
  cleanupManager.registerOperation(new OrphanedAchievementCleanup());
  cleanupManager.registerOperation(new OrphanedProgressCleanup());
  cleanupManager.registerOperation(new OrphanedLeaderboardCleanup());
  cleanupManager.registerOperation(new OrphanedPrerequisitesCleanup());
  
  logger.info('Orphaned data cleanup operations registered', {
    operationCount: 4
  });
}

// Export individual operations for testing
export {
  OrphanedAchievementCleanup,
  OrphanedProgressCleanup,
  OrphanedLeaderboardCleanup,
  OrphanedPrerequisitesCleanup
};
