#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up Authentication System...\n');

// Generate secure secrets
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Create .env.local if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  let envContent = '';
  
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    envContent = `# Authentication Environment Variables
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecret()}

# Database (Update with your database URL)
DATABASE_URL="postgresql://username:password@localhost:5432/solidity_learning_dev"

# OAuth Providers (Optional - Get these from GitHub/Google)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
`;
  }
  
  // Replace placeholder secrets with real ones
  envContent = envContent.replace(
    /NEXTAUTH_SECRET=".*"/,
    `NEXTAUTH_SECRET="${generateSecret()}"`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created with secure secrets');
} else {
  console.log('✅ .env.local already exists');
}

// Check if Prisma client exists
const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
if (!fs.existsSync(prismaClientPath)) {
  console.log('⚠️  Prisma client not found. You may need to run: npx prisma generate');
} else {
  console.log('✅ Prisma client found');
}

// Check if database is configured
const envLocal = fs.readFileSync(envPath, 'utf8');
if (envLocal.includes('postgresql://username:password@localhost:5432')) {
  console.log('⚠️  Database URL needs to be configured in .env.local');
  console.log('   Update DATABASE_URL with your actual database connection string');
} else {
  console.log('✅ Database URL configured');
}

console.log('\n🎉 Authentication setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update DATABASE_URL in .env.local with your database connection');
console.log('2. Run: npx prisma migrate dev (if you have a database)');
console.log('3. Run: npm run dev');
console.log('4. Visit: http://localhost:3000/auth/test to test authentication');
console.log('\n📚 For detailed setup instructions, see: docs/AUTHENTICATION_SETUP.md');

// Create a simple test script
const testScriptPath = path.join(process.cwd(), 'scripts', 'test-auth.js');
const testScript = `#!/usr/bin/env node

console.log('🧪 Testing Authentication System...');

// Test environment variables
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DATABASE_URL'
];

let allGood = true;

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(\`✅ \${envVar} is set\`);
  } else {
    console.log(\`❌ \${envVar} is missing\`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\\n🎉 All required environment variables are set!');
  console.log('\\n🚀 You can now start the development server with: npm run dev');
} else {
  console.log('\\n⚠️  Please set the missing environment variables in .env.local');
}
`;

fs.writeFileSync(testScriptPath, testScript);
console.log('✅ Test script created at scripts/test-auth.js');
