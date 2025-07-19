#!/usr/bin/env node

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Performance test configuration
const PERFORMANCE_CONFIG = {
  urls: [
    { url: 'http://localhost:3000', name: 'Homepage' },
    { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
    { url: 'http://localhost:3000/learn', name: 'Learn Page' },
    { url: 'http://localhost:3000/code', name: 'Code Editor' },
    { url: 'http://localhost:3000/collaborate', name: 'Collaboration' },
    { url: 'http://localhost:3000/achievements', name: 'Achievements' },
    { url: 'http://localhost:3000/settings', name: 'Settings' }
  ],
  thresholds: {
    performance: 90,
    accessibility: 90,
    bestPractices: 90,
    seo: 90,
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100,  // First Input Delay (ms)
    cls: 0.1   // Cumulative Layout Shift
  },
  lighthouse: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      },
      emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36'
    }
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

// Run Lighthouse audit for a single URL
async function runLighthouseAudit(url, chrome) {
  try {
    logInfo(`Running Lighthouse audit for ${url}`);
    
    const result = await lighthouse(url, {
      port: chrome.port,
      ...PERFORMANCE_CONFIG.lighthouse
    });
    
    if (!result) {
      throw new Error('Lighthouse audit failed to return results');
    }
    
    return {
      url,
      scores: {
        performance: Math.round(result.lhr.categories.performance.score * 100),
        accessibility: Math.round(result.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(result.lhr.categories['best-practices'].score * 100),
        seo: Math.round(result.lhr.categories.seo.score * 100)
      },
      metrics: {
        lcp: result.lhr.audits['largest-contentful-paint']?.numericValue || 0,
        fid: result.lhr.audits['max-potential-fid']?.numericValue || 0,
        cls: result.lhr.audits['cumulative-layout-shift']?.numericValue || 0,
        fcp: result.lhr.audits['first-contentful-paint']?.numericValue || 0,
        si: result.lhr.audits['speed-index']?.numericValue || 0,
        tti: result.lhr.audits['interactive']?.numericValue || 0
      },
      opportunities: result.lhr.audits,
      rawResult: result.lhr
    };
  } catch (error) {
    logError(`Lighthouse audit failed for ${url}: ${error.message}`);
    return null;
  }
}

// Analyze Core Web Vitals
function analyzeWebVitals(metrics, thresholds) {
  const vitals = {
    lcp: {
      value: metrics.lcp,
      threshold: thresholds.lcp,
      status: metrics.lcp <= thresholds.lcp ? 'good' : metrics.lcp <= thresholds.lcp * 1.5 ? 'needs-improvement' : 'poor'
    },
    fid: {
      value: metrics.fid,
      threshold: thresholds.fid,
      status: metrics.fid <= thresholds.fid ? 'good' : metrics.fid <= thresholds.fid * 3 ? 'needs-improvement' : 'poor'
    },
    cls: {
      value: metrics.cls,
      threshold: thresholds.cls,
      status: metrics.cls <= thresholds.cls ? 'good' : metrics.cls <= thresholds.cls * 2.5 ? 'needs-improvement' : 'poor'
    }
  };
  
  return vitals;
}

// Generate performance recommendations
function generateRecommendations(auditResults) {
  const recommendations = [];
  
  auditResults.forEach(result => {
    if (!result) return;
    
    const { scores, metrics, opportunities } = result;
    
    // Performance recommendations
    if (scores.performance < PERFORMANCE_CONFIG.thresholds.performance) {
      if (metrics.lcp > PERFORMANCE_CONFIG.thresholds.lcp) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          issue: 'Large Contentful Paint is too slow',
          suggestion: 'Optimize images, reduce server response times, and eliminate render-blocking resources'
        });
      }
      
      if (metrics.cls > PERFORMANCE_CONFIG.thresholds.cls) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          issue: 'Cumulative Layout Shift is too high',
          suggestion: 'Add size attributes to images and videos, avoid inserting content above existing content'
        });
      }
      
      if (opportunities['unused-css-rules']?.score < 0.9) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          issue: 'Unused CSS detected',
          suggestion: 'Remove unused CSS rules to reduce bundle size'
        });
      }
      
      if (opportunities['unused-javascript']?.score < 0.9) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          issue: 'Unused JavaScript detected',
          suggestion: 'Remove unused JavaScript and implement code splitting'
        });
      }
    }
    
    // Accessibility recommendations
    if (scores.accessibility < PERFORMANCE_CONFIG.thresholds.accessibility) {
      if (opportunities['color-contrast']?.score < 1) {
        recommendations.push({
          type: 'accessibility',
          priority: 'high',
          issue: 'Color contrast issues detected',
          suggestion: 'Ensure text has sufficient color contrast ratio (4.5:1 for normal text)'
        });
      }
      
      if (opportunities['aria-labels']?.score < 1) {
        recommendations.push({
          type: 'accessibility',
          priority: 'high',
          issue: 'Missing ARIA labels',
          suggestion: 'Add proper ARIA labels to interactive elements'
        });
      }
    }
  });
  
  return recommendations;
}

// Generate detailed report
function generateReport(auditResults, recommendations) {
  logHeader('Performance Test Results');
  
  let totalScore = 0;
  let pageCount = 0;
  let allVitals = [];
  
  auditResults.forEach(result => {
    if (!result) return;
    
    pageCount++;
    const { url, scores, metrics } = result;
    const vitals = analyzeWebVitals(metrics, PERFORMANCE_CONFIG.thresholds);
    allVitals.push(vitals);
    
    log(`\n📄 ${result.url}`, 'bright');
    log('-'.repeat(50), 'cyan');
    
    // Lighthouse scores
    log('Lighthouse Scores:', 'bright');
    Object.entries(scores).forEach(([category, score]) => {
      const threshold = PERFORMANCE_CONFIG.thresholds[category] || 90;
      const status = score >= threshold ? 'green' : score >= threshold * 0.8 ? 'yellow' : 'red';
      log(`  ${category}: ${score}/100`, status);
    });
    
    // Core Web Vitals
    log('\nCore Web Vitals:', 'bright');
    Object.entries(vitals).forEach(([metric, data]) => {
      const color = data.status === 'good' ? 'green' : data.status === 'needs-improvement' ? 'yellow' : 'red';
      const unit = metric === 'cls' ? '' : 'ms';
      log(`  ${metric.toUpperCase()}: ${data.value.toFixed(metric === 'cls' ? 3 : 0)}${unit} (${data.status})`, color);
    });
    
    // Additional metrics
    log('\nAdditional Metrics:', 'bright');
    log(`  First Contentful Paint: ${metrics.fcp.toFixed(0)}ms`);
    log(`  Speed Index: ${metrics.si.toFixed(0)}ms`);
    log(`  Time to Interactive: ${metrics.tti.toFixed(0)}ms`);
    
    totalScore += (scores.performance + scores.accessibility + scores.bestPractices + scores.seo) / 4;
  });
  
  // Overall summary
  log('\n' + '='.repeat(60), 'cyan');
  log('Overall Summary', 'bright');
  log('='.repeat(60), 'cyan');
  
  const averageScore = totalScore / pageCount;
  log(`Average Lighthouse Score: ${averageScore.toFixed(1)}/100`, averageScore >= 90 ? 'green' : 'yellow');
  
  // Core Web Vitals summary
  const avgVitals = {
    lcp: allVitals.reduce((sum, v) => sum + v.lcp.value, 0) / allVitals.length,
    fid: allVitals.reduce((sum, v) => sum + v.fid.value, 0) / allVitals.length,
    cls: allVitals.reduce((sum, v) => sum + v.cls.value, 0) / allVitals.length
  };
  
  log('\nAverage Core Web Vitals:', 'bright');
  log(`  LCP: ${avgVitals.lcp.toFixed(0)}ms (target: <${PERFORMANCE_CONFIG.thresholds.lcp}ms)`);
  log(`  FID: ${avgVitals.fid.toFixed(0)}ms (target: <${PERFORMANCE_CONFIG.thresholds.fid}ms)`);
  log(`  CLS: ${avgVitals.cls.toFixed(3)} (target: <${PERFORMANCE_CONFIG.thresholds.cls})`);
  
  // Recommendations
  if (recommendations.length > 0) {
    log('\n🔧 Performance Recommendations:', 'bright');
    recommendations.forEach((rec, index) => {
      const priorityColor = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue';
      log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`, priorityColor);
      log(`   💡 ${rec.suggestion}`, 'cyan');
    });
  }
  
  // Success criteria
  const success = averageScore >= 90 && 
                 avgVitals.lcp <= PERFORMANCE_CONFIG.thresholds.lcp &&
                 avgVitals.fid <= PERFORMANCE_CONFIG.thresholds.fid &&
                 avgVitals.cls <= PERFORMANCE_CONFIG.thresholds.cls;
  
  log('\n' + '='.repeat(60), 'cyan');
  if (success) {
    logSuccess('🎉 All performance targets met!');
  } else {
    logWarning('⚠️  Some performance targets not met. See recommendations above.');
  }
  log('='.repeat(60), 'cyan');
  
  return { success, averageScore, avgVitals, recommendations };
}

// Save detailed report to file
function saveReport(auditResults, summary) {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `performance-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    results: auditResults,
    config: PERFORMANCE_CONFIG
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`Detailed report saved to: ${reportPath}`);
  
  return reportPath;
}

// Main execution
async function main() {
  logHeader('Solidity Learning Platform - Performance Testing');
  
  // Launch Chrome
  logInfo('Launching Chrome...');
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  try {
    // Run audits for all URLs
    const auditResults = [];
    
    for (const { url, name } of PERFORMANCE_CONFIG.urls) {
      logInfo(`Testing ${name} (${url})`);
      const result = await runLighthouseAudit(url, chrome);
      if (result) {
        auditResults.push({ ...result, name });
        logSuccess(`✅ ${name} audit completed`);
      } else {
        logError(`❌ ${name} audit failed`);
      }
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(auditResults);
    
    // Generate and display report
    const summary = generateReport(auditResults, recommendations);
    
    // Save detailed report
    saveReport(auditResults, summary);
    
    // Exit with appropriate code
    process.exit(summary.success ? 0 : 1);
    
  } catch (error) {
    logError(`Performance testing failed: ${error.message}`);
    process.exit(1);
  } finally {
    await chrome.kill();
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
    logError(`Performance test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runLighthouseAudit, analyzeWebVitals, generateRecommendations };
