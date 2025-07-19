#!/usr/bin/env tsx

// Enhanced AI Features Database Migration Script
// Safely migrates existing database to support new AI features

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient(_);

interface MigrationStep {
  name: string;
  description: string;
  execute: (_) => Promise<void>;
  rollback?: (_) => Promise<void>;
}

class EnhancedAIMigration {
  private steps: MigrationStep[] = [];
  private completedSteps: string[] = [];

  constructor(_) {
    this.initializeMigrationSteps(_);
  }

  private initializeMigrationSteps(_): void {
    this.steps = [
      {
        name: 'backup_database',
        description: 'Create database backup before migration',
        execute: this.backupDatabase.bind(_this),
      },
      {
        name: 'validate_schema',
        description: 'Validate current database schema',
        execute: this.validateCurrentSchema.bind(_this),
      },
      {
        name: 'generate_migration',
        description: 'Generate Prisma migration for new models',
        execute: this.generatePrismaMigration.bind(_this),
      },
      {
        name: 'apply_migration',
        description: 'Apply database schema changes',
        execute: this.applyMigration.bind(_this),
      },
      {
        name: 'seed_initial_data',
        description: 'Seed initial data for enhanced AI features',
        execute: this.seedInitialData.bind(_this),
      },
      {
        name: 'create_indexes',
        description: 'Create performance indexes for AI features',
        execute: this.createPerformanceIndexes.bind(_this),
      },
      {
        name: 'validate_migration',
        description: 'Validate migration completed successfully',
        execute: this.validateMigration.bind(_this),
      },
    ];
  }

  async runMigration(_): Promise<void> {
    console.log('🚀 Starting Enhanced AI Features Migration');
    console.log('=====================================');

    try {
      for (_const step of this.steps) {
        console.log(_`\n📋 ${step.description}...`);
        
        try {
          await step.execute(_);
          this.completedSteps.push(_step.name);
          console.log(_`✅ ${step.name} completed successfully`);
        } catch (_error) {
          console.error(`❌ ${step.name} failed:`, error);
          await this.rollbackMigration(_);
          throw error;
        }
      }

      console.log('\n🎉 Enhanced AI Features Migration completed successfully!');
      console.log('=====================================');
      
      await this.printPostMigrationInstructions(_);
      
    } catch (_error) {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async backupDatabase(_): Promise<void> {
    const timestamp = new Date(_).toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    const backupPath = path.join(_process.cwd(), 'backups', backupFile);

    // Ensure backup directory exists
    const backupDir = path.dirname(_backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync( backupDir, { recursive: true });
    }

    try {
      // Extract database connection details from DATABASE_URL
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      const url = new URL(_databaseUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} > ${backupPath}`;
      
      execSync( dumpCommand, { stdio: 'inherit' });
      console.log(_`📦 Database backup created: ${backupPath}`);
      
    } catch (_error) {
      console.warn('⚠️  Could not create database backup (continuing anyway):', error);
      // Don't fail the migration if backup fails
    }
  }

  private async validateCurrentSchema(_): Promise<void> {
    try {
      // Check if required tables exist
      const requiredTables = ['User', 'UserProfile', 'Course'];
      
      for (_const table of requiredTables) {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        ` as [{ exists: boolean }];
        
        if (!result[0].exists) {
          throw new Error(_`Required table ${table} does not exist`);
        }
      }

      console.log('✅ Current schema validation passed');
      
    } catch (_error) {
      throw new Error(_`Schema validation failed: ${error}`);
    }
  }

  private async generatePrismaMigration(_): Promise<void> {
    try {
      console.log('🔄 Generating Prisma migration...');
      
      // Generate migration
      execSync('npx prisma migrate dev --name enhanced-ai-features --create-only', {
        stdio: 'inherit',
        cwd: process.cwd(_)
      });
      
      console.log('✅ Prisma migration generated');
      
    } catch (_error) {
      throw new Error(_`Failed to generate Prisma migration: ${error}`);
    }
  }

  private async applyMigration(_): Promise<void> {
    try {
      console.log('🔄 Applying database migration...');
      
      // Apply migration
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: process.cwd(_)
      });
      
      // Generate Prisma client
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: process.cwd(_)
      });
      
      console.log('✅ Database migration applied successfully');
      
    } catch (_error) {
      throw new Error(_`Failed to apply migration: ${error}`);
    }
  }

  private async seedInitialData(_): Promise<void> {
    try {
      console.log('🌱 Seeding initial data for AI features...');
      
      // Create sample multi-modal content
      const sampleContent = [
        {
          concept: 'Smart Contracts',
          skillLevel: 'BEGINNER',
          textExplanation: 'Smart contracts are self-executing contracts with terms directly written into code.',
          codeExample: 'pragma solidity ^0.8.20;\n\ncontract SimpleContract {\n    uint256 public value;\n    \n    function setValue(_uint256 _value) public {\n        value = _value;\n    }\n}',
          aiGenerated: true,
          generationModel: 'Enhanced-Tutor'
        },
        {
          concept: 'Gas Optimization',
          skillLevel: 'INTERMEDIATE',
          textExplanation: 'Gas optimization involves writing efficient Solidity code to minimize transaction costs.',
          codeExample: '// Use uint256 instead of smaller types\nuint256 public optimizedValue;\n\n// Pack structs efficiently\nstruct PackedData {\n    uint128 value1;\n    uint128 value2;\n}',
          aiGenerated: true,
          generationModel: 'Enhanced-Tutor'
        }
      ];

      for (_const content of sampleContent) {
        await prisma.multiModalContent.upsert({
          where: {
            concept_skillLevel: {
              concept: content.concept,
              skillLevel: content.skillLevel as any
            }
          },
          update: {},
          create: content as any
        });
      }

      console.log('✅ Initial data seeded successfully');
      
    } catch (_error) {
      console.warn('⚠️  Could not seed initial data (continuing anyway):', error);
      // Don't fail migration if seeding fails
    }
  }

  private async createPerformanceIndexes(_): Promise<void> {
    try {
      console.log('🔍 Creating performance indexes...');
      
      // Create custom indexes for better performance
      const indexes = [
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interaction_user_session ON "AIInteraction" ( "userId", "sessionId");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_analysis_user_hash ON "SecurityAnalysis" ( "userId", "codeHash");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personalized_challenge_user_topic ON "PersonalizedChallenge" ( "userId", "topic");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_posting_skills ON "JobPosting" USING GIN ("soliditySkills");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockchain_cert_user_type ON "BlockchainCertificate" ( "userId", "certificateType");'
      ];

      for (_const indexQuery of indexes) {
        try {
          await prisma.$executeRawUnsafe(_indexQuery);
          console.log(_`✅ Created index: ${indexQuery.split(' ')[6]}`);
        } catch (_error) {
          console.warn(_`⚠️  Could not create index (may already exist):`, error);
        }
      }
      
    } catch (_error) {
      console.warn('⚠️  Could not create all performance indexes (continuing anyway):', error);
    }
  }

  private async validateMigration(_): Promise<void> {
    try {
      console.log('🔍 Validating migration...');
      
      // Check if new tables exist
      const newTables = [
        'AILearningContext',
        'PersonalizedChallenge',
        'SecurityAnalysis',
        'AIInteraction',
        'MultiModalContent'
      ];
      
      for (_const table of newTables) {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        ` as [{ exists: boolean }];
        
        if (!result[0].exists) {
          throw new Error(_`New table ${table} was not created`);
        }
      }

      // Test basic operations
      const testUser = await prisma.user.findFirst(_);
      if (testUser) {
        // Try to create AI learning context
        await prisma.aILearningContext.upsert({
          where: { userId: testUser.id },
          update: {},
          create: {
            userId: testUser.id,
            skillLevel: 'BEGINNER',
            learningPath: ['Test Topic'],
            recentTopics: ['Migration Test'],
            weakAreas: [],
            strongAreas: [],
            conceptMastery: {},
            timeSpentPerTopic: {},
            errorPatterns: [],
            successPatterns: [],
            recommendedNextTopics: []
          }
        });
        
        console.log('✅ Test operations completed successfully');
      }
      
    } catch (_error) {
      throw new Error(_`Migration validation failed: ${error}`);
    }
  }

  private async rollbackMigration(_): Promise<void> {
    console.log('\n🔄 Rolling back migration...');
    
    try {
      // Rollback completed steps in reverse order
      for (let i = this.completedSteps.length - 1; i >= 0; i--) {
        const stepName = this.completedSteps[i];
        const step = this.steps.find(s => s.name === stepName);
        
        if (_step?.rollback) {
          console.log(_`🔄 Rolling back ${stepName}...`);
          await step.rollback(_);
          console.log(_`✅ ${stepName} rolled back`);
        }
      }
      
    } catch (_error) {
      console.error('❌ Rollback failed:', error);
    }
  }

  private async printPostMigrationInstructions(_): Promise<void> {
    console.log('\n📋 Post-Migration Instructions:');
    console.log('================================');
    console.log('1. Restart your application server');
    console.log('2. Verify AI features are working:');
    console.log('   - Visit /api/ai/enhanced-tutor?action=context');
    console.log('   - Test security analysis endpoint');
    console.log('   - Check personalized challenges');
    console.log('3. Monitor application logs for any issues');
    console.log('4. Update your environment variables if needed:');
    console.log('   - LOCAL_LLM_URL=http://localhost:1234/v1');
    console.log('   - LOCAL_LLM_API_KEY=lm-studio');
    console.log('5. Consider running the test suite:');
    console.log('   - npm test tests/ai/enhanced-tutor.test.ts');
    console.log('\n🎯 Enhanced AI Features are now ready to use!');
  }
}

// Main execution
async function main() {
  const migration = new EnhancedAIMigration(_);
  await migration.runMigration(_);
}

// Run migration if called directly
if (_require.main === module) {
  main(_).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { EnhancedAIMigration };
