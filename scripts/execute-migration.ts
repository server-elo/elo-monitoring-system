#!/usr/bin/env tsx
/**
 * Production database migration script
 * Safely migrates from SQLite to PostgreSQL with comprehensive validation
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseMigrationManager, MigrationUtils } from '../lib/database/migration-scripts';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

interface MigrationOptions {
  dryRun: boolean;
  force: boolean;
  batchSize: number;
  skipBackup: boolean;
  skipValidation: boolean;
}

async function main() {
  console.log('🚀 Learning Solidity - Database Migration Tool');
  console.log('============================================');

  // Parse command line arguments
  const options = parseArguments();
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No actual migration will be performed');
  }

  try {
    // Step 1: Environment validation
    console.log('\n📋 Step 1: Environment Validation');
    const envCheck = await MigrationUtils.validateEnvironment();
    if (!envCheck.valid) {
      console.error('❌ Environment validation failed:');
      envCheck.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    console.log('✅ Environment validation passed');

    // Step 2: Disk space check
    console.log('\n💾 Step 2: Disk Space Check');
    const diskCheck = await MigrationUtils.checkDiskSpace();
    if (!diskCheck.sufficient) {
      console.error(`❌ Insufficient disk space: ${diskCheck.available}MB available, ${diskCheck.required}MB required`);
      if (!options.force) {
        process.exit(1);
      }
    }
    console.log(`✅ Sufficient disk space: ${Math.round(diskCheck.available / 1024 / 1024)}MB available`);

    // Step 3: Initialize database clients
    console.log('\n🔌 Step 3: Database Connection Setup');
    
    const sqliteClient = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./prisma/dev.db'
        }
      }
    });

    // For PostgreSQL client, we need to use the target DATABASE_URL
    const postgresUrl = process.env.DATABASE_URL;
    if (!postgresUrl || !postgresUrl.includes('postgresql')) {
      console.error('❌ PostgreSQL DATABASE_URL not configured');
      process.exit(1);
    }

    const postgresClient = new PrismaClient({
      datasources: {
        db: {
          url: postgresUrl
        }
      }
    });

    console.log('✅ Database clients initialized');

    // Step 4: Migration time estimation
    console.log('\n⏱️  Step 4: Migration Time Estimation');
    const estimatedTime = await MigrationUtils.estimateMigrationTime(sqliteClient);
    console.log(`📊 Estimated migration time: ${estimatedTime} seconds`);

    if (!options.force && estimatedTime > 300) { // 5 minutes
      console.log('⚠️  Long migration detected. Use --force to proceed anyway.');
      const confirmed = await promptUser('Continue with migration? (y/N): ');
      if (!confirmed.toLowerCase().startsWith('y')) {
        console.log('Migration cancelled by user');
        process.exit(0);
      }
    }

    // Step 5: Create migration manager
    console.log('\n🔧 Step 5: Migration Manager Setup');
    const migrationManager = new DatabaseMigrationManager(sqliteClient, postgresClient);

    // Step 6: Setup logging
    const logFile = createWriteStream(
      resolve(process.cwd(), `migration-${new Date().toISOString().slice(0, 10)}.log`),
      { flags: 'a' }
    );

    // Step 7: Execute migration
    console.log('\n🚀 Step 6: Executing Migration');
    console.log('This may take several minutes depending on your data size...\n');

    const migrationResult = await migrationManager.executeMigration({
      batchSize: options.batchSize,
      verifyIntegrity: !options.skipValidation,
      createBackup: !options.skipBackup,
      dryRun: options.dryRun
    });

    // Step 8: Results reporting
    console.log('\n📊 Migration Results');
    console.log('===================');
    
    if (migrationResult.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📈 Records migrated: ${migrationResult.migratedCount.toLocaleString()}`);
      console.log(`⏱️  Duration: ${Math.round(migrationResult.duration / 1000)}s`);
      console.log(`🔐 Data checksum: ${migrationResult.checksum}`);
      
      if (!options.dryRun) {
        console.log('\n🎯 Next Steps:');
        console.log('1. Update your .env file to use the PostgreSQL DATABASE_URL');
        console.log('2. Restart your application');
        console.log('3. Verify all functionality works correctly');
        console.log('4. Remove the SQLite database file when confident');
      }
    } else {
      console.error('❌ Migration failed!');
      console.error(`📊 Partial migration: ${migrationResult.migratedCount.toLocaleString()} records`);
      console.error('🔍 Errors:');
      migrationResult.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
      
      if (!options.dryRun) {
        console.error('\n🚨 IMPORTANT: Your PostgreSQL database may be in an inconsistent state.');
        console.error('Please review the errors and consider running a rollback.');
      }
    }

    // Write detailed log
    const migrationLog = migrationManager.getMigrationLog();
    migrationLog.forEach(entry => logFile.write(entry + '\n'));
    logFile.end();

    console.log(`\n📝 Detailed log written to: migration-${new Date().toISOString().slice(0, 10)}.log`);

    // Cleanup
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();

    process.exit(migrationResult.success ? 0 : 1);

  } catch (error) {
    console.error('💥 Unexpected error during migration:');
    console.error(error);
    process.exit(1);
  }
}

function parseArguments(): MigrationOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    force: args.includes('--force') || args.includes('-f'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1000'),
    skipBackup: args.includes('--skip-backup'),
    skipValidation: args.includes('--skip-validation')
  };
}

async function promptUser(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

function showHelp() {
  console.log(`
Database Migration Tool - Learning Solidity Platform

Usage: npm run migrate [options]

Options:
  --dry-run, -d          Simulate migration without making changes
  --force, -f            Force migration even with warnings
  --batch-size=<n>       Number of records to process per batch (default: 1000)
  --skip-backup          Skip database backup creation
  --skip-validation      Skip data integrity validation
  --help, -h             Show this help message

Examples:
  npm run migrate --dry-run                    # Test migration
  npm run migrate --force --batch-size=500     # Force migration with smaller batches
  npm run migrate --skip-backup                # Skip backup (not recommended)

Environment Variables:
  DATABASE_URL           PostgreSQL connection string (target database)
  SQLITE_PATH           Path to SQLite database (default: ./prisma/dev.db)

⚠️  IMPORTANT: Always run with --dry-run first to validate your migration!
`);
}

// Handle help command
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Migration terminated');
  process.exit(1);
});

// Execute migration
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});