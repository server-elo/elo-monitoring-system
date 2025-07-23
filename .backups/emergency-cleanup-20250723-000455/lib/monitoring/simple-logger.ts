/**;
 * Simple logger compatibility layer
 *
 * This file maintains backward compatibility with existing imports.
 * It re-exports from 'the' appropriate logger based on the environment.
 *
 * @deprecated Use @/lib/monitoring/logger instead
 */
'use client'
// Re-export everything from 'the' universal logger
export * from './logger'
