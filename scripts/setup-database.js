#!/usr/bin/env node

/**
 * Database Setup Script for Solidity Learning Platform
 * This script initializes the database schema and seeds initial data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed:`);
    console.log(`   ${error.message}\n`);
    return false;
  }
}

function checkEnvironment() {
  console.log('🔍 Checking Environment...');
  
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n💡 Run: npm run setup:env');
    return false;
  }
  
  console.log('✅ Environment variables look good\n');
  return true;
}

async function testDatabaseConnection() {
  console.log('🔌 Testing Database Connection...');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(`   ${error.message}`);
    console.log('\n💡 Please check your DATABASE_URL');
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Database for Solidity Learning Platform');
  console.log('===================================================\n');

  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Test database connection
  if (!await testDatabaseConnection()) {
    process.exit(1);
  }

  // Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    process.exit(1);
  }

  // Push schema to database (for development)
  if (!runCommand('npx prisma db push', 'Pushing schema to database')) {
    console.log('💡 If this fails, try:');
    console.log('   1. Check your DATABASE_URL');
    console.log('   2. Ensure your database is accessible');
    console.log('   3. Check Supabase dashboard for connection issues');
    process.exit(1);
  }

  // Seed database with initial data
  console.log('🌱 Seeding Database...');
  try {
    if (fs.existsSync('prisma/seed.ts')) {
      runCommand('npm run db:seed', 'Seeding database with initial data');
    } else {
      console.log('⚪ No seed file found, skipping seeding');
    }
  } catch (error) {
    console.log('⚠️  Seeding failed, but database setup is complete');
  }

  console.log('🎉 Database setup complete!');
  console.log('\n📊 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000');
  console.log('3. Test user registration and authentication');
}

setupDatabase().catch(console.error);
