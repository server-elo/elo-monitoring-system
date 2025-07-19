import crypto from 'crypto';
import { isProduction } from './environment';

/**
 * Secrets Management Utility
 * Provides secure handling of sensitive configuration data
 */

interface SecretRotationConfig {
  secretName: string;
  rotationInterval: number; // in days
  lastRotated: Date;
  nextRotation: Date;
}

interface EncryptedSecret {
  encrypted: string;
  iv: string;
  tag: string;
}

class SecretsManager {
  private readonly encryptionKey: Buffer;
  private readonly rotationConfigs: Map<string, SecretRotationConfig> = new Map();

  constructor() {
    // Generate or retrieve encryption key for secret storage
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.initializeRotationConfigs();
  }

  /**
   * Get or create encryption key for local secret encryption
   */
  private getOrCreateEncryptionKey(): Buffer {
    const keyEnv = process.env.SECRET_ENCRYPTION_KEY;
    if (keyEnv) {
      return Buffer.from(keyEnv, 'hex');
    }

    // Generate new key (should be stored securely in production)
    const key = crypto.randomBytes(32);
    if (!isProduction) {
      console.warn('⚠️  Generated new encryption key. In production, use SECRET_ENCRYPTION_KEY env var.');
    }
    return key;
  }

  /**
   * Initialize rotation configurations for secrets
   */
  private initializeRotationConfigs(): void {
    const configs: Array<{ name: string; interval: number }> = [
      { name: 'NEXTAUTH_SECRET', interval: 90 },
      { name: 'CSRF_TOKEN_SECRET', interval: 30 },
      { name: 'JWT_SECRET', interval: 60 },
      { name: 'API_ENCRYPTION_KEY', interval: 45 },
      { name: 'WEBHOOK_SECRET', interval: 30 },
    ];

    configs.forEach(({ name, interval }) => {
      const lastRotated = this.getLastRotationDate(name);
      const nextRotation = new Date(lastRotated.getTime() + interval * 24 * 60 * 60 * 1000);
      
      this.rotationConfigs.set(name, {
        secretName: name,
        rotationInterval: interval,
        lastRotated,
        nextRotation,
      });
    });
  }

  /**
   * Get last rotation date for a secret (from database or file)
   */
  private getLastRotationDate(secretName: string): Date {
    // In production, this would query a secure database
    // For now, return a default date based on secret type
    const rotationIntervals: Record<string, number> = {
      'database': 90, // 90 days
      'api_key': 30,  // 30 days
      'jwt_secret': 60, // 60 days
      'encryption_key': 180, // 180 days
    };

    const daysAgo = rotationIntervals[secretName] || 30;
    console.log(`Secret ${secretName} last rotated ${daysAgo} days ago`);

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - daysAgo);
    return defaultDate;
  }

  /**
   * Encrypt a secret value
   */
  public encryptSecret(value: string): EncryptedSecret {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('secret-data'));

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  /**
   * Decrypt a secret value
   */
  public decryptSecret(encryptedSecret: EncryptedSecret): string {
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAAD(Buffer.from('secret-data'));
    decipher.setAuthTag(Buffer.from(encryptedSecret.tag, 'hex'));

    let decrypted = decipher.update(encryptedSecret.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a secure random secret
   */
  public generateSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a JWT secret
   */
  public generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('base64');
  }

  /**
   * Generate a NextAuth secret
   */
  public generateNextAuthSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Check if a secret needs rotation
   */
  public needsRotation(secretName: string): boolean {
    const config = this.rotationConfigs.get(secretName);
    if (!config) return false;

    return new Date() >= config.nextRotation;
  }

  /**
   * Get all secrets that need rotation
   */
  public getSecretsNeedingRotation(): string[] {
    return Array.from(this.rotationConfigs.keys()).filter(name => 
      this.needsRotation(name)
    );
  }

  /**
   * Rotate a secret (generate new value)
   */
  public rotateSecret(secretName: string): string {
    const newSecret = this.generateSecret();
    
    // Update rotation config
    const config = this.rotationConfigs.get(secretName);
    if (config) {
      config.lastRotated = new Date();
      config.nextRotation = new Date(
        config.lastRotated.getTime() + config.rotationInterval * 24 * 60 * 60 * 1000
      );
    }

    // In production, this would update the secret in the secret store
    console.log(`🔄 Rotated secret: ${secretName}`);
    
    return newSecret;
  }

  /**
   * Validate secret strength
   */
  public validateSecretStrength(secret: string): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    // Length check
    if (secret.length < 16) {
      issues.push('Secret should be at least 16 characters long');
    } else if (secret.length >= 32) {
      score += 25;
    } else {
      score += 15;
    }

    // Character variety
    const hasLower = /[a-z]/.test(secret);
    const hasUpper = /[A-Z]/.test(secret);
    const hasNumbers = /\d/.test(secret);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);

    const varietyCount = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    score += varietyCount * 15;

    if (varietyCount < 3) {
      issues.push('Secret should contain at least 3 different character types');
    }

    // Entropy check
    const entropy = this.calculateEntropy(secret);
    if (entropy < 3.5) {
      issues.push('Secret has low entropy (too predictable)');
    } else {
      score += 25;
    }

    // Common patterns
    if (/(.)\1{2,}/.test(secret)) {
      issues.push('Secret contains repeated characters');
      score -= 10;
    }

    if (/123|abc|qwe|password|secret/i.test(secret)) {
      issues.push('Secret contains common patterns');
      score -= 20;
    }

    return {
      isValid: issues.length === 0 && score >= 70,
      score: Math.max(0, Math.min(100, score)),
      issues,
    };
  }

  /**
   * Calculate entropy of a string
   */
  private calculateEntropy(str: string): number {
    const freq: { [key: string]: number } = {};
    
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const length = str.length;

    for (const count of Object.values(freq)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Get secret rotation status report
   */
  public getRotationReport(): {
    total: number;
    needingRotation: number;
    upToDate: number;
    details: Array<{
      name: string;
      lastRotated: Date;
      nextRotation: Date;
      daysUntilRotation: number;
      needsRotation: boolean;
    }>;
  } {
    const details = Array.from(this.rotationConfigs.entries()).map(([name, config]) => ({
      name,
      lastRotated: config.lastRotated,
      nextRotation: config.nextRotation,
      daysUntilRotation: Math.ceil(
        (config.nextRotation.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      ),
      needsRotation: this.needsRotation(name),
    }));

    const needingRotation = details.filter(d => d.needsRotation).length;

    return {
      total: details.length,
      needingRotation,
      upToDate: details.length - needingRotation,
      details,
    };
  }
}

// Create singleton instance
export const secretsManager = new SecretsManager();

/**
 * Utility functions for secret management
 */

/**
 * Get a secret from environment with fallback
 */
export function getSecret(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Required secret ${key} is not set`);
  }
  return value;
}

/**
 * Get a secret and validate its strength
 */
export function getValidatedSecret(key: string): string {
  const secret = getSecret(key);
  const validation = secretsManager.validateSecretStrength(secret);
  
  if (!validation.isValid) {
    console.warn(`⚠️  Secret ${key} validation failed:`, validation.issues);
    if (isProduction) {
      throw new Error(`Secret ${key} does not meet security requirements`);
    }
  }
  
  return secret;
}

/**
 * Check if secrets need rotation and log warnings
 */
export function checkSecretRotation(): void {
  const report = secretsManager.getRotationReport();
  
  if (report.needingRotation > 0) {
    console.warn(`⚠️  ${report.needingRotation} secrets need rotation:`);
    report.details
      .filter(d => d.needsRotation)
      .forEach(d => {
        console.warn(`  - ${d.name} (overdue by ${Math.abs(d.daysUntilRotation)} days)`);
      });
  }

  // Log upcoming rotations
  const soonToRotate = report.details.filter(d => 
    !d.needsRotation && d.daysUntilRotation <= 7
  );
  
  if (soonToRotate.length > 0) {
    console.info(`ℹ️  ${soonToRotate.length} secrets need rotation soon:`);
    soonToRotate.forEach(d => {
      console.info(`  - ${d.name} (in ${d.daysUntilRotation} days)`);
    });
  }
}

/**
 * Initialize secrets management
 */
export function initializeSecrets(): void {
  // Validate critical secrets
  try {
    getValidatedSecret('NEXTAUTH_SECRET');
  } catch (error) {
    console.error('❌ Critical secret validation failed:', error);
    if (isProduction) {
      process.exit(1);
    }
  }

  // Check rotation status
  checkSecretRotation();

  // Set up periodic rotation checks (every 24 hours)
  if (isProduction) {
    setInterval(() => {
      checkSecretRotation();
    }, 24 * 60 * 60 * 1000);
  }

  console.log('✅ Secrets management initialized');
}

// Export types
export type { SecretRotationConfig, EncryptedSecret };
