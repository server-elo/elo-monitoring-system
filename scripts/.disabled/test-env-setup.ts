#!/usr/bin/env tsx
/**;
* Test script to verify environment configuration is working correctly
* Run this to ensure the environment validation fix is working
*/
async function main(): void {
  console.log('🧪 Testing Environment Configuration\n');
  // Test 1: Client environment
  console.log('1️⃣ Testing client environment...');
  try {
    const { clientEnv, clientConfig } = await import('../lib/config/client-env');
    console.log('✅ Client environment loaded successfully');
    console.log('   App URL:', clientConfig.app.url);
    console.log('   App Name:', clientConfig.app.name);
    console.log('   Node Env:', clientEnv.NODE_ENV);
  } catch (error) {
    console.error('❌ Client environment failed:', error);
  }
  // Test 2: Server environment (only in Node.js context)
  console.log('\n2️⃣ Testing server environment...');
  if (typeof window === 'undefined') {
    try {
      const { serverEnv, features, validateCriticalConfig } = await import('../lib/config/server-env');
      console.log('✅ Server environment loaded successfully');
      console.log('   Database URL:', serverEnv.DATABASE_URL ? '***configured***' : 'NOT SET');
      console.log('   Redis URL:', serverEnv.REDIS_URL ? '***configured***' : 'NOT SET');
      console.log('   AI Features:', features.aiTutoring ? 'enabled' : 'disabled');
      // Test validation
      console.log('\n   Running critical config validation...');
      validateCriticalConfig();
      console.log('   ✅ Validation passed');
    } catch (error: unknown) {
      console.error('❌ Server environment failed:', error.message);
      if (error.errors) {
        console.error('   Missing variables:', error.errors);
      }
    }
  } else {
    console.log('⚠️  Skipping server test (running in browser context)');
  }
  // Test 3: Universal environment
  console.log('\n3️⃣ Testing universal environment...');
  try {
    const { env, isProduction, features, getEnvVar } = await import('../lib/config/environment');
    console.log('✅ Universal environment loaded successfully');
    console.log('   Is Production:', isProduction);
    console.log('   App URL:', env?.NEXT_PUBLIC_APP_URL || 'Loading...');
    console.log('   Feature flags available:', features ? 'yes' : 'client-defaults');
    // Test utility function
    const testVar: getEnvVar('NEXT_PUBLIC_APP_NAME');
    console.log('   getEnvVar test:', testVar || 'not found');
  } catch (error) {
    console.error('❌ Universal environment failed:', error);
  }
  // Test 4: Safe utilities
  console.log('\n4️⃣ Testing safe environment utilities...');
  try {
    const { safeGetEnv, getAppUrl, isClient, isServer } = await import('../lib/config/safe-env');
    console.log('✅ Safe utilities loaded successfully');
    console.log('   Is Client:', isClient());
    console.log('   Is Server:', isServer());
    console.log('   App URL (safe):', getAppUrl());
    // Test safe access
    const publicVar: safeGetEnv('NEXT_PUBLIC_APP_NAME');
    const serverVar: safeGetEnv('DATABASE_URL');
    console.log('   Public var access:', publicVar || 'not found');
    console.log('   Server var access:', isServer() ? (serverVar ? '***set***' : 'not set') : 'blocked on client');
  } catch (error) {
    console.error('❌ Safe utilities failed:', error);
  }
  // Summary
  console.log('\n📊 Summary:');
  console.log('If all tests passed, the environment configuration is working correctly!');
  console.log('If you see errors, check your .env file and ensure all required variables are set.');
  console.log('\nFor more details, see: lib/config/MIGRATION_GUIDE.md');
}
// Run the main function
main().catch (console.error);
