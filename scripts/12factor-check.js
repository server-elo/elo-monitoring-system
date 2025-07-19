#!/usr/bin/env node

/**
 * 12-Factor Compliance Check Script
 * Quick validation of 12-factor methodology compliance
 */

const TwelveFactorValidator = require('../lib/12factor/validator');
const path = require('path');

async function main() {
  console.log('🔍 Running 12-Factor Compliance Check...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  const validator = new TwelveFactorValidator(projectRoot);
  
  const startTime = Date.now();
  const report = await validator.validate();
  const duration = Date.now() - startTime;
  
  // Display results
  console.log('📊 12-Factor Compliance Report');
  console.log('================================\n');
  
  console.log(`Overall Score: ${report.score}% (${report.passed}/${report.total} factors)`);
  console.log(`Status: ${report.summary}`);
  console.log(`Check completed in: ${duration}ms\n`);
  
  // Detailed factor results
  console.log('Factor Analysis:');
  console.log('----------------');
  
  const factorNames = {
    'I': 'Codebase',
    'II': 'Dependencies',
    'III': 'Config',
    'IV': 'Backing Services',
    'V': 'Build, Release, Run',
    'VI': 'Processes',
    'VII': 'Port Binding',
    'VIII': 'Concurrency',
    'IX': 'Disposability',
    'X': 'Dev/Prod Parity',
    'XI': 'Logs',
    'XII': 'Admin Processes'
  };
  
  for (const [factorId, result] of Object.entries(report.factors)) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Factor ${factorId}: ${factorNames[factorId]}`);
    
    if (!result.passed && result.recommendations.length > 0) {
      console.log(`   Recommendations:`);
      result.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
  }
  
  console.log('\n');
  
  // Summary recommendations
  if (report.score < 100) {
    console.log('📝 Next Steps:');
    console.log('--------------');
    
    const allRecommendations = [];
    for (const result of Object.values(report.factors)) {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    }
    
    allRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\nRun /prp-fix to automatically address these issues.');
  } else {
    console.log('🎉 Congratulations! Your application is fully 12-factor compliant!');
  }
  
  // Exit with appropriate code
  process.exit(report.score >= 80 ? 0 : 1);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Check failed:', error.message);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Check failed:', error.message);
  process.exit(1);
});