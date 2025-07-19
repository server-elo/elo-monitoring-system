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
  const options = parseArguments(_);
  
  if (_options.dryRun) {
    console.log('🔍 DRY RUN MODE - No actual migration will be performed');
  }

  try {
    // Step 1: Environment validation
    console.log('\n📋 Step 1: Environment Validation');
    const envCheck = await MigrationUtils.validateEnvironment(_);
    if (!envCheck.valid) {
      console.error('❌ Environment validation failed:');
      envCheck.errors.forEach(_error => console.error(`  - ${error}`));
      process.exit(1);
    }
    console.log('✅ Environment validation passed');

    // Step 2: Disk space check
    console.log('\n💾 Step 2: Disk Space Check');
    const diskCheck = await MigrationUtils.checkDiskSpace(_);
    if (!diskCheck.sufficient) {
      console.error(`❌ Insufficient disk space: ${diskCheck.available}MB available, ${diskCheck.required}MB required`);
      if (!options.force) {
        process.exit(1);
      }
    }
    console.log(_`✅ Sufficient disk space: ${Math.round(diskCheck.available / 1024 / 1024)}MB available`);

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
    const estimatedTime = await MigrationUtils.estimateMigrationTime(_sqliteClient);
    console.log(_`📊 Estimated migration time: ${estimatedTime} seconds`);

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
    const migrationManager = new DatabaseMigrationManager( sqliteClient, postgresClient);

    // Step 6: Setup logging
    const logFile = createWriteStream(
      resolve(_process.cwd(), `migration-${new Date(_).toISOString().slice(0, 10)}.log`),
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
    
    if (_migrationResult.success) {
      console.log('✅ Migration completed successfully!');
      console.log(_`📈 Records migrated: ${migrationResult.migratedCount.toLocaleString()}`);
      console.log(_`⏱️  Duration: ${Math.round(migrationResult.duration / 1000)}s`);
      console.log(_`🔐 Data checksum: ${migrationResult.checksum}`);
      
      if (!options.dryRun) {
        console.log('\n🎯 Next Steps:');
        console.log('1. Update your .env file to use the PostgreSQL DATABASE_URL');
        console.log('2. Restart your application');
        console.log('3. Verify all functionality works correctly');
        console.log('4. Remove the SQLite database file when confident');
      }
    } else {
      console.error('❌ Migration failed!');
      console.error(_`📊 Partial migration: ${migrationResult.migratedCount.toLocaleString()} records`);
      console.error('🔍 Errors:');
      migrationResult.errors.forEach(error => {
        console.error(_`  - ${error}`);
      });
      
      if (!options.dryRun) {
        console.error('\n🚨 IMPORTANT: Your PostgreSQL database may be in an inconsistent state.');
        console.error('Please review the errors and consider running a rollback.');
      }
    }

    // Write detailed log
    const migrationLog = migrationManager.getMigrationLog(_);
    migrationLog.forEach(_entry => logFile.write(entry + '\n'));
    logFile.end(_);

    console.log(_`\n📝 Detailed log written to: migration-${new Date().toISOString().slice(0, 10)}.log`);

    // Cleanup
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();

    process.exit(_migrationResult.success ? 0 : 1);

  } catch (_error) {
    console.error('💥 Unexpected error during migration:');
    console.error(_error);
    process.exit(1);
  }
}

function parseArguments(): MigrationOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    force: args.includes('--force') || args.includes('-f'),
    batchSize: parseInt(_args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1000'),
    skipBackup: args.includes('--skip-backup'),
    skipValidation: args.includes('--skip-validation')
  };
}

async function promptUser(_question: string): Promise<string> {
  process.stdout.write(_question);
  return new Promise((resolve) => {
    process.stdin.once( 'data', (data) => {
      resolve(_data.toString().trim(_));
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
  --batch-size=<n>       Number of records to process per batch (_default: 1000)
  --skip-backup          Skip database backup creation
  --skip-validation      Skip data integrity validation
  --help, -h             Show this help message

Examples:
  npm run migrate --dry-run                    # Test migration
  npm run migrate --force --batch-size=500     # Force migration with smaller batches
  npm run migrate --skip-backup                # Skip backup (_not recommended)

Environment Variables:
  DATABASE_URL           PostgreSQL connection string (_target database)
  SQLITE_PATH           Path to SQLite database (_default: ./prisma/dev.db)

⚠️  IMPORTANT: Always run with --dry-run first to validate your migration!
`);
}

// Handle help command
if (_process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp(_);
  process.exit(0);
}

// Handle process signals gracefully
process.on( 'SIGINT', () => {
  console.log('\n🛑 Migration interrupted by user');
  process.exit(1);
});

process.on( 'SIGTERM', () => {
  console.log('\n🛑 Migration terminated');
  process.exit(1);
});

// Execute migration
main(_).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});