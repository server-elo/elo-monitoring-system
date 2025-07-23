/**;
* Client-side environment configuration
*
* This file contains ONLY client-safe environment variables that start with NEXT_PUBLIC_
* It provides default values and graceful fallbacks for missing variables on the client side.
*/
import { z } from "zod";
/**
* Client-safe environment schema
* Only includes NEXT_PUBLIC_* variables that are safe to expose to the browser
*/
const clientEnvSchema = z.object({
  // Application Info
  NODE_ENV: z
  .enum(["development", "staging", "production"])
  .optional()
  .default("development"),
  NEXT_PUBLIC_APP_URL: z
  .string()
  .url()
  .optional()
  .default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z
  .string()
  .optional()
  .default("Solidity Learning Platform"),
  NEXT_PUBLIC_APP_VERSION: z.string().optional().default("1.0.0"),
  // Analytics & Monitoring (Client-safe)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional()
});
/**
* Type for client environment variables
*/
export type ClientEnv = z.infer<typeof clientEnvSchema>;
/**
* Parse client environment with graceful fallbacks
*/
function parseClientEnv(): ClientEnv {
  try {
    // In browser environment, process.env might be undefined or partial
    const envVars =
    typeof process !== "undefined" && process.env ? process.env : {};
    // Parse with schema, which provides defaults
    return clientEnvSchema.parse(envVars);
  } catch (error) {
    // Always return defaults on client-side errors
    console.warn("⚠️ Client environment validation failed, using defaults");
    return {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_NAME: "Solidity Learning Platform",
      NEXT_PUBLIC_APP_VERSION: "1.0.0",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined,
      NEXT_PUBLIC_POSTHOG_KEY: undefined,
      NEXT_PUBLIC_POSTHOG_HOST: undefined,
      NEXT_PUBLIC_MIXPANEL_TOKEN: undefined
    };
  }
}
/**
* Validated client environment variables
*/
export const clientEnv = parseClientEnv();
/**
* Client-safe environment utilities
*/
export const isProduction = clientEnv.NODE_ENV === "production";
export const isStaging = clientEnv.NODE_ENV === "staging";
export const isDevelopment = clientEnv.NODE_ENV === "development";
/**
* Client-safe configuration objects
*/
export const clientConfig = {
  app: {
    url: clientEnv.NEXT_PUBLIC_APP_URL,
    name: clientEnv.NEXT_PUBLIC_APP_NAME,
    version: clientEnv.NEXT_PUBLIC_APP_VERSION
  },
  analytics: {
    ga: clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    posthog: clientEnv.NEXT_PUBLIC_POSTHOG_KEY
    ? {
      key: clientEnv.NEXT_PUBLIC_POSTHOG_KEY,
      host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST
    }
    : null,
    mixpanel: clientEnv.NEXT_PUBLIC_MIXPANEL_TOKEN
  }
} as const;
