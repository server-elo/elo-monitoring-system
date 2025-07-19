#!/usr/bin/env node

/**
 * Vercel Deployment Setup Script
 * Prepares the project for Vercel deployment with all necessary configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Vercel Deployment Setup for Solidity Learning Platform');
console.log('========================================================\n');

// Check if Vercel CLI is installed
function checkVercelCLI() {
  console.log('🔍 Checking Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ Vercel CLI not found');
    console.log('💡 Install with: npm install -g vercel');
    return false;
  }
}

// Create vercel.json configuration
function createVercelConfig() {
  console.log('\n📝 Creating vercel.json configuration...');
  
  const vercelConfig = {
    "version": 2,
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "devCommand": "npm run dev",
    "installCommand": "npm install",
    "functions": {
      "app/api/**/*.ts": {
        "maxDuration": 30
      }
    },
    "env": {
      "NEXTAUTH_URL": "@nextauth_url",
      "NEXTAUTH_SECRET": "@nextauth_secret",
      "DATABASE_URL": "@database_url",
      "GITHUB_CLIENT_ID": "@github_client_id",
      "GITHUB_CLIENT_SECRET": "@github_client_secret",
      "GOOGLE_CLIENT_ID": "@google_client_id",
      "GOOGLE_CLIENT_SECRET": "@google_client_secret"
    },
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          },
          {
            "key": "Access-Control-Allow-Methods",
            "value": "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            "key": "Access-Control-Allow-Headers",
            "value": "Content-Type, Authorization"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "/docs/:path*",
        "destination": "/docs/:path*"
      }
    ]
  };
  
  const vercelPath = path.join(process.cwd(), 'vercel.json');
  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
  console.log('✅ vercel.json created');
}

// Create deployment environment template
function createEnvTemplate() {
  console.log('\n📋 Creating environment variables template...');
  
  const envTemplate = `# Vercel Environment Variables Template
# Copy these to your Vercel dashboard: Settings → Environment Variables

# Authentication (REQUIRED)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key-min-32-characters-long

# Database (REQUIRED)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# OAuth Providers (OPTIONAL)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Integration (OPTIONAL)
GEMINI_API_KEY=your-gemini-api-key

# Monitoring (OPTIONAL)
WAKATIME_API_KEY=your-wakatime-api-key
`;
  
  const templatePath = path.join(process.cwd(), '.env.vercel.template');
  fs.writeFileSync(templatePath, envTemplate);
  console.log('✅ .env.vercel.template created');
}

// Create deployment checklist
function createDeploymentChecklist() {
  console.log('\n📝 Creating deployment checklist...');
  
  const checklist = `# 🚀 Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup (Supabase)
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project: "solidity-learning-platform"
- [ ] Copy database connection string from Settings → Database
- [ ] Update DATABASE_URL in Vercel environment variables

### 2. OAuth Setup (Optional)
- [ ] GitHub OAuth App: https://github.com/settings/developers
  - Homepage URL: https://your-app.vercel.app
  - Callback URL: https://your-app.vercel.app/api/auth/callback/github
- [ ] Google OAuth: https://console.cloud.google.com
  - Redirect URI: https://your-app.vercel.app/api/auth/callback/google

### 3. Vercel Project Setup
- [ ] Sign up at https://vercel.com with GitHub
- [ ] Import repository from GitHub
- [ ] Configure environment variables (see .env.vercel.template)
- [ ] Deploy project

## Post-Deployment Tasks

### 4. Database Migration
- [ ] Run: npx prisma db push (with production DATABASE_URL)
- [ ] Run: npm run db:seed (optional sample data)

### 5. Testing
- [ ] Test user registration: https://your-app.vercel.app/auth/test
- [ ] Test OAuth providers
- [ ] Test protected routes: https://your-app.vercel.app/admin
- [ ] Test authentication flows

### 6. Custom Domain (Optional)
- [ ] Add custom domain in Vercel dashboard
- [ ] Configure DNS records
- [ ] Update NEXTAUTH_URL environment variable
- [ ] Update OAuth callback URLs

## Environment Variables Checklist

### Required Variables
- [ ] NEXTAUTH_URL (your Vercel app URL)
- [ ] NEXTAUTH_SECRET (32+ character secret)
- [ ] DATABASE_URL (Supabase connection string)

### Optional Variables
- [ ] GITHUB_CLIENT_ID
- [ ] GITHUB_CLIENT_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GEMINI_API_KEY

## Verification Steps
- [ ] App loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes work
- [ ] Database connections work
- [ ] OAuth providers work (if configured)

## Troubleshooting
- Check Vercel function logs for errors
- Verify environment variables are set correctly
- Ensure database is accessible from Vercel
- Check OAuth callback URLs match exactly
- Verify NEXTAUTH_SECRET is properly set

## Support Resources
- Vercel Documentation: https://vercel.com/docs
- NextAuth.js Deployment: https://next-auth.js.org/deployment
- Supabase Documentation: https://supabase.com/docs
- Project Documentation: docs/HOSTING_DEPLOYMENT_GUIDE.md
`;
  
  const checklistPath = path.join(process.cwd(), 'DEPLOYMENT_CHECKLIST.md');
  fs.writeFileSync(checklistPath, checklist);
  console.log('✅ DEPLOYMENT_CHECKLIST.md created');
}

// Create package.json scripts for deployment
function updatePackageScripts() {
  console.log('\n📦 Updating package.json scripts...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add deployment scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "deploy:vercel": "vercel --prod",
    "deploy:preview": "vercel",
    "postbuild": "next-sitemap",
    "db:deploy": "prisma migrate deploy",
    "db:seed:prod": "NODE_ENV=production npm run db:seed"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json scripts updated');
}

// Main deployment setup
async function main() {
  try {
    // Check prerequisites
    const hasVercelCLI = checkVercelCLI();
    
    // Create configuration files
    createVercelConfig();
    createEnvTemplate();
    createDeploymentChecklist();
    updatePackageScripts();
    
    console.log('\n🎉 Vercel deployment setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up Supabase database (see DEPLOYMENT_CHECKLIST.md)');
    console.log('2. Go to https://vercel.com and import your GitHub repository');
    console.log('3. Configure environment variables using .env.vercel.template');
    console.log('4. Deploy your project');
    console.log('5. Follow DEPLOYMENT_CHECKLIST.md for complete setup');
    
    if (!hasVercelCLI) {
      console.log('\n💡 Optional: Install Vercel CLI for command-line deployment:');
      console.log('   npm install -g vercel');
      console.log('   vercel login');
      console.log('   vercel --prod');
    }
    
    console.log('\n📚 Documentation:');
    console.log('- Deployment Guide: docs/HOSTING_DEPLOYMENT_GUIDE.md');
    console.log('- Deployment Checklist: DEPLOYMENT_CHECKLIST.md');
    console.log('- Environment Template: .env.vercel.template');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
