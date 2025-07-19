#!/usr/bin/env node

/**
 * Quick Setup Script for Testing Authentication
 * Sets up environment variables and tests the system
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local already exists');
    return;
  }
  
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Authentication Environment Variables
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecret()}

# Database (Supabase example - replace with your actual URL)
DATABASE_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

# OAuth Providers (Optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Integration (Optional)
GEMINI_API_KEY="your-gemini-api-key"

# Monitoring (Optional)
WAKATIME_API_KEY="your-wakatime-api-key"
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created with secure secrets');
}

async function testTypeScript() {
  console.log('\n🔍 Testing TypeScript compilation...');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.log('❌ TypeScript errors found:');
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
    console.log(output.split('\n').slice(-20).join('\n')); // Show last 20 lines
    return false;
  }
}

async function testBuild() {
  console.log('\n🏗️  Testing build process...');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.log('❌ Build failed:');
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
    console.log(output.split('\n').slice(-15).join('\n')); // Show last 15 lines
    return false;
  }
}

function showDatabaseSetupInstructions() {
  console.log('\n📊 Database Setup Instructions');
  console.log('==============================');
  console.log('');
  console.log('🚀 Option 1: Supabase (Recommended - Free)');
  console.log('1. Go to https://supabase.com');
  console.log('2. Create a new project');
  console.log('3. Get your connection string from Settings > Database');
  console.log('4. Update DATABASE_URL in .env.local');
  console.log('5. Run: npm run setup:db');
  console.log('');
  console.log('🐘 Option 2: Local PostgreSQL');
  console.log('1. Install PostgreSQL locally');
  console.log('2. Create a database: createdb solidity_learning_dev');
  console.log('3. Update DATABASE_URL in .env.local');
  console.log('4. Run: npm run setup:db');
  console.log('');
  console.log('🧪 Option 3: Test Without Database');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000');
  console.log('3. UI components will work, but registration/login will fail');
  console.log('');
}

function showNextSteps() {
  console.log('\n🎯 Next Steps');
  console.log('=============');
  console.log('');
  console.log('1. 📊 Set up database (see instructions above)');
  console.log('2. 🚀 Start development server: npm run dev');
  console.log('3. 🧪 Test authentication: http://localhost:3000/auth/test');
  console.log('4. 👤 Test user registration and login');
  console.log('5. 🔐 Test protected routes: http://localhost:3000/admin');
  console.log('6. 📱 Test responsive design on different devices');
  console.log('');
  console.log('📚 Documentation:');
  console.log('- Authentication: docs/AUTHENTICATION_SETUP.md');
  console.log('- Database: docs/DATABASE_SETUP.md');
  console.log('- Troubleshooting: docs/TROUBLESHOOTING.md');
  console.log('');
}

async function main() {
  console.log('⚡ Quick Setup for Solidity Learning Platform');
  console.log('============================================\n');
  
  // Create environment file
  createEnvFile();
  
  // Test TypeScript
  const tsOk = await testTypeScript();
  
  // Test build (only if TypeScript is OK)
  let buildOk = false;
  if (tsOk) {
    buildOk = await testBuild();
  } else {
    console.log('\n⚠️  Skipping build test due to TypeScript errors');
  }
  
  // Show results
  console.log('\n📋 Setup Results');
  console.log('================');
  console.log(`Environment File: ✅ Created`);
  console.log(`TypeScript: ${tsOk ? '✅ OK' : '❌ Errors'}`);
  console.log(`Build Process: ${buildOk ? '✅ OK' : '❌ Failed'}`);
  
  if (tsOk && buildOk) {
    console.log('\n🎉 Setup completed successfully!');
    console.log('Your authentication system is ready to test.');
  } else {
    console.log('\n⚠️  Setup completed with issues');
    console.log('Please fix the errors above before proceeding.');
  }
  
  showDatabaseSetupInstructions();
  showNextSteps();
}

main().catch(console.error);
