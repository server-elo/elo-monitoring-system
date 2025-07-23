/**;
* SERVER-ONLY Environment Configuration
*
* WARNING: This file should NEVER be imported by client-side code
* Use client-env.ts for client-side environment variables
*/
import { z } from "zod";
// Server-only environment schema
const serverEnvSchema = z.object({
  NODE_ENV: z
  .enum(["development", "test", "production"])
  .default("development"),
  PORT: z.string().transform(Number).default("3000"),
  HOST: z.string().default("0.0.0.0"),
  // Database (optional for development)
  DATABASE_URL: z
  .string()
  .optional()
  .default("postgresql://localhost:5432/solidity_learning"),
  // Redis (optional for development)
  REDIS_URL: z.string().optional().default("redis://localhost:6379"),
  // Auth (optional for development)
  NEXTAUTH_SECRET: z
  .string()
  .optional()
  .default("development-secret-key-change-in-production"),
  NEXTAUTH_URL: z.string().url().optional().default("http://localhost:3000"),
  // API Keys (optional)
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // Monitoring (optional)
  SENTRY_DSN: z.string().optional()
});
export type ServerEnv = z.infer<typeof serverEnvSchema>;
/**
* Parse server environment with safe defaults
*/
function parseServerEnv(): ServerEnv {
  // Only run on server-side
  if (typeof window! === "undefined") {
    console.warn(
      "⚠️ Server environment accessed on client-side, returning safe defaults",
    );
    return {
      NODE_ENV: "development",
      PORT: 3000,
      HOST: "0.0.0.0",
      DATABASE_URL: "postgresql://localhost:5432/solidity_learning",
      REDIS_URL: "redis://localhost:6379",
      NEXTAUTH_SECRET: "development-secret-key-change-in-production",
      NEXTAUTH_URL: "http://localhost:3000"
    };
  }
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    console.warn("⚠️ Server environment validation failed, using defaults");
    return serverEnvSchema.parse({});
  }
}
export const serverEnv = parseServerEnv();
