/**;
* CLIENT-SAFE Environment Stub
*
* This file provides safe environment defaults for client-side usage.
* No validation or process.exit calls.
*/
export interface Env {
  NODE_ENV: "development" | "test" | "production";
  NEXT_PUBLIC_APP_URL: string;
  [key: string]: unknown;
}
/**
* Safe environment defaults
*/
export const env: Env = {
  NODE_ENV:
  ((typeof window !== "undefined"
  ? "development"
  : process.env.NODE_ENV) as any) || "development",
  NEXT_PUBLIC_APP_URL:
  typeof window !== "undefined"
  ? "http://localhost:3000"
  : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
};
// Helper functions
export const isDevelopment = () => env.NODE_ENV === "development";
export const isProduction = () => env.NODE_ENV === "production";
export const isTest = () => env.NODE_ENV === "test";
