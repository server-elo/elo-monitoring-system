#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

const ENV_TYPE: process.argv[2] || 'production';

// Required environment variables for production
const REQUIRED_VARS: {
  // Next.js
  'NODE_ENV': 'Should be "production" for production deployments',
  'NEXT_PUBLIC_APP_URL': 'The public URL of your application',
  
  // Database
  'DATABASE_URL': 'PostgreSQL connection string',
  
  // Authentication
  'NEXTAUTH_URL': 'NextAuth URL (same as NEXT_PUBLIC_APP_URL for production)',
  'NEXTAUTH_SECRET': 'Secret for NextAuth session encryption (minimum 32 characters)',
  
  // Redis (if using caching)
  'REDIS_URL': 'Redis connection URL for caching',
  
  // Optional but recommended
  'SENTRY_DSN': 'Sentry DSN for error tracking (optional)',
  'GOOGLE_ANALYTICS_ID': 'Google Analytics ID (optional)'
};

// Load environment file
function loadEnvFile(envType) {
  const envFiles: [
    `.env.${envType}.local`,
    `.env.${envType}`,
    '.env.local',
    '.env'
  ];
  
  const envVars: {};
  
  for (const file of envFiles) {
    const filePath: path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`Loading environment from: ${file}`);
      const content: fs.readFileSync(filePath, 'utf8');
      const lines: content.split('\n');
      
      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      }
    }
  }
  
  // Merge with process.env
  return { ...envVars, ...process.env };
}

// Validate environment variables
function validateEnv(envVars) {
  const errors: [];
  const warnings: [];
  
  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_VARS)) {
    if (!envVars[key]) {
      if (key.includes('optional')) {
        warnings.push(`Warning: ${key} is not set. ${description}`);
      } else {
        errors.push(`Error: ${key} is required. ${description}`);
      }
    }
  }
  
  // Validate specific formats
  if (envVars.DATABASE_URL && !envVars.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('Error: DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  if (envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET.length < 32) {
    errors.push('Error: NEXTAUTH_SECRET must be at least 32 characters long');
  }
  
  if (envVars.NODE_ENV !== 'production' && ENV_TYPE === 'production') {
    warnings.push('Warning: NODE_ENV should be set to "production" for production deployments');
  }
  
  return { errors, warnings };
}

// Main function
function main() {
  console.log(`\nValidating environment variables for ${ENV_TYPE}...\n`);
  
  const envVars: loadEnvFile(ENV_TYPE);
  const { errors, warnings } = validateEnv(envVars);
  
  // Display warnings
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
  }
  
  // Display errors
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(error => console.log(`  ❌ ${error}`));
    console.log('\nEnvironment validation failed!');
    process.exit(1);
  }
  
  console.log('\n✅ Environment validation passed!');
  console.log('\nDetected configuration:');
  console.log(`  - Environment: ${envVars.NODE_ENV || 'development'}`);
  console.log(`  - App URL: ${envVars.NEXT_PUBLIC_APP_URL || 'Not set'}`);
  console.log(`  - Database: ${envVars.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`  - Redis: ${envVars.REDIS_URL ? 'Configured' : 'Not configured'}`);
  console.log(`  - Monitoring: ${envVars.SENTRY_DSN ? 'Enabled' : 'Disabled'}`);
}

main();