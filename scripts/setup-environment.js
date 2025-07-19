#!/usr/bin/env node

/**
 * Environment Setup Script for Solidity Learning Platform
 * This script helps you configure all required environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateSecureSecret() {
  return crypto.randomBytes(32).toString('base64');
}

async function main() {
  console.log('🚀 Solidity Learning Platform - Environment Setup');
  console.log('==================================================\n');

  const config = {};

  // Database Configuration
  console.log('📊 DATABASE CONFIGURATION');
  console.log('Please set up your Supabase database first:');
  console.log('1. Go to https://supabase.com');
  console.log('2. Create a new project');
  console.log('3. Get your connection string from Settings > Database\n');

  config.DATABASE_URL = await question('Enter your Supabase DATABASE_URL: ');
  
  if (!config.DATABASE_URL || !config.DATABASE_URL.includes('supabase.co')) {
    console.log('⚠️  Warning: This doesn\'t look like a Supabase URL. Make sure it\'s correct.');
  }

  // Authentication Configuration
  console.log('\n🔐 AUTHENTICATION CONFIGURATION');
  
  const useGeneratedSecret = await question('Generate a secure NEXTAUTH_SECRET? (y/n): ');
  if (useGeneratedSecret.toLowerCase() === 'y') {
    config.NEXTAUTH_SECRET = generateSecureSecret();
    console.log(`Generated NEXTAUTH_SECRET: ${config.NEXTAUTH_SECRET}`);
  } else {
    config.NEXTAUTH_SECRET = await question('Enter your NEXTAUTH_SECRET (min 32 chars): ');
  }

  config.NEXTAUTH_URL = await question('Enter your app URL (http://localhost:3000 for dev): ') || 'http://localhost:3000';

  // GitHub OAuth
  console.log('\n🐙 GITHUB OAUTH SETUP');
  console.log('Create a GitHub OAuth app at: https://github.com/settings/applications/new');
  console.log(`Callback URL: ${config.NEXTAUTH_URL}/api/auth/callback/github\n`);
  
  config.GITHUB_CLIENT_ID = await question('Enter GitHub Client ID: ');
  config.GITHUB_CLIENT_SECRET = await question('Enter GitHub Client Secret: ');

  // Google OAuth
  console.log('\n🔍 GOOGLE OAUTH SETUP');
  console.log('Create a Google OAuth app at: https://console.cloud.google.com/apis/credentials');
  console.log(`Callback URL: ${config.NEXTAUTH_URL}/api/auth/callback/google\n`);
  
  config.GOOGLE_CLIENT_ID = await question('Enter Google Client ID: ');
  config.GOOGLE_CLIENT_SECRET = await question('Enter Google Client Secret: ');

  // AI Services
  console.log('\n🤖 AI SERVICES CONFIGURATION');
  console.log('Get your Gemini API key at: https://makersuite.google.com/app/apikey\n');
  
  config.GEMINI_API_KEY = await question('Enter Gemini API Key: ');

  // Optional Services
  console.log('\n⚙️  OPTIONAL SERVICES');
  
  const setupRedis = await question('Set up Redis for caching? (y/n): ');
  if (setupRedis.toLowerCase() === 'y') {
    console.log('Recommended: Use Upstash Redis (https://upstash.com/) for free tier');
    config.REDIS_URL = await question('Enter Redis URL (optional): ') || '';
  }

  // Environment
  config.NODE_ENV = 'development';
  config.NEXT_PUBLIC_APP_URL = config.NEXTAUTH_URL;

  // Generate .env.local file
  const envContent = `# =============================================================================
# SOLIDITY LEARNING PLATFORM - LOCAL ENVIRONMENT
# =============================================================================
# Generated on ${new Date().toISOString()}
# =============================================================================

# Database Configuration
DATABASE_URL="${config.DATABASE_URL}"

# Authentication Configuration
NEXTAUTH_SECRET="${config.NEXTAUTH_SECRET}"
NEXTAUTH_URL="${config.NEXTAUTH_URL}"

# OAuth Providers
GITHUB_CLIENT_ID="${config.GITHUB_CLIENT_ID}"
GITHUB_CLIENT_SECRET="${config.GITHUB_CLIENT_SECRET}"
GOOGLE_CLIENT_ID="${config.GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="${config.GOOGLE_CLIENT_SECRET}"

# AI Services
GEMINI_API_KEY="${config.GEMINI_API_KEY}"

# Optional Services
${config.REDIS_URL ? `REDIS_URL="${config.REDIS_URL}"` : '# REDIS_URL=""'}

# Environment Configuration
NODE_ENV="${config.NODE_ENV}"
NEXT_PUBLIC_APP_URL="${config.NEXT_PUBLIC_APP_URL}"

# Feature Flags
FEATURE_AI_TUTORING=true
FEATURE_COLLABORATION=true
FEATURE_CODE_COMPILATION=true
FEATURE_BLOCKCHAIN_INTEGRATION=true
FEATURE_GAMIFICATION=true
FEATURE_SOCIAL_FEATURES=true
`;

  // Write to .env.local
  fs.writeFileSync('.env.local', envContent);
  
  console.log('\n✅ Environment configuration complete!');
  console.log('📁 Created .env.local file');
  
  console.log('\n🔄 NEXT STEPS:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run db:generate');
  console.log('3. Run: npm run db:push');
  console.log('4. Run: npm run dev');
  console.log('5. Test authentication at http://localhost:3000');

  console.log('\n📋 PRODUCTION DEPLOYMENT:');
  console.log('- Copy these environment variables to your deployment platform');
  console.log('- Update NEXTAUTH_URL to your production domain');
  console.log('- Update OAuth callback URLs to production domain');
  
  rl.close();
}

main().catch(console.error);
