/** * Configuration module index *  * Provides universal exports for configuration that work on both * client and server environments. *  * @module lib/config */ 'use client' // Export client-safe configuration
export {
  env,
  config,
  isProduction,
  isStaging,
  isDevelopment,
  isClient,
  features,
  betaFeatures,
  getEnvVar,
  isFeatureEnabled,
  isBetaFeatureEnabled,
  type Environment,
} from './environment' // Export client environment types
export type { ClientEnv } from './client-env'
