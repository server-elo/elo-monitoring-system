#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables and tests connections
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GEMINI_API_KEY'
];

const optionalVars = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'REDIS_URL'
];

function validateEnvironment() {
  console.log('🔍 Validating Environment Configuration');
  console.log('=====================================\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('📋 REQUIRED VARIABLES:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: Missing`);
      hasErrors = true;
    } else if (value.includes('your-') || value.includes('YOUR_')) {
      console.log(`⚠️  ${varName}: Contains placeholder value`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });

  // Check optional variables
  console.log('\n🔧 OPTIONAL VARIABLES:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`⚪ ${varName}: Not set`);
    } else if (value.includes('your-') || value.includes('YOUR_')) {
      console.log(`⚠️  ${varName}: Contains placeholder value`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });

  // Validate specific formats
  console.log('\n🔍 VALIDATION CHECKS:');

  // Database URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.startsWith('postgresql://') && dbUrl.includes('supabase.co')) {
      console.log('✅ DATABASE_URL: Valid Supabase format');
    } else if (dbUrl.startsWith('postgresql://')) {
      console.log('⚠️  DATABASE_URL: Valid PostgreSQL format (not Supabase)');
    } else {
      console.log('❌ DATABASE_URL: Invalid format');
      hasErrors = true;
    }
  }

  // NextAuth Secret
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret) {
    if (nextAuthSecret.length >= 32) {
      console.log('✅ NEXTAUTH_SECRET: Sufficient length');
    } else {
      console.log('⚠️  NEXTAUTH_SECRET: Should be at least 32 characters');
      hasWarnings = true;
    }
  }

  // NextAuth URL
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    if (nextAuthUrl.startsWith('http://') || nextAuthUrl.startsWith('https://')) {
      console.log('✅ NEXTAUTH_URL: Valid format');
    } else {
      console.log('❌ NEXTAUTH_URL: Must start with http:// or https://');
      hasErrors = true;
    }
  }

  // OAuth Configuration
  const hasGitHub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  
  if (hasGitHub && hasGoogle) {
    console.log('✅ OAuth: Both GitHub and Google configured');
  } else if (hasGitHub || hasGoogle) {
    console.log('⚠️  OAuth: Only one provider configured');
    hasWarnings = true;
  } else {
    console.log('❌ OAuth: No providers configured');
    hasErrors = true;
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  if (hasErrors) {
    console.log('❌ Configuration has errors that must be fixed');
    console.log('   Please update your environment variables and try again.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Configuration has warnings but should work');
    console.log('   Consider addressing the warnings for better functionality.');
  } else {
    console.log('✅ Configuration looks good!');
  }

  return !hasErrors;
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection...');
  
  try {
    // Dynamic import to avoid issues if Prisma isn't set up yet
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(`   ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Ensure DATABASE_URL is correct');
    console.log('   2. Run: npm run db:generate');
    console.log('   3. Run: npm run db:push');
    return false;
  }
  
  return true;
}

async function testGeminiAPI() {
  console.log('\n🤖 Testing Gemini API...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚪ Gemini API key not set, skipping test');
    return true;
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent('Hello, this is a test.');
    console.log('✅ Gemini API connection successful');
    return true;
  } catch (error) {
    console.log('❌ Gemini API test failed:');
    console.log(`   ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify your API key at https://makersuite.google.com/app/apikey');
    console.log('   2. Ensure the API key has proper permissions');
    return false;
  }
}

async function main() {
  console.log('🚀 Environment Validation for Solidity Learning Platform\n');

  // Validate environment variables
  const envValid = validateEnvironment();
  
  if (!envValid) {
    console.log('\n❌ Please fix environment variable errors before proceeding.');
    process.exit(1);
  }

  // Test connections
  const dbConnected = await testDatabaseConnection();
  const geminiWorking = await testGeminiAPI();

  console.log('\n🎯 FINAL RESULTS:');
  console.log(`Environment Variables: ${envValid ? '✅' : '❌'}`);
  console.log(`Database Connection: ${dbConnected ? '✅' : '❌'}`);
  console.log(`Gemini API: ${geminiWorking ? '✅' : '❌'}`);

  if (envValid && dbConnected && geminiWorking) {
    console.log('\n🎉 All systems ready! You can now run:');
    console.log('   npm run dev');
  } else {
    console.log('\n⚠️  Some issues detected. Please resolve them before deployment.');
  }
}

main().catch(console.error);
