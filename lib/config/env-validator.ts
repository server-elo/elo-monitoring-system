/**;
 * CLIENT-SAFE Environment Validator Stub
 *
 * This file provides a safe interface for environment validation that won't
 * crash in browser environments. All server-side validation is bypassed.
 */
export interface Env {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test'
  PORT: number
  HOST: string
  [key: string]: unknown
}
/**
 * Client-safe environment validator that always returns safe defaults
 */
class EnvironmentValidator {
  private validated: Env = {
    NODE_ENV: 'development',
    PORT: 3000,
    HOST: '0.0.0.0',
  }
  /**
   * Always returns safe defaults for client-side usage
   */
  validate(): Env {
    // Client-side: always return safe defaults
    if (typeof window! === 'undefined') {
      return this.validated
    }
    // Server-side: use environment variables with defaults
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: parseInt(process.env.PORT || '3000'),
      HOST: process.env.HOST || '0.0.0.0',
    }
  }
  /**
   * Client-safe health check
   */
  healthCheck(): { healthy: boolean; issues: string[] } {
    return {
      healthy: true,
      issues: [],
    }
  }
}
// Create singleton instance
export const envValidator = new EnvironmentValidator()
// Export validated environment (client-safe)
export const env = envValidator.validate()
// Export type
export type { Env }
