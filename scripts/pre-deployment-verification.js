#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
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

// Pre-deployment verification configuration
const VERIFICATION_CONFIG = {
  requiredFiles: [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'tailwind.config.js',
    'docs/production-readiness-assessment.md',
    'DEPLOYMENT_CHECKLIST.md'
  ],
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],
  testCommands: [
    { name: 'TypeScript Check', command: 'npx tsc --noEmit' },
    { name: 'ESLint Check', command: 'npx eslint . --ext .ts,.tsx --max-warnings 0' },
    { name: 'Build Test', command: 'npm run build' }
  ],
  performanceTargets: {
    buildTime: 300000, // 5 minutes max
    bundleSize: 5 * 1024 * 1024, // 5MB max
    dependencies: 1000 // Max number of dependencies
  }
};

// Check if required files exist
function checkRequiredFiles() {
  logHeader('Checking Required Files');
  
  let allFilesExist = true;
  
  VERIFICATION_CONFIG.requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} is missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Verify package.json configuration
function verifyPackageJson() {
  logHeader('Verifying Package.json Configuration');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['dev', 'build', 'start', 'test'];
    let scriptsValid = true;
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logSuccess(`Script "${script}" is defined`);
      } else {
        logError(`Script "${script}" is missing`);
        scriptsValid = false;
      }
    });
    
    // Check Node.js version requirement
    if (packageJson.engines && packageJson.engines.node) {
      logSuccess(`Node.js version requirement: ${packageJson.engines.node}`);
    } else {
      logWarning('Node.js version not specified in engines field');
    }
    
    // Check dependency count
    const depCount = Object.keys(packageJson.dependencies || {}).length + 
                    Object.keys(packageJson.devDependencies || {}).length;
    
    if (depCount <= VERIFICATION_CONFIG.performanceTargets.dependencies) {
      logSuccess(`Dependency count: ${depCount} (within limit)`);
    } else {
      logWarning(`Dependency count: ${depCount} (exceeds recommended limit of ${VERIFICATION_CONFIG.performanceTargets.dependencies})`);
    }
    
    return scriptsValid;
  } catch (error) {
    logError(`Failed to parse package.json: ${error.message}`);
    return false;
  }
}

// Check environment variables documentation
function checkEnvironmentVariables() {
  logHeader('Checking Environment Variables');
  
  let envValid = true;
  
  // Check if .env.example exists
  if (fs.existsSync('.env.example')) {
    logSuccess('.env.example file exists');
    
    try {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
      VERIFICATION_CONFIG.requiredEnvVars.forEach(envVar => {
        if (envExample.includes(envVar)) {
          logSuccess(`${envVar} is documented in .env.example`);
        } else {
          logError(`${envVar} is missing from .env.example`);
          envValid = false;
        }
      });
    } catch (error) {
      logError(`Failed to read .env.example: ${error.message}`);
      envValid = false;
    }
  } else {
    logError('.env.example file is missing');
    envValid = false;
  }
  
  return envValid;
}

// Run TypeScript and build checks
async function runBuildChecks() {
  logHeader('Running Build Checks');
  
  let allChecksPass = true;
  
  for (const check of VERIFICATION_CONFIG.testCommands) {
    try {
      logInfo(`Running ${check.name}...`);
      const startTime = Date.now();
      
      execSync(check.command, { 
        stdio: 'pipe',
        timeout: VERIFICATION_CONFIG.performanceTargets.buildTime
      });
      
      const duration = Date.now() - startTime;
      logSuccess(`${check.name} passed (${duration}ms)`);
    } catch (error) {
      logError(`${check.name} failed: ${error.message}`);
      allChecksPass = false;
    }
  }
  
  return allChecksPass;
}

// Check production readiness assessment
function checkProductionReadiness() {
  logHeader('Checking Production Readiness Assessment');
  
  try {
    if (fs.existsSync('docs/production-readiness-assessment.md')) {
      const assessment = fs.readFileSync('docs/production-readiness-assessment.md', 'utf8');
      
      // Check for key indicators of readiness
      const indicators = [
        'PRODUCTION READY',
        'APPROVED FOR PRODUCTION',
        'All tests passed',
        'Performance targets met',
        'Security assessment complete'
      ];
      
      let readinessConfirmed = true;
      
      indicators.forEach(indicator => {
        if (assessment.includes(indicator)) {
          logSuccess(`Found: ${indicator}`);
        } else {
          logWarning(`Missing indicator: ${indicator}`);
          readinessConfirmed = false;
        }
      });
      
      return readinessConfirmed;
    } else {
      logError('Production readiness assessment not found');
      return false;
    }
  } catch (error) {
    logError(`Failed to check production readiness: ${error.message}`);
    return false;
  }
}

// Check deployment checklist
function checkDeploymentChecklist() {
  logHeader('Checking Deployment Checklist');
  
  try {
    if (fs.existsSync('DEPLOYMENT_CHECKLIST.md')) {
      logSuccess('DEPLOYMENT_CHECKLIST.md exists');
      
      const checklist = fs.readFileSync('DEPLOYMENT_CHECKLIST.md', 'utf8');
      
      // Check for key deployment steps
      const steps = [
        'Environment Variables',
        'Database Setup',
        'Build Configuration',
        'Domain Configuration',
        'SSL Certificate'
      ];
      
      let checklistComplete = true;
      
      steps.forEach(step => {
        if (checklist.includes(step)) {
          logSuccess(`Checklist includes: ${step}`);
        } else {
          logWarning(`Checklist missing: ${step}`);
          checklistComplete = false;
        }
      });
      
      return checklistComplete;
    } else {
      logError('DEPLOYMENT_CHECKLIST.md not found');
      return false;
    }
  } catch (error) {
    logError(`Failed to check deployment checklist: ${error.message}`);
    return false;
  }
}

// Generate verification report
function generateVerificationReport(results) {
  logHeader('Pre-Deployment Verification Report');
  
  const { 
    filesExist, 
    packageValid, 
    envValid, 
    buildChecks, 
    readinessConfirmed, 
    checklistComplete 
  } = results;
  
  log('\nVerification Results:', 'bright');
  log(`Required Files: ${filesExist ? '✅ PASS' : '❌ FAIL'}`, filesExist ? 'green' : 'red');
  log(`Package.json: ${packageValid ? '✅ PASS' : '❌ FAIL'}`, packageValid ? 'green' : 'red');
  log(`Environment Variables: ${envValid ? '✅ PASS' : '❌ FAIL'}`, envValid ? 'green' : 'red');
  log(`Build Checks: ${buildChecks ? '✅ PASS' : '❌ FAIL'}`, buildChecks ? 'green' : 'red');
  log(`Production Readiness: ${readinessConfirmed ? '✅ PASS' : '❌ FAIL'}`, readinessConfirmed ? 'green' : 'red');
  log(`Deployment Checklist: ${checklistComplete ? '✅ PASS' : '❌ FAIL'}`, checklistComplete ? 'green' : 'red');
  
  const allPassed = filesExist && packageValid && envValid && buildChecks && readinessConfirmed && checklistComplete;
  
  log('\n' + '='.repeat(60), 'cyan');
  if (allPassed) {
    logSuccess('🎉 ALL PRE-DEPLOYMENT CHECKS PASSED!');
    logSuccess('✅ Ready for production deployment');
  } else {
    logError('❌ PRE-DEPLOYMENT CHECKS FAILED');
    logError('Please address the issues above before proceeding with deployment');
  }
  log('='.repeat(60), 'cyan');
  
  return allPassed;
}

// Main execution
async function main() {
  logHeader('Solidity Learning Platform - Pre-Deployment Verification');
  
  try {
    // Run all verification checks
    const results = {
      filesExist: checkRequiredFiles(),
      packageValid: verifyPackageJson(),
      envValid: checkEnvironmentVariables(),
      buildChecks: await runBuildChecks(),
      readinessConfirmed: checkProductionReadiness(),
      checklistComplete: checkDeploymentChecklist()
    };
    
    // Generate final report
    const success = generateVerificationReport(results);
    
    // Save verification report
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `pre-deployment-verification-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      success,
      config: VERIFICATION_CONFIG
    }, null, 2));
    
    logInfo(`Verification report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError(`Pre-deployment verification failed: ${error.message}`);
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
    logError(`Pre-deployment verification runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { 
  checkRequiredFiles, 
  verifyPackageJson, 
  checkEnvironmentVariables, 
  runBuildChecks,
  checkProductionReadiness,
  checkDeploymentChecklist
};
