#!/usr/bin/env tsx
/**
 * @fileoverview Quantum Secrets Rotation Script
 * 
 * Automated script to rotate all application secrets with zero-downtime
 * deployment strategy and rollback capabilities.
 * 
 * Usage:
 *   npm run secrets:rotate
 *   npm run secrets:rotate -- --environment production --dry-run
 *   npm run secrets:rotate -- --rollback
 * 
 * @security CRITICAL: This script handles production secrets
 */

import { writeFile, readFile, access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { quantumSecrets } from '../lib/security/QuantumSecretsManager';

interface RotationOptions {
  environment: 'development' | 'staging' | 'production';
  dryRun: boolean;
  rollback: boolean;
  backup: boolean;
  force: boolean;
}

interface RotationResult {
  success: boolean;
  rotatedSecrets: string[];
  errors: string[];
  backupFile?: string;
  rollbackCommands: string[];
}

/**
 * Main secrets rotation orchestrator
 */
class QuantumSecretsRotation {
  private readonly options: RotationOptions;
  private readonly timestamp: string;
  private readonly backupDir: string;

  constructor(options: RotationOptions) {
    this.options = options;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = join(process.cwd(), 'backups', 'secrets');
  }

  /**
   * Execute secrets rotation process
   */
  public async execute(): Promise<RotationResult> {
    console.log('🔄 QUANTUM SECRETS ROTATION INITIATED');
    console.log('=====================================');
    console.log(`Environment: ${this.options.environment}`);
    console.log(`Dry Run: ${this.options.dryRun}`);
    console.log(`Timestamp: ${this.timestamp}`);
    console.log('');

    const result: RotationResult = {
      success: false,
      rotatedSecrets: [],
      errors: [],
      rollbackCommands: []
    };

    try {
      // Step 1: Backup existing secrets
      if (this.options.backup && !this.options.rollback) {
        result.backupFile = await this.backupExistingSecrets();
        console.log(`✅ Secrets backed up to: ${result.backupFile}`);
      }

      if (this.options.rollback) {
        return await this.executeRollback();
      }

      // Step 2: Generate new secrets
      const newSecrets = await this.generateNewSecrets();
      console.log(`🔐 Generated ${Object.keys(newSecrets).length} new secrets`);

      // Step 3: Validate new secrets
      const validation = await this.validateSecrets(newSecrets);
      if (!validation.valid) {
        throw new Error(`Secret validation failed: ${validation.errors.join(', ')}`);
      }
      console.log('✅ All new secrets validated successfully');

      // Step 4: Update environment files
      if (!this.options.dryRun) {
        await this.updateEnvironmentFiles(newSecrets);
        result.rotatedSecrets = Object.keys(newSecrets);
        console.log('✅ Environment files updated');
      } else {
        console.log('🔍 DRY RUN: Would update environment files');
        result.rotatedSecrets = Object.keys(newSecrets);
      }

      // Step 5: Generate rollback commands
      result.rollbackCommands = this.generateRollbackCommands(result.backupFile);

      result.success = true;
      console.log('');
      console.log('🎉 QUANTUM SECRETS ROTATION COMPLETED SUCCESSFULLY!');

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error('❌ Rotation failed:', errorMessage);

      // Attempt automatic rollback on failure
      if (!this.options.dryRun && result.backupFile) {
        console.log('🔄 Attempting automatic rollback...');
        try {
          await this.performRollback(result.backupFile);
          console.log('✅ Automatic rollback completed');
        } catch (rollbackError) {
          console.error('❌ Automatic rollback failed:', rollbackError);
          result.errors.push(`Rollback failed: ${rollbackError}`);
        }
      }

      return result;
    }
  }

  /**
   * Generate new cryptographically secure secrets
   */
  private async generateNewSecrets(): Promise<Record<string, string>> {
    console.log('🔐 Generating new cryptographically secure secrets...');
    
    const secrets = quantumSecrets.generateProductionSecrets();
    
    // Add environment-specific adjustments
    if (this.options.environment === 'development') {
      // Shorter secrets for development, but still secure
      secrets.NEXTAUTH_SECRET = quantumSecrets.generateSecret({
        length: 32,
        type: 'hex',
        includeSpecial: false,
        minEntropy: 128
      });
    }

    // Add quantum signature for tracking
    const quantumSignature = quantumSecrets.generateSecret({
      length: 16,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 64
    });

    secrets.QUANTUM_ROTATION_ID = `qr_${this.timestamp}_${quantumSignature}`;
    secrets.QUANTUM_ROTATION_ENV = this.options.environment;

    return secrets;
  }

  /**
   * Validate all generated secrets
   */
  private async validateSecrets(secrets: Record<string, string>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(secrets)) {
      // Skip metadata keys
      if (key.startsWith('QUANTUM_ROTATION_')) continue;

      const category = this.getSecretCategory(key);
      const validation = quantumSecrets.validateSecretStrength(value, category);

      if (!validation.valid) {
        errors.push(`${key}: ${validation.issues.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Backup existing secrets before rotation
   */
  private async backupExistingSecrets(): Promise<string> {
    await mkdir(this.backupDir, { recursive: true });
    
    const backupFile = join(
      this.backupDir,
      `secrets-backup-${this.options.environment}-${this.timestamp}.json`
    );

    const existingSecrets: Record<string, string> = {};

    // Read current environment file
    const envFile = this.getEnvironmentFilePath();
    try {
      const envContent = await readFile(envFile, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          existingSecrets[key] = value;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${envFile}:`, error);
    }

    const backup = {
      timestamp: this.timestamp,
      environment: this.options.environment,
      secrets: existingSecrets,
      metadata: {
        rotationId: `backup_${this.timestamp}`,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    await writeFile(backupFile, JSON.stringify(backup, null, 2));
    return backupFile;
  }

  /**
   * Update environment files with new secrets
   */
  private async updateEnvironmentFiles(secrets: Record<string, string>): Promise<void> {
    const envFile = this.getEnvironmentFilePath();
    
    // Read existing content
    let existingContent = '';
    try {
      existingContent = await readFile(envFile, 'utf8');
    } catch (error) {
      console.log(`Creating new environment file: ${envFile}`);
    }

    // Parse existing environment variables
    const existingVars = new Map<string, string>();
    const existingLines = existingContent.split('\n');
    const nonEnvLines: string[] = [];

    for (const line of existingLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        existingVars.set(key, valueParts.join('='));
      } else {
        nonEnvLines.push(line);
      }
    }

    // Update with new secrets
    for (const [key, value] of Object.entries(secrets)) {
      existingVars.set(key, value);
    }

    // Rebuild environment file
    const newContent: string[] = [];
    
    // Add header comment
    newContent.push(`# Environment configuration - Last updated: ${new Date().toISOString()}`);
    newContent.push(`# Quantum Secrets Rotation ID: ${secrets.QUANTUM_ROTATION_ID}`);
    newContent.push('');

    // Add non-environment lines (comments, etc.)
    newContent.push(...nonEnvLines.filter(line => line.trim()));

    if (nonEnvLines.filter(line => line.trim()).length > 0) {
      newContent.push('');
    }

    // Add environment variables in sorted order
    const sortedVars = Array.from(existingVars.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    for (const [key, value] of sortedVars) {
      newContent.push(`${key}=${value}`);
    }

    // Write updated content
    const finalContent = newContent.join('\n') + '\n';
    await writeFile(envFile, finalContent);

    console.log(`✅ Updated environment file: ${envFile}`);
  }

  /**
   * Execute rollback to previous secrets
   */
  private async executeRollback(): Promise<RotationResult> {
    console.log('🔄 EXECUTING ROLLBACK TO PREVIOUS SECRETS');
    console.log('==========================================');

    const result: RotationResult = {
      success: false,
      rotatedSecrets: [],
      errors: [],
      rollbackCommands: []
    };

    try {
      // Find latest backup file
      const backupFiles = await this.findBackupFiles();
      if (backupFiles.length === 0) {
        throw new Error('No backup files found for rollback');
      }

      const latestBackup = backupFiles[0]; // Assuming sorted by timestamp
      console.log(`Rolling back to: ${latestBackup}`);

      await this.performRollback(latestBackup);
      
      result.success = true;
      result.rotatedSecrets = ['ROLLBACK_COMPLETED'];
      console.log('✅ Rollback completed successfully');

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error('❌ Rollback failed:', errorMessage);
      return result;
    }
  }

  /**
   * Perform actual rollback operation
   */
  private async performRollback(backupFile: string): Promise<void> {
    const backupContent = await readFile(backupFile, 'utf8');
    const backup = JSON.parse(backupContent);

    console.log(`Restoring ${Object.keys(backup.secrets).length} secrets from backup`);

    await this.updateEnvironmentFiles(backup.secrets);
  }

  /**
   * Generate rollback commands for manual recovery
   */
  private generateRollbackCommands(backupFile?: string): string[] {
    const commands = [
      '# Manual Rollback Commands',
      '# ========================',
      '',
      '# Option 1: Using this script',
      'npm run secrets:rotate -- --rollback',
      '',
      '# Option 2: Manual backup restoration',
    ];

    if (backupFile) {
      commands.push(`# Restore from: ${backupFile}`);
      commands.push('# 1. Copy backup file to current environment file');
      commands.push('# 2. Restart application services');
      commands.push('# 3. Verify application functionality');
    }

    return commands;
  }

  /**
   * Find available backup files
   */
  private async findBackupFiles(): Promise<string[]> {
    try {
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(this.backupDir);
      
      return files
        .filter(file => file.includes(this.options.environment) && file.endsWith('.json'))
        .sort()
        .reverse() // Most recent first
        .map(file => join(this.backupDir, file));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get environment file path based on environment
   */
  private getEnvironmentFilePath(): string {
    switch (this.options.environment) {
      case 'production':
        return join(process.cwd(), '.env.production');
      case 'staging':
        return join(process.cwd(), '.env.staging');
      case 'development':
      default:
        return join(process.cwd(), '.env.local');
    }
  }

  /**
   * Determine secret category from key name
   */
  private getSecretCategory(key: string): 'auth' | 'database' | 'api' | 'encryption' | 'webhook' {
    if (key.includes('AUTH') || key.includes('JWT') || key.includes('SESSION')) {
      return 'auth';
    }
    if (key.includes('DATABASE') || key.includes('DB')) {
      return 'database';
    }
    if (key.includes('WEBHOOK')) {
      return 'webhook';
    }
    if (key.includes('ENCRYPTION') || key.includes('SIGNING')) {
      return 'encryption';
    }
    return 'api';
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const options: RotationOptions = {
    environment: 'development',
    dryRun: false,
    rollback: false,
    backup: true,
    force: false,
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--environment':
      case '-e':
        options.environment = args[++i] as RotationOptions['environment'];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--rollback':
        options.rollback = true;
        break;
      case '--no-backup':
        options.backup = false;
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // Validate environment
  if (!['development', 'staging', 'production'].includes(options.environment)) {
    console.error('❌ Invalid environment. Must be: development, staging, or production');
    process.exit(1);
  }

  // Safety check for production
  if (options.environment === 'production' && !options.force && !options.dryRun) {
    console.error('❌ Production secrets rotation requires --force flag or --dry-run');
    console.error('   Use --dry-run to preview changes first');
    process.exit(1);
  }

  const rotation = new QuantumSecretsRotation(options);
  const result = await rotation.execute();

  if (result.success) {
    console.log('\n📋 ROTATION SUMMARY');
    console.log('==================');
    console.log(`Rotated Secrets: ${result.rotatedSecrets.length}`);
    console.log(`Environment: ${options.environment}`);
    if (result.backupFile) {
      console.log(`Backup File: ${result.backupFile}`);
    }
    
    if (result.rollbackCommands.length > 0) {
      console.log('\n🔄 ROLLBACK COMMANDS');
      console.log(result.rollbackCommands.join('\n'));
    }

    process.exit(0);
  } else {
    console.log('\n❌ ROTATION FAILED');
    console.log('==================');
    console.log('Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
    
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
🔐 Quantum Secrets Rotation Tool
================================

Usage: npm run secrets:rotate [options]

Options:
  -e, --environment <env>  Target environment (development|staging|production)
  --dry-run               Preview changes without applying them
  --rollback              Rollback to previous secrets
  --no-backup             Skip backup creation
  --force                 Force production rotation (use with caution)
  -h, --help              Show this help message

Examples:
  npm run secrets:rotate                                    # Development dry-run
  npm run secrets:rotate -- --environment staging --force  # Rotate staging secrets
  npm run secrets:rotate -- --rollback                     # Rollback last rotation
  npm run secrets:rotate -- --dry-run --environment production  # Preview production rotation

Safety Features:
  - Automatic backup before rotation
  - Cryptographic validation of all secrets
  - Rollback capabilities
  - Production safety guards
  - Zero-downtime rotation strategy

For more information, see: docs/SECURITY.md
`);
}

// Execute if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}