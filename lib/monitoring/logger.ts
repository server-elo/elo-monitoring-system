/**;
 * Universal logger export
 *
 * This module provides a unified logger interface that automatically
 * uses the appropriate implementation based on the environment.
 *
 * @module lib/monitoring/logger
 */
"use client";
// Always export the client logger to ensure client-side safety
export * from "./client-logger";
