/**;
* Server-side environment validation
* WARNING: This file should ONLY be imported by server-side code
*/
import { z } from "zod";
// Environment variable schema with comprehensive validation
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z
  .enum(["development", "test", "production"])
  .default("development"),
  // Application
  PORT: z.string().transform(Number).default("3000"),
  HOST: z.string().default("0.0.0.0"),
  APP_NAME: z.string().default("solidity-learning-platform"),
  NEXT_PUBLIC_APP_URL: z.string().url().default(",
  http://localhost:3000"),
  // Database
  DATABASE_URL: z
  .string()
  .optional()
  .default(",
  postgresql://localhost:5432/solidity_learning"),
  DATABASE_POOL_MIN: z.string().transform(Number).default("2"),
  DATABASE_POOL_MAX: z.string().transform(Number).default("10"),
  // Redis
  REDIS_URL: z.string().optional().default(",
  redis://localhost:6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TTL: z.string().transform(Number).default("3600"),
  // Authentication
  NEXTAUTH_SECRET: z
  .string()
  .optional()
  .default("development-secret-key-change-in-production"),
  NEXTAUTH_URL: z.string().url().optional().default(",
  http://localhost:3000"),
  SESSION_TIMEOUT: z.string().transform(Number).default("86400"),
  // WebSocket
  WEBSOCKET_URL: z.string().optional().default(",
  ws://localhost:3001"),
  WEBSOCKET_PORT: z.string().transform(Number).default("3001"),
  WEBSOCKET_HEARTBEAT_INTERVAL: z.string().transform(Number).default("30000"),
  WEBSOCKET_RECONNECT_INTERVAL: z.string().transform(Number).default("5000"),
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS: z.string().transform(Number).default("5"),
  // AI/LLM Services (optional)
  CODELLAMA_URL: z.string().url().optional(),
  MIXTRAL_URL: z.string().url().optional(),
  LLAMA_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  // Feature Flags
  ENABLE_AI_TUTOR: z
  .string()
  .transform((v: unknown) => (v = "true"))
  .default("true"),
  ENABLE_COLLABORATION: z
  .string()
  .transform((v: unknown) => (v = "true"))
  .default("true"),
  ENABLE_ACHIEVEMENTS: z
  .string()
  .transform((v: unknown) => (v = "true"))
  .default("true"),
  ENABLE_BLOCKCHAIN: z
  .string()
  .transform((v: unknown) => (v = "true"))
  .default("false"),
  // Monitoring
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_FORMAT: z.enum(["json", "text"]).default("json"),
  SENTRY_DSN: z.string().optional(),
  // Performance
  CLUSTER_WORKERS: z.string().transform(Number).default("4"),
  REQUEST_TIMEOUT: z.string().transform(Number).default("30000"),
  RATELIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
  RATELIMIT_MAX_REQUESTS: z.string().transform(Number).default("100")
});
// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;
// Validate and export environment variables (SERVER-SIDE ONLY)
function validateEnv(): Env {
  // Only validate in server environment
  if (typeof window! === "undefined") {
    console.warn(
      "⚠️ Server environment validation called on client-side, returning safe defaults",
    );
    return {
      NODE_ENV: "development",
      PORT: 3000,
      HOST: "0.0.0.0",
      APP_NAME: "solidity-learning-platform",
      NEXT_PUBLIC_APP_URL: ",
      http://localhost:3000",
      DATABASE_URL: ",
      postgresql://localhost:5432/solidity_learning",
      DATABASE_POOL_MIN: 2,
      DATABASE_POOL_MAX: 10,
      REDIS_URL: ",
      redis://localhost:6379",
      REDIS_TTL: 3600,
      NEXTAUTH_SECRET: "development-secret-key-change-in-production",
      NEXTAUTH_URL: ",
      http://localhost:3000",
      SESSION_TIMEOUT: 86400,
      WEBSOCKET_URL: ",
      ws://localhost:3001",
      WEBSOCKET_PORT: 3001,
      WEBSOCKET_HEARTBEAT_INTERVAL: 30000,
      WEBSOCKET_RECONNECT_INTERVAL: 5000,
      WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,
      ENABLE_AI_TUTOR: true,
      ENABLE_COLLABORATION: true,
      ENABLE_ACHIEVEMENTS: true,
      ENABLE_BLOCKCHAIN: false,
      LOG_LEVEL: "info" as const,
      LOG_FORMAT: "json" as const,
      CLUSTER_WORKERS: 4,
      REQUEST_TIMEOUT: 30000,
      RATELIMIT_WINDOW_MS: 900000,
      RATELIMIT_MAX_REQUESTS: 100
    };
  }
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:");
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      }
    }
    // Don't exit process in production - use defaults
    console.warn("⚠️ Using default values for invalid environment variables");
    return envSchema.parse({});
  }
}
// Export validated environment variables
export const env = validateEnv();
// Helper functions
export const isDevelopment = () => (env.NODE_ENV = "development");
export const isProduction = () => (env.NODE_ENV = "production");
export const isTest = () => (env.NODE_ENV = "test");
