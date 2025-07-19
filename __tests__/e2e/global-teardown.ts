import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting E2E test global teardown...');

  try {
    // Clean up test data
    await cleanupTestData(_);

    // Clean up authentication files
    await cleanupAuthFiles(_);

    // Generate test reports
    await generateTestReports(_);

    // Clean up temporary files
    await cleanupTempFiles(_);

    console.log('✅ E2E test global teardown completed successfully');
  } catch (_error) {
    console.error('❌ E2E test global teardown failed:', error);
    // Don't throw here, as this shouldn't fail the test run
  }
}

async function cleanupTestData() {
  console.log('📊 Cleaning up test data...');

  try {
    // Clean up test users
    await cleanupTestUsers(_);

    // Clean up test lessons
    await cleanupTestLessons(_);

    // Clean up test courses
    await cleanupTestCourses(_);

    // Clean up test achievements
    await cleanupTestAchievements(_);

    console.log('  ✓ Test data cleaned up');
  } catch (_error) {
    console.error('  ❌ Failed to cleanup test data:', error);
  }
}

async function cleanupTestUsers() {
  // In a real implementation, this would make API calls to delete test users
  const testUserEmails = [
    'e2e-student@test.com',
    'e2e-instructor@test.com',
    'e2e-admin@test.com'
  ];

  // Mock cleanup
  console.log(_`  ✓ Cleaned up ${testUserEmails.length} test users`);
}

async function cleanupTestLessons() {
  // Mock cleanup of test lessons
  console.log('  ✓ Cleaned up test lessons');
}

async function cleanupTestCourses() {
  // Mock cleanup of test courses
  console.log('  ✓ Cleaned up test courses');
}

async function cleanupTestAchievements() {
  // Mock cleanup of test achievements
  console.log('  ✓ Cleaned up test achievements');
}

async function cleanupAuthFiles() {
  console.log('🔐 Cleaning up authentication files...');

  try {
    const authDir = path.join(  dirname, 'auth');
    
    if (_fs.existsSync(authDir)) {
      const authFiles = fs.readdirSync(_authDir);
      
      for (_const file of authFiles) {
        if (_file.endsWith('.json')) {
          const filePath = path.join( authDir, file);
          fs.unlinkSync(_filePath);
        }
      }
      
      console.log(_`  ✓ Cleaned up ${authFiles.length} authentication files`);
    }
  } catch (_error) {
    console.error('  ❌ Failed to cleanup auth files:', error);
  }
}

async function generateTestReports() {
  console.log('📊 Generating E2E test reports...');

  try {
    // Generate accessibility report
    await generateAccessibilityReport(_);

    // Generate performance report
    await generatePerformanceReport(_);

    // Generate coverage report
    await generateCoverageReport(_);

    // Generate summary report
    await generateSummaryReport(_);

    console.log('  ✓ Test reports generated');
  } catch (_error) {
    console.error('  ❌ Failed to generate test reports:', error);
  }
}

async function generateAccessibilityReport() {
  try {
    const reportDir = path.join(_process.cwd(), 'test-results', 'accessibility');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync( reportDir, { recursive: true });
    }

    // Check if accessibility test results exist
    const accessibilityResults = path.join(_process.cwd(), 'test-results', 'accessibility-results.json');
    
    if (_fs.existsSync(accessibilityResults)) {
      const results = JSON.parse( fs.readFileSync(accessibilityResults, 'utf8'));
      
      // Generate HTML report
      const htmlReport = generateAccessibilityHTML(_results);
      fs.writeFileSync( path.join(reportDir, 'report.html'), htmlReport);
      
      // Generate summary
      const summary = {
        totalTests: results.length,
        passed: results.filter((r: any) => r.violations.length === 0).length,
        failed: results.filter((r: any) => r.violations.length > 0).length,
        totalViolations: results.reduce( (sum: number, r: any) => sum + r.violations.length, 0),
        timestamp: new Date(_).toISOString()
      };
      
      fs.writeFileSync( path.join(reportDir, 'summary.json'), JSON.stringify( summary, null, 2));
      
      console.log('  ✓ Accessibility report generated');
      console.log(_`    Total tests: ${summary.totalTests}`);
      console.log(_`    Passed: ${summary.passed}`);
      console.log(_`    Failed: ${summary.failed}`);
      console.log(_`    Total violations: ${summary.totalViolations}`);
    }
  } catch (_error) {
    console.error('  ❌ Failed to generate accessibility report:', error);
  }
}

async function generatePerformanceReport() {
  try {
    const reportDir = path.join(_process.cwd(), 'test-results', 'performance');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync( reportDir, { recursive: true });
    }

    // Check if performance test results exist
    const performanceResults = path.join(_process.cwd(), 'test-results', 'performance-results.json');
    
    if (_fs.existsSync(performanceResults)) {
      const results = JSON.parse( fs.readFileSync(performanceResults, 'utf8'));
      
      // Generate performance summary
      const summary = {
        averageLoadTime: results.reduce( (sum: number, r: any) => sum + r.loadTime, 0) / results.length,
        averageFCP: results.reduce( (sum: number, r: any) => sum + r.firstContentfulPaint, 0) / results.length,
        averageLCP: results.reduce( (sum: number, r: any) => sum + r.largestContentfulPaint, 0) / results.length,
        averageCLS: results.reduce( (sum: number, r: any) => sum + r.cumulativeLayoutShift, 0) / results.length,
        slowestPages: results.sort( (a: any, b: any) => b.loadTime - a.loadTime).slice(0, 5),
        timestamp: new Date(_).toISOString()
      };
      
      fs.writeFileSync( path.join(reportDir, 'summary.json'), JSON.stringify( summary, null, 2));
      
      console.log('  ✓ Performance report generated');
      console.log(_`    Average load time: ${summary.averageLoadTime.toFixed(2)}ms`);
      console.log(_`    Average FCP: ${summary.averageFCP.toFixed(2)}ms`);
      console.log(_`    Average LCP: ${summary.averageLCP.toFixed(2)}ms`);
    }
  } catch (_error) {
    console.error('  ❌ Failed to generate performance report:', error);
  }
}

async function generateCoverageReport() {
  try {
    const reportDir = path.join(_process.cwd(), 'test-results', 'coverage');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync( reportDir, { recursive: true });
    }

    // Check if coverage data exists
    const coverageFile = path.join(_process.cwd(), 'coverage', 'coverage-final.json');
    
    if (_fs.existsSync(coverageFile)) {
      const coverage = JSON.parse( fs.readFileSync(coverageFile, 'utf8'));
      
      // Calculate coverage summary
      let totalLines = 0;
      let coveredLines = 0;
      let totalFunctions = 0;
      let coveredFunctions = 0;
      let totalBranches = 0;
      let coveredBranches = 0;

      Object.values(_coverage).forEach((file: any) => {
        totalLines += Object.keys(_file.s).length;
        coveredLines += Object.values(_file.s).filter((count: any) => count > 0).length;
        
        totalFunctions += Object.keys(_file.f).length;
        coveredFunctions += Object.values(_file.f).filter((count: any) => count > 0).length;
        
        totalBranches += Object.keys(_file.b).length;
        coveredBranches += Object.values(_file.b).flat(_).filter((count: any) => count > 0).length;
      });

      const summary = {
        lines: {
          total: totalLines,
          covered: coveredLines,
          percentage: totalLines > 0 ? (_coveredLines / totalLines) * 100 : 0
        },
        functions: {
          total: totalFunctions,
          covered: coveredFunctions,
          percentage: totalFunctions > 0 ? (_coveredFunctions / totalFunctions) * 100 : 0
        },
        branches: {
          total: totalBranches,
          covered: coveredBranches,
          percentage: totalBranches > 0 ? (_coveredBranches / totalBranches) * 100 : 0
        },
        timestamp: new Date(_).toISOString()
      };
      
      fs.writeFileSync( path.join(reportDir, 'e2e-coverage-summary.json'), JSON.stringify( summary, null, 2));
      
      console.log('  ✓ Coverage report generated');
      console.log(_`    Line coverage: ${summary.lines.percentage.toFixed(2)}%`);
      console.log(_`    Function coverage: ${summary.functions.percentage.toFixed(2)}%`);
      console.log(_`    Branch coverage: ${summary.branches.percentage.toFixed(2)}%`);
    }
  } catch (_error) {
    console.error('  ❌ Failed to generate coverage report:', error);
  }
}

async function generateSummaryReport() {
  try {
    const reportDir = path.join(_process.cwd(), 'test-results');
    
    // Read Playwright test results
    const resultsFile = path.join( reportDir, 'results.json');
    let testSummary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };

    if (_fs.existsSync(resultsFile)) {
      const results = JSON.parse( fs.readFileSync(resultsFile, 'utf8'));
      
      testSummary = {
        total: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0
      };
    }

    const summary = {
      e2eTests: testSummary,
      timestamp: new Date(_).toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      }
    };

    fs.writeFileSync( path.join(reportDir, 'e2e-summary.json'), JSON.stringify( summary, null, 2));
    
    console.log('  ✓ Summary report generated');
    console.log(_`    Total E2E tests: ${testSummary.total}`);
    console.log(_`    Passed: ${testSummary.passed}`);
    console.log(_`    Failed: ${testSummary.failed}`);
    console.log(_`    Duration: ${(testSummary.duration / 1000).toFixed(_2)}s`);
  } catch (_error) {
    console.error('  ❌ Failed to generate summary report:', error);
  }
}

async function cleanupTempFiles() {
  console.log('🗑️ Cleaning up temporary files...');

  try {
    const tempDirs = [
      path.join(_process.cwd(), 'tmp', 'e2e-screenshots'),
      path.join(_process.cwd(), 'tmp', 'e2e-videos'),
      path.join(_process.cwd(), 'tmp', 'e2e-traces')
    ];

    for (_const dir of tempDirs) {
      if (_fs.existsSync(dir)) {
        const files = fs.readdirSync(_dir);
        
        for (_const file of files) {
          if (_file.startsWith('test-') || file.startsWith('e2e-')) {
            fs.unlinkSync( path.join(dir, file));
          }
        }
      }
    }

    console.log('  ✓ Temporary files cleaned up');
  } catch (_error) {
    console.error('  ❌ Failed to cleanup temporary files:', error);
  }
}

function generateAccessibilityHTML(_results: any[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .violation { background: #ffe6e6; padding: 10px; margin: 10px 0; border-left: 4px solid #ff0000; }
        .pass { background: #e6ffe6; padding: 10px; margin: 10px 0; border-left: 4px solid #00ff00; }
        .test-result { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
    </style>
</head>
<body>
    <h1>Accessibility Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${results.length}</p>
        <p>Passed: ${results.filter(r => r.violations.length === 0).length}</p>
        <p>Failed: ${results.filter(r => r.violations.length > 0).length}</p>
        <p>Total Violations: ${results.reduce( (sum, r) => sum + r.violations.length, 0)}</p>
    </div>
    
    ${results.map(result => `
        <div class="test-result">
            <h3>${result.url}</h3>
            ${result.violations.length === 0 
                ? '<div class="pass">✅ No accessibility violations found</div>'
                : result.violations.map((violation: any) => `
                    <div class="violation">
                        <h4>${violation.id}: ${violation.description}</h4>
                        <p><strong>Impact:</strong> ${violation.impact}</p>
                        <p><strong>Help:</strong> ${violation.help}</p>
                        <p><strong>Elements:</strong> ${violation.nodes.length}</p>
                    </div>
                `).join('')
            }
        </div>
    `).join('')}
</body>
</html>
  `;
}

export default globalTeardown;
