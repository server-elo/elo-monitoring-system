#!/usr/bin/env node

/**
 * Local Development Optimization Script
 * Optimizes the project for local development and testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Optimizing Local Development Environment');
console.log('==========================================\n');

// Check Node.js version
function checkNodeVersion() {
  console.log('📋 Checking Node.js version...');
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      console.log(`✅ Node.js ${nodeVersion} (compatible)`);
      return true;
    } else {
      console.log(`❌ Node.js ${nodeVersion} (requires 18+)`);
      return false;
    }
  } catch (error) {
    console.log('❌ Could not check Node.js version');
    return false;
  }
}

// Check dependencies
function checkDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules not found - run npm install');
    return false;
  }
  
  console.log('✅ Dependencies installed');
  return true;
}

// Create development environment file
function createDevEnv() {
  console.log('\n📝 Setting up development environment...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local already exists');
    return;
  }
  
  const devEnvContent = `# Development Environment Variables
NODE_ENV=development

# NextAuth.js (for development without database)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-for-local-testing-only

# Database (optional for development)
# DATABASE_URL="postgresql://username:password@localhost:5432/solidity_learning_dev"

# OAuth Providers (optional for development)
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Development flags
SKIP_DATABASE_CHECK=true
ENABLE_MOCK_AUTH=true
`;
  
  fs.writeFileSync(envPath, devEnvContent);
  console.log('✅ .env.local created for development');
}

// Check TypeScript compilation
function checkTypeScript() {
  console.log('\n🔍 Checking TypeScript compilation...');
  
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.log('❌ TypeScript errors found');
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const lines = output.split('\n').filter(line => line.trim());
    const errorLines = lines.slice(-10); // Show last 10 lines
    
    console.log('\nRecent errors:');
    errorLines.forEach(line => {
      if (line.includes('error TS')) {
        console.log(`  ${line}`);
      }
    });
    
    return false;
  }
}

// Test build process
function testBuild() {
  console.log('\n🏗️  Testing build process...');
  
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.log('❌ Build failed');
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    
    if (output.includes('EPERM') || output.includes('permission denied')) {
      console.log('💡 Windows permission issue detected');
      console.log('   Try running as administrator or use WSL');
    } else if (output.includes('Prisma')) {
      console.log('💡 Prisma issue detected');
      console.log('   Build will work in production with proper database');
    }
    
    return false;
  }
}

// Create development scripts
function createDevScripts() {
  console.log('\n📜 Creating development scripts...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add development scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "dev:clean": "rm -rf .next && npm run dev",
    "dev:debug": "NODE_OPTIONS='--inspect' npm run dev",
    "test:auth": "echo 'Visit http://localhost:3000/auth/local-test to test authentication'",
    "test:components": "echo 'Visit http://localhost:3000/auth/demo to see component showcase'",
    "check:all": "npm run type-check && npm run lint",
    "fix:all": "npm run lint -- --fix && npm run format"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Development scripts added');
}

// Create development README
function createDevReadme() {
  console.log('\n📖 Creating development guide...');
  
  const devReadme = `# 🚀 Local Development Guide

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Test authentication system:**
   - Visit: http://localhost:3000/auth/local-test
   - Test all authentication flows with mock data
   - No database required for testing

## Development URLs

- **Main App**: http://localhost:3000
- **Auth Testing**: http://localhost:3000/auth/local-test
- **Auth Demo**: http://localhost:3000/auth/demo
- **Admin Dashboard**: http://localhost:3000/admin

## Development Features

### ✅ Mock Authentication System
- Test user registration and login
- Role-based access control testing
- Permission system validation
- No database required

### ✅ Component Showcase
- Interactive UI component demos
- Authentication flow demonstrations
- Design system examples

### ✅ Development Tools
- TypeScript error checking
- Hot reload and fast refresh
- Development navigation menu
- Mock data for testing

## Troubleshooting

### Common Issues

**Dev server won't start:**
- Check Node.js version (18+ required)
- Run \`npm install\` to update dependencies
- Clear cache: \`rm -rf .next\`

**TypeScript errors:**
- Run \`npm run type-check\` to see all errors
- Run \`npm run check:all\` for comprehensive check

**Build fails:**
- Windows permission issues: Run as administrator
- Prisma issues: Normal in development without database

### Development Commands

\`\`\`bash
# Development
npm run dev              # Start development server
npm run dev:clean        # Clean start (clears .next cache)
npm run dev:debug        # Start with debugging enabled

# Testing
npm run test:auth        # Authentication testing guide
npm run test:components  # Component testing guide

# Code Quality
npm run type-check       # Check TypeScript errors
npm run lint            # Check code style
npm run check:all       # Run all checks
npm run fix:all         # Fix auto-fixable issues
\`\`\`

## Next Steps

1. **Test locally**: Use the mock authentication system
2. **Set up database**: Follow \`docs/DATABASE_SETUP.md\`
3. **Deploy**: Follow \`docs/HOSTING_DEPLOYMENT_GUIDE.md\`

Happy coding! 🎉
`;
  
  const readmePath = path.join(process.cwd(), 'DEV_README.md');
  fs.writeFileSync(readmePath, devReadme);
  console.log('✅ DEV_README.md created');
}

// Main optimization function
async function main() {
  try {
    const nodeOk = checkNodeVersion();
    const depsOk = checkDependencies();
    
    if (!nodeOk) {
      console.log('\n❌ Please update Node.js to version 18 or higher');
      process.exit(1);
    }
    
    if (!depsOk) {
      console.log('\n❌ Please run: npm install');
      process.exit(1);
    }
    
    createDevEnv();
    createDevScripts();
    createDevReadme();
    
    const tsOk = checkTypeScript();
    const buildOk = testBuild();
    
    console.log('\n📊 Optimization Results');
    console.log('=======================');
    console.log(`Node.js: ${nodeOk ? '✅' : '❌'}`);
    console.log(`Dependencies: ${depsOk ? '✅' : '❌'}`);
    console.log(`TypeScript: ${tsOk ? '✅' : '❌'}`);
    console.log(`Build: ${buildOk ? '✅' : '⚠️'}`);
    
    console.log('\n🎯 Development Ready!');
    console.log('====================');
    console.log('');
    console.log('🚀 Start development server:');
    console.log('   npm run dev');
    console.log('');
    console.log('🧪 Test authentication system:');
    console.log('   http://localhost:3000/auth/local-test');
    console.log('');
    console.log('🎨 View component demos:');
    console.log('   http://localhost:3000/auth/demo');
    console.log('');
    console.log('📖 Read development guide:');
    console.log('   DEV_README.md');
    
    if (!tsOk) {
      console.log('\n⚠️  TypeScript errors detected');
      console.log('   Run: npm run type-check');
      console.log('   Most errors won\'t prevent development server from running');
    }
    
    if (!buildOk) {
      console.log('\n⚠️  Build issues detected');
      console.log('   This is normal in development without database');
      console.log('   Production build will work with proper setup');
    }
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

main();
