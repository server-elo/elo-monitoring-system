#!/usr/bin/env node

import { SolidityPlatformE2BTests } from './sandbox-config'
import { solidityMonitor } from '@/lib/monitoring/agentops'

async function runE2BTests() {
  console.log('🚀 Starting E2B Sandbox Tests for Solidity Learning Platform')
  console.log('=' .repeat(60))
  
  const testRunner = new SolidityPlatformE2BTests()
  
  try {
    // Start monitoring session
    await solidityMonitor.startCodeAssistantSession('e2b-test', 'platform-testing')
    
    // Track test start
    await solidityMonitor.trackToolUsage('e2b-test', 'test-runner', {
      action: 'start',
      timestamp: new Date().toISOString()
    })
    
    // Run all tests
    const results = await testRunner.runAllTests()
    
    // Display results
    console.log('\n📊 Test Results:')
    console.log(`✅ Passed: ${results.passed}`)
    console.log(`❌ Failed: ${results.failed}`)
    console.log(`📈 Success Rate: ${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`)
    
    // Display detailed results
    console.log('\n📋 Detailed Results:')
    for (const detail of results.details) {
      const status = detail.passed ? '✅' : '❌'
      console.log(`\n${status} ${detail.name}`)
      
      if (!detail.passed) {
        console.log('  Errors:')
        detail.errors.forEach(error => {
          console.log(`    - ${error}`)
        })
      }
      
      console.log('  Steps:')
      detail.stepResults.forEach(step => {
        const stepStatus = step.success ? '✓' : '✗'
        console.log(`    ${stepStatus} ${step.action}`)
        if (step.error) {
          console.log(`      Error: ${step.error}`)
        }
      })
    }
    
    // Track test completion
    await solidityMonitor.trackToolUsage('e2b-test', 'test-runner', {
      action: 'complete',
      passed: results.passed,
      failed: results.failed,
      timestamp: new Date().toISOString()
    })
    
    // End monitoring session
    await solidityMonitor.endSession('e2b-test', 
      results.failed === 0 ? 'success' : 'error',
      { testResults: results }
    )
    
    // Generate test report
    await generateTestReport(results)
    
    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test runner failed:', error)
    
    // Track error
    await solidityMonitor.trackError(error as Error, {
      context: 'e2b-test-runner'
    })
    
    // End session with error
    await solidityMonitor.endSession('e2b-test', 'error', {
      error: error.message
    })
    
    process.exit(1)
  }
}

async function generateTestReport(results: any) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.passed + results.failed,
      passed: results.passed,
      failed: results.failed,
      successRate: `${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`
    },
    scenarios: results.details.map((detail: any) => ({
      name: detail.name,
      status: detail.passed ? 'PASSED' : 'FAILED',
      errors: detail.errors,
      steps: detail.stepResults.map((step: any) => ({
        action: step.action,
        status: step.success ? 'SUCCESS' : 'FAILED',
        error: step.error
      }))
    })),
    recommendations: generateRecommendations(results)
  }
  
  // Save report
  const fs = require('fs').promises
  const reportPath = `./test-reports/e2b-test-${Date.now()}.json`
  await fs.mkdir('./test-reports', { recursive: true })
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`\n📄 Test report saved to: ${reportPath}`)
}

function generateRecommendations(results: any): string[] {
  const recommendations: string[] = []
  
  // Analyze failures
  for (const detail of results.details) {
    if (!detail.passed) {
      if (detail.name.includes('Security')) {
        recommendations.push('Review security scanning implementation')
      }
      if (detail.name.includes('Performance')) {
        recommendations.push('Optimize performance monitoring setup')
      }
      if (detail.name.includes('AI')) {
        recommendations.push('Verify AI assistant API endpoints')
      }
    }
  }
  
  // General recommendations
  if (results.failed > 0) {
    recommendations.push('Fix failing tests before deployment')
    recommendations.push('Add more comprehensive error handling')
  }
  
  if (results.passed === results.details.length) {
    recommendations.push('All tests passing - ready for deployment')
    recommendations.push('Consider adding more edge case tests')
  }
  
  return recommendations
}

// Run tests if executed directly
if (require.main === module) {
  runE2BTests().catch(console.error)
}