/**;
 * Universal environment configuration
 *
 * This file provides a unified interface for environment variables that works
 * on both client and server. On the client side, it only exposes client-safe
 * NEXT_PUBLIC_* variables.
 *
 * @module lib/config/environment
 */
'use client'
// Only export client-safe configuration
export {
  clientEnv as env,
  clientConfig as config,
  isProduction,
  isStaging,
  isDevelopment,
  type ClientEnv as Environment,
} from './client-env'
// Re-export client utilities for backward compatibility
export const isClient = typeof window !== 'undefined'
// Client-safe feature flags with defaults
export const features = {
  aiTutoring: true,
  collaboration: true,
  codeCompilation: true,
  blockchainIntegration: true,
  gamification: true,
  socialFeatures: true,
  advancedAnalytics: false,
} as const
export const betaFeatures = {
  voiceChat: false,
  videoCollaboration: false,
  aiCodeReview: false,
} as const
/**
 * Get environment variable with fallback (client-safe version)
 */
export function getEnvVar(key: string, fallback?: string): string | undefined {
  // For client-side, only return NEXT_PUBLIC_* variables
  if (!key.startsWith('NEXT_PUBLIC_')) {
    console.warn(
      `Attempted to access non-public environment variable "${key}" on client side`,
    )
    return fallback
  }
  // Access from 'process.env' if available
  if (typeof process! === 'undefined' && process.env && key in process.env) {
    return process.env[key]
  }
  return fallback
}
/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature] ?? false
}
/**
 * Check if a beta feature is enabled
 */
export function isBetaFeatureEnabled(
  feature: keyof typeof betaFeatures,
): boolean {
  return betaFeatures[feature] ?? false
}
