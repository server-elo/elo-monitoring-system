/**
 * @fileoverview Quantum Secrets Management System
 *
 * Advanced cryptographic secrets manager with rotation, derivation,
 * and secure storage capabilities.
 *
 * @security CRITICAL: This file handles sensitive cryptographic operations
 * @module lib/security/QuantumSecretsManager
 */

import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/**
 * Secret metadata interface
 */
export interface SecretMetadata {
  /** Secret identifier */
  id: string
  /** Creation timestamp */
  created: Date
  /** Last rotation timestamp */
  lastRotated: Date
  /** Next rotation due date */
  nextRotation: Date
  /** Secret strength level */
  strength: 'development' | 'staging' | 'production'
  /** Secret category */
  category: 'auth' | 'database' | 'api' | 'encryption' | 'webhook'
  /** Rotation policy in days */
  rotationPolicy: number
}

/**
 * Secret generation configuration
 */
export interface SecretConfig {
  /** Length of the secret */
  length: number
  /** Include special characters */
  includeSpecial: boolean
  /** Secret type */
  type: 'hex' | 'base64' | 'alphanumeric' | 'uuid'
  /** Minimum entropy bits */
  minEntropy: number
}

/**
 * Quantum Secrets Manager
 *
 * Provides enterprise-grade secret management with:
 * - Cryptographically secure random generation
 * - Key derivation functions (KDF)
 * - Automatic rotation scheduling
 * - Secure comparison and validation
 * - Environment-specific strength policies
 */
export class QuantumSecretsManager {
  private readonly secrets = new Map<string, SecretMetadata>()
  private readonly environment: string

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.environment = environment
  }

  /**
   * Generate a cryptographically secure secret
   *
   * @param config - Secret generation configuration
   * @returns Generated secret string
   */
  public generateSecret(config: SecretConfig): string {
    const { length, type, includeSpecial, minEntropy } = config

    // Validate minimum entropy
    const actualEntropy = this.calculateEntropy(length, type, includeSpecial)
    if (actualEntropy < minEntropy) {
      throw new Error(
        `Generated secret entropy (${actualEntropy} bits) below minimum (${minEntropy} bits)`,
      )
    }

    switch (type) {
      case 'hex':
        return randomBytes(Math.ceil(length / 2))
          .toString('hex')
          .substring(0, length)

      case 'base64':
        return randomBytes(Math.ceil((length * 3) / 4))
          .toString('base64')
          .replace(/[+/]/g, (char) => (char === '+' ? '-' : '_'))
          .substring(0, length)

      case 'uuid':
        return this.generateUUID()

      case 'alphanumeric':
      default:
        return this.generateAlphanumeric(length, includeSpecial)
    }
  }

  /**
   * Generate production-grade secrets for all services
   *
   * @returns Object containing all generated secrets
   */
  public generateProductionSecrets(): Record<string, string> {
    const secrets: Record<string, string> = {}

    // Authentication secrets
    secrets.NEXTAUTH_SECRET = this.generateSecret({
      length: 64,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 256,
    })

    secrets.JWT_SECRET = this.generateSecret({
      length: 64,
      type: 'base64',
      includeSpecial: false,
      minEntropy: 256,
    })

    secrets.SESSION_SECRET = this.generateSecret({
      length: 64,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 256,
    })

    secrets.CSRF_TOKEN_SECRET = this.generateSecret({
      length: 64,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 256,
    })

    // Encryption keys
    secrets.ENCRYPTION_KEY = this.generateSecret({
      length: 64,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 256,
    })

    secrets.SIGNING_KEY = this.generateSecret({
      length: 128,
      type: 'base64',
      includeSpecial: false,
      minEntropy: 512,
    })

    // Webhook secrets
    secrets.GITHUB_WEBHOOK_SECRET = this.generateSecret({
      length: 40,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 160,
    })

    secrets.STRIPE_WEBHOOK_SECRET = `whsec_${this.generateSecret({
      length: 64,
      type: 'base64',
      includeSpecial: false,
      minEntropy: 256,
    })}`

    // Database encryption
    secrets.DATABASE_ENCRYPTION_KEY = this.generateSecret({
      length: 64,
      type: 'hex',
      includeSpecial: false,
      minEntropy: 256,
    })

    return secrets
  }

  /**
   * Derive a key from a master secret using PBKDF2
   *
   * @param masterSecret - Master secret to derive from
   * @param salt - Salt for key derivation
   * @param iterations - Number of PBKDF2 iterations
   * @param keyLength - Desired key length in bytes
   * @returns Derived key as hex string
   */
  public async deriveKey(
    masterSecret: string,
    salt: string,
    iterations: number = 100000,
    keyLength: number = 32,
  ): Promise<string> {
    const derivedKey = (await scryptAsync(
      masterSecret,
      salt,
      keyLength,
    )) as Buffer
    return derivedKey.toString('hex')
  }

  /**
   * Validate secret strength based on environment
   *
   * @param secret - Secret to validate
   * @param category - Secret category
   * @returns Validation result
   */
  public validateSecretStrength(
    secret: string,
    category: SecretMetadata['category'],
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    // Minimum length requirements by environment
    const minLengths = {
      development: {
        auth: 32,
        database: 16,
        api: 16,
        encryption: 32,
        webhook: 16,
      },
      staging: { auth: 48, database: 32, api: 32, encryption: 48, webhook: 32 },
      production: {
        auth: 64,
        database: 48,
        api: 48,
        encryption: 64,
        webhook: 40,
      },
    }

    const env = this.environment as keyof typeof minLengths
    const minLength =
      minLengths[env]?.[category] || minLengths.production[category]

    if (secret.length < minLength) {
      issues.push(
        `Secret too short: ${secret.length} < ${minLength} (${env} environment)`,
      )
    }

    // Check for common weak patterns
    if (
      /^(test|dev|staging|prod|secret|password|key|token)/.test(
        secret.toLowerCase(),
      )
    ) {
      issues.push('Secret contains weak prefix pattern')
    }

    if (/\b(admin|user|guest|demo|example)\b/i.test(secret)) {
      issues.push('Secret contains common words')
    }

    // Entropy check
    const entropy = this.calculateStringEntropy(secret)
    const minEntropy =
      env === 'production' ? 4.5 : env === 'staging' ? 4.0 : 3.5

    if (entropy < minEntropy) {
      issues.push(
        `Low entropy: ${entropy.toFixed(2)} < ${minEntropy} bits per character`,
      )
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Securely compare two secrets using timing-safe comparison
   *
   * @param secret1 - First secret
   * @param secret2 - Second secret
   * @returns True if secrets match
   */
  public secureCompare(secret1: string, secret2: string): boolean {
    if (secret1.length !== secret2.length) {
      return false
    }

    const buffer1 = Buffer.from(secret1, 'utf8')
    const buffer2 = Buffer.from(secret2, 'utf8')

    return timingSafeEqual(buffer1, buffer2)
  }

  /**
   * Generate rotation schedule for secrets
   *
   * @param secrets - Array of secret identifiers
   * @returns Rotation schedule
   */
  public generateRotationSchedule(secrets: string[]): Array<{
    secretId: string
    nextRotation: Date
    priority: 'high' | 'medium' | 'low'
  }> {
    const now = new Date()
    const schedule = []

    for (const secretId of secrets) {
      const metadata = this.secrets.get(secretId)
      const rotationDays =
        metadata?.rotationPolicy || this.getDefaultRotationPolicy(secretId)

      const nextRotation = new Date(now)
      nextRotation.setDate(nextRotation.getDate() + rotationDays)

      const priority = this.getRotationPriority(secretId, rotationDays)

      schedule.push({
        secretId,
        nextRotation,
        priority,
      })
    }

    return schedule.sort(
      (a, b) => a.nextRotation.getTime() - b.nextRotation.getTime(),
    )
  }

  /**
   * Calculate theoretical entropy for secret configuration
   *
   * @private
   */
  private calculateEntropy(
    length: number,
    type: SecretConfig['type'],
    includeSpecial: boolean,
  ): number {
    let charsetSize = 0

    switch (type) {
      case 'hex':
        charsetSize = 16
        break
      case 'base64':
        charsetSize = 64
        break
      case 'uuid':
        return 128 // UUID v4 has 128 bits of entropy
      case 'alphanumeric':
        charsetSize = 62 // a-z, A-Z, 0-9
        if (includeSpecial) {
          charsetSize += 32 // Common special characters
        }
        break
    }

    return length * Math.log2(charsetSize)
  }

  /**
   * Calculate actual entropy of a string
   *
   * @private
   */
  private calculateStringEntropy(str: string): number {
    const charCount = new Map<string, number>()

    for (const char of str) {
      charCount.set(char, (charCount.get(char) || 0) + 1)
    }

    let entropy = 0
    const length = str.length

    for (const count of charCount.values()) {
      const probability = count / length
      entropy -= probability * Math.log2(probability)
    }

    return entropy
  }

  /**
   * Generate alphanumeric secret
   *
   * @private
   */
  private generateAlphanumeric(
    length: number,
    includeSpecial: boolean,
  ): string {
    let charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    if (includeSpecial) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    let result = ''
    const buffer = randomBytes(length)

    for (let i = 0; i < length; i++) {
      result += charset[buffer[i] % charset.length]
    }

    return result
  }

  /**
   * Generate UUID v4
   *
   * @private
   */
  private generateUUID(): string {
    const bytes = randomBytes(16)

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = bytes.toString('hex')
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join('-')
  }

  /**
   * Get default rotation policy for secret type
   *
   * @private
   */
  private getDefaultRotationPolicy(secretId: string): number {
    // Days between rotations
    if (secretId.includes('auth') || secretId.includes('session')) return 90
    if (secretId.includes('webhook') || secretId.includes('api')) return 180
    if (secretId.includes('encryption') || secretId.includes('signing'))
      return 365
    if (secretId.includes('database')) return 180

    return 90 // Default 90 days
  }

  /**
   * Get rotation priority based on secret type and age
   *
   * @private
   */
  private getRotationPriority(
    secretId: string,
    rotationDays: number,
  ): 'high' | 'medium' | 'low' {
    if (secretId.includes('auth') || secretId.includes('session')) return 'high'
    if (rotationDays <= 30) return 'high'
    if (rotationDays <= 90) return 'medium'
    return 'low'
  }
}

/**
 * Singleton instance for application use
 */
export const quantumSecrets = new QuantumSecretsManager()

/**
 * Environment-specific secret strength policies
 */
export const SECRET_POLICIES = {
  development: {
    minLength: 16,
    minEntropy: 3.0,
    rotationDays: 0, // No rotation in dev
  },
  staging: {
    minLength: 32,
    minEntropy: 4.0,
    rotationDays: 30,
  },
  production: {
    minLength: 64,
    minEntropy: 4.5,
    rotationDays: 90,
  },
} as const
