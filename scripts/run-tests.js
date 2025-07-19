#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  unit: {
    command: 'npm run test:unit',
    timeout: 60000,
    description: 'Unit Tests'
  },
  integration: {
    command: 'npm run test:integration',
    timeout: 120000,
    description: 'Integration Tests'
  },
  e2e: {
    command: 'npm run test:e2e',
    timeout: 300000,
    description: 'End-to-End Tests'
  },
  api: {
    command: 'npm run test:api',
    timeout: 90000,
    description: 'API Tests'
  },
  ux: {
    command: 'npm run test:ux',
    timeout: 180000,
    description: 'UX Tests'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

// Check if required dependencies are installed
function checkDependencies() {
  logHeader('Checking Dependencies');
  
  const requiredDeps = [
    '@jest/globals',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@playwright/test',
    'jest'
  ];
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  let missingDeps = [];
  
  requiredDeps.forEach(dep => {
    if (!allDeps[dep]) {
      missingDeps.push(dep);
    } else {
      logSuccess(`${dep} is installed`);
    }
  });
  
  if (missingDeps.length > 0) {
    logError(`Missing dependencies: ${missingDeps.join(', ')}`);
    logInfo('Installing missing dependencies...');
    
    try {
      execSync(`npm install ${missingDeps.join(' ')} --save-dev`, { stdio: 'inherit' });
      logSuccess('Dependencies installed successfully');
    } catch (error) {
      logError('Failed to install dependencies');
      process.exit(1);
    }
  }
}

// Run a single test suite
async function runTestSuite(suiteName, config) {
  return new Promise((resolve) => {
    logHeader(`Running ${config.description}`);
    logInfo(`Command: ${config.command}`);
    
    const startTime = Date.now();
    
    const child = spawn('npm', ['run', `test:${suiteName}`], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      logWarning(`Test suite ${suiteName} timed out after ${config.timeout}ms`);
      resolve({
        success: false,
        duration: Date.now() - startTime,
        output,
        error: 'Timeout',
        coverage: null
      });
    }, config.timeout);
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        logSuccess(`${config.description} completed successfully in ${duration}ms`);
        
        // Extract coverage information if available
        let coverage = null;
        const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
        if (coverageMatch) {
          coverage = {
            statements: parseFloat(coverageMatch[1]),
            branches: parseFloat(coverageMatch[2]),
            functions: parseFloat(coverageMatch[3]),
            lines: parseFloat(coverageMatch[4])
          };
        }
        
        resolve({
          success: true,
          duration,
          output,
          error: null,
          coverage
        });
      } else {
        logError(`${config.description} failed with exit code ${code}`);
        resolve({
          success: false,
          duration,
          output,
          error: errorOutput || `Exit code: ${code}`,
          coverage: null
        });
      }
    });
  });
}

// Generate test report
function generateReport(results) {
  logHeader('Test Results Summary');
  
  let totalTests = 0;
  let passedTests = 0;
  let totalDuration = 0;
  let overallCoverage = {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0,
    count: 0
  };
  
  Object.entries(results).forEach(([suiteName, result]) => {
    totalTests++;
    totalDuration += result.duration;
    
    if (result.success) {
      passedTests++;
      logSuccess(`${TEST_CONFIG[suiteName].description}: PASSED (${result.duration}ms)`);
      
      if (result.coverage) {
        overallCoverage.statements += result.coverage.statements;
        overallCoverage.branches += result.coverage.branches;
        overallCoverage.functions += result.coverage.functions;
        overallCoverage.lines += result.coverage.lines;
        overallCoverage.count++;
      }
    } else {
      logError(`${TEST_CONFIG[suiteName].description}: FAILED (${result.duration}ms)`);
      if (result.error) {
        logError(`  Error: ${result.error}`);
      }
    }
  });
  
  log('\n' + '-'.repeat(60), 'cyan');
  log(`Total Test Suites: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
  log(`Total Duration: ${totalDuration}ms`, 'blue');
  
  if (overallCoverage.count > 0) {
    const avgCoverage = {
      statements: overallCoverage.statements / overallCoverage.count,
      branches: overallCoverage.branches / overallCoverage.count,
      functions: overallCoverage.functions / overallCoverage.count,
      lines: overallCoverage.lines / overallCoverage.count
    };
    
    log('\nCode Coverage:', 'bright');
    log(`Statements: ${avgCoverage.statements.toFixed(2)}%`, avgCoverage.statements >= 90 ? 'green' : 'yellow');
    log(`Branches: ${avgCoverage.branches.toFixed(2)}%`, avgCoverage.branches >= 90 ? 'green' : 'yellow');
    log(`Functions: ${avgCoverage.functions.toFixed(2)}%`, avgCoverage.functions >= 90 ? 'green' : 'yellow');
    log(`Lines: ${avgCoverage.lines.toFixed(2)}%`, avgCoverage.lines >= 90 ? 'green' : 'yellow');
    
    const overallScore = (avgCoverage.statements + avgCoverage.branches + avgCoverage.functions + avgCoverage.lines) / 4;
    log(`Overall Coverage: ${overallScore.toFixed(2)}%`, overallScore >= 90 ? 'green' : 'yellow');
  }
  
  log('-'.repeat(60), 'cyan');
  
  // Success criteria
  const success = passedTests === totalTests && (overallCoverage.count === 0 || 
    (overallCoverage.statements / overallCoverage.count) >= 90);
  
  if (success) {
    logSuccess('🎉 All tests passed and coverage targets met!');
    return true;
  } else {
    logError('❌ Some tests failed or coverage targets not met');
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const suitesToRun = args.length > 0 ? args : Object.keys(TEST_CONFIG);
  
  logHeader('Solidity Learning Platform - Test Suite Runner');
  logInfo(`Running test suites: ${suitesToRun.join(', ')}`);
  
  // Check dependencies first
  checkDependencies();
  
  // Run tests
  const results = {};
  
  for (const suiteName of suitesToRun) {
    if (!TEST_CONFIG[suiteName]) {
      logWarning(`Unknown test suite: ${suiteName}`);
      continue;
    }
    
    results[suiteName] = await runTestSuite(suiteName, TEST_CONFIG[suiteName]);
  }
  
  // Generate report
  const success = generateReport(results);
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTestSuite, generateReport };
