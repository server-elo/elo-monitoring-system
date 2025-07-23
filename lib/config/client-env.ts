/**
 * Client-safe environment configuration
 * Only exposes NEXT_PUBLIC_* variables to the browser
 */

interface ClientEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY?: string;
}

export const clientEnv: ClientEnvironment = {
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Solidity Learning Platform',
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY,
};

// For backward compatibility
export const env = clientEnv;