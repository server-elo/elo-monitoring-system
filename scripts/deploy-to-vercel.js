#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  projectName: 'solidity-learning-platform',
  framework: 'nextjs',
  nodeVersion: '20.x',
  buildCommand: 'npm run build',
  devCommand: 'npm run dev',
  installCommand: 'npm ci',
  outputDirectory: '.next',
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],
  optionalEnvVars: [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SENTRY_DSN',
    'REDIS_URL'
  ]
};

// Check if Vercel CLI is installed
function checkVercelCLI() {
  logHeader('Checking Vercel CLI');
  
  try {
    const version = execSync('vercel --version', { encoding: 'utf8' }).trim();
    logSuccess(`Vercel CLI installed: ${version}`);
    return true;
  } catch (error) {
    logError('Vercel CLI not found');
    logInfo('Install with: npm install -g vercel');
    return false;
  }
}

// Check authentication
function checkAuthentication() {
  logHeader('Checking Vercel Authentication');
  
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
    logSuccess(`Authenticated as: ${whoami}`);
    return true;
  } catch (error) {
    logError('Not authenticated with Vercel');
    logInfo('Run: vercel login');
    return false;
  }
}

// Validate project configuration
function validateProjectConfig() {
  logHeader('Validating Project Configuration');
  
  let configValid = true;
  
  // Check package.json
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      logSuccess('Build script found in package.json');
    } else {
      logError('Build script missing in package.json');
      configValid = false;
    }
    
    if (packageJson.engines && packageJson.engines.node) {
      logSuccess(`Node.js version specified: ${packageJson.engines.node}`);
    } else {
      logWarning('Node.js version not specified in package.json');
    }
  } else {
    logError('package.json not found');
    configValid = false;
  }
  
  // Check Next.js config
  if (fs.existsSync('next.config.js')) {
    logSuccess('next.config.js found');
  } else {
    logWarning('next.config.js not found');
  }
  
  // Check Vercel config
  if (fs.existsSync('vercel.json')) {
    logSuccess('vercel.json found');
    
    try {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      if (vercelConfig.framework === 'nextjs') {
        logSuccess('Framework set to Next.js');
      } else {
        logWarning('Framework not set to Next.js');
      }
      
      if (vercelConfig.buildCommand) {
        logSuccess(`Build command: ${vercelConfig.buildCommand}`);
      } else {
        logWarning('Build command not specified');
      }
    } catch (error) {
      logError('Invalid vercel.json format');
      configValid = false;
    }
  } else {
    logWarning('vercel.json not found (will use defaults)');
  }
  
  return configValid;
}

// Check environment variables
function checkEnvironmentVariables() {
  logHeader('Checking Environment Variables');
  
  let envValid = true;
  
  // Check .env.example
  if (fs.existsSync('.env.example')) {
    logSuccess('.env.example found');
    
    const envExample = fs.readFileSync('.env.example', 'utf8');
    
    DEPLOYMENT_CONFIG.requiredEnvVars.forEach(envVar => {
      if (envExample.includes(envVar)) {
        logSuccess(`${envVar} documented`);
      } else {
        logError(`${envVar} not documented in .env.example`);
        envValid = false;
      }
    });
    
    DEPLOYMENT_CONFIG.optionalEnvVars.forEach(envVar => {
      if (envExample.includes(envVar)) {
        logInfo(`${envVar} documented (optional)`);
      }
    });
  } else {
    logError('.env.example not found');
    envValid = false;
  }
  
  return envValid;
}

// Deploy to Vercel
function deployToVercel(production = false) {
  logHeader(`Deploying to Vercel ${production ? '(Production)' : '(Preview)'}`);
  
  try {
    const deployCommand = production ? 'vercel --prod' : 'vercel';
    
    logInfo(`Running: ${deployCommand}`);
    
    const output = execSync(deployCommand, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Extract deployment URL from output
    const urlMatch = output.match(/https:\/\/[^\s]+/);
    const deploymentUrl = urlMatch ? urlMatch[0] : 'Unknown';
    
    logSuccess(`Deployment successful!`);
    logSuccess(`URL: ${deploymentUrl}`);
    
    return {
      success: true,
      url: deploymentUrl,
      output
    };
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Set environment variables
function setEnvironmentVariables(envVars) {
  logHeader('Setting Environment Variables');
  
  let success = true;
  
  Object.entries(envVars).forEach(([key, value]) => {
    try {
      execSync(`vercel env add ${key} production`, {
        input: value,
        encoding: 'utf8'
      });
      logSuccess(`Set ${key}`);
    } catch (error) {
      logError(`Failed to set ${key}: ${error.message}`);
      success = false;
    }
  });
  
  return success;
}

// Verify deployment
function verifyDeployment(url) {
  logHeader('Verifying Deployment');
  
  try {
    // Simple HTTP check
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { 
      encoding: 'utf8' 
    }).trim();
    
    if (response === '200') {
      logSuccess('Deployment is accessible');
      return true;
    } else {
      logError(`Deployment returned HTTP ${response}`);
      return false;
    }
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return false;
  }
}

// Generate deployment report
function generateDeploymentReport(results) {
  logHeader('Deployment Report');
  
  const {
    cliInstalled,
    authenticated,
    configValid,
    envValid,
    deploymentResult
  } = results;
  
  log('\nDeployment Results:', 'bright');
  log(`Vercel CLI: ${cliInstalled ? '✅ PASS' : '❌ FAIL'}`, cliInstalled ? 'green' : 'red');
  log(`Authentication: ${authenticated ? '✅ PASS' : '❌ FAIL'}`, authenticated ? 'green' : 'red');
  log(`Configuration: ${configValid ? '✅ PASS' : '❌ FAIL'}`, configValid ? 'green' : 'red');
  log(`Environment Variables: ${envValid ? '✅ PASS' : '❌ FAIL'}`, envValid ? 'green' : 'red');
  log(`Deployment: ${deploymentResult.success ? '✅ PASS' : '❌ FAIL'}`, deploymentResult.success ? 'green' : 'red');
  
  if (deploymentResult.success) {
    log('\n🎉 DEPLOYMENT SUCCESSFUL!', 'green');
    log(`🌐 URL: ${deploymentResult.url}`, 'cyan');
    log('\nNext Steps:', 'bright');
    log('1. Test the deployed application', 'blue');
    log('2. Configure custom domain (if needed)', 'blue');
    log('3. Set up monitoring and alerts', 'blue');
    log('4. Update DNS records (if using custom domain)', 'blue');
  } else {
    log('\n❌ DEPLOYMENT FAILED', 'red');
    log('Please address the issues above and try again', 'yellow');
  }
  
  return deploymentResult.success;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const production = args.includes('--prod') || args.includes('--production');
  
  logHeader('Solidity Learning Platform - Vercel Deployment');
  
  if (production) {
    log('🚀 PRODUCTION DEPLOYMENT MODE', 'bright');
  } else {
    log('🧪 PREVIEW DEPLOYMENT MODE', 'bright');
  }
  
  try {
    // Run all checks
    const results = {
      cliInstalled: checkVercelCLI(),
      authenticated: checkAuthentication(),
      configValid: validateProjectConfig(),
      envValid: checkEnvironmentVariables(),
      deploymentResult: { success: false }
    };
    
    // Only proceed if all checks pass
    if (results.cliInstalled && results.authenticated && results.configValid) {
      // Deploy to Vercel
      results.deploymentResult = deployToVercel(production);
      
      // Verify deployment if successful
      if (results.deploymentResult.success) {
        const verified = verifyDeployment(results.deploymentResult.url);
        results.deploymentResult.verified = verified;
      }
    } else {
      logError('Pre-deployment checks failed. Cannot proceed with deployment.');
    }
    
    // Generate final report
    const success = generateDeploymentReport(results);
    
    // Save deployment report
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `vercel-deployment-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      production,
      results,
      config: DEPLOYMENT_CONFIG
    }, null, 2));
    
    logInfo(`Deployment report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError(`Deployment process failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logError(`Deployment script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { 
  checkVercelCLI, 
  checkAuthentication, 
  validateProjectConfig, 
  deployToVercel 
};
