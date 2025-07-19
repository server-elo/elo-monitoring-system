#!/usr/bin/env node

/**
 * Production Deployment Checklist
 * Comprehensive pre-deployment validation script
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

class DeploymentChecker {
  constructor() {
    this.results = {
      environment: false,
      database: false,
      build: false,
      typescript: false,
      oauth: false,
      api: false
    };
    this.warnings = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      check: '🔍'
    };
    console.log(`${icons[type]} ${message}`);
  }

  async checkEnvironmentVariables() {
    this.log('Checking Environment Variables', 'check');
    
    const required = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'GEMINI_API_KEY'
    ];

    const oauth = [
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];

    let allRequired = true;
    let hasOAuth = false;

    // Check required variables
    for (const varName of required) {
      const value = process.env[varName];
      if (!value) {
        this.log(`${varName}: Missing`, 'error');
        this.errors.push(`Missing required environment variable: ${varName}`);
        allRequired = false;
      } else if (value.includes('your-') || value.includes('YOUR_')) {
        this.log(`${varName}: Contains placeholder`, 'warning');
        this.warnings.push(`${varName} contains placeholder value`);
        allRequired = false;
      } else {
        this.log(`${varName}: Set`, 'success');
      }
    }

    // Check OAuth variables
    const oauthSet = oauth.filter(varName => process.env[varName] && !process.env[varName].includes('your-'));
    if (oauthSet.length >= 2) {
      hasOAuth = true;
      this.log(`OAuth: ${oauthSet.length}/4 providers configured`, 'success');
    } else {
      this.log('OAuth: Insufficient providers configured', 'warning');
      this.warnings.push('At least one complete OAuth provider (GitHub or Google) should be configured');
    }

    // Validate specific formats
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.startsWith('postgresql://')) {
      this.log('DATABASE_URL: Invalid format', 'error');
      this.errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
      allRequired = false;
    }

    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    if (nextAuthSecret && nextAuthSecret.length < 32) {
      this.log('NEXTAUTH_SECRET: Too short', 'warning');
      this.warnings.push('NEXTAUTH_SECRET should be at least 32 characters');
    }

    this.results.environment = allRequired;
    this.results.oauth = hasOAuth;
    return allRequired;
  }

  async checkDatabaseConnection() {
    this.log('Testing Database Connection', 'check');
    
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$connect();
      
      // Test basic operations
      const userCount = await prisma.user.count();
      const courseCount = await prisma.course.count();
      
      this.log(`Database connection successful (${userCount} users, ${courseCount} courses)`, 'success');
      
      await prisma.$disconnect();
      this.results.database = true;
      return true;
    } catch (error) {
      this.log(`Database connection failed: ${error.message}`, 'error');
      this.errors.push(`Database connection error: ${error.message}`);
      this.results.database = false;
      return false;
    }
  }

  async checkTypeScript() {
    this.log('Checking TypeScript', 'check');
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.log('TypeScript check passed', 'success');
      this.results.typescript = true;
      return true;
    } catch (error) {
      this.log('TypeScript errors found', 'error');
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorLines = output.split('\n').filter(line => line.includes('error')).slice(0, 5);
      errorLines.forEach(line => this.log(`  ${line}`, 'error'));
      this.errors.push('TypeScript compilation errors found');
      this.results.typescript = false;
      return false;
    }
  }

  async checkBuildProcess() {
    this.log('Testing Build Process', 'check');
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.log('Build process successful', 'success');
      this.results.build = true;
      return true;
    } catch (error) {
      this.log('Build process failed', 'error');
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorLines = output.split('\n').slice(-10);
      errorLines.forEach(line => {
        if (line.trim()) this.log(`  ${line}`, 'error');
      });
      this.errors.push('Build process failed');
      this.results.build = false;
      return false;
    }
  }

  async checkAPIEndpoints() {
    this.log('Checking API Endpoints', 'check');
    
    // Check if critical API files exist
    const apiRoutes = [
      'app/api/auth/[...nextauth]/route.ts',
      'app/api/ai/assistant/route.ts',
      'app/api/user/progress/route.ts',
      'app/api/collaboration/route.ts'
    ];

    let allExist = true;
    for (const route of apiRoutes) {
      if (fs.existsSync(route)) {
        this.log(`${route}: Found`, 'success');
      } else {
        this.log(`${route}: Missing`, 'error');
        this.errors.push(`Missing API route: ${route}`);
        allExist = false;
      }
    }

    this.results.api = allExist;
    return allExist;
  }

  generateReport() {
    console.log('\n🎯 DEPLOYMENT READINESS REPORT');
    console.log('==============================\n');

    // Results summary
    const checks = [
      { name: 'Environment Variables', result: this.results.environment },
      { name: 'Database Connection', result: this.results.database },
      { name: 'TypeScript Compilation', result: this.results.typescript },
      { name: 'Build Process', result: this.results.build },
      { name: 'OAuth Configuration', result: this.results.oauth },
      { name: 'API Endpoints', result: this.results.api }
    ];

    checks.forEach(check => {
      this.log(`${check.name}: ${check.result ? 'PASS' : 'FAIL'}`, check.result ? 'success' : 'error');
    });

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    // Overall status
    const allPassed = Object.values(this.results).every(result => result);
    const criticalPassed = this.results.environment && this.results.database && this.results.build;

    console.log('\n📊 OVERALL STATUS:');
    if (allPassed) {
      this.log('🎉 READY FOR PRODUCTION DEPLOYMENT!', 'success');
      console.log('\n📋 Next steps:');
      console.log('   1. Deploy to your chosen platform');
      console.log('   2. Set environment variables in deployment platform');
      console.log('   3. Update OAuth callback URLs to production domain');
      console.log('   4. Test production deployment');
    } else if (criticalPassed) {
      this.log('⚠️  MOSTLY READY - Minor issues to address', 'warning');
      console.log('\n📋 Recommended actions:');
      console.log('   1. Address warnings before deployment');
      console.log('   2. Test thoroughly after deployment');
    } else {
      this.log('❌ NOT READY - Critical issues must be fixed', 'error');
      console.log('\n🔧 Required actions:');
      console.log('   1. Fix all critical errors');
      console.log('   2. Run this checklist again');
      console.log('   3. Only deploy after all checks pass');
    }

    return allPassed;
  }

  async run() {
    console.log('🚀 Production Deployment Checklist');
    console.log('===================================\n');

    await this.checkEnvironmentVariables();
    await this.checkDatabaseConnection();
    await this.checkTypeScript();
    await this.checkBuildProcess();
    await this.checkAPIEndpoints();

    return this.generateReport();
  }
}

async function main() {
  const checker = new DeploymentChecker();
  const ready = await checker.run();
  
  process.exit(ready ? 0 : 1);
}

main().catch(console.error);
