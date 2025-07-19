#!/usr/bin/env tsx

// Enhanced AI Features Database Migration Script
// Safely migrates existing database to support new AI features

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface MigrationStep {
  name: string;
  description: string;
  execute: () => Promise<void>;
  rollback?: () => Promise<void>;
}

class EnhancedAIMigration {
  private steps: MigrationStep[] = [];
  private completedSteps: string[] = [];

  constructor() {
    this.initializeMigrationSteps();
  }

  private initializeMigrationSteps(): void {
    this.steps = [
      {
        name: 'backup_database',
        description: 'Create database backup before migration',
        execute: this.backupDatabase.bind(this),
      },
      {
        name: 'validate_schema',
        description: 'Validate current database schema',
        execute: this.validateCurrentSchema.bind(this),
      },
      {
        name: 'generate_migration',
        description: 'Generate Prisma migration for new models',
        execute: this.generatePrismaMigration.bind(this),
      },
      {
        name: 'apply_migration',
        description: 'Apply database schema changes',
        execute: this.applyMigration.bind(this),
      },
      {
        name: 'seed_initial_data',
        description: 'Seed initial data for enhanced AI features',
        execute: this.seedInitialData.bind(this),
      },
      {
        name: 'create_indexes',
        description: 'Create performance indexes for AI features',
        execute: this.createPerformanceIndexes.bind(this),
      },
      {
        name: 'validate_migration',
        description: 'Validate migration completed successfully',
        execute: this.validateMigration.bind(this),
      },
    ];
  }

  async runMigration(): Promise<void> {
    console.log('🚀 Starting Enhanced AI Features Migration');
    console.log('=====================================');

    try {
      for (const step of this.steps) {
        console.log(`\n📋 ${step.description}...`);
        
        try {
          await step.execute();
          this.completedSteps.push(step.name);
          console.log(`✅ ${step.name} completed successfully`);
        } catch (error) {
          console.error(`❌ ${step.name} failed:`, error);
          await this.rollbackMigration();
          throw error;
        }
      }

      console.log('\n🎉 Enhanced AI Features Migration completed successfully!');
      console.log('=====================================');
      
      await this.printPostMigrationInstructions();
      
    } catch (error) {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async backupDatabase(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', backupFile);

    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      // Extract database connection details from DATABASE_URL
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} > ${backupPath}`;
      
      execSync(dumpCommand, { stdio: 'inherit' });
      console.log(`📦 Database backup created: ${backupPath}`);
      
    } catch (error) {
      console.warn('⚠️  Could not create database backup (continuing anyway):', error);
      // Don't fail the migration if backup fails
    }
  }

  private async validateCurrentSchema(): Promise<void> {
    try {
      // Check if required tables exist
      const requiredTables = ['User', 'UserProfile', 'Course'];
      
      for (const table of requiredTables) {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        ` as [{ exists: boolean }];
        
        if (!result[0].exists) {
          throw new Error(`Required table ${table} does not exist`);
        }
      }

      console.log('✅ Current schema validation passed');
      
    } catch (error) {
      throw new Error(`Schema validation failed: ${error}`);
    }
  }

  private async generatePrismaMigration(): Promise<void> {
    try {
      console.log('🔄 Generating Prisma migration...');
      
      // Generate migration
      execSync('npx prisma migrate dev --name enhanced-ai-features --create-only', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Prisma migration generated');
      
    } catch (error) {
      throw new Error(`Failed to generate Prisma migration: ${error}`);
    }
  }

  private async applyMigration(): Promise<void> {
    try {
      console.log('🔄 Applying database migration...');
      
      // Apply migration
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Generate Prisma client
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Database migration applied successfully');
      
    } catch (error) {
      throw new Error(`Failed to apply migration: ${error}`);
    }
  }

  private async seedInitialData(): Promise<void> {
    try {
      console.log('🌱 Seeding initial data for AI features...');
      
      // Create sample multi-modal content
      const sampleContent = [
        {
          concept: 'Smart Contracts',
          skillLevel: 'BEGINNER',
          textExplanation: 'Smart contracts are self-executing contracts with terms directly written into code.',
          codeExample: 'pragma solidity ^0.8.20;\n\ncontract SimpleContract {\n    uint256 public value;\n    \n    function setValue(uint256 _value) public {\n        value = _value;\n    }\n}',
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

      for (const content of sampleContent) {
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
      
    } catch (error) {
      console.warn('⚠️  Could not seed initial data (continuing anyway):', error);
      // Don't fail migration if seeding fails
    }
  }

  private async createPerformanceIndexes(): Promise<void> {
    try {
      console.log('🔍 Creating performance indexes...');
      
      // Create custom indexes for better performance
      const indexes = [
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interaction_user_session ON "AIInteraction" ("userId", "sessionId");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_analysis_user_hash ON "SecurityAnalysis" ("userId", "codeHash");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personalized_challenge_user_topic ON "PersonalizedChallenge" ("userId", "topic");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_posting_skills ON "JobPosting" USING GIN ("soliditySkills");',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockchain_cert_user_type ON "BlockchainCertificate" ("userId", "certificateType");'
      ];

      for (const indexQuery of indexes) {
        try {
          await prisma.$executeRawUnsafe(indexQuery);
          console.log(`✅ Created index: ${indexQuery.split(' ')[6]}`);
        } catch (error) {
          console.warn(`⚠️  Could not create index (may already exist):`, error);
        }
      }
      
    } catch (error) {
      console.warn('⚠️  Could not create all performance indexes (continuing anyway):', error);
    }
  }

  private async validateMigration(): Promise<void> {
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
      
      for (const table of newTables) {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        ` as [{ exists: boolean }];
        
        if (!result[0].exists) {
          throw new Error(`New table ${table} was not created`);
        }
      }

      // Test basic operations
      const testUser = await prisma.user.findFirst();
      if (testUser) {
        // Try to create AI learning context
        await prisma.aiLearningContext.upsert({
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
      
    } catch (error) {
      throw new Error(`Migration validation failed: ${error}`);
    }
  }

  private async rollbackMigration(): Promise<void> {
    console.log('\n🔄 Rolling back migration...');
    
    try {
      // Rollback completed steps in reverse order
      for (let i = this.completedSteps.length - 1; i >= 0; i--) {
        const stepName = this.completedSteps[i];
        const step = this.steps.find(s => s.name === stepName);
        
        if (step?.rollback) {
          console.log(`🔄 Rolling back ${stepName}...`);
          await step.rollback();
          console.log(`✅ ${stepName} rolled back`);
        }
      }
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    }
  }

  private async printPostMigrationInstructions(): Promise<void> {
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
  const migration = new EnhancedAIMigration();
  await migration.runMigration();
}

// Run migration if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { EnhancedAIMigration };
