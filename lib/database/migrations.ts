import { logger } from '@/lib/api/logger';
import { BackupService } from './cleanup';

// Migration Types
export interface Migration {
  id: string;
  name: string;
  description: string;
  version: string;
  up: string; // SQL for applying migration
  down: string; // SQL for rolling back migration
  dependencies: string[]; // Required migrations
  estimatedDuration: number; // in seconds
  requiresBackup: boolean;
  dataTransformation: boolean;
  createdAt: string;
}

export interface MigrationStatus {
  id: string;
  appliedAt: string;
  rollbackAvailable: boolean;
  checksum: string;
}

export interface MigrationResult {
  success: boolean;
  migration: string;
  duration: number;
  affectedRows?: number;
  errors: string[];
  warnings: string[];
  backupCreated?: string;
}

export interface MigrationPlan {
  migrations: Migration[];
  totalEstimatedDuration: number;
  requiresBackup: boolean;
  dataTransformations: number;
  dependencies: string[];
}

// Database interface for migrations
interface MigrationDatabase {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number }>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  getTableSchema(tableName: string): Promise<any>;
  validateConstraints(): Promise<string[]>;
}

// Mock database implementation
const migrationDb: MigrationDatabase = {
  async query<T>(sql: string, _params?: any[]): Promise<T[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (sql.includes('schema_migrations')) {
      return [
        { id: 'migration_001', applied_at: '2024-01-01T00:00:00Z', checksum: 'abc123' },
        { id: 'migration_002', applied_at: '2024-01-02T00:00:00Z', checksum: 'def456' }
      ] as T[];
    }
    
    return [] as T[];
  },

  async execute(sql: string, _params?: any[]): Promise<{ affectedRows: number }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { affectedRows: Math.floor(Math.random() * 100) + 1 };
  },

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    logger.info('Starting database transaction');
    try {
      const result = await callback();
      logger.info('Database transaction committed');
      return result;
    } catch (error) {
      logger.error('Database transaction rolled back', { error });
      throw error;
    }
  },

  async getTableSchema(tableName: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      columns: ['id', 'name', 'created_at'],
      indexes: ['PRIMARY', 'idx_name'],
      constraints: ['fk_user_id']
    };
  },

  async validateConstraints(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return []; // No constraint violations
  }
};

// Migration Manager
export class MigrationManager {
  private static instance: MigrationManager;
  private migrations: Map<string, Migration> = new Map();
  private backupService: BackupService;

  constructor() {
    this.backupService = BackupService.getInstance();
    this.loadMigrations();
  }

  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  private loadMigrations(): void {
    // Load migration definitions
    const sampleMigrations: Migration[] = [
      {
        id: 'migration_001',
        name: 'Create Users Table',
        description: 'Initial users table with basic fields',
        version: '1.0.0',
        up: `
          CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `,
        down: 'DROP TABLE users;',
        dependencies: [],
        estimatedDuration: 30,
        requiresBackup: false,
        dataTransformation: false,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'migration_002',
        name: 'Add User Roles',
        description: 'Add role and status fields to users table',
        version: '1.1.0',
        up: `
          ALTER TABLE users 
          ADD COLUMN role VARCHAR(50) DEFAULT 'STUDENT',
          ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';
        `,
        down: `
          ALTER TABLE users 
          DROP COLUMN role,
          DROP COLUMN status;
        `,
        dependencies: ['migration_001'],
        estimatedDuration: 60,
        requiresBackup: true,
        dataTransformation: false,
        createdAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'migration_003',
        name: 'Create Lessons Table',
        description: 'Create lessons table with foreign key to users',
        version: '1.2.0',
        up: `
          CREATE TABLE lessons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            content TEXT,
            instructor_id UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
          );
        `,
        down: 'DROP TABLE lessons;',
        dependencies: ['migration_002'],
        estimatedDuration: 45,
        requiresBackup: false,
        dataTransformation: false,
        createdAt: '2024-01-03T00:00:00Z'
      }
    ];

    sampleMigrations.forEach(migration => {
      this.migrations.set(migration.id, migration);
    });

    logger.info('Migrations loaded', { count: this.migrations.size });
  }

  async getAppliedMigrations(): Promise<MigrationStatus[]> {
    try {
      const applied = await migrationDb.query<{
        id: string;
        applied_at: string;
        checksum: string;
      }>(`
        SELECT id, applied_at, checksum
        FROM schema_migrations
        ORDER BY applied_at ASC
      `);

      return applied.map(m => ({
        id: m.id,
        appliedAt: m.applied_at,
        rollbackAvailable: this.migrations.has(m.id),
        checksum: m.checksum
      }));
    } catch (error) {
      logger.error('Failed to get applied migrations', { error });
      return [];
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));

    return Array.from(this.migrations.values())
      .filter(migration => !appliedIds.has(migration.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMigrationPlan(targetMigrations?: string[]): Promise<MigrationPlan> {
    const pending = await this.getPendingMigrations();
    let migrationsToApply: Migration[];

    if (targetMigrations) {
      migrationsToApply = pending.filter(m => targetMigrations.includes(m.id));
    } else {
      migrationsToApply = pending;
    }

    // Resolve dependencies
    const resolved = this.resolveDependencies(migrationsToApply);

    return {
      migrations: resolved,
      totalEstimatedDuration: resolved.reduce((sum, m) => sum + m.estimatedDuration, 0),
      requiresBackup: resolved.some(m => m.requiresBackup),
      dataTransformations: resolved.filter(m => m.dataTransformation).length,
      dependencies: this.getAllDependencies(resolved)
    };
  }

  private resolveDependencies(migrations: Migration[]): Migration[] {
    const resolved: Migration[] = [];
    const visited = new Set<string>();

    const resolve = (migration: Migration) => {
      if (visited.has(migration.id)) {
        return;
      }

      // Resolve dependencies first
      for (const depId of migration.dependencies) {
        const dependency = this.migrations.get(depId);
        if (dependency && !visited.has(depId)) {
          resolve(dependency);
        }
      }

      resolved.push(migration);
      visited.add(migration.id);
    };

    migrations.forEach(resolve);
    return resolved;
  }

  private getAllDependencies(migrations: Migration[]): string[] {
    const deps = new Set<string>();
    
    migrations.forEach(migration => {
      migration.dependencies.forEach(dep => deps.add(dep));
    });

    return Array.from(deps);
  }

  async applyMigration(migrationId: string, dryRun: boolean = false): Promise<MigrationResult> {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let backupPath: string | undefined;

    try {
      logger.info('Applying migration', {
        migrationId,
        name: migration.name,
        dryRun
      });

      // Create backup if required
      if (migration.requiresBackup && !dryRun) {
        backupPath = await this.backupService.createBackup(
          ['users', 'lessons', 'schema_migrations'],
          `migration_${migrationId}_${Date.now()}`
        );
      }

      // Validate dependencies
      const missingDeps = await this.validateDependencies(migration);
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }

      let affectedRows = 0;

      if (!dryRun) {
        // Apply migration in transaction
        await migrationDb.transaction(async () => {
          // Execute migration SQL
          const result = await migrationDb.execute(migration.up);
          affectedRows = result.affectedRows;

          // Record migration as applied
          await migrationDb.execute(`
            INSERT INTO schema_migrations (id, applied_at, checksum)
            VALUES (?, NOW(), ?)
          `, [migration.id, this.calculateChecksum(migration)]);
        });

        // Validate constraints after migration
        const constraintViolations = await migrationDb.validateConstraints();
        if (constraintViolations.length > 0) {
          warnings.push(`Constraint violations detected: ${constraintViolations.join(', ')}`);
        }
      } else {
        // Dry run - validate SQL syntax
        try {
          await this.validateMigrationSQL(migration.up);
        } catch (error) {
          errors.push(`SQL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Migration applied successfully', {
        migrationId,
        duration,
        affectedRows,
        dryRun
      });

      return {
        success: true,
        migration: migration.name,
        duration,
        affectedRows,
        errors,
        warnings,
        backupCreated: backupPath
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      logger.error('Migration failed', {
        migrationId,
        error: errorMessage,
        duration
      });

      return {
        success: false,
        migration: migration.name,
        duration,
        errors,
        warnings,
        backupCreated: backupPath
      };
    }
  }

  async rollbackMigration(migrationId: string, dryRun: boolean = false): Promise<MigrationResult> {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let backupPath: string | undefined;

    try {
      logger.info('Rolling back migration', {
        migrationId,
        name: migration.name,
        dryRun
      });

      // Check if migration is applied
      const applied = await this.getAppliedMigrations();
      const isApplied = applied.some(m => m.id === migrationId);

      if (!isApplied) {
        throw new Error(`Migration ${migrationId} is not applied`);
      }

      // Create backup before rollback
      if (!dryRun) {
        backupPath = await this.backupService.createBackup(
          ['users', 'lessons', 'schema_migrations'],
          `rollback_${migrationId}_${Date.now()}`
        );
      }

      let affectedRows = 0;

      if (!dryRun) {
        // Rollback migration in transaction
        await migrationDb.transaction(async () => {
          // Execute rollback SQL
          const result = await migrationDb.execute(migration.down);
          affectedRows = result.affectedRows;

          // Remove migration record
          await migrationDb.execute(`
            DELETE FROM schema_migrations WHERE id = ?
          `, [migration.id]);
        });
      } else {
        // Dry run - validate rollback SQL
        try {
          await this.validateMigrationSQL(migration.down);
        } catch (error) {
          errors.push(`Rollback SQL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Migration rolled back successfully', {
        migrationId,
        duration,
        affectedRows,
        dryRun
      });

      return {
        success: true,
        migration: migration.name,
        duration,
        affectedRows,
        errors,
        warnings,
        backupCreated: backupPath
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      logger.error('Migration rollback failed', {
        migrationId,
        error: errorMessage,
        duration
      });

      return {
        success: false,
        migration: migration.name,
        duration,
        errors,
        warnings,
        backupCreated: backupPath
      };
    }
  }

  async applyPendingMigrations(dryRun: boolean = false): Promise<MigrationResult[]> {
    const plan = await this.createMigrationPlan();
    const results: MigrationResult[] = [];

    logger.info('Applying pending migrations', {
      count: plan.migrations.length,
      estimatedDuration: plan.totalEstimatedDuration,
      dryRun
    });

    for (const migration of plan.migrations) {
      const result = await this.applyMigration(migration.id, dryRun);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        logger.error('Migration batch stopped due to failure', {
          failedMigration: migration.id
        });
        break;
      }
    }

    return results;
  }

  private async validateDependencies(migration: Migration): Promise<string[]> {
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));

    return migration.dependencies.filter(dep => !appliedIds.has(dep));
  }

  private async validateMigrationSQL(sql: string): Promise<void> {
    // In production, this would validate SQL syntax
    // For now, just check for basic issues
    if (!sql.trim()) {
      throw new Error('Empty SQL statement');
    }

    if (sql.includes('DROP DATABASE') || sql.includes('TRUNCATE')) {
      throw new Error('Dangerous SQL operation detected');
    }
  }

  private calculateChecksum(migration: Migration): string {
    // Simple checksum calculation
    const content = migration.up + migration.down;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  async getMigrationStatus(): Promise<{
    applied: number;
    pending: number;
    total: number;
    lastApplied?: string;
  }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    const total = this.migrations.size;

    return {
      applied: applied.length,
      pending: pending.length,
      total,
      lastApplied: applied.length > 0 ? applied[applied.length - 1].appliedAt : undefined
    };
  }

  async testMigration(migrationId: string): Promise<{
    syntaxValid: boolean;
    dependenciesMet: boolean;
    estimatedImpact: string;
    warnings: string[];
  }> {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const warnings: string[] = [];
    let syntaxValid = true;
    let dependenciesMet = true;

    try {
      await this.validateMigrationSQL(migration.up);
      await this.validateMigrationSQL(migration.down);
    } catch (error) {
      syntaxValid = false;
      warnings.push(`SQL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const missingDeps = await this.validateDependencies(migration);
    if (missingDeps.length > 0) {
      dependenciesMet = false;
      warnings.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    }

    const estimatedImpact = migration.dataTransformation 
      ? 'HIGH - Data transformation required'
      : migration.requiresBackup 
        ? 'MEDIUM - Schema changes'
        : 'LOW - Additive changes only';

    return {
      syntaxValid,
      dependenciesMet,
      estimatedImpact,
      warnings
    };
  }
}

// Export singleton instance
export const migrationManager = MigrationManager.getInstance();
