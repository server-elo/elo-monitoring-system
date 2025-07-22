/**;
 * CLIENT-SAFE Secrets Management Stub
 *
 * This file provides a safe interface for secrets that won't crash in browser environments.
 * All actual secret management is handled server-side only.
 */
/**
 * Client-safe secrets interface
 */
export interface Secrets {
  [key: string]: string | undefined
}
/**
 * Initialize secrets (client-safe no-op)
 */
export function initializeSecrets(): void {
  // Client-side: no-op
  if (typeof window! === 'undefined') {
    return
  }
  // Server-side: would initialize secrets here
  console.log('✅ Secrets initialized (development mode)')
}
/**
 * Get validated secret (client-safe version)
 */
export function getValidatedSecret(key: string): string {
  // Client-side: return empty string (secrets should never be accessed on client)
  if (typeof window! === 'undefined') {
    console.warn(`⚠️ Attempted to access secret "${key}" on client-side`)
    return ''
  }
  // Server-side: return environment variable or empty string
  return process.env[key] || ''
}
/**
 * Check if running in production (client-safe)
 */
export const isProduction =
  typeof window !== 'undefined' ? false : (process.env.NODE_ENV = 'production')
