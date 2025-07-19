#!/usr/bin/env tsx

/**
 * Enhanced Tutor System Test Runner
 * 
 * This script runs comprehensive tests for the Enhanced Tutor System
 * including database integration, AI response parsing, and LLM integration.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    console.error(error);
    return false;
  }
}

function checkPrerequisites(): boolean {
  log('\n🔍 Checking prerequisites...', 'cyan');
  
  const requiredFiles = [
    'lib/ai/EnhancedTutorSystem.ts',
    'tests/enhanced-tutor-system.test.ts',
    'tests/enhanced-tutor-integration.test.ts',
    'vitest.config.ts',
    'tests/setup.ts',
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      log(`✅ ${file} exists`, 'green');
    } else {
      log(`❌ ${file} is missing`, 'red');
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

function checkDependencies(): boolean {
  log('\n📦 Checking dependencies...', 'cyan');
  
  try {
    const packageJson = require('../package.json');
    const requiredDeps = ['vitest', '@vitest/ui', 'prisma', 'axios'];
    // Dev dependencies are checked along with regular dependencies
    // const requiredDevDeps = ['@types/node', 'typescript'];
    
    let allDepsPresent = true;
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        log(`✅ ${dep} is installed`, 'green');
      } else {
        log(`❌ ${dep} is missing`, 'red');
        allDepsPresent = false;
      }
    }
    
    return allDepsPresent;
  } catch (error) {
    log('❌ Could not read package.json', 'red');
    return false;
  }
}

async function main() {
  log('🚀 Enhanced Tutor System Test Runner', 'bright');
  log('=====================================', 'bright');

  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites check failed. Please ensure all required files exist.', 'red');
    process.exit(1);
  }

  if (!checkDependencies()) {
    log('\n❌ Dependencies check failed. Please install missing dependencies.', 'red');
    process.exit(1);
  }

  log('\n✅ All prerequisites met!', 'green');

  // Run tests
  const testResults: boolean[] = [];

  // 1. Run unit tests
  testResults.push(
    runCommand(
      'npm run ai:test',
      'Running Enhanced Tutor System unit tests'
    )
  );

  // 2. Run integration tests (if local LLM is available)
  log('\n🔍 Checking if local LLM is available...', 'cyan');
  try {
    execSync('curl -f http://localhost:1234/health', { stdio: 'pipe' });
    log('✅ Local LLM is available, running integration tests', 'green');
    testResults.push(
      runCommand(
        'npm run ai:test:integration',
        'Running Enhanced Tutor System integration tests'
      )
    );
  } catch (error) {
    log('⚠️  Local LLM not available, skipping integration tests', 'yellow');
    log('   To run integration tests, start your local LLM server on port 1234', 'yellow');
  }

  // 3. Run all Enhanced Tutor tests
  testResults.push(
    runCommand(
      'npm run test:enhanced-tutor',
      'Running all Enhanced Tutor System tests'
    )
  );

  // 4. Generate coverage report
  testResults.push(
    runCommand(
      'npm run test:coverage -- tests/enhanced-tutor*.test.ts',
      'Generating test coverage report'
    )
  );

  // Summary
  log('\n📊 Test Results Summary', 'bright');
  log('=======================', 'bright');

  const passedTests = testResults.filter(Boolean).length;
  const totalTests = testResults.length;

  if (passedTests === totalTests) {
    log(`\n🎉 All tests passed! (${passedTests}/${totalTests})`, 'green');
    log('\n✅ Enhanced Tutor System is ready for production!', 'green');
  } else {
    log(`\n⚠️  Some tests failed (${passedTests}/${totalTests} passed)`, 'yellow');
    log('\n🔧 Please review the failed tests and fix any issues.', 'yellow');
  }

  // Additional recommendations
  log('\n💡 Next Steps:', 'cyan');
  log('1. Review test coverage report', 'cyan');
  log('2. Test with actual local LLM if not already done', 'cyan');
  log('3. Run end-to-end tests with real user scenarios', 'cyan');
  log('4. Monitor performance in development environment', 'cyan');

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log('\n💥 Uncaught exception:', 'red');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('\n💥 Unhandled rejection:', 'red');
  console.error(reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log('\n💥 Test runner failed:', 'red');
  console.error(error);
  process.exit(1);
});
