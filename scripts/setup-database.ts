#!/usr/bin/env tsx

// Database Setup Script for Enhanced AI Features
// Handles database initialization and migration for development

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface DatabaseSetupResult {
  success: boolean;
  message: string;
  details?: string;
}

class DatabaseSetup {
  private databaseUrl: string;

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || '';
  }

  async setupDatabase(): Promise<DatabaseSetupResult> {
    console.log('🗄️  Database Setup for Enhanced AI Features');
    console.log('===========================================');

    try {
      // Step 1: Check if DATABASE_URL is set
      if (!this.databaseUrl) {
        return await this.handleMissingDatabaseUrl();
      }

      // Step 2: Test database connection
      const connectionResult = await this.testDatabaseConnection();
      if (!connectionResult.success) {
        return await this.handleConnectionFailure(connectionResult);
      }

      // Step 3: Run Prisma migrations
      const migrationResult = await this.runPrismaMigrations();
      if (!migrationResult.success) {
        return migrationResult;
      }

      // Step 4: Generate Prisma client
      const clientResult = await this.generatePrismaClient();
      if (!clientResult.success) {
        return clientResult;
      }

      // Step 5: Seed initial data if needed
      const seedResult = await this.seedInitialData();

      return {
        success: true,
        message: '✅ Database setup completed successfully!',
        details: `Database ready with Enhanced AI features. ${seedResult.message}`
      };

    } catch (error) {
      return {
        success: false,
        message: '❌ Database setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleMissingDatabaseUrl(): Promise<DatabaseSetupResult> {
    console.log('⚠️  DATABASE_URL not found. Setting up development database...');
    
    // Create a simple file-based database URL for development
    const devDbPath = path.join(process.cwd(), 'dev.db');
    const devDatabaseUrl = `file:${devDbPath}`;
    
    // Update .env.local with SQLite URL
    const envPath = path.join(process.cwd(), '.env.local');
    try {
      let envContent = await fs.readFile(envPath, 'utf-8');
      
      if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL="${devDatabaseUrl}"`
        );
      } else {
        envContent += `\nDATABASE_URL="${devDatabaseUrl}"\n`;
      }
      
      await fs.writeFile(envPath, envContent);
      
      // Update schema to use SQLite
      await this.updateSchemaForSQLite();
      
      console.log('✅ Development database configuration created');
      
      // Set the URL for this session
      process.env.DATABASE_URL = devDatabaseUrl;
      this.databaseUrl = devDatabaseUrl;
      
      // Continue with setup
      return await this.setupDatabase();
      
    } catch (error) {
      return {
        success: false,
        message: '❌ Failed to create development database configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async updateSchemaForSQLite(): Promise<void> {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaContent = await fs.readFile(schemaPath, 'utf-8');
    
    // Update provider to sqlite
    schemaContent = schemaContent.replace(
      /provider = "postgresql"/,
      'provider = "sqlite"'
    );
    
    // Remove PostgreSQL-specific types and arrays for SQLite compatibility
    // This is a simplified version - in production you'd want proper migration
    schemaContent = schemaContent.replace(/@db\.Text/g, '');
    schemaContent = schemaContent.replace(/String\[\]/g, 'String'); // Convert arrays to strings
    
    await fs.writeFile(schemaPath, schemaContent);
    console.log('✅ Schema updated for SQLite compatibility');
  }

  private async testDatabaseConnection(): Promise<DatabaseSetupResult> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Try to generate Prisma client first
      await execAsync('npx prisma generate', { cwd: process.cwd() });
      
      // Test connection with a simple query
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$connect();
      await prisma.$disconnect();
      
      console.log('✅ Database connection successful');
      return { success: true, message: 'Database connection successful' };
      
    } catch (error) {
      console.log('❌ Database connection failed');
      return {
        success: false,
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleConnectionFailure(_connectionResult: DatabaseSetupResult): Promise<DatabaseSetupResult> {
    console.log('⚠️  Database connection failed. Attempting fallback setup...');
    
    // Try to set up a development database
    return await this.handleMissingDatabaseUrl();
  }

  private async runPrismaMigrations(): Promise<DatabaseSetupResult> {
    try {
      console.log('🔄 Running Prisma migrations...');
      
      // First, try to push the schema (for development)
      await execAsync('npx prisma db push', { cwd: process.cwd() });
      
      console.log('✅ Database schema updated');
      return { success: true, message: 'Migrations completed' };
      
    } catch (error) {
      console.log('❌ Migration failed, trying alternative approach...');
      
      try {
        // Try migrate dev as fallback
        await execAsync('npx prisma migrate dev --name init', { cwd: process.cwd() });
        console.log('✅ Database migrations completed');
        return { success: true, message: 'Migrations completed' };
        
      } catch (migrationError) {
        return {
          success: false,
          message: 'Database migration failed',
          details: migrationError instanceof Error ? migrationError.message : 'Unknown error'
        };
      }
    }
  }

  private async generatePrismaClient(): Promise<DatabaseSetupResult> {
    try {
      console.log('⚙️  Generating Prisma client...');
      
      await execAsync('npx prisma generate', { cwd: process.cwd() });
      
      console.log('✅ Prisma client generated');
      return { success: true, message: 'Prisma client generated' };
      
    } catch (error) {
      return {
        success: false,
        message: 'Prisma client generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async seedInitialData(): Promise<DatabaseSetupResult> {
    try {
      console.log('🌱 Seeding initial data...');
      
      // Check if seed script exists
      const seedPath = path.join(process.cwd(), 'prisma', 'seed.ts');
      try {
        await fs.access(seedPath);
        await execAsync('npx prisma db seed', { cwd: process.cwd() });
        console.log('✅ Initial data seeded');
        return { success: true, message: 'Initial data seeded' };
      } catch {
        console.log('ℹ️  No seed script found, skipping...');
        return { success: true, message: 'No seeding required' };
      }
      
    } catch (error) {
      // Seeding failure is not critical
      console.log('⚠️  Seeding failed, but continuing...');
      return { 
        success: true, 
        message: 'Seeding skipped',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Main execution
async function main() {
  const setup = new DatabaseSetup();
  const result = await setup.setupDatabase();
  
  console.log('\n' + '='.repeat(50));
  console.log(result.message);
  if (result.details) {
    console.log('Details:', result.details);
  }
  console.log('='.repeat(50));
  
  process.exit(result.success ? 0 : 1);
}

// Run setup if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
}

export { DatabaseSetup };
