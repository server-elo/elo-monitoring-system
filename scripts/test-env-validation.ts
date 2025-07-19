#!/usr/bin/env tsx

/**
 * Environment Validation Test Script
 */

import { config } from 'dotenv';
import { envValidator } from '../lib/config/env-validator';

// Load environment variables
config({ path: '.env' });

try {
  console.log('🔍 Testing environment validation...');
  
  const env = envValidator.validate();
  
  console.log('✅ Environment validation passed!');
  console.log('📊 Configuration summary:', {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    cluster: env.CLUSTER_ENABLED,
    dbUrl: env.DATABASE_URL.replace(/:[^:]*@/, ':***@'),
    redisUrl: env.REDIS_URL,
  });
  
  // Test health check
  const health = envValidator.healthCheck();
  console.log('🏥 Health check:', health);
  
} catch (error) {
  console.error('❌ Environment validation failed:', (error as Error).message);
  process.exit(1);
}