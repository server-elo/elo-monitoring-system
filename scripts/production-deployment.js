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

// Production deployment configuration
const PRODUCTION_CONFIG = {
  projectName: 'solidity-learning-platform',
  productionUrl: 'https://solidity-learning-platform.vercel.app',
  healthCheckEndpoints: [
    '/',
    '/api/health',
    '/api/v1/auth/status',
    '/dashboard',
    '/learn'
  ],
  performanceTargets: {
    loadTime: 3000, // 3 seconds
    lcp: 2500,      // Largest Contentful Paint
    fid: 100,       // First Input Delay
    cls: 0.1        // Cumulative Layout Shift
  },
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
};

// Execute production deployment
async function executeProductionDeployment() {
  logHeader('Executing Production Deployment');
  
  try {
    // Step 1: Final pre-deployment checks
    logInfo('Running final pre-deployment verification...');
    
    try {
      execSync('node scripts/pre-deployment-verification.js', { 
        stdio: 'pipe',
        timeout: 120000 
      });
      logSuccess('Pre-deployment verification passed');
    } catch (error) {
      logError('Pre-deployment verification failed');
      throw new Error('Cannot proceed with deployment - verification failed');
    }
    
    // Step 2: Build production version
    logInfo('Building production version...');
    
    try {
      execSync('npm run build', { 
        stdio: 'pipe',
        timeout: 300000 
      });
      logSuccess('Production build completed');
    } catch (error) {
      logError('Production build failed');
      throw new Error('Build process failed');
    }
    
    // Step 3: Deploy to Vercel
    logInfo('Deploying to Vercel...');
    
    try {
      const deployOutput = execSync('vercel --prod --yes', { 
        encoding: 'utf8',
        timeout: 600000 
      });
      
      // Extract deployment URL
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : PRODUCTION_CONFIG.productionUrl;
      
      logSuccess(`Deployment successful: ${deploymentUrl}`);
      
      return {
        success: true,
        url: deploymentUrl,
        output: deployOutput
      };
    } catch (error) {
      logError('Vercel deployment failed');
      throw new Error(`Deployment failed: ${error.message}`);
    }
    
  } catch (error) {
    logError(`Production deployment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Verify deployment health
async function verifyDeploymentHealth(url) {
  logHeader('Verifying Deployment Health');
  
  const results = {
    healthChecks: [],
    allPassed: true
  };
  
  for (const endpoint of PRODUCTION_CONFIG.healthCheckEndpoints) {
    const fullUrl = `${url}${endpoint}`;
    
    try {
      logInfo(`Checking ${endpoint}...`);
      
      const response = execSync(`curl -s -o /dev/null -w "%{http_code},%{time_total}" "${fullUrl}"`, { 
        encoding: 'utf8',
        timeout: 30000
      }).trim();
      
      const [statusCode, responseTime] = response.split(',');
      const responseTimeMs = Math.round(parseFloat(responseTime) * 1000);
      
      if (statusCode === '200') {
        logSuccess(`${endpoint}: ${statusCode} (${responseTimeMs}ms)`);
        results.healthChecks.push({
          endpoint,
          status: 'pass',
          statusCode: parseInt(statusCode),
          responseTime: responseTimeMs
        });
      } else {
        logError(`${endpoint}: ${statusCode} (${responseTimeMs}ms)`);
        results.healthChecks.push({
          endpoint,
          status: 'fail',
          statusCode: parseInt(statusCode),
          responseTime: responseTimeMs
        });
        results.allPassed = false;
      }
    } catch (error) {
      logError(`${endpoint}: Request failed - ${error.message}`);
      results.healthChecks.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      results.allPassed = false;
    }
  }
  
  return results;
}

// Test critical user journeys
async function testCriticalJourneys(url) {
  logHeader('Testing Critical User Journeys');
  
  const journeys = [
    {
      name: 'Homepage Load',
      url: `${url}/`,
      expectedElements: ['nav', 'main', 'footer']
    },
    {
      name: 'Authentication Pages',
      url: `${url}/auth/login`,
      expectedElements: ['form', 'input[type="email"]', 'input[type="password"]']
    },
    {
      name: 'Dashboard Access',
      url: `${url}/dashboard`,
      expectedElements: ['main', 'nav']
    },
    {
      name: 'Learning Platform',
      url: `${url}/learn`,
      expectedElements: ['main', 'nav']
    }
  ];
  
  const results = {
    journeys: [],
    allPassed: true
  };
  
  for (const journey of journeys) {
    try {
      logInfo(`Testing ${journey.name}...`);
      
      // Simple HTTP check for now (in a real scenario, you'd use Playwright/Puppeteer)
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" "${journey.url}"`, { 
        encoding: 'utf8',
        timeout: 30000
      }).trim();
      
      if (response === '200') {
        logSuccess(`${journey.name}: Accessible`);
        results.journeys.push({
          name: journey.name,
          status: 'pass',
          url: journey.url
        });
      } else {
        logError(`${journey.name}: HTTP ${response}`);
        results.journeys.push({
          name: journey.name,
          status: 'fail',
          url: journey.url,
          statusCode: parseInt(response)
        });
        results.allPassed = false;
      }
    } catch (error) {
      logError(`${journey.name}: ${error.message}`);
      results.journeys.push({
        name: journey.name,
        status: 'error',
        error: error.message
      });
      results.allPassed = false;
    }
  }
  
  return results;
}

// Monitor initial deployment metrics
async function monitorDeploymentMetrics(url) {
  logHeader('Monitoring Initial Deployment Metrics');
  
  const metrics = {
    timestamp: new Date().toISOString(),
    url,
    checks: []
  };
  
  // Performance check
  try {
    logInfo('Checking page load performance...');
    
    const perfResult = execSync(`curl -s -o /dev/null -w "Connect: %{time_connect}s, TTFB: %{time_starttransfer}s, Total: %{time_total}s" "${url}"`, { 
      encoding: 'utf8',
      timeout: 30000
    });
    
    logSuccess(`Performance: ${perfResult}`);
    metrics.checks.push({
      type: 'performance',
      status: 'pass',
      result: perfResult
    });
  } catch (error) {
    logError(`Performance check failed: ${error.message}`);
    metrics.checks.push({
      type: 'performance',
      status: 'error',
      error: error.message
    });
  }
  
  // SSL/Security check
  try {
    logInfo('Checking SSL certificate...');
    
    const sslResult = execSync(`curl -s -I "${url}" | grep -i "strict-transport-security"`, { 
      encoding: 'utf8',
      timeout: 30000
    });
    
    if (sslResult.trim()) {
      logSuccess('SSL and security headers configured');
      metrics.checks.push({
        type: 'security',
        status: 'pass',
        result: 'HSTS header present'
      });
    } else {
      logWarning('HSTS header not found');
      metrics.checks.push({
        type: 'security',
        status: 'warning',
        result: 'HSTS header missing'
      });
    }
  } catch (error) {
    logWarning(`SSL check inconclusive: ${error.message}`);
    metrics.checks.push({
      type: 'security',
      status: 'warning',
      error: error.message
    });
  }
  
  return metrics;
}

// Generate deployment success report
function generateDeploymentReport(deploymentResult, healthResults, journeyResults, metricsResults) {
  logHeader('Production Deployment Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    deployment: deploymentResult,
    health: healthResults,
    journeys: journeyResults,
    metrics: metricsResults,
    success: deploymentResult.success && healthResults.allPassed && journeyResults.allPassed
  };
  
  log('\n🚀 PRODUCTION DEPLOYMENT SUMMARY', 'bright');
  log('='.repeat(50), 'cyan');
  
  log(`Deployment: ${deploymentResult.success ? '✅ SUCCESS' : '❌ FAILED'}`, deploymentResult.success ? 'green' : 'red');
  log(`Health Checks: ${healthResults.allPassed ? '✅ PASSED' : '❌ FAILED'}`, healthResults.allPassed ? 'green' : 'red');
  log(`User Journeys: ${journeyResults.allPassed ? '✅ PASSED' : '❌ FAILED'}`, journeyResults.allPassed ? 'green' : 'red');
  
  if (deploymentResult.success) {
    log(`\n🌐 Production URL: ${deploymentResult.url}`, 'cyan');
  }
  
  // Health check summary
  log('\n📊 Health Check Results:', 'bright');
  healthResults.healthChecks.forEach(check => {
    const status = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    const time = check.responseTime ? ` (${check.responseTime}ms)` : '';
    log(`  ${status} ${check.endpoint}${time}`);
  });
  
  // Journey test summary
  log('\n🛤️  User Journey Results:', 'bright');
  journeyResults.journeys.forEach(journey => {
    const status = journey.status === 'pass' ? '✅' : journey.status === 'fail' ? '❌' : '⚠️';
    log(`  ${status} ${journey.name}`);
  });
  
  if (report.success) {
    log('\n🎉 PRODUCTION DEPLOYMENT SUCCESSFUL!', 'green');
    log('\n📋 Next Steps:', 'bright');
    log('1. Monitor application for 24-48 hours', 'blue');
    log('2. Set up monitoring alerts and dashboards', 'blue');
    log('3. Notify stakeholders of successful deployment', 'blue');
    log('4. Schedule post-deployment review', 'blue');
    log('5. Update documentation with production URLs', 'blue');
  } else {
    log('\n❌ PRODUCTION DEPLOYMENT ISSUES DETECTED', 'red');
    log('Please review the issues above and take corrective action', 'yellow');
  }
  
  return report;
}

// Main execution
async function main() {
  logHeader('Solidity Learning Platform - Production Deployment');
  
  try {
    // Execute deployment
    const deploymentResult = await executeProductionDeployment();
    
    if (!deploymentResult.success) {
      throw new Error('Deployment failed');
    }
    
    // Wait a moment for deployment to stabilize
    logInfo('Waiting for deployment to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    
    // Verify deployment
    const healthResults = await verifyDeploymentHealth(deploymentResult.url);
    const journeyResults = await testCriticalJourneys(deploymentResult.url);
    const metricsResults = await monitorDeploymentMetrics(deploymentResult.url);
    
    // Generate final report
    const report = generateDeploymentReport(deploymentResult, healthResults, journeyResults, metricsResults);
    
    // Save deployment report
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `production-deployment-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logInfo(`Deployment report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(report.success ? 0 : 1);
    
  } catch (error) {
    logError(`Production deployment process failed: ${error.message}`);
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
    logError(`Production deployment script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { 
  executeProductionDeployment, 
  verifyDeploymentHealth, 
  testCriticalJourneys, 
  monitorDeploymentMetrics 
};
