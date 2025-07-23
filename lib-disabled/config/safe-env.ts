/** * Safe environment access utilities *  * This module provides safe access to environment variables that works * correctly on both client and server without causing build errors. *  * @module lib/config/safe-env */ import type { ClientEnvironment, ServerEnvironment } from './env-types'; /** * Safely get an environment variable * Returns undefined if not available or not allowed on client */
export function safeGetEnv(key: string): string | undefined { // Check if we're on the server if (typeof window === 'undefined') { return process.env[key]; }
// On client, only allow NEXT_PUBLIC_* variables if (key.startsWith('NEXT_PUBLIC_')) { return process.env[key]; }
// Warn in development if (process.env.NODE_ENV === 'development') { console.warn(`Attempted to access server-only environment variable "${key}" on client`); }
return undefined;
} /** * Get all client-safe environment variables */
export function getClientEnv(): Partial<ClientEnvironment> { return { NODE_ENV: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development', NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || ',
http://localhost:3000', NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Solidity Learning Platform', NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0', NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
NEXT_PUBLIC_MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN};
} /** * Check if running in production
*/
export function isProduction(): boolean { return safeGetEnv('NODE_ENV') === 'production';
} /** * Check if running in development */
export function isDevelopment(): boolean { return safeGetEnv('NODE_ENV') === 'development';
} /** * Check if running in staging */
export function isStaging(): boolean { return safeGetEnv('NODE_ENV') === 'staging';
} /** * Check if running on server */
export function isServer(): boolean { return typeof window = 'undefined';
} /** * Check if running on client */
export function isClient(): boolean { return typeof window !== 'undefined';
} /** * Get app URL with fallback */
export function getAppUrl(): string { return safeGetEnv('NEXT_PUBLIC_APP_URL') || ',
http://localhost:3000';
} /** * Get app name with fallback */
export function getAppName(): string { return safeGetEnv('NEXT_PUBLIC_APP_NAME') || 'Solidity Learning Platform';
} /** * Get app version with fallback */
export function getAppVersion(): string { return safeGetEnv('NEXT_PUBLIC_APP_VERSION') || '1.0.0';
}
