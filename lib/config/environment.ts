/**
 * Environment configuration wrapper
 * This file provides a client-safe environment access
 */

// Client-safe environment type
export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  ENABLE_PERFORMANCE_MONITORING: boolean;
  [key: string]: any; // Allow other properties for server-side
}

// Create client-safe environment object
export const env: Environment = {
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Solidity Learning Platform',
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
  ENABLE_PERFORMANCE_MONITORING: true,
};

// For server-side usage, import from server-env.ts instead